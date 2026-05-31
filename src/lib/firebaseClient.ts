import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCmcgassrYLXPcJkOV4Z-24qMf6HIr1f8U",
  authDomain: "project-astro-91620.firebaseapp.com",
  projectId: "project-astro-91620",
  storageBucket: "project-astro-91620.firebasestorage.app",
  messagingSenderId: "698637885070",
  appId: "1:698637885070:web:cf2ef774fb6b94764d33df"
};

// Initialize Firebase (SSR safe check)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
