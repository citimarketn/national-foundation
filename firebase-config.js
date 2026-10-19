// استبدل القيم من: Firebase Console > Project settings > Your apps > Web app
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxx"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// بيانات التواصل (عدّلها هنا مرة واحدة)
export const CONTACT = {
  whatsapp: "201000000000",      // رقم واتساب بالصيغة الدولية بدون +
  telegram: "your_channel",      // اسم مستخدم تلجرام
  phone: "+20 100 000 0000",
  email: "info@example.org",
  address: "السويس، جمهورية مصر العربية",
  youtube: "https://youtube.com/@your",
  facebook: "https://facebook.com/your",
  instagram: "https://instagram.com/your"
};
