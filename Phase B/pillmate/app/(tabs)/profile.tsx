import { router } from "expo-router";
import { updateEmail, updateProfile } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DesignSystem, getThemeColors } from "../../constants/DesignSystem";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { auth } from "../../src/firebase";

export default function ProfileTab() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const user = auth.currentUser;

  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const colors = getThemeColors(isDark);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
      }
      if (email.trim() && email !== user.email) {
        await updateEmail(user, email.trim());
      }
      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('editProfile')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{t('name')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder={t('name')}
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={[styles.label, { color: colors.textPrimary }]}>{t('email')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={email}
            onChangeText={setEmail}
            placeholder={t('email')}
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }, loading && styles.btnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.card, styles.changePasswordCard, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/change-password' as any)}
        >
          <Text style={[styles.changePasswordText, { color: colors.textPrimary }]}>{t('changePassword')}</Text>
          <Text style={[styles.arrow, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.base,
    paddingTop: Platform.OS === 'ios' ? DesignSystem.spacing.sm : DesignSystem.spacing.lg,
    borderBottomWidth: 1,
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
    marginBottom: DesignSystem.spacing.lg,
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
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
  },
  changePasswordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changePasswordText: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  arrow: {
    fontSize: DesignSystem.typography.fontSize.xl,
  },
});