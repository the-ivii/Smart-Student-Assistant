import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// Get your web app config from Firebase Console:
// Project Settings > General > Your apps > Web app
// Or set environment variables in .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCKgwXJbg78zFA9sds9VMBV3ddtYmbxLQI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "prasf-3c29f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "prasf-3c29f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "prasf-3c29f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "175171323885",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:175171323885:web:90f6915635a443f16489e4"
};

// Validate configuration
if (!firebaseConfig.apiKey) {
  console.warn('⚠️ Firebase API key not configured. Please set VITE_FIREBASE_API_KEY in .env');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

