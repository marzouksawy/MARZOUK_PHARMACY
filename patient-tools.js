const PatientTools = (function () {
  const FAV_KEY = "marzouk_pharmacy_favorites";
  const WHATSAPP_NUMBER = "201062276534";

  // ================= المفضلة =================
  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function isFavorite(id) {
    return getFavorites().includes(id);
  }

  function toggleFavorite(id) {
    let favs = getFavorites();
    if (favs.includes(id)) {
      favs = favs.filter((f) => f !== id);
    } else {
      favs.push(id);
    }
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    return favs.includes(id);
  }

  // ================= رفع الروشتة =================
  function initPrescriptionUpload(containerSelector) {
    const el = document.querySelector(containerSelector);
    if (!el) return;

    el.innerHTML = `
      <div style="text-align:center;">
        <input type="file" accept="image/*" capture="environment" id="rx-file-input" style="display:none;">
        <label for="rx-file-input" class="btn btn-primary" style="cursor:pointer;display:inline-flex;">
          📷 اختر صورة الروشتة
        </label>
        <div id="rx-preview" style="margin-top:16px;"></div>
        <div id="rx-send-area" style="margin-top:14px;"></div>
      </div>
    `;

    const input = el.querySelector("#rx-file-input");
    const preview = el.querySelector("#rx-preview");
    const sendArea = el.querySelector("#rx-send-area");
    let selectedFile = null;

    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;
      selectedFile = file;
      const url = URL.createObjectURL(file);
      preview.innerHTML = `<img src="${url}" style="max-width:220px;border-radius:12px;border:1px solid var(--line);margin:0 auto;">`;

      const canShareFiles =
        navigator.canShare && navigator.canShare({ files: [file] });

      if (canShareFiles) {
        sendArea.innerHTML = `<button id="rx-send-btn" class="btn btn-primary">إرسال الروشتة عبر واتساب</button>`;
        el.querySelector("#rx-send-btn").addEventListener("click", async () => {
          try {
            await navigator.share({
              files: [selectedFile],
              text: "روشتة من عميل صيدلية د. مرزوق الصاوي",
            });
          } catch (e) {
            /* المستخدم ألغى المشاركة */
          }
        });
      } else {
        sendArea.innerHTML = `
          <p style="font-size:13px;color:rgba(14,42,46,0.6);margin-bottom:10px;">
            جهازك مش بيدعم إرفاق الصورة تلقائيًا. اضغط تواصل واتساب وارفق الصورة يدويًا من المعرض.
          </p>
          <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
          "معايا روشتة عايز أرسلها، هرفقها دلوقتي"
        )}" target="_blank" class="btn btn-primary">فتح واتساب لإرفاق الروشتة</a>
        `;
      }
    });
  }

  // ================= اسأل الصيدلي =================
  function initAskPharmacist(containerSelector) {
    const el = document.querySelector(containerSelector);
    if (!el) return;

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;max-width:420px;">
        <input id="ask-name" type="text" placeholder="اسمك (اختياري)"
          style="padding:12px 16px;border-radius:12px;border:1px solid var(--line);font-family:'IBM Plex Sans Arabic';">
        <textarea id="ask-question" placeholder="اكتب سؤالك للصيدلي هنا..." rows="3"
          style="padding:12px 16px;border-radius:12px;border:1px solid var(--line);font-family:'IBM Plex Sans Arabic';resize:vertical;"></textarea>
        <button id="ask-send-btn" class="btn btn-primary" style="align-self:flex-start;">إرسال السؤال عبر واتساب</button>
      </div>
    `;

    el.querySelector("#ask-send-btn").addEventListener("click", () => {
      const name = el.querySelector("#ask-name").value.trim();
      const question = el.querySelector("#ask-question").value.trim();
      if (!question) {
        alert("من فضلك اكتب سؤالك أولًا");
        return;
      }
      const text = `${name ? "الاسم: " + name + "\n" : ""}سؤال لصيدلي الصيدلية:\n${question}`;
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
        "_blank"
      );
    });
  }

  return {
    getFavorites,
    isFavorite,
    toggleFavorite,
    initPrescriptionUpload,
    initAskPharmacist,
  };
})();
