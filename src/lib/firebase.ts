import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAQL9rFiNo9MV0NDHQ8Z5XN7nyQTxnUw-0",
  authDomain: "painelgestor-11e67.firebaseapp.com",
  projectId: "painelgestor-11e67",
  storageBucket: "painelgestor-11e67.firebasestorage.app",
  messagingSenderId: "204688938294",
  appId: "1:204688938294:web:99eeb829e72d31fcbd8f97",
};

console.log("==========================================");
console.log("🔥 CONECTADO AO PAINELGESTOR-11E67!");
console.log("==========================================");

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export default firebaseConfig;
