import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

export default function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();

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

  const colors = isDark
    ? {
        background: '#1a1a1a',
        card: '#2a2a2a',
        text: '#fff',
        textSecondary: '#aaa',
        border: '#333',
      }
    : {
        background: '#f8f9fa',
        card: '#fff',
        text: '#1a1a1a',
        textSecondary: '#666',
        border: '#e0e0e0',
      };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content}>
        {/* Language Selection */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('language')}</Text>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.option,
                { borderBottomColor: colors.border },
                language === lang.code && { backgroundColor: '#f0f4ff' },
              ]}
              onPress={() => setLanguage(lang.code)}
            >
              <Text style={styles.optionIcon}>{lang.flag}</Text>
              <Text style={[styles.optionText, { color: colors.text }]}>{lang.name}</Text>
              {language === lang.code && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme Selection */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('theme')}</Text>
          {themes.map((th) => (
            <TouchableOpacity
              key={th.code}
              style={[
                styles.option,
                { borderBottomColor: colors.border },
                theme === th.code && { backgroundColor: '#f0f4ff' },
              ]}
              onPress={() => setTheme(th.code)}
            >
              <Text style={[styles.optionText, { color: colors.text }]}>{th.name}</Text>
              {theme === th.code && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
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
    padding: 16,
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
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    padding: 16,
    paddingBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#6366f1',
    fontWeight: '700',
  },
});

