/**
 * Splash Screen Component
 * 
 * Displays a loading screen while checking the user's authentication state.
 * After a 2-second delay, navigates to:
 * - Main tabs if user is authenticated
 * - Sign-in screen if user is not authenticated
 */
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { auth } from '../src/firebase';

export default function SplashScreen() {
  // Check authentication state on mount
  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Wait 2 seconds before navigating (for splash screen visibility)
      setTimeout(() => {
        if (user) {
          // User is signed in - navigate to main app
          router.replace('/(tabs)' as any);
        } else {
          // User is not signed in - navigate to sign-in screen
          router.replace('/(auth)/sign-in' as any);
        }
      }, 2000);
    });

    // Cleanup: unsubscribe from auth state listener on unmount
    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.logo}>💊</Text>
      <Text style={styles.title}>PillMate</Text>
      <Text style={styles.subtitle}>Your Smart Medication Reminder</Text>
      <ActivityIndicator size="large" color="#fff" style={styles.loader} />
      <Text style={styles.credits}>by mohamad, Jolian</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 40,
    fontWeight: '500',
  },
  loader: {
    marginTop: 20,
  },
  credits: {
    position: 'absolute',
    bottom: 40,
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});