import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { getThemeColors } from '../constants/DesignSystem';

interface HelpButtonProps {
  onPress: () => void;
}

export default function HelpButton({ onPress }: HelpButtonProps) {
  const { isDark } = useTheme();
  const { getScaledFontSize, getMinTouchTarget, simplifiedMode, highContrast } = useAccessibility();
  const colors = getThemeColors(isDark, highContrast);
  const minTouchTarget = getMinTouchTarget();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.primary,
          minWidth: minTouchTarget,
          minHeight: minTouchTarget,
          borderRadius: simplifiedMode ? 12 : minTouchTarget / 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel="Help"
      accessibilityHint="Tap to view tutorial and help information"
    >
      <Text style={[styles.icon, { fontSize: getScaledFontSize(20) }]}>❓</Text>
      {simplifiedMode && (
        <Text style={[styles.label, { color: '#fff', fontSize: getScaledFontSize(14) }]}>Help</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  icon: {
    color: '#fff',
  },
  label: {
    fontWeight: '600',
  },
});
