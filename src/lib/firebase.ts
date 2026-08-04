import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: any = null;
let db: any = null;

export function initFirebase() {
  try {
    if (!firebaseConfig.projectId) {
      console.warn("Firebase projectId is missing in environment variables.");
      return null;
    }
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      getAnalytics(app); // Initialize analytics
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app);
    return db;
  } catch (e) {
    console.error("Firebase init error:", e);
    return null;
  }
}

// Initialize immediately
db = initFirebase();

export { db };
