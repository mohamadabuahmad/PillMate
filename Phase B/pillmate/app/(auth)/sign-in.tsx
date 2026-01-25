import { Link, router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { DesignSystem, getThemeColors } from "../../constants/DesignSystem";
import { useTheme } from "../../contexts/ThemeContext";
import { auth, db } from "../../src/firebase";

export default function SignIn() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const checkForLinkedDevice = async (uid: string): Promise<boolean> => {
    try {
      const devicesRef = collection(db, "users", uid, "devices");
      const snapshot = await getDocs(devicesRef);
      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking for linked device:", error);
      return false;
    }
  };

  const onSignIn = async () => {
    setErrorMessage("");
    
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;
      
      const hasDevice = await checkForLinkedDevice(uid);
      
      if (hasDevice) {
        router.replace("/(tabs)" as any);
      } else {
        router.replace("/(device)/link" as any);
      }
    } catch (e: any) {
      let errorMsg = "Sign in failed. Please try again.";
      
      if (e.code === "auth/user-not-found") {
        errorMsg = "No account found with this email address.";
      } else if (e.code === "auth/wrong-password") {
        errorMsg = "Incorrect password. Please check and try again.";
      } else if (e.code === "auth/invalid-email") {
        errorMsg = "Invalid email address format.";
      } else if (e.code === "auth/too-many-requests") {
        errorMsg = "Too many failed attempts. Please try again later.";
      } else if (e.code === "auth/network-request-failed") {
        errorMsg = "Network error. Please check your connection.";
      } else if (e.code === "auth/invalid-credential") {
        errorMsg = "Invalid email or password.";
      }
      
      setErrorMessage(errorMsg);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.h1, { color: colors.textPrimary }]}>PillMate</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Welcome back</Text>
      </View>

      {errorMessage ? (
        <View style={[styles.errorContainer, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2', borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: isDark ? '#FCA5A5' : colors.error }]}>⚠️ {errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }, errorMessage && styles.inputError]}
          placeholder="Email"
          placeholderTextColor={colors.textTertiary}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrorMessage("");
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }, errorMessage && styles.inputError]}
          placeholder="Password"
          placeholderTextColor={colors.textTertiary}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrorMessage("");
          }}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
        />

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: colors.primary }]} 
          onPress={onSignIn}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
        <Link href="./sign-up" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>Sign up</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: DesignSystem.layout.containerPadding, 
    justifyContent: "center", 
  },
  header: {
    marginBottom: DesignSystem.spacing['3xl'],
  },
  h1: { 
    fontSize: DesignSystem.typography.fontSize['4xl'], 
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    letterSpacing: DesignSystem.typography.letterSpacing.tight,
    marginBottom: DesignSystem.spacing.xs,
  },
  subtitle: { 
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.regular,
  },
  form: {
    marginTop: DesignSystem.spacing['2xl'],
  },
  input: { 
    padding: DesignSystem.layout.inputPadding, 
    borderRadius: DesignSystem.borderRadius.base, 
    marginBottom: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.base,
    borderWidth: 1,
    fontWeight: DesignSystem.typography.fontWeight.regular,
    ...DesignSystem.shadows.sm,
  },
  inputError: {
    borderColor: DesignSystem.colors.error,
    borderWidth: 2,
  },
  errorContainer: {
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.base,
    marginBottom: DesignSystem.spacing.base,
    borderWidth: 1,
  },
  errorText: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  btn: { 
    padding: DesignSystem.layout.buttonPadding, 
    borderRadius: DesignSystem.borderRadius.base, 
    alignItems: "center", 
    marginTop: DesignSystem.spacing.md,
    ...DesignSystem.shadows.md,
  },
  btnText: { 
    color: "#fff", 
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    fontSize: DesignSystem.typography.fontSize.base,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: DesignSystem.spacing.xl,
  },
  footerText: {
    fontSize: DesignSystem.typography.fontSize.base,
  },
  link: {
    marginTop: 0,
  },
  linkText: {
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    fontSize: DesignSystem.typography.fontSize.base,
  },
});