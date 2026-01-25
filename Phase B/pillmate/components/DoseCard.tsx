import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getThemeColors } from "../constants/DesignSystem";
import type { Dose } from "../constants/types";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { useTheme } from "../contexts/ThemeContext";

interface DoseCardProps {
  item: Dose;
  onNotify: (dose: Dose) => void;
  onEdit: (dose: Dose) => void;
  onDelete: (dose: Dose) => void;
  onToggle: (dose: Dose) => void;
}

export default function DoseCard({ item, onNotify, onEdit, onDelete, onToggle }: DoseCardProps) {
  const { isDark } = useTheme();
  const { highContrast, getScaledFontSize, getMinTouchTarget, simplifiedMode } = useAccessibility();
  const colors = getThemeColors(isDark, highContrast);
  const minTouchTarget = getMinTouchTarget();

  const handleNotify = () => {
    console.log("DoseCard: Notify button pressed for", item.medName);
    onNotify(item);
  };

  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.surface, borderColor: colors.border },
      !item.enabled && styles.cardDisabled
    ]}>
      <View style={styles.cardContent}>
        <View style={[styles.timeBadge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.timeText, { color: colors.primary, fontSize: getScaledFontSize(16) }]}>{item.time}</Text>
        </View>
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.title,
              { color: colors.textPrimary, fontSize: getScaledFontSize(17) },
              !item.enabled && { color: colors.textTertiary }
            ]}>{item.medName}</Text>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                { minHeight: minTouchTarget, minWidth: simplifiedMode ? 60 : 50 },
                item.enabled
                  ? { backgroundColor: isDark ? '#065F46' : '#d1fae5' }
                  : { backgroundColor: isDark ? '#7F1D1D' : '#fee2e2' }
              ]}
              onPress={() => onToggle(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, { color: item.enabled ? (isDark ? '#D1FAE5' : '#065F46') : (isDark ? '#FCA5A5' : '#991B1B'), fontSize: getScaledFontSize(11) }]}>
                {item.enabled ? "ON" : "OFF"}
              </Text>
            </TouchableOpacity>
          </View>
          {item.dose && (
            <Text style={[
              styles.dose,
              { color: colors.textSecondary, fontSize: getScaledFontSize(14) },
              !item.enabled && { color: colors.textTertiary }
            ]}>{item.dose}</Text>
          )}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, minWidth: minTouchTarget, minHeight: minTouchTarget }]}
          onPress={handleNotify}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionBtnText, { fontSize: getScaledFontSize(16) }]}>🔔</Text>
          {simplifiedMode && <Text style={[styles.actionBtnLabel, { color: colors.textPrimary, fontSize: getScaledFontSize(10) }]}>Notify</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, minWidth: minTouchTarget, minHeight: minTouchTarget }]}
          onPress={() => onEdit(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionBtnText, { fontSize: getScaledFontSize(16) }]}>✏️</Text>
          {simplifiedMode && <Text style={[styles.actionBtnLabel, { color: colors.textPrimary, fontSize: getScaledFontSize(10) }]}>Edit</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.deleteBtn,
            { backgroundColor: isDark ? '#7F1D1D' : '#fee2e2', borderColor: isDark ? '#991B1B' : '#fecaca', minWidth: minTouchTarget, minHeight: minTouchTarget }
          ]}
          onPress={() => onDelete(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionBtnText, { fontSize: getScaledFontSize(16) }]}>🗑️</Text>
          {simplifiedMode && <Text style={[styles.actionBtnLabel, { color: isDark ? '#FCA5A5' : '#991B1B', fontSize: getScaledFontSize(10) }]}>Delete</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  timeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 70,
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    fontWeight: "800",
  },
  infoSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
  },
  dose: {
    fontSize: 14,
    fontWeight: "500",
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: "800",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 6,
    marginLeft: 8,
  },
  actionBtn: {
    minWidth: 40,
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  deleteBtn: {
  },
  actionBtnText: {
    fontSize: 16,
  },
  actionBtnLabel: {
    marginTop: 2,
    fontWeight: '600',
  },
});
