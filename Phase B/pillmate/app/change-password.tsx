import { router } from "expo-router";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Alert } from "react-native";
import { auth } from "../src/firebase";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeColors, DesignSystem } from "../constants/DesignSystem";

export default function ChangePasswordScreen() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const user = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = getThemeColors(isDark);

  const handleChangePassword = async () => {
    if (!user || !user.email) {
      Alert.alert("Error", "User not found");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Password changed successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('changePassword')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t('currentPassword')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder={t('currentPassword')}
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
          />

          <Text style={[styles.label, { color: colors.textPrimary }]}>{t('newPassword')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t('newPassword')}
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
          />

          <Text style={[styles.label, { color: colors.textPrimary }]}>{t('confirmPassword')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('confirmPassword')}
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }, loading && styles.btnDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DesignSystem.spacing.base,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: DesignSystem.typography.fontSize['2xl'],
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  headerTitle: {
    fontSize: DesignSystem.typography.fontSize['2xl'],
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
  },
  content: {
    flex: 1,
    padding: DesignSystem.layout.containerPadding,
  },
  card: {
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.layout.cardPadding,
    ...DesignSystem.shadows.base,
  },
  label: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    marginBottom: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: DesignSystem.borderRadius.base,
    padding: DesignSystem.layout.inputPadding,
    fontSize: DesignSystem.typography.fontSize.base,
    marginBottom: DesignSystem.spacing.xs,
    fontWeight: DesignSystem.typography.fontWeight.regular,
    ...DesignSystem.shadows.sm,
  },
  btn: {
    padding: DesignSystem.layout.buttonPadding,
    borderRadius: DesignSystem.borderRadius.base,
    alignItems: 'center',
    marginTop: DesignSystem.spacing.lg,
    ...DesignSystem.shadows.md,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#fff',
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.bold,
  },
});

