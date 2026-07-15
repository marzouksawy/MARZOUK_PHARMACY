/**
 * search.js — منطق البحث والتصفية لصفحة المنتجات (v2.0)
 * يقرأ المنتجات من Firestore بدل products.json.
 * لازم يُستدعى كـ module: <script type="module" src="search.js"></script>
 */
import { fetchAllProducts, CATEGORIES } from "./firebase-config.js";

const PharmacySearch = (function () {
  let allProducts = [];
  let categories = CATEGORIES;

  // إزالة التشكيل والمسافات الزائدة عشان البحث العربي يكون مرن
  function normalize(text) {
    return (text || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[\u064B-\u0652]/g, "") // تشكيل
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي");
  }

  function matches(product, query) {
    const q = normalize(query);
    if (!q) return true;
    const keywordsMatch = (product.keywords || []).some((k) =>
      normalize(k).includes(q)
    );
    return (
      normalize(product.trade_name).includes(q) ||
      normalize(product.active_ingredient).includes(q) ||
      normalize(product.company).includes(q) ||
      keywordsMatch
    );
  }

  function getAlternatives(productId) {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return [];
    return (product.alternatives || [])
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean);
  }

  function renderCard(product) {
    const cat = categories.find((c) => c.id === product.category) || {};
    const thumb = product.image
      ? `<img src="${product.image}" alt="${product.trade_name}" style="width:100%;height:100%;object-fit:contain;padding:6px;">`
      : cat.icon || "💊";
    const favActive = typeof PatientTools !== 'undefined' && PatientTools.isFavorite(product.id);
    return `
      <div class="prod-card" style="position:relative;">
        <button class="fav-btn" data-fav-id="${product.id}"
          style="position:absolute;top:10px;left:10px;z-index:2;border:none;background:rgba(255,255,255,0.9);
          width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;">
          ${favActive ? "❤️" : "🤍"}
        </button>
        <div class="prod-thumb"${product.image ? ' style="background:#f5f5f5;"' : ""}>${thumb}</div>
        <div class="prod-body">
          <h3>${product.trade_name}</h3>
          <p>${product.short_uses || product.active_ingredient}</p>
          <div class="prod-foot">
            <span class="prod-price">${product.price} ${product.currency === "EGP" ? "ج.م" : product.currency}</span>
            <a href="product.html?id=${product.id}" class="prod-btn">التفاصيل</a>
          </div>
        </div>
      </div>`;
  }

  let currentCategory = "all";
  let favoritesOnly = false;

  function search(query, categoryId) {
    return allProducts.filter((p) => {
      const inCategory = !categoryId || categoryId === "all" || p.category === categoryId;
      const inFavorites =
        !favoritesOnly || (typeof PatientTools !== 'undefined' && PatientTools.isFavorite(p.id));
      return inCategory && inFavorites && matches(p, query);
    });
  }

  function bindFavButtons(grid) {
    grid.querySelectorAll(".fav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.favId;
        if (typeof PatientTools !== 'undefined') {
          const nowActive = PatientTools.toggleFavorite(id);
          btn.textContent = nowActive ? "❤️" : "🤍";
          if (favoritesOnly && !nowActive) window.__pharmacyRunSearch && window.__pharmacyRunSearch();
        }
      });
    });
  }

  function renderResults(container, results) {
    container.innerHTML = results.length
      ? results.map(renderCard).join("")
      : `<p class="no-results">لا توجد منتجات مطابقة لبحثك.</p>`;
    bindFavButtons(container);
  }

  async function init(inputSelector, gridSelector, categorySelector) {
    allProducts = await fetchAllProducts();
    categories = CATEGORIES;

    const input = document.querySelector(inputSelector);
    const grid = document.querySelector(gridSelector);
    const catSelect = categorySelector ? document.querySelector(categorySelector) : null;

    function runSearch() {
      const query = input ? input.value : "";
      const categoryId = catSelect ? catSelect.value : currentCategory;
      renderResults(grid, search(query, categoryId));
    }

    if (input) input.addEventListener("input", runSearch);
    if (catSelect) catSelect.addEventListener("change", runSearch);

    // يُستدعى من أزرار الفلتر في home-widgets.js
    window.__pharmacyRunSearch = runSearch;
    window.__pharmacySetCategory = function (catId) {
      currentCategory = catId;
      runSearch();
    };

    runSearch(); // عرض كل المنتجات أول ما الصفحة تفتح
  }

  return {
    init,
    search,
    getAlternatives,
    normalize,
    getCategories: () => categories,
    setCategory: (catId) => window.__pharmacySetCategory && window.__pharmacySetCategory(catId),
    setFavoritesOnly: (val) => {
      favoritesOnly = val;
      window.__pharmacyRunSearch && window.__pharmacyRunSearch();
    },
  };
})();

window.PharmacySearch = PharmacySearch;
