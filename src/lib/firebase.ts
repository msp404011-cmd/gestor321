import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAQL9rFiNo9MV0NDHQ8Z5XN7nyQTxnUw-0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "painelgestor-11e67.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "painelgestor-11e67",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "painelgestor-11e67.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "204688938294",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:204688938294:web:99eeb829e72d31fcbd8f97",
};

console.log("==========================================");
console.log("🔥 CONECTADO AO FIREBASE!");
console.log("🔥 Project ID Ativo:", "painelgestor-11e67");
console.log("==========================================");

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export default firebaseConfig;
