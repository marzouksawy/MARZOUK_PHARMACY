// firebase-config.js — إعداد Firebase المشترك لكل صفحات الموقع
// يُستورد كـ ES module: <script type="module" src="firebase-config.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBisIWwa7v48bA3Vb4dds6_G8dk9OIvH7w",
  authDomain: "marzouk-pharmacy.firebaseapp.com",
  projectId: "marzouk-pharmacy",
  storageBucket: "marzouk-pharmacy.firebasestorage.app",
  messagingSenderId: "710677488799",
  appId: "1:710677488799:web:0be59f38c27ef89dc22eaa",
  measurementId: "G-D2XX5C2Q7J",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// تصنيفات ثابتة (نادرًا ما تتغير، فمش محتاجة قاعدة بيانات)
export const CATEGORIES = [
  { id: "drugs", name: "أدوية", icon: "💊", color: "#0F4C4F" },
  { id: "supplements", name: "فيتامينات ومكملات", icon: "🌿", color: "#D98C4A" },
  { id: "care", name: "عناية ومستلزمات طبية", icon: "🩹", color: "#7A6A8A" },
];

// جلب كل المنتجات من Firestore
export async function fetchAllProducts() {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// جلب منتج واحد بالمعرف
export async function fetchProduct(id) {
  const ref = doc(db, "products", id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// إضافة/تعديل منتج (تُستخدم في لوحة التحكم لاحقًا)
export async function saveProduct(id, data) {
  await setDoc(doc(db, "products", id), data, { merge: true });
}

// حذف منتج (تُستخدم في لوحة التحكم لاحقًا)
export async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", id));
}

export { db, doc, setDoc, getDocs, collection };
