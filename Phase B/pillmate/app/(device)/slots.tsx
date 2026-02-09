import { router } from "expo-router";
import { get, off, onValue, ref, set, update } from "firebase/database";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DesignSystem, getThemeColors } from "../../constants/DesignSystem";
import { useTheme } from "../../contexts/ThemeContext";
import { DeviceSlot } from "../../constants/types";
import { auth, db, rtdb } from "../../src/firebase";

export default function DeviceSlotsScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [devicePIN, setDevicePIN] = useState<string | null>(null);
  const [slots, setSlots] = useState<DeviceSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editMedication, setEditMedication] = useState("");
  const [editPillCount, setEditPillCount] = useState("");

  // Get linked device PIN
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      router.replace("/(auth)/sign-in" as any);
      return;
    }

    const devicesRef = collection(db, "users", uid, "devices");
    getDocs(devicesRef).then((snapshot) => {
      if (!snapshot.empty) {
        const deviceData = snapshot.docs[0].data();
        if (deviceData.devicePIN) {
          setDevicePIN(deviceData.devicePIN);
        } else {
          Alert.alert("No Device", "Please link a device first.", [
            { text: "OK", onPress: () => router.back() }
          ]);
        }
      } else {
        Alert.alert("No Device", "Please link a device first.", [
          { text: "OK", onPress: () => router.back() }
        ]);
      }
    }).catch((error) => {
      console.error("Error fetching device:", error);
      setLoading(false);
    });
  }, []);

  // Load and listen to device slots
  useEffect(() => {
    if (!devicePIN) return;

    const slotsRef = ref(rtdb, `devices/${devicePIN}/slots`);
    
    // Initial load
    get(slotsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const slotsData = snapshot.val();
        const slotsArray: DeviceSlot[] = [];
        
        // Convert object to array and ensure all 7 slots exist
        for (let i = 1; i <= 7; i++) {
          if (slotsData[i]) {
            slotsArray.push(slotsData[i]);
          } else {
            // Initialize empty slot
            slotsArray.push({
              slotNumber: i,
              medicationName: null,
              pillCount: 0,
              maxCapacity: 100,
              lowThreshold: 10,
            });
          }
        }
        
        setSlots(slotsArray.sort((a, b) => a.slotNumber - b.slotNumber));
      } else {
        // Initialize all 7 slots if they don't exist
        const initialSlots: DeviceSlot[] = [];
        const slotsData: any = {};
        
        for (let i = 1; i <= 7; i++) {
          const slot: DeviceSlot = {
            slotNumber: i,
            medicationName: null,
            pillCount: 0,
            maxCapacity: 100,
            lowThreshold: 10,
          };
          initialSlots.push(slot);
          slotsData[i] = slot;
        }
        
        set(slotsRef, slotsData);
        setSlots(initialSlots);
      }
      setLoading(false);
    }).catch((error) => {
      console.error("Error loading slots:", error);
      setLoading(false);
    });

    // Listen for real-time updates
    const unsubscribe = onValue(slotsRef, (snapshot) => {
      if (snapshot.exists()) {
        const slotsData = snapshot.val();
        const slotsArray: DeviceSlot[] = [];
        
        for (let i = 1; i <= 7; i++) {
          if (slotsData[i]) {
            slotsArray.push(slotsData[i]);
          } else {
            slotsArray.push({
              slotNumber: i,
              medicationName: null,
              pillCount: 0,
              maxCapacity: 100,
              lowThreshold: 10,
            });
          }
        }
        
        setSlots(slotsArray.sort((a, b) => a.slotNumber - b.slotNumber));
      }
    });

    return () => off(slotsRef);
  }, [devicePIN]);

  const handleEditSlot = (slot: DeviceSlot) => {
    setEditingSlot(slot.slotNumber);
    setEditMedication(slot.medicationName || "");
    setEditPillCount(slot.pillCount.toString());
  };

  const handleSaveSlot = async (slotNumber: number) => {
    if (!devicePIN) return;

    const medicationName = editMedication.trim() || null;
    const pillCount = parseInt(editPillCount) || 0;

    if (pillCount < 0) {
      Alert.alert("Invalid Count", "Pill count cannot be negative.");
      return;
    }

    try {
      const slotRef = ref(rtdb, `devices/${devicePIN}/slots/${slotNumber}`);
      await update(slotRef, {
        medicationName: medicationName,
        pillCount: pillCount,
        lastRefilled: medicationName ? new Date().toISOString() : null,
      });

      setEditingSlot(null);
      setEditMedication("");
      setEditPillCount("");
    } catch (error: any) {
      console.error("Error updating slot:", error);
      Alert.alert("Error", "Failed to update slot. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingSlot(null);
    setEditMedication("");
    setEditPillCount("");
  };

  const getSlotStatusColor = (slot: DeviceSlot) => {
    if (slot.pillCount === 0) return colors.error;
    if (slot.pillCount <= slot.lowThreshold) return "#FFA500"; // Orange
    return colors.success || "#10B981"; // Green
  };

  const getSlotStatusText = (slot: DeviceSlot) => {
    if (slot.pillCount === 0) return "Empty";
    if (slot.pillCount <= slot.lowThreshold) return "Low";
    return "OK";
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading device slots...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Device Slots</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Manage your device's 7 pill slots. Set medication names and pill counts for each slot.
        </Text>

        {slots.map((slot) => (
          <View key={slot.slotNumber} style={[styles.slotCard, { backgroundColor: colors.surface }]}>
            <View style={styles.slotHeader}>
              <Text style={[styles.slotNumber, { color: colors.textPrimary }]}>
                Slot {slot.slotNumber}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getSlotStatusColor(slot) + '20' }]}>
                <Text style={[styles.statusText, { color: getSlotStatusColor(slot) }]}>
                  {getSlotStatusText(slot)}
                </Text>
              </View>
            </View>

            {editingSlot === slot.slotNumber ? (
              <View style={styles.editForm}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="Medication name (optional)"
                  placeholderTextColor={colors.textTertiary}
                  value={editMedication}
                  onChangeText={setEditMedication}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="Pill count"
                  placeholderTextColor={colors.textTertiary}
                  value={editPillCount}
                  onChangeText={setEditPillCount}
                  keyboardType="number-pad"
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.border }]}
                    onPress={handleCancelEdit}
                  >
                    <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleSaveSlot(slot.slotNumber)}
                  >
                    <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.slotInfo}>
                <View style={styles.slotRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Medication:</Text>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>
                    {slot.medicationName || "Not set"}
                  </Text>
                </View>
                <View style={styles.slotRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Pills:</Text>
                  <Text style={[styles.value, { color: colors.textPrimary, fontWeight: 'bold' }]}>
                    {slot.pillCount} / {slot.maxCapacity}
                  </Text>
                </View>
                {slot.lastRefilled && (
                  <View style={styles.slotRow}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Last refilled:</Text>
                    <Text style={[styles.value, { color: colors.textSecondary, fontSize: 12 }]}>
                      {new Date(slot.lastRefilled).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: colors.primary + '15' }]}
                  onPress={() => handleEditSlot(slot)}
                >
                  <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
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
    justifyContent: 'space-between',
    padding: DesignSystem.spacing.base,
    paddingTop: Platform.OS === 'ios' ? DesignSystem.spacing.sm : DesignSystem.spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: DesignSystem.typography.fontSize['2xl'],
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.base,
  },
  content: {
    flex: 1,
    padding: DesignSystem.spacing.base,
  },
  description: {
    fontSize: DesignSystem.typography.fontSize.sm,
    marginBottom: DesignSystem.spacing.lg,
    lineHeight: 20,
  },
  slotCard: {
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.base,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.base,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  slotNumber: {
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.bold,
  },
  statusBadge: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.full,
  },
  statusText: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  slotInfo: {
    gap: DesignSystem.spacing.sm,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs,
  },
  label: {
    fontSize: DesignSystem.typography.fontSize.base,
  },
  value: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  editButton: {
    marginTop: DesignSystem.spacing.sm,
    padding: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  editForm: {
    gap: DesignSystem.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.base,
  },
  editButtons: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
});
