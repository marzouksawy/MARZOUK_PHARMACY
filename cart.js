import { LS_KEYS } from "./constants.js";
import { getLocalItem, setLocalItem, formatPrice, showToast } from "./utils.js";

// ===== Cart Core =====
// شكل عنصر السلة الواحد:
// { id, trade_name, price, image, qty }

const Cart = (function () {
  function getCart() {
    return getLocalItem(LS_KEYS.CART, []);
  }

  function saveCart(cart) {
    setLocalItem(LS_KEYS.CART, cart);
    updateBadge();
  }

  function addItem(product, qty = 1) {
    const cart = getCart();
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: product.id,
        trade_name: product.trade_name,
        price: product.price,
        image: product.image || "",
        qty,
      });
    }
    saveCart(cart);
    showToast(`تمت إضافة ${product.trade_name} إلى السلة`);
  }

  function removeItem(productId) {
    const cart = getCart().filter((i) => i.id !== productId);
    saveCart(cart);
  }

  function updateQty(productId, qty) {
    const cart = getCart();
    const item = cart.find((i) => i.id === productId);
    if (!item) return;
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    item.qty = qty;
    saveCart(cart);
  }

  function clearCart() {
    saveCart([]);
  }

  function getTotalItems() {
    return getCart().reduce((sum, i) => sum + i.qty, 0);
  }

  function getTotalPrice() {
    return getCart().reduce((sum, i) => sum + i.qty * i.price, 0);
  }

  // ===== تحديث الـ Badge على أيقونة السلة (لو موجودة في الصفحة) =====
  function updateBadge() {
    const badge = document.querySelector("#cart-badge");
    if (!badge) return;
    const count = getTotalItems();
    badge.textContent = count > 0 ? count : "";
    badge.style.display = count > 0 ? "flex" : "none";
  }

  // ===== رسم صفحة السلة الكاملة (cart.html) =====
  function renderCartPage(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const cart = getCart();

    if (!cart.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
          <p style="font-size:16px;color:var(--ink);margin-bottom:16px;">السلة فارغة حاليًا</p>
          <a href="index.html" class="cart-cta-btn">تصفح المنتجات</a>
        </div>
      `;
      return;
    }

    const itemsHtml = cart
      .map(
        (item) => `
      <div class="cart-item" data-id="${item.id}" style="display:flex;align-items:center;gap:14px;
        padding:14px 0;border-bottom:1px solid var(--line);">
        <img src="${item.image || "icon-192.png"}" alt="${item.trade_name}"
          style="width:56px;height:56px;object-fit:cover;border-radius:10px;flex-shrink:0;">
        <div style="flex:1;">
          <div style="font-weight:600;color:var(--ink);margin-bottom:4px;">${item.trade_name}</div>
          <div style="color:var(--primary);font-size:14px;">${formatPrice(item.price)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="qty-btn" data-action="decrease" data-id="${item.id}"
            style="width:28px;height:28px;border-radius:8px;border:1px solid var(--line);
            background:var(--card);cursor:pointer;font-size:16px;">−</button>
          <span style="min-width:20px;text-align:center;">${item.qty}</span>
          <button class="qty-btn" data-action="increase" data-id="${item.id}"
            style="width:28px;height:28px;border-radius:8px;border:1px solid var(--line);
            background:var(--card);cursor:pointer;font-size:16px;">+</button>
        </div>
        <button class="remove-btn" data-id="${item.id}"
          style="background:none;border:none;color:#C0392B;cursor:pointer;font-size:18px;margin-inline-start:6px;">🗑</button>
      </div>
    `
      )
      .join("");

    container.innerHTML = `
      <div class="cart-items">${itemsHtml}</div>
      <div class="cart-summary" style="margin-top:20px;padding-top:16px;border-top:2px solid var(--primary);">
        <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:700;color:var(--ink);margin-bottom:16px;">
          <span>الإجمالي</span>
          <span>${formatPrice(getTotalPrice())}</span>
        </div>
        <a href="checkout.html" class="cart-cta-btn" style="display:block;text-align:center;">إتمام الطلب</a>
      </div>
    `;

    // ربط أزرار الكمية والحذف
    container.querySelectorAll(".qty-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const item = getCart().find((i) => i.id === id);
        if (!item) return;
        const newQty = btn.dataset.action === "increase" ? item.qty + 1 : item.qty - 1;
        updateQty(id, newQty);
        renderCartPage(containerSelector);
      });
    });
    container.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeItem(btn.dataset.id);
        renderCartPage(containerSelector);
      });
    });
  }

  return {
    getCart,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    getTotalItems,
    getTotalPrice,
    updateBadge,
    renderCartPage,
  };
})();

// تحديث الـ Badge تلقائيًا عند تحميل أي صفحة تستورد الملف ده
document.addEventListener("DOMContentLoaded", () => Cart.updateBadge());

window.Cart = Cart;
export default Cart;
