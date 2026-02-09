import { router } from "expo-router";
import { signOut } from "firebase/auth";
import React from "react";
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DesignSystem, getThemeColors } from "../../constants/DesignSystem";
import { useAccessibility, type TextSize } from "../../contexts/AccessibilityContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { auth } from "../../src/firebase";
import Tutorial from "../../components/Tutorial";

export default function SettingsTab() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();
  const {
    textSize,
    setTextSize,
    highContrast,
    setHighContrast,
    simplifiedMode,
    setSimplifiedMode,
    showTutorial,
    setShowTutorial,
    getScaledFontSize,
    getScaledSpacing,
    getMinTouchTarget,
  } = useAccessibility();

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'ar' as const, name: 'العربية', flag: '🇸🇦' },
    { code: 'he' as const, name: 'עברית', flag: '🇮🇱' },
  ];

  const themes = [
    { code: 'light' as const, name: t('light') },
    { code: 'dark' as const, name: t('dark') },
    { code: 'auto' as const, name: t('auto') },
  ];

  const textSizes: { code: TextSize; name: string; description: string }[] = [
    { code: 'small', name: 'Small', description: 'Standard size' },
    { code: 'medium', name: 'Medium', description: 'Default size' },
    { code: 'large', name: 'Large', description: 'Easier to read' },
    { code: 'extra-large', name: 'Extra Large', description: 'Easiest to read' },
  ];

  const minTouchTarget = getMinTouchTarget();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace("/(auth)/sign-in" as any);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to logout");
            }
          },
        },
      ]
    );
  };

  const colors = getThemeColors(isDark, highContrast);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('settings')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Language Selection */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('language')}</Text>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.option,
                { borderBottomColor: colors.border },
                language === lang.code && { backgroundColor: colors.primary + '15' },
              ]}
              onPress={() => setLanguage(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionIcon}>{lang.flag}</Text>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>{lang.name}</Text>
              {language === lang.code && <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme Selection */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: getScaledFontSize(18) }]}>{t('theme')}</Text>
          {themes.map((th) => (
            <TouchableOpacity
              key={th.code}
              style={[
                styles.option,
                { borderBottomColor: colors.border, minHeight: minTouchTarget },
                theme === th.code && { backgroundColor: colors.primary + '15' },
              ]}
              onPress={() => setTheme(th.code)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, { color: colors.textPrimary, fontSize: getScaledFontSize(16) }]}>{th.name}</Text>
              {theme === th.code && <Text style={[styles.checkmark, { color: colors.primary, fontSize: getScaledFontSize(20) }]}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Accessibility Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: getScaledFontSize(18) }]}>
            Accessibility
          </Text>
          
          {/* Text Size */}
          <View style={[styles.option, { borderBottomColor: colors.border }]}>
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: colors.textPrimary, fontSize: getScaledFontSize(16) }]}>
                Text Size
              </Text>
              <Text style={[styles.optionSubtext, { color: colors.textSecondary, fontSize: getScaledFontSize(14) }]}>
                Make text easier to read
              </Text>
            </View>
          </View>
          {textSizes.map((size) => (
            <TouchableOpacity
              key={size.code}
              style={[
                styles.option,
                { borderBottomColor: colors.border, minHeight: minTouchTarget },
                textSize === size.code && { backgroundColor: colors.primary + '15' },
              ]}
              onPress={() => setTextSize(size.code)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Text style={[styles.optionText, { color: colors.textPrimary, fontSize: getScaledFontSize(16) }]}>
                  {size.name}
                </Text>
                <Text style={[styles.optionSubtext, { color: colors.textSecondary, fontSize: getScaledFontSize(13) }]}>
                  {size.description}
                </Text>
              </View>
              {textSize === size.code && (
                <Text style={[styles.checkmark, { color: colors.primary, fontSize: getScaledFontSize(20) }]}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

          {/* High Contrast */}
          <View style={[styles.option, { borderBottomColor: colors.border, minHeight: minTouchTarget }]}>
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: colors.textPrimary, fontSize: getScaledFontSize(16) }]}>
                High Contrast
              </Text>
              <Text style={[styles.optionSubtext, { color: colors.textSecondary, fontSize: getScaledFontSize(14) }]}>
                Better visibility with stronger colors
              </Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={highContrast ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Simplified Mode */}
          <View style={[styles.option, { borderBottomWidth: 0, minHeight: minTouchTarget }]}>
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: colors.textPrimary, fontSize: getScaledFontSize(16) }]}>
                Simplified Mode
              </Text>
              <Text style={[styles.optionSubtext, { color: colors.textSecondary, fontSize: getScaledFontSize(14) }]}>
                Larger buttons with text labels
              </Text>
            </View>
            <Switch
              value={simplifiedMode}
              onValueChange={setSimplifiedMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={simplifiedMode ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Tutorial Button */}
          <TouchableOpacity
            style={[
              styles.option,
              { borderTopWidth: 1, borderTopColor: colors.border, borderBottomWidth: 0, minHeight: minTouchTarget },
            ]}
            onPress={() => setShowTutorial(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionIcon}>📖</Text>
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: colors.textPrimary, fontSize: getScaledFontSize(16) }]}>
                Show Tutorial
              </Text>
              <Text style={[styles.optionSubtext, { color: colors.textSecondary, fontSize: getScaledFontSize(14) }]}>
                Learn how to use the app
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textSecondary, fontSize: getScaledFontSize(20) }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Device Management Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Device</Text>
          <TouchableOpacity
            style={[
              styles.option,
              { borderBottomWidth: 1 },
            ]}
            onPress={() => router.push("/(device)/slots" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionIcon}>💊</Text>
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>Device Slots</Text>
              <Text style={[styles.optionSubtext, { color: colors.textSecondary }]}>
                Manage 7 pill slots and track inventory
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.option,
              { borderBottomWidth: 0 },
            ]}
            onPress={() => router.push("/(device)/link?fromSettings=true" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionIcon}>📱</Text>
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>Link Device</Text>
              <Text style={[styles.optionSubtext, { color: colors.textSecondary }]}>
                Add a new device or re-link after reset
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.logoutOption}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {showTutorial && (
        <Tutorial 
          visible={showTutorial} 
          onClose={() => {
            setShowTutorial(false);
          }} 
        />
      )}
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
  section: {
    borderRadius: DesignSystem.borderRadius.lg,
    marginBottom: DesignSystem.spacing.lg,
    overflow: 'hidden',
    ...DesignSystem.shadows.base,
  },
  sectionTitle: {
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    padding: DesignSystem.spacing.base,
    paddingBottom: DesignSystem.spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.base,
    borderBottomWidth: 1,
  },
  optionIcon: {
    fontSize: DesignSystem.typography.fontSize['2xl'],
    marginRight: DesignSystem.spacing.md,
  },
  optionText: {
    flex: 1,
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  optionContent: {
    flex: 1,
  },
  optionSubtext: {
    fontSize: DesignSystem.typography.fontSize.sm,
    marginTop: 2,
    fontWeight: DesignSystem.typography.fontWeight.regular,
  },
  chevron: {
    fontSize: DesignSystem.typography.fontSize['2xl'],
    fontWeight: DesignSystem.typography.fontWeight.bold,
    marginLeft: DesignSystem.spacing.sm,
  },
  checkmark: {
    fontSize: DesignSystem.typography.fontSize.xl,
    fontWeight: DesignSystem.typography.fontWeight.bold,
  },
  logoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.base,
  },
  logoutIcon: {
    fontSize: DesignSystem.typography.fontSize['2xl'],
    marginRight: DesignSystem.spacing.md,
  },
  logoutText: {
    flex: 1,
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.bold,
  },
});