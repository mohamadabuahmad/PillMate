import { router } from "expo-router";
import { signOut } from "firebase/auth";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Modal, ScrollView, I18nManager } from "react-native";
import { auth } from "../src/firebase";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/(auth)/sign-in" as any);
  };

  const menuItems = [
    { id: 'home', label: t('home'), icon: '🏠', route: '/(tabs)/' },
    { id: 'profile', label: t('profile'), icon: '👤', route: '/profile' },
    { id: 'settings', label: t('settings'), icon: '⚙️', route: '/settings' },
  ];

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      if (route === '/(tabs)/') {
        router.replace(route as any);
      } else {
        router.push(route as any);
      }
    }, 300);
  };

  const colors = isDark
    ? {
        background: '#1a1a1a',
        card: '#2a2a2a',
        text: '#fff',
        textSecondary: '#aaa',
        border: '#333',
      }
    : {
        background: '#fff',
        card: '#f8f9fa',
        text: '#1a1a1a',
        textSecondary: '#666',
        border: '#e0e0e0',
      };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={[
          styles.sidebar, 
          { backgroundColor: colors.background },
        ]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>PillMate</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.menu}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => handleNavigate(item.route)}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuLabel, styles.logoutLabel]}>{t('logout')}</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {t('language')}: {language.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: 280,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 24,
    fontWeight: '600',
  },
  menu: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  menuLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  logoutItem: {
    marginTop: 10,
  },
  logoutLabel: {
    color: '#f44336',
  },
  divider: {
    height: 1,
    marginVertical: 10,
    marginHorizontal: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

