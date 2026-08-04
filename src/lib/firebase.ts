import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore, type Firestore } from 'firebase/firestore';
import bundledConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || bundledConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || bundledConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || bundledConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || bundledConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || bundledConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || bundledConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || bundledConfig.measurementId,
};

let db: Firestore | null = null;

export function initFirebase(): Firestore | null {
  if (db) return db;

  try {
    if (!firebaseConfig.projectId) return null;

    const app = getApps()[0] || initializeApp(firebaseConfig);
    // GOMO uses the project's Firestore `(default)` database, matching
    // FirebaseFirestore.getInstance(app) in the Android application.
    db = getFirestore(app);

    // Analytics is optional and is not supported by every Android WebView.
    void isSupported().then((supported) => {
      if (supported && firebaseConfig.measurementId) getAnalytics(app);
    }).catch(() => undefined);

    return db;
  } catch (error) {
    console.error('Firebase init error:', error);
    return null;
  }
}
