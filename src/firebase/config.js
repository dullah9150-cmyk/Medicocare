// src/firebase/config.js
// ⚠️  Replace these values with your actual Firebase project credentials
// Go to: Firebase Console > Project Settings > Your Apps > SDK setup and configuration

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8LG_lQGWLZQYyM9c6AG7D4Xqefhoyh9I",
  authDomain: "dashboard-28bd1.firebaseapp.com",
  projectId: "dashboard-28bd1",
  storageBucket: "dashboard-28bd1.firebasestorage.app",
  messagingSenderId: "670813421494",
  appId: "1:670813421494:web:7bc3d29a52f9237bf08b17",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;