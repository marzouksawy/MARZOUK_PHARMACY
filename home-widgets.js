const PharmacyHome = (function () {
  // ===== حالة الصيدلية (مفتوح/مغلق) بناءً على مواعيد العمل: يوميًا 8:00 ص - 1:00 ص =====
  function renderOpenStatus(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    const now = new Date();
    const hour = now.getHours();
    // مفتوحة من 8 صباحًا حتى 1 بعد منتصف الليل (يعني مغلقة فقط من 1:00 إلى 8:00 صباحًا)
    const isOpen = hour >= 8 || hour < 1;
    el.textContent = isOpen ? "مفتوحة الآن" : "مغلقة حاليًا — تفتح 8:00 ص";
    el.style.color = isOpen ? "#2E7D55" : "#C0392B";
  }

  // ===== نصيحة اليوم: تدور حسب رقم يوم السنة عشان تتغير كل يوم تلقائيًا =====
  function dayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  async function renderDailyTip(selector, contentUrl) {
    const el = document.querySelector(selector);
    if (!el) return;
    const res = await fetch(contentUrl || "content.json");
    const data = await res.json();
    const tips = data.daily_tips || [];
    if (!tips.length) return;
    el.textContent = tips[dayOfYear() % tips.length];
  }

  // ===== دواء اليوم: يدور على منتج مقترح من القايمة، ويقرأ بياناته الكاملة من products.json =====
  async function renderMedicineOfDay(selector, contentUrl, productsUrl) {
    const el = document.querySelector(selector);
    if (!el) return;
    const [contentRes, productsRes] = await Promise.all([
      fetch(contentUrl || "content.json"),
      fetch(productsUrl || "products.json"),
    ]);
    const content = await contentRes.json();
    const productsData = await productsRes.json();
    const ids = content.medicine_of_day_ids || [];
    if (!ids.length) return;
    const todayId = ids[dayOfYear() % ids.length];
    const product = productsData.products.find((p) => p.id === todayId);
    if (!product) return;
    el.innerHTML = `
      <h3 style="margin-bottom:6px;">${product.trade_name}</h3>
      <p style="margin-bottom:14px;">${product.short_uses || product.active_ingredient}</p>
      <a href="product.html?id=${product.id}" class="prod-btn">التفاصيل</a>
    `;
  }

  // ===== أرقام الطوارئ =====
  async function renderEmergencyNumbers(selector, contentUrl) {
    const el = document.querySelector(selector);
    if (!el) return;
    const res = await fetch(contentUrl || "content.json");
    const data = await res.json();
    const numbers = data.emergency_numbers || [];
    el.innerHTML = numbers
      .map(
        (n) => `
      <a href="tel:${n.number}" class="contact-item" style="text-decoration:none;">
        <span class="ic">📞</span>
        <div><div class="t">${n.label}</div><div class="d">${n.number}</div></div>
      </a>`
      )
      .join("");
  }

  // ===== فلتر الفئات فوق شبكة المنتجات (يعمل مع search.js الموجود) =====
  function renderCategoryFilters(selector, categories, onSelect) {
    const el = document.querySelector(selector);
    if (!el) return;
    const chips = [{ id: "all", name: "الكل", icon: "🔎" }, ...categories];
    el.innerHTML = chips
      .map(
        (c, i) => `
      <button type="button" data-cat="${c.id}"
        style="padding:8px 16px;border-radius:999px;border:1px solid var(--line);
        background:${i === 0 ? "var(--petrol)" : "var(--paper)"};
        color:${i === 0 ? "#fff" : "var(--ink)"};
        font-family:'IBM Plex Sans Arabic';font-size:13.5px;cursor:pointer;margin:4px;">
        ${c.icon || ""} ${c.name}
      </button>`
      )
      .join("");
    el.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        el.querySelectorAll("button").forEach((b) => {
          b.style.background = "var(--paper)";
          b.style.color = "var(--ink)";
        });
        btn.style.background = "var(--petrol)";
        btn.style.color = "#fff";
        onSelect(btn.dataset.cat);
      });
    });
  }

  return {
    renderOpenStatus,
    renderDailyTip,
    renderMedicineOfDay,
    renderEmergencyNumbers,
    renderCategoryFilters,
  };
})();
