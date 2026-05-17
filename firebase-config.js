import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAvhNAmKuKtLtExyol8MSvyBw4FaUYRiE0",
  authDomain: "psm-projekt-5d1b4.firebaseapp.com",
  projectId: "psm-projekt-5d1b4",
  storageBucket: "psm-projekt-5d1b4.firebasestorage.app",
  messagingSenderId: "677814502806",
  appId: "1:677814502806:web:b6f04808c3418ceb4a49b7",
  measurementId: "G-4RQK05RZ2J"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);