// utils.js
// دوال مساعدة عامة (Helper Functions) يستخدمها أكتر من ملف في المشروع
// استوردها بالشكل ده: import { formatPrice, generateOrderId } from "./utils.js";

// ===== تنسيق السعر =====
export function formatPrice(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  return `${Number(amount).toLocaleString("ar-EG")} جنيه`;
}

// ===== تنسيق التاريخ بالعربي =====
export function formatDateAr(date = new Date()) {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date instanceof Date ? date : new Date(date));
}

// ===== توليد رقم طلب فريد (V3.3) =====
// شكل الرقم: ORD-YYYYMMDD-XXXX (XXXX رقم عشوائي)
export function generateOrderId() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${datePart}-${randomPart}`;
}

// ===== بناء رابط واتساب مع رسالة جاهزة =====
export function buildWhatsAppLink(phoneNumber, message) {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

// ===== Debounce (مفيد في البحث اللحظي) =====
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ===== قراءة/كتابة آمنة من LocalStorage (بترجع null بدل ما تكسر الصفحة) =====
export function getLocalItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`تعذر قراءة ${key} من LocalStorage:`, e);
    return fallback;
  }
}

export function setLocalItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`تعذر حفظ ${key} في LocalStorage:`, e);
    return false;
  }
}

// ===== تنبيه بسيط (Toast) يمكن استخدامه بدل alert() =====
export function showToast(message, duration = 2500) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #0F4C4F; color: #F6F2EA; padding: 12px 20px; border-radius: 10px;
    font-family: 'Tajawal', sans-serif; font-size: 14px; z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2); opacity: 0; transition: opacity 0.3s ease;
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => (toast.style.opacity = "1"));
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== الحصول على موقع العميل (GPS) — نسخة مُحسّنة للدقة (بعد ملاحظة عدم دقة الموقع) =====
// المشكلة القديمة: getCurrentPosition بمكالمة واحدة كان بيرجّع أول قراءة متاحة، وغالبًا
// دي كانت قراءة تقريبية معتمدة على الواي فاي/الشبكة قبل ما شريحة الـ GPS تاخد وقتها الكافي
// (10-30 ثانية عادةً) عشان توصل لقفل دقيق (GPS lock).
//
// الحل: نستخدم watchPosition بدل مكالمة واحدة، ونفضل نستقبل قراءات متتالية لمدة أطول
// (15 ثانية كحد أقصى)، ونحتفظ بأدق قراءة وصلتنا (أقل رقم accuracy بالمتر). لو وصلت لدقة
// ممتازة (أقل من 30 متر) نوقف فورًا من غير استنى لحد آخر المهلة، عشان مانضيعش وقت العميل
// من غير داعي لو الجهاز قفل بسرعة.
//
// بترجع: { lat, lng, accuracy } — accuracy بالمتر، تقدر تستخدمها لعرض مستوى الثقة للمستخدم.
export function getCurrentLocation(options = {}) {
  const {
    maxWaitMs = 15000, // أقصى وقت انتظار إجمالي
    desiredAccuracyMeters = 30, // لو وصلنا لدقة أحسن من كده، نوقف فورًا
  } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("المتصفح لا يدعم تحديد الموقع"));
      return;
    }

    let bestPosition = null;
    let watchId = null;
    let finished = false;

    function finish(err) {
      if (finished) return;
      finished = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timeoutId);
      if (bestPosition) {
        resolve({
          lat: bestPosition.coords.latitude,
          lng: bestPosition.coords.longitude,
          accuracy: bestPosition.coords.accuracy,
        });
      } else {
        reject(err || new Error("تعذر تحديد الموقع"));
      }
    }

    const timeoutId = setTimeout(() => finish(new Error("انتهت مهلة تحديد الموقع")), maxWaitMs);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }
        if (position.coords.accuracy <= desiredAccuracyMeters) {
          finish();
        }
      },
      (error) => {
        finish(error);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: maxWaitMs }
    );
  });
}
