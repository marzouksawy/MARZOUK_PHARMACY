// search.js — منطق البحث والتصفية لصفحة المنتجات (v2.1 + زرار أضف للسلة)
// بيقرأ المنتجات من Firestore، وبيعرضها بشكل تدريجي (Pagination) عشان الصفحة الرئيسية
// متبقاش طويلة جدًا لو مفيش بحث محدد (بدل ما يعرض آلاف المنتجات مرة واحدة)
// لازم يُستورد كـ module: <script type="module" src="search.js"></script>

import { fetchAllProducts, CATEGORIES } from "./firebase-config.js";
import Cart from "./cart.js";

const PharmacySearch = (function () {
  let allProducts = [];
  let categories = CATEGORIES;
  let favoritesOnly = false;

  const PAGE_SIZE = 24; // عدد المنتجات المعروضة في كل دفعة
  let currentResults = [];
  let visibleCount = PAGE_SIZE;
  let gridEl = null;

  function normalize(text) {
    return (text || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[\u064B-\u0652]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي");
  }

  function matches(product, query) {
    const q = normalize(query);
    if (!q) return true;
    const keywords = Array.isArray(product.keywords) ? product.keywords : [];
    return (
      normalize(product.trade_name).includes(q) ||
      normalize(product.active_ingredient).includes(q) ||
      normalize(product.company).includes(q) ||
      keywords.some((k) => normalize(k).includes(q))
    );
  }

  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem("marzouk_favorites") || "[]");
    } catch {
      return [];
    }
  }

  function search(query, categoryId) {
    const favs = favoritesOnly ? getFavorites() : null;
    return allProducts.filter((p) => {
      const inCategory = !categoryId || categoryId === "all" || p.category === categoryId;
      const inFavorites = !favoritesOnly || (favs && favs.includes(p.id));
      return inCategory && inFavorites && matches(p, query);
    });
  }

  function setFavoritesOnly(val) {
    favoritesOnly = val;
  }

  function getAlternatives(productId) {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return [];
    return (product.alternatives || [])
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getPrimaryImage(product) {
    const gallery = Array.isArray(product.images) ? product.images : [];
    return [product.image, ...gallery].find((image) => typeof image === "string" && image.trim()) || "";
  }

  function renderCard(product) {
    const cat = categories.find((c) => c.id === product.category) || {};
    const title = escapeHtml(product.trade_name || "منتج صيدلي");
    const active = escapeHtml(product.active_ingredient || "");
    const uses = escapeHtml(product.short_uses || product.active_ingredient || "تواصل مع الصيدلي لمعرفة التفاصيل.");
    const image = getPrimaryImage(product);
    const alt = escapeHtml([product.trade_name, product.active_ingredient].filter(Boolean).join(" — ") || "صورة منتج صيدلي");
    const available = product.available === true;
    const currency = product.currency === "EGP" ? "ج.م" : escapeHtml(product.currency || "ج.م");
    const price = Number.isFinite(Number(product.price)) ? Number(product.price).toFixed(2).replace(/\.00$/, "") : "—";
    const availability = available ? "متوفر" : "غير متوفر";
    const thumb = image
      ? `<img src="${image}" alt="${alt}" loading="lazy">`
      : `<span aria-hidden="true">${cat.icon || "💊"}</span>`;

    return `
      <article class="prod-card">
        <a class="prod-image-link" href="product.html?id=${encodeURIComponent(product.id)}" aria-label="عرض تفاصيل ${title}">
          <div class="prod-thumb">
            <span class="prod-availability ${available ? "in" : "out"}">${availability}</span>
            ${thumb}
          </div>
        </a>
        <div class="prod-body">
          <h3>${title}</h3>
          <div class="prod-meta">${active ? `المادة الفعالة: ${active}` : `الفئة: ${escapeHtml(cat.name || "منتج صيدلي")}`}</div>
          <p>${uses}</p>
          <div class="prod-foot">
            ${available ? `<span class="prod-price">${price} ${currency}</span>` : `<span class="prod-unavailable">غير متوفر حاليًا</span>`}
            <div class="prod-actions">
              ${available ? `<button type="button" class="prod-btn prod-cart-btn" data-id="${escapeHtml(product.id)}" aria-label="إضافة ${title} إلى السلة" style="border:none;cursor:pointer;font-family:inherit;">🛒</button>` : ""}
              <a href="product.html?id=${encodeURIComponent(product.id)}" class="prod-btn">${available ? "التفاصيل" : "اسأل"}</a>
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderResults(container, results) {
    currentResults = results;
    visibleCount = PAGE_SIZE;
    gridEl = container;
    renderVisible();
  }

  function renderVisible() {
    if (!gridEl) return;
    const total = currentResults.length;
    const slice = currentResults.slice(0, visibleCount);

    if (total === 0) {
      gridEl.innerHTML = `<p class="no-results">لا توجد منتجات مطابقة لبحثك.</p>`;
      return;
    }

    let html = slice.map(renderCard).join("");

    if (visibleCount < total) {
      html += `
        <div style="grid-column:1/-1;text-align:center;padding:20px 0;">
          <button id="load-more-btn" style="
            background:var(--petrol,#0F4C4F);color:#fff;border:none;
            padding:12px 28px;border-radius:999px;font-family:'IBM Plex Sans Arabic',sans-serif;
            font-size:14.5px;font-weight:600;cursor:pointer;">
            عرض المزيد
          </button>
        </div>`;
    } else if (total > PAGE_SIZE) {
      html += `
        <div style="grid-column:1/-1;text-align:center;padding:14px 0;color:rgba(14,42,46,0.5);font-size:13px;">
          تم عرض كل ${total} منتج
        </div>`;
    }

    gridEl.innerHTML = html;

    const loadMoreBtn = gridEl.querySelector("#load-more-btn");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => {
        visibleCount += PAGE_SIZE;
        renderVisible();
      });
    }

    // ربط أزرار "أضف للسلة" على كل كارت
    gridEl.querySelectorAll(".prod-cart-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const product = allProducts.find((p) => p.id === btn.dataset.id);
        if (!product) return;
        Cart.addItem({
          id: product.id,
          trade_name: product.trade_name,
          price: product.price,
          image: product.image,
        });
      });
    });
  }

  async function init(inputSelector, gridSelector, categorySelector) {
    const grid = document.querySelector(gridSelector);
    grid.innerHTML = `<p class="no-results">جاري تحميل المنتجات...</p>`;

    try {
      allProducts = await fetchAllProducts();
    } catch (err) {
      grid.innerHTML = `<p class="no-results">تعذّر تحميل المنتجات، حاولي تحديث الصفحة.</p>`;
      console.error(err);
      return;
    }

    const input = document.querySelector(inputSelector);
    const catSelect = categorySelector ? document.querySelector(categorySelector) : null;

    function runSearch() {
      const query = input ? input.value : "";
      const categoryId = catSelect ? catSelect.value : "all";
      renderResults(grid, search(query, categoryId));
    }

    let debounceTimer;
    if (input) {
      input.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runSearch, 150);
      });
    }
    if (catSelect) catSelect.addEventListener("change", runSearch);

    // إتاحة إعادة البحث من الخارج (زي فلاتر الفئات والمفضلة في home-widgets.js)
    PharmacySearch.setCategory = (catId) => {
      if (catSelect) catSelect.value = catId;
      runSearchWithCategory(catId);
    };
    function runSearchWithCategory(catId) {
      const query = input ? input.value : "";
      renderResults(grid, search(query, catId));
    }
    PharmacySearch._runSearch = runSearch;
    PharmacySearch.setFavoritesOnly = (val) => {
      setFavoritesOnly(val);
      runSearch();
    };

    runSearch();
  }

  return { init, search, getAlternatives, normalize, setFavoritesOnly };
})();

window.PharmacySearch = PharmacySearch;
