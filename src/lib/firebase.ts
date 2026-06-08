import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ============================
// Primary App – psymathweb (Web / Next.js)
// ============================
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// אתחול האפליקציה רק אם היא לא אותחלה כבר (חשוב ב-Next.js)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ============================
// Secondary App – psymath-1dd2b (Mobile / React Native project)
// ============================
const mobileConfig = {
  apiKey: "AIzaSyCq18HYBE02OUjrKlc5JgzmiMHOjMU6TjM",
  authDomain: "psymath-1dd2b.firebaseapp.com",
  projectId: "psymath-1dd2b",
  storageBucket: "psymath-1dd2b.firebasestorage.app",
  messagingSenderId: "493324822355",
  appId: "1:493324822355:web:5fa24fffe8067d4c0a63a6",
  measurementId: "G-WTR88S3H1R"
};

// Initialize the secondary app only if it hasn't been initialized yet (Next.js hot-reload safe)
const MOBILE_APP_NAME = "PsyMathMobileInstance";
const mobileApp = getApps().find((a) => a.name === MOBILE_APP_NAME)
  ?? initializeApp(mobileConfig, MOBILE_APP_NAME);

export const mobileDb = getFirestore(mobileApp);
export const mobileAuth = getAuth(mobileApp);