import { getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Firebase configuration
// NOTE: measurementId is removed to prevent Firebase Analytics auto-initialization
// which causes infinite recursion crashes in React Native/Expo environments.
// If Analytics is needed, it should be initialized explicitly using getAnalytics()
// only when required, not at app startup.
const firebaseConfig = {
  apiKey: "AIzaSyBBcVtzSBPGNq9CmbDEnuGUkkIg9iuApQY",
  authDomain: "pillmate-cc6cd.firebaseapp.com",
  projectId: "pillmate-cc6cd",
  storageBucket: "pillmate-cc6cd.firebasestorage.app",
  messagingSenderId: "149620387080",
  appId: "1:149620387080:web:899c45cef52dbc290790bd",
  // measurementId removed to prevent Analytics auto-initialization recursion crash
  // measurementId: "G-GDHTKCD6TS",
  databaseURL: "https://pillmate-cc6cd-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase app
// Analytics is NOT auto-initialized, preventing the recursion crash
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Auth for web platform (uses browser localStorage by default)
const auth: Auth = getAuth(app);

export { auth };

export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Initialize Functions with explicit region (us-central1 where functions are deployed)
// ✅ CORRECT: Region matches function deployment region
// ✅ CORRECT: Functions instance uses same app as auth
// 
// IMPORTANT: getFunctions() automatically gets auth from the app instance
// The functions instance is created at module load, but httpsCallable will
// check auth.currentUser when called, not when the instance is created
export const functions = getFunctions(app, 'us-central1');

// Helper function to get a fresh functions instance (in case auth state changes)
// This ensures we always get a functions instance linked to the current auth state
export const getFunctionsInstance = () => {
  return getFunctions(app, 'us-central1');
};

// NOTE: Firebase Analytics is NOT initialized here to prevent recursion crashes.
// If Analytics is needed in the future, initialize it explicitly using:
//   import { getAnalytics } from 'firebase/analytics';
//   const analytics = getAnalytics(app);
// Only do this when Analytics is actually needed, not at app startup.
