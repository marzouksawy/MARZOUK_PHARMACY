/**
 * search.js — منطق البحث والتصفية لصفحة المنتجات (v1.3)
 * استخدمه مع products.json الموجود في نفس المجلد.
 *
 * دمجه في صفحة المنتجات الحالية:
 *   <script src="search.js"></script>
 *   ...
 *   PharmacySearch.init('#search-input', '#products-grid');
 */
const PharmacySearch = (function () {
  let allProducts = [];
  let categories = [];

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
    return (
      normalize(product.trade_name).includes(q) ||
      normalize(product.active_ingredient).includes(q) ||
      normalize(product.company).includes(q)
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
            <span class="prod-price">${product.price} ${product.currency === "EGP" ? "ج.م" : product.currency}</span>
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
    const res = await fetch("products.json");
    const data = await res.json();
    allProducts = data.products;
    categories = data.categories;

    const input = document.querySelector(inputSelector);
    const grid = document.querySelector(gridSelector);
    const catSelect = categorySelector ? document.querySelector(categorySelector) : null;

    function runSearch() {
      const query = input ? input.value : "";
      const categoryId = catSelect ? catSelect.value : "all";
      renderResults(grid, search(query, categoryId));
    }

    if (input) input.addEventListener("input", runSearch);
    if (catSelect) catSelect.addEventListener("change", runSearch);

    runSearch(); // عرض كل المنتجات أول ما الصفحة تفتح
  }

  return { init, search, getAlternatives, normalize };
})();
