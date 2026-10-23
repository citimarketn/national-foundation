import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCEiH6p2hL-uHJrawGqCKlY9_5rBQ9iXBU",
  authDomain: "national-foundation-2d74e.firebaseapp.com",
  projectId: "national-foundation-2d74e",
  storageBucket: "national-foundation-2d74e.firebasestorage.app",
  messagingSenderId: "1036671690651",
  appId: "1:1036671690651:web:527df6e6ca56930bc5233e"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);