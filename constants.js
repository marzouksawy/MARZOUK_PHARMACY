// constants.js
// ملف موحّد لكل الأسماء (Keys) المستخدمة في LocalStorage و Firestore
// الهدف: أي ملف جديد (cart.js, checkout.js, ...) يستورد من هنا بدل ما يكتب النص يدوي
// لو غيّرت اسم أي مفتاح، غيّره هنا بس وكل الملفات هتتحدث تلقائي

// ===== LocalStorage Keys =====
export const LS_KEYS = {
  CART: "marzouk_pharmacy_cart",
  WISHLIST: "marzouk_pharmacy_wishlist",
  WHATSAPP_SUMMARY: "marzouk_pharmacy_whatsapp_summary", // مستخدم فعلاً في suggest-edit.html
  GUEST_CUSTOMER_INFO: "marzouk_pharmacy_guest_info", // مستخدم في V3.2 (Checkout)
  APPLIED_COUPON: "marzouk_pharmacy_applied_coupon", // هيتلي استخدامه في V3.6
};

// ===== Firestore Collections =====
export const COLLECTIONS = {
  PRODUCTS: "products",
  STAFF: "staff",
  EDIT_REQUESTS: "edit_requests",
  ORDERS: "orders", // مستخدم فعلاً في V3.2 (Checkout)
  COUPONS: "coupons", // هيتلي استخدامه في V3.6
  AUDIT_LOG: "audit_log", // هيتلي استخدامه في V3.11
};

// ===== Order Status (V3.3 / V3.4) =====
export const ORDER_STATUS = {
  PENDING: "pending",
  PREPARING: "preparing",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

// أسماء الحالات بالعربي للعرض في الواجهة
export const ORDER_STATUS_LABELS_AR = {
  [ORDER_STATUS.PENDING]: "قيد الانتظار",
  [ORDER_STATUS.PREPARING]: "جاري التجهيز",
  [ORDER_STATUS.OUT_FOR_DELIVERY]: "خرج للتوصيل",
  [ORDER_STATUS.DELIVERED]: "تم التوصيل",
  [ORDER_STATUS.CANCELLED]: "ملغي",
};

// ===== أرقام واتساب =====
export const WHATSAPP_NUMBERS = {
  ADMIN: "966541796684",
  ORDERS: "201062276534", // رقم استقبال طلبات العملاء (V3.2 Checkout)
};

// ===== إعدادات عامة =====
export const APP_CONFIG = {
  CURRENCY: "جنيه",
  LOYALTY_POUNDS_PER_POINT: 100, // هيتلي استخدامه في V3.10
};
