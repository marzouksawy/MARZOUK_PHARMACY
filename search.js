// search.js — منطق البحث والتصفية لصفحة المنتجات (v2.0)
// دلوقتي بيقرأ المنتجات من Firestore بدل products.json
// لازم يُستورد كـ module: <script type="module" src="search.js"></script>

import { fetchAllProducts, CATEGORIES } from "./firebase-config.js";

const PharmacySearch = (function () {
  let allProducts = [];
  let categories = CATEGORIES;

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

  function search(query, categoryId) {
    return allProducts.filter((p) => {
      const inCategory = !categoryId || categoryId === "all" || p.category === categoryId;
      return inCategory && matches(p, query);
    });
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
    return `
      <div class="prod-card">
        <div class="prod-thumb"${product.image ? ' style="background:#f5f5f5;"' : ""}>${thumb}</div>
        <div class="prod-body">
          <h3>${product.trade_name}</h3>
          <p>${product.short_uses || product.active_ingredient}</p>
          <div class="prod-foot">
            <span class="prod-price">${product.available ? (product.price + " " + (product.currency === "EGP" ? "ج.م" : product.currency)) : "غير متوفر"}</span>
            <a href="product.html?id=${product.id}" class="prod-btn">التفاصيل</a>
          </div>
        </div>
      </div>`;
  }

  function renderResults(container, results) {
    container.innerHTML = results.length
      ? results.map(renderCard).join("")
      : `<p class="no-results">لا توجد منتجات مطابقة لبحثك.</p>`;
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

    runSearch();
  }

  return { init, search, getAlternatives, normalize };
})();

window.PharmacySearch = PharmacySearch;
