// الحماية 1/3: إعدادات Firebase + App Check (يمنع أي تطبيق خارجي من استخدام قاعدة بياناتك)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check.js";
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

// مفتاح reCAPTCHA v3 (من Firebase Console > App Check). اتركه فارغًا أثناء التجربة المحلية فقط.
const RECAPTCHA_SITE_KEY = "";

const app = initializeApp(firebaseConfig);
if (RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true });
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
