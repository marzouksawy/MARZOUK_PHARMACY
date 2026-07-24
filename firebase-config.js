// firebase-config.js — إعداد Firebase المشترك لكل صفحات الموقع
// يُستورد كـ ES module: <script type="module" src="firebase-config.js"></script>
// ملحوظة: مفيش Firebase Storage هنا (يحتاج خطة Blaze مدفوعة).
// الصور بتتخزن كـ base64 جوه مستند المنتج نفسه في Firestore (حد أقصى ~700 كيلوبايت للصورة).

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
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
const auth = getAuth(app);

// ===== المصادقة (تسجيل الدخول للوحة التحكم) =====
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

// حماية صفحة: لو مفيش مستخدم مسجّل دخول، يرجّعه لصفحة تسجيل الدخول
export function requireAuth(redirectTo = "admin-login.html") {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = redirectTo;
      } else {
        resolve(user);
      }
    });
  });
}

// ===== جلب صلاحية (role) الموظف من مجموعة staff =====
// بيرجع الـ role كنص ("assistant", "pharmacist", ...) أو null لو الموظف مش موجود في المجموعة
export async function getStaffRole(uid) {
  const ref = doc(db, "staff", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().role || null : null;
}

// حماية صفحة الأدمن: لازم يكون مسجّل دخول وصلاحيته ضمن الأدوار المسموحة
// افتراضيًا بيسمح لأي حد role بتاعه مش "assistant" (يعني الصيدلي/المالك)
// لو الموظف assistant بيتحول لـ suggest-edit.html بدل ما يدخل اللوحة
export function requireAdminAuth(options = {}) {
  const { loginRedirect = "admin-login.html", assistantRedirect = "suggest-edit.html" } = options;
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = loginRedirect;
        return;
      }
      const role = await getStaffRole(user.uid);
      if (role === "assistant") {
        window.location.href = assistantRedirect;
        return;
      }
      resolve(user);
    });
  });
}

export { auth };

// تصنيفات ثابتة (نادرًا ما تتغير، فمش محتاجة قاعدة بيانات)
export const CATEGORIES = [
  { id: "drugs", name: "أدوية", icon: "💊", color: "#0F4C4F" },
  { id: "supplements", name: "فيتامينات ومكملات غذائية", icon: "🌿", color: "#D98C4A" },
  { id: "skincare", name: "العناية بالبشرة الطبية", icon: "🧴", color: "#C77B5B" },
  { id: "baby", name: "عناية الطفل والأم", icon: "🍼", color: "#7A9EA8" },
  { id: "medical_supplies", name: "مستلزمات طبية", icon: "🩹", color: "#7A6A8A" },
  { id: "personal_care", name: "العناية الشخصية", icon: "🧼", color: "#8A9A5B" },
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

// إضافة/تعديل منتج
export async function saveProduct(id, data) {
  await setDoc(doc(db, "products", id), data, { merge: true });
}

// حذف منتج
export async function deleteProduct(id) {
  await deleteDoc(doc(db, "products", id));
}

export { db, doc, setDoc, getDoc, getDocs, collection, runTransaction };
