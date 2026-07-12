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
    el.innerHTML =
      chips
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
        .join("") +
      `<button type="button" id="fav-filter-btn"
        style="padding:8px 16px;border-radius:999px;border:1px solid var(--line);
        background:var(--paper);color:var(--ink);
        font-family:'IBM Plex Sans Arabic';font-size:13.5px;cursor:pointer;margin:4px;">
        ❤️ المفضلة
      </button>`;
    el.querySelectorAll("button[data-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        el.querySelectorAll("button[data-cat]").forEach((b) => {
          b.style.background = "var(--paper)";
          b.style.color = "var(--ink)";
        });
        btn.style.background = "var(--petrol)";
        btn.style.color = "#fff";
        PharmacySearch.setFavoritesOnly(false);
        onSelect(btn.dataset.cat);
      });
    });
    const favBtn = el.querySelector("#fav-filter-btn");
    let favActive = false;
    favBtn.addEventListener("click", () => {
      favActive = !favActive;
      favBtn.style.background = favActive ? "var(--amber)" : "var(--paper)";
      favBtn.style.color = favActive ? "#fff" : "var(--ink)";
      PharmacySearch.setFavoritesOnly(favActive);
    });
  }

  // ===== الوضع الليلي =====
  function initDarkMode(toggleSelector) {
    const btn = document.querySelector(toggleSelector);
    const saved = localStorage.getItem("marzouk_theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    updateToggleIcon(btn);
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("marzouk_theme", "light");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("marzouk_theme", "dark");
      }
      updateToggleIcon(btn);
    });
  }

  function updateToggleIcon(btn) {
    if (!btn) return;
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    btn.textContent = isDark ? "☀️" : "🌙";
  }

  // ===== شريط تنبيه التحديثات (بديل عملي بدون سيرفر) =====
  async function renderUpdateBanner(selector, contentUrl) {
    const el = document.querySelector(selector);
    if (!el) return;
    const res = await fetch(contentUrl || "content.json");
    const data = await res.json();
    const update = data.latest_update;
    if (!update) return;
    const seenId = localStorage.getItem("marzouk_seen_update");
    if (seenId === update.id) return;

    el.innerHTML = `
      <div style="background:var(--amber);color:#fff;padding:12px 18px;display:flex;
        align-items:center;justify-content:space-between;gap:12px;font-size:14px;">
        <span>${update.message}</span>
        <button id="dismiss-update-btn" style="background:rgba(255,255,255,0.25);border:none;
          color:#fff;border-radius:999px;width:26px;height:26px;cursor:pointer;flex-shrink:0;">✕</button>
      </div>
    `;
    el.querySelector("#dismiss-update-btn").addEventListener("click", () => {
      localStorage.setItem("marzouk_seen_update", update.id);
      el.innerHTML = "";
    });
  }

  // ===== تفعيل إشعارات المتصفح (محلية فقط، بدون سيرفر Push) =====
  function initNotificationOptIn(btnSelector) {
    const btn = document.querySelector(btnSelector);
    if (!btn || !("Notification" in window)) return;

    function refreshLabel() {
      btn.textContent =
        Notification.permission === "granted" ? "🔔 الإشعارات مفعّلة" : "🔕 فعّل الإشعارات";
    }
    refreshLabel();

    btn.addEventListener("click", async () => {
      if (Notification.permission === "granted") {
        new Notification("صيدلية د. مرزوق الصاوي", {
          body: "الإشعارات شغالة بنجاح! هنبلغك بأي تحديث مهم.",
        });
        return;
      }
      const perm = await Notification.requestPermission();
      refreshLabel();
      if (perm === "granted") {
        new Notification("صيدلية د. مرزوق الصاوي", {
          body: "تم تفعيل الإشعارات بنجاح ✅",
        });
      }
    });
  }

  return {
    renderOpenStatus,
    renderDailyTip,
    renderMedicineOfDay,
    renderEmergencyNumbers,
    renderCategoryFilters,
    initDarkMode,
    renderUpdateBanner,
    initNotificationOptIn,
  };
})();
