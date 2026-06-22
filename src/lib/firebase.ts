import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Config do app WEB do Firebase. Estes valores são públicos por design
// (a proteção real vem das regras do Firestore e dos domínios autorizados do Auth),
// por isso ficam no código — assim funciona no Lovable e em qualquer build.
// Em dev, o .env.local pode sobrescrever para apontar para outro projeto.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDiNOBX7udR03YZkwcn08AGN21n7wW6yhk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fifa-album-connect.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fifa-album-connect",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fifa-album-connect.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "345173926878",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:345173926878:web:5c539de211cf663f7cf34f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-71R3L5569L",
};

// Evita reinicializar no HMR/SSR.
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
