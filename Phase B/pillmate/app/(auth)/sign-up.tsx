import { router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { DesignSystem, getThemeColors } from "../../constants/DesignSystem";
import { useTheme } from "../../contexts/ThemeContext";
import { auth, db } from "../../src/firebase";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function SignUp() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    phone: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  // Validation functions
  const validateFirstName = (name: string): string | undefined => {
    if (!name.trim()) {
      return "First name is required";
    }
    if (name.trim().length < 2) {
      return "First name must be at least 2 characters";
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      return "First name can only contain letters, spaces, hyphens, and apostrophes";
    }
    return undefined;
  };

  const validateLastName = (name: string): string | undefined => {
    if (!name.trim()) {
      return "Last name is required";
    }
    if (name.trim().length < 2) {
      return "Last name must be at least 2 characters";
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      return "Last name can only contain letters, spaces, hyphens, and apostrophes";
    }
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) {
      return "Phone number is required";
    }
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return "Phone number must be at least 10 digits";
    }
    if (digitsOnly.length > 15) {
      return "Phone number is too long";
    }
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (password.length > 128) {
      return "Password is too long";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password should contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password should contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password should contain at least one number";
    }
    return undefined;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
    if (!confirmPassword) {
      return "Please confirm your password";
    }
    if (confirmPassword !== password) {
      return "Passwords do not match";
    }
    return undefined;
  };

  // Real-time validation handlers
  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    if (touched.firstName) {
      setErrors(prev => ({ ...prev, firstName: validateFirstName(text) }));
    }
  };

  const handleLastNameChange = (text: string) => {
    setLastName(text);
    if (touched.lastName) {
      setErrors(prev => ({ ...prev, lastName: validateLastName(text) }));
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    if (touched.phone) {
      setErrors(prev => ({ ...prev, phone: validatePhone(text) }));
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateEmail(text) }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(text) }));
    }
    // Also validate confirm password if it's been touched
    if (touched.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, text) }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (touched.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(text, password) }));
    }
  };

  // Helper function to check if there are actual errors
  const hasErrors = (): boolean => {
    return Object.values(errors).some(error => error !== undefined && error !== '');
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    const firstNameError = validateFirstName(firstName);
    if (firstNameError) newErrors.firstName = firstNameError;
    
    const lastNameError = validateLastName(lastName);
    if (lastNameError) newErrors.lastName = lastNameError;
    
    const phoneError = validatePhone(phone);
    if (phoneError) newErrors.phone = phoneError;
    
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    
    const confirmPasswordError = validateConfirmPassword(confirmPassword, password);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    setTouched({ firstName: true, lastName: true, phone: true, email: true, password: true, confirmPassword: true });
    
    return Object.keys(newErrors).length === 0;
  };

  const onSignUp = async () => {
    // Clear previous errors
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // Update user profile with display name (first + last)
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await updateProfile(cred.user, { displayName: fullName });

      // Create user document with all information
      await setDoc(doc(db, "users", cred.user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: fullName,
        phone: phone.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
      });

      // Redirect to allergy form (required step)
      router.replace("/(auth)/allergy-form" as any);
    } catch (e: any) {
      let errorMsg = "Sign up failed. Please try again.";
      
      // Handle specific Firebase errors
      switch (e.code) {
        case "auth/email-already-in-use":
          errorMsg = "This email is already registered. Please sign in instead.";
          setErrors(prev => ({ ...prev, email: "This email is already in use" }));
          break;
        case "auth/invalid-email":
          errorMsg = "Invalid email address format.";
          setErrors(prev => ({ ...prev, email: "Invalid email format" }));
          break;
        case "auth/weak-password":
          errorMsg = "Password is too weak. Please use a stronger password.";
          setErrors(prev => ({ ...prev, password: "Password is too weak" }));
          break;
        case "auth/operation-not-allowed":
          errorMsg = "Email/password accounts are not enabled. Please contact support.";
          break;
        case "auth/network-request-failed":
          errorMsg = "Network error. Please check your internet connection.";
          setErrors(prev => ({ ...prev, general: errorMsg }));
          break;
        case "auth/too-many-requests":
          errorMsg = "Too many requests. Please try again later.";
          setErrors(prev => ({ ...prev, general: errorMsg }));
          break;
        default:
          setErrors(prev => ({ ...prev, general: errorMsg }));
      }
      
      // Show alert for critical errors
      if (e.code !== "auth/email-already-in-use" && e.code !== "auth/invalid-email") {
        Alert.alert("Sign Up Failed", errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.h1, { color: colors.textPrimary }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign up to start managing your medications</Text>
        </View>

        {/* General Error Message */}
        {errors.general && (
          <View style={[styles.errorContainer, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2', borderColor: colors.error }]}>
            <Text style={[styles.errorText, { color: isDark ? '#FCA5A5' : colors.error }]}>⚠️ {errors.general}</Text>
          </View>
        )}

        {/* First Name Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>First Name</Text>
          <TextInput 
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
              touched.firstName && errors.firstName && styles.inputError,
              touched.firstName && !errors.firstName && firstName.length > 0 && styles.inputSuccess
            ]} 
            placeholder="Enter your first name"
            placeholderTextColor={colors.textTertiary}
            value={firstName} 
            onChangeText={handleFirstNameChange}
            onBlur={() => {
              setTouched(prev => ({ ...prev, firstName: true }));
              setErrors(prev => ({ ...prev, firstName: validateFirstName(firstName) }));
            }}
            autoCapitalize="words"
            editable={!loading}
            autoComplete="given-name"
            textContentType="givenName"
          />
          {touched.firstName && errors.firstName && (
            <Text style={styles.fieldError}>{errors.firstName}</Text>
          )}
        </View>

        {/* Last Name Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Last Name</Text>
          <TextInput 
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
              touched.lastName && errors.lastName && styles.inputError,
              touched.lastName && !errors.lastName && lastName.length > 0 && styles.inputSuccess
            ]} 
            placeholder="Enter your last name"
            placeholderTextColor={colors.textTertiary} 
            value={lastName} 
            onChangeText={handleLastNameChange}
            onBlur={() => {
              setTouched(prev => ({ ...prev, lastName: true }));
              setErrors(prev => ({ ...prev, lastName: validateLastName(lastName) }));
            }}
            autoCapitalize="words"
            editable={!loading}
            autoComplete="family-name"
            textContentType="familyName"
          />
          {touched.lastName && errors.lastName && (
            <Text style={styles.fieldError}>{errors.lastName}</Text>
          )}
        </View>

        {/* Phone Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Phone Number</Text>
          <TextInput 
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
              touched.phone && errors.phone && styles.inputError,
              touched.phone && !errors.phone && phone.length > 0 && styles.inputSuccess
            ]} 
            placeholder="Enter your phone number"
            placeholderTextColor={colors.textTertiary} 
            value={phone} 
            onChangeText={handlePhoneChange}
            onBlur={() => {
              setTouched(prev => ({ ...prev, phone: true }));
              setErrors(prev => ({ ...prev, phone: validatePhone(phone) }));
            }}
            keyboardType="phone-pad"
            editable={!loading}
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
          {touched.phone && errors.phone && (
            <Text style={styles.fieldError}>{errors.phone}</Text>
          )}
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Email</Text>
          <TextInput 
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
              touched.email && errors.email && styles.inputError,
              touched.email && !errors.email && email.length > 0 && styles.inputSuccess
            ]} 
            placeholder="Enter your email"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={handleEmailChange}
            onBlur={() => {
              setTouched(prev => ({ ...prev, email: true }));
              setErrors(prev => ({ ...prev, email: validateEmail(email) }));
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            editable={!loading}
          />
          {touched.email && errors.email && (
            <Text style={styles.fieldError}>{errors.email}</Text>
          )}
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
          <TextInput 
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
              touched.password && errors.password && styles.inputError,
              touched.password && !errors.password && password.length > 0 && styles.inputSuccess
            ]} 
            placeholder="Create a password"
            placeholderTextColor={colors.textTertiary}
            value={password} 
            onChangeText={handlePasswordChange}
            onBlur={() => {
              setTouched(prev => ({ ...prev, password: true }));
              setErrors(prev => ({ ...prev, password: validatePassword(password) }));
            }}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            editable={!loading}
          />
          {touched.password && errors.password && (
            <Text style={styles.fieldError}>{errors.password}</Text>
          )}
          {touched.password && !errors.password && password.length > 0 && (
            <Text style={styles.passwordHint}>
              ✓ Password meets requirements (uppercase, lowercase, number)
            </Text>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Confirm Password</Text>
          <TextInput 
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
              touched.confirmPassword && errors.confirmPassword && styles.inputError,
              touched.confirmPassword && !errors.confirmPassword && confirmPassword.length > 0 && styles.inputSuccess
            ]} 
            placeholder="Confirm your password"
            placeholderTextColor={colors.textTertiary}
            value={confirmPassword} 
            onChangeText={handleConfirmPasswordChange}
            onBlur={() => {
              setTouched(prev => ({ ...prev, confirmPassword: true }));
              setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, password) }));
            }}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            editable={!loading}
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
          )}
          {touched.confirmPassword && !errors.confirmPassword && confirmPassword.length > 0 && (
            <Text style={styles.passwordHint}>
              ✓ Passwords match
            </Text>
          )}
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity 
          style={[
            styles.btn,
            { backgroundColor: colors.primary },
            (loading || hasErrors()) && styles.btnDisabled
          ]} 
          onPress={onSignUp}
          disabled={loading || hasErrors()}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.btnText}>Creating Account...</Text>
            </View>
          ) : (
            <Text style={styles.btnText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Back to Sign In */}
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          disabled={loading}
        >
          <Text style={[styles.link, { color: colors.textSecondary }]}>
            Already have an account? <Text style={[styles.linkBold, { color: colors.primary }]}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: DesignSystem.layout.containerPadding,
    justifyContent: "center",
    paddingTop: DesignSystem.spacing['3xl'],
    paddingBottom: DesignSystem.spacing['3xl'],
  },
  header: {
    marginBottom: DesignSystem.spacing['2xl'],
    alignItems: "center",
  },
  h1: { 
    fontSize: DesignSystem.typography.fontSize['3xl'], 
    fontWeight: DesignSystem.typography.fontWeight.extrabold, 
    marginBottom: DesignSystem.spacing.sm,
    letterSpacing: DesignSystem.typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: DesignSystem.typography.fontSize.base,
    textAlign: "center",
    fontWeight: DesignSystem.typography.fontWeight.regular,
  },
  inputGroup: {
    marginBottom: DesignSystem.spacing.lg,
  },
  label: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    marginBottom: DesignSystem.spacing.sm,
  },
  input: { 
    padding: DesignSystem.layout.inputPadding, 
    borderRadius: DesignSystem.borderRadius.base, 
    fontSize: DesignSystem.typography.fontSize.base,
    borderWidth: 1,
    fontWeight: DesignSystem.typography.fontWeight.regular,
    ...DesignSystem.shadows.sm,
  },
  inputError: {
    borderColor: DesignSystem.colors.error,
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  inputSuccess: {
    borderColor: DesignSystem.colors.success,
    borderWidth: 1,
  },
  fieldError: {
    color: DesignSystem.colors.error,
    fontSize: DesignSystem.typography.fontSize.xs,
    marginTop: DesignSystem.spacing.xs,
    marginLeft: DesignSystem.spacing.xs,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  passwordHint: {
    color: DesignSystem.colors.success,
    fontSize: DesignSystem.typography.fontSize.xs,
    marginTop: DesignSystem.spacing.xs,
    marginLeft: DesignSystem.spacing.xs,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.base,
    marginBottom: DesignSystem.spacing.lg,
    borderWidth: 1,
    borderColor: DesignSystem.colors.error,
  },
  errorText: {
    color: DesignSystem.colors.error,
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  btn: { 
    padding: DesignSystem.layout.buttonPadding, 
    borderRadius: DesignSystem.borderRadius.base, 
    alignItems: "center", 
    marginTop: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.md,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: { 
    color: "#fff", 
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    fontSize: DesignSystem.typography.fontSize.base,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.sm,
  },
  backButton: {
    marginTop: DesignSystem.spacing.xl,
    alignItems: "center",
  },
  link: { 
    fontWeight: DesignSystem.typography.fontWeight.medium, 
    textAlign: "center",
    fontSize: DesignSystem.typography.fontSize.sm,
  },
  linkBold: {
    fontWeight: DesignSystem.typography.fontWeight.bold,
  },
});
