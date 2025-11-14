import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCKgwXJbg78zFA9sds9VMBV3ddtYmbxLQI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smart-study-assistant-aa394.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-study-assistant-aa394",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smart-study-assistant-aa394.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "175171323885",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:175171323885:web:90f6915635a443f16489e4"
};

if (!firebaseConfig.apiKey) {
  console.warn('Firebase API key not configured. Please set VITE_FIREBASE_API_KEY in .env');
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export default app;
