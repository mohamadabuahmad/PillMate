import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { Platform } from "react-native";

/**
 * Firebase Configuration and Initialization
 * 
 * This file initializes Firebase services including:
 * - Authentication (with platform-specific persistence)
 * - Firestore (NoSQL database)
 * - Realtime Database (for device communication)
 * - Cloud Functions (for server-side logic)
 * 
 * NOTE: Analytics is intentionally not initialized here to prevent
 * recursion crashes in React Native/Expo environments.
 */
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

// Initialize Firebase App (only if not already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth based on Platform
// Web and native platforms require different persistence strategies
let auth;

if (Platform.OS === 'web') {
  // Web uses standard browser persistence (localStorage)
  auth = getAuth(app);
} else {
  // iOS/Android uses AsyncStorage for persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };

// Firestore database for storing user data, medications, schedules, etc.
export const db = getFirestore(app);

// Realtime Database for real-time device communication (motor control, dispense commands)
export const rtdb = getDatabase(app);

// Initialize Functions with explicit region (us-central1 where functions are deployed)
export const functions = getFunctions(app, 'us-central1');

/**
 * Helper function to get a fresh functions instance
 * Useful when auth state changes and you need a new instance
 * @returns Fresh Cloud Functions instance
 */
export const getFunctionsInstance = () => {
  return getFunctions(app, 'us-central1');
};

// NOTE: Firebase Analytics is NOT initialized here to prevent recursion crashes.
// If Analytics is needed in the future, initialize it explicitly using:
//   import { getAnalytics } from 'firebase/analytics';
//   const analytics = getAnalytics(app);
// Only do this when Analytics is actually needed, not at app startup.
