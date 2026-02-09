/**
 * Home Screen Component
 * 
 * Main screen for managing medications. Features include:
 * - View medication schedule with next dose display
 * - Add new medications with safety checks (allergies, interactions)
 * - Edit and delete medications
 * - Enable/disable medication reminders
 * - AI-powered medication name suggestions
 * - Automatic device dispense on notification
 * - Manual dispense button
 * - Tutorial for new users
 * 
 * Integrates with Firebase for data persistence and real-time updates.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { ref, set } from "firebase/database";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";

import DoseCard from "../../components/DoseCard";
import Tutorial from "../../components/Tutorial";
import { DesignSystem, getThemeColors } from "../../constants/DesignSystem";
import type { Dose } from "../../constants/types";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { auth, db, rtdb } from "../../src/firebase";

import * as Notifications from "expo-notifications";
import {
  cancelAllDoseNotifications,
  ensureNotificationPermissions,
  parseHHMM,
  scheduleDoseNotification,
} from "../../hooks/notifications";
import { useDeviceSlotsNotifications } from "../../hooks/useDeviceSlotsNotifications";
import { useMedicationSafety } from "../../hooks/useMedicationSafety";
import { useMedicationSuggestions } from "../../hooks/useMedicationSuggestions";
import { rotateMotor } from "../../hooks/useMotorControl";

export default function Home() {
  const [doses, setDoses] = useState<Dose[]>([]);
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { showTutorial, setShowTutorial, getScaledFontSize, getScaledSpacing, getMinTouchTarget, simplifiedMode, highContrast } = useAccessibility();
  const [userName, setUserName] = useState<string | null>(null);
  const [devicePIN, setDevicePIN] = useState<string | null>(null);

  const colors = getThemeColors(isDark, highContrast);
  const minTouchTarget = getMinTouchTarget();

  // Form state for adding new medication
  const [medName, setMedName] = useState("");
  const [doseNumber, setDoseNumber] = useState("");
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [blockDispense, setBlockDispense] = useState(false);

  // AI-powered hooks for medication safety and suggestions
  const { checkAllergy, checkInteraction, getUserAllergies, checking: safetyChecking } = useMedicationSafety();
  // Get AI suggestions when user types medication name (minimum 2 characters)
  const { suggestions: aiSuggestions, loading: suggestionsLoading } = useMedicationSuggestions(
    medName,
    medName.trim().length >= 2 && showSuggestions
  );

  // Monitor device slots for low/empty pills and send notifications
  useDeviceSlotsNotifications();

  // Edit state
  const [editingDose, setEditingDose] = useState<Dose | null>(null);
  const [editMedName, setEditMedName] = useState("");
  const [editDoseNumber, setEditDoseNumber] = useState("");
  const [editSelectedHour, setEditSelectedHour] = useState(8);
  const [editSelectedMinute, setEditSelectedMinute] = useState(0);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);

  useEffect(() => {
    ensureNotificationPermissions();
  }, []);

  // Show tutorial automatically for new users after sign up
  useEffect(() => {
    const checkAndShowTutorial = async () => {
      try {
        const hasSeenTutorial = await AsyncStorage.getItem('@pillmate_has_seen_tutorial');
        if (!hasSeenTutorial) {
          // New user - show tutorial after a short delay
          setTimeout(() => {
            setShowTutorial(true);
            AsyncStorage.setItem('@pillmate_has_seen_tutorial', 'true');
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
      }
    };

    checkAndShowTutorial();
  }, []);

  // Reset tutorial state when navigating to home tab (but don't auto-show if already seen)
  useFocusEffect(
    useCallback(() => {
      // Only close tutorial if it's open, don't auto-open it
      // (auto-open is handled by the useEffect above on first mount)
    }, [])
  );

  // Get user's display name
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.displayName) {
      setUserName(user.displayName);
    } else {
      // Fallback to email username if no display name
      const emailName = user?.email?.split("@")[0] || null;
      setUserName(emailName);
    }
  }, []);

  // Get linked device PIN
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const devicesRef = collection(db, "users", uid, "devices");
    getDocs(devicesRef).then((snapshot) => {
      if (!snapshot.empty) {
        // Get the first linked device
        const deviceData = snapshot.docs[0].data();
        if (deviceData.devicePIN) {
          setDevicePIN(deviceData.devicePIN);
        }
      }
    }).catch((error) => {
      console.error("Error fetching device:", error);
    });
  }, []);

  // Subscribe to real-time medication schedule updates from Firestore
  // Automatically updates when medications are added, edited, or deleted
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      // Redirect to sign-in if not authenticated
      router.replace("/(auth)/sign-in" as any);
      return;
    }

    // Query user's medication schedule, ordered by time
    const ref = collection(db, "users", uid, "schedule");
    const q = query(ref, orderBy("time", "asc"));

    // Listen for real-time changes
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Dose[];
      setDoses(list);
    });

    // Cleanup: unsubscribe when component unmounts
    return () => unsub();
  }, []);

  // Schedule notifications for all enabled medications
  // Uses debouncing to avoid excessive rescheduling when doses change
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (doses.length === 0) return;

    // Debounce notification scheduling (wait 1 second after last change)
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    notificationTimeoutRef.current = setTimeout(async () => {
      const ok = await ensureNotificationPermissions();
      if (!ok) return;

      // Cancel all existing notifications before rescheduling
      await cancelAllDoseNotifications();

      // Schedule daily recurring notifications for each enabled medication
      for (const d of doses) {
        if (!d.enabled) continue;

        const { hh, mm } = parseHHMM(d.time);

        await scheduleDoseNotification({
          title: "Time to take your dose",
          body: `${d.medName}${d.dose ? ` • ${d.dose}` : ""}`,
          hour: hh,
          minute: mm,
        });
      }
    }, 1000);

    // Cleanup: clear timeout on unmount or when doses change
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [doses]);

  /**
   * Auto-dispense function - triggered automatically when notification is received
   * Performs safety checks before dispensing (allergies, block status)
   * Similar to triggerDispense but without user alerts (silent operation)
   */
  const autoTriggerDispense = useCallback(async () => {
    if (!devicePIN) {
      console.log("No device linked for auto-dispense");
      return;
    }

    // Check if dispense is blocked (safety first!)
    if (blockDispense) {
      console.warn("Auto-dispense blocked due to safety concerns");
      return;
    }

    // Check allergies before auto-dispensing
    const nextDose = doses.find((d) => d.enabled);
    if (nextDose) {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const userAllergies = await getUserAllergies(uid);
        if (userAllergies.length > 0) {
          const allergyCheck = await checkAllergy(nextDose.medName, userAllergies);

          if (allergyCheck.hasAllergy && allergyCheck.shouldBlock) {
            console.warn("Auto-dispense blocked due to allergy:", allergyCheck.message);
            return;
          }
        }
      }
    }

    try {
      // Trigger dispense automatically via Realtime Database
      const dispenseRef = ref(rtdb, `devices/${devicePIN}/dispense`);
      await set(dispenseRef, true);
      console.log("✅ Auto-dispense triggered successfully");
    } catch (error: any) {
      console.error("Error triggering auto-dispense:", error);
    }
  }, [devicePIN, doses, blockDispense, getUserAllergies, checkAllergy]);

  // Auto-dispense when pill notification is received
  // Listens for medication reminder notifications and automatically:
  // 1. Rotates the device motor
  // 2. Triggers device dispense (with safety checks)
  useEffect(() => {
    if (!devicePIN) return;

    // Notifications are not supported on web
    if (Platform.OS === 'web') {
      return;
    }

    // Listen for when notifications are received (when user sees the notification)
    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      // Check if this is a pill dose notification (not a low inventory notification)
      const title = notification.request.content.title;
      if (title && title.includes("Time to take your dose")) {
        // Rotate motor 45 degrees when pill notification is received
        await rotateMotor(45);

        // Automatically trigger dispense (with safety checks)
        await autoTriggerDispense();
      }
    });

    // Cleanup: remove notification listener on unmount
    return () => {
      subscription.remove();
    };
  }, [devicePIN, autoTriggerDispense]);

  const nextDose = useMemo(() => doses.find((d) => d.enabled) ?? null, [doses]);

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const parseTime = (timeStr: string) => {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour: hour || 8, minute: minute || 0 };
  };

  /**
   * Add a new medication to the schedule
   * 
   * Performs comprehensive safety checks:
   * 1. Allergy verification
   * 2. Drug interaction checking
   * 3. Time gap validation
   * 
   * Only adds medication if all safety checks pass.
   */
  const addMedication = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const name = medName.trim();
    const dose = doseNumber.trim();
    const timeStr = formatTime(selectedHour, selectedMinute);

    // Validate input
    if (!name) return Alert.alert(t('missing'), t('enterMedicationName'));
    if (!dose || isNaN(Number(dose)) || Number(dose) <= 0) {
      return Alert.alert(t('invalidDose'), t('enterValidNumber'));
    }

    // 1. CHECK ALLERGIES - Verify medication doesn't conflict with user's allergies
    const userAllergies = await getUserAllergies(uid);
    if (userAllergies.length > 0) {
      const allergyCheck = await checkAllergy(name, userAllergies);

      if (allergyCheck.hasAllergy) {
        const shouldProceed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            `⚠️ ${t('allergyWarning')}`,
            `${allergyCheck.message}\n\nSeverity: ${allergyCheck.severity.toUpperCase()}`,
            [
              {
                text: t('cancel'),
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: allergyCheck.shouldBlock ? t('ok') : t('addAnyway'),
                onPress: () => resolve(!allergyCheck.shouldBlock),
                style: allergyCheck.shouldBlock ? "destructive" : "default",
              },
            ]
          );
        });

        if (!shouldProceed) {
          setBlockDispense(allergyCheck.shouldBlock);
          setSafetyWarning(allergyCheck.message);
          return;
        }
      }
    }

    // 2. CHECK DRUG INTERACTIONS WITH EXISTING MEDICATIONS
    // Verify new medication doesn't interact dangerously with existing medications
    for (const existingDose of doses) {
      if (!existingDose.enabled) continue;

      const interaction = await checkInteraction(
        name,
        existingDose.medName,
        timeStr,
        existingDose.time
      );

      // Block if medications cannot be taken together
      if (!interaction.canTakeTogether || interaction.recommendation === "avoid") {
        Alert.alert(
          `🚫 ${t('drugInteractionWarning')}`,
          `${interaction.message}\n\nCannot take "${name}" with "${existingDose.medName}".`,
          [{ text: t('ok') }]
        );
        return;
      }

      // Warn if medications need time gap between doses
      if (interaction.recommendation === "space_hours" && interaction.timeGapRequired > 0) {
        const timeGapWarning = `⚠️ ${t('timeGapRequired')}\n\n${interaction.message}\n\nYou need at least ${interaction.timeGapRequired} hours between "${name}" and "${existingDose.medName}".`;

        const shouldProceed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            t('timeGapRequired'),
            timeGapWarning,
            [
              { text: t('cancel'), onPress: () => resolve(false) },
              { text: t('adjustTime'), onPress: () => resolve(true) },
            ]
          );
        });

        if (!shouldProceed) return;
      }
    }

    // 3. ADD MEDICATION IF ALL CHECKS PASS - Save to Firestore
    try {
      await addDoc(collection(db, "users", uid, "schedule"), {
        medName: name,
        dose: dose,
        time: timeStr,
        enabled: true,
        createdAt: serverTimestamp(),
      });

      setMedName("");
      setDoseNumber("");
      setSelectedHour(8);
      setSelectedMinute(0);
      setShowSuggestions(false);
      setSafetyWarning(null);
      setBlockDispense(false);
    } catch (e: any) {
      Alert.alert("Failed to add", e?.message ?? "Unknown error");
    }
  };

  const handleEdit = useCallback((dose: Dose) => {
    setEditingDose(dose);
    setEditMedName(dose.medName);
    setEditDoseNumber(dose.dose || "");
    const { hour, minute } = parseTime(dose.time);
    setEditSelectedHour(hour);
    setEditSelectedMinute(minute);
  }, []);

  const handleSaveEdit = async () => {
    if (!editingDose) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const name = editMedName.trim();
    const dose = editDoseNumber.trim();
    const timeStr = formatTime(editSelectedHour, editSelectedMinute);

    if (!name) {
      Alert.alert(t('missing'), t('enterMedicationName'));
      return;
    }
    if (!dose || isNaN(Number(dose)) || Number(dose) <= 0) {
      Alert.alert(t('invalidDose'), t('enterValidNumber'));
      return;
    }

    try {
      const doseRef = doc(db, "users", uid, "schedule", editingDose.id);
      await updateDoc(doseRef, {
        medName: name,
        dose: dose,
        time: timeStr,
      });

      setEditingDose(null);
      setEditMedName("");
      setEditDoseNumber("");
      setEditSelectedHour(8);
      setEditSelectedMinute(0);
    } catch (e: any) {
      Alert.alert("Failed to update", e?.message ?? "Unknown error");
    }
  };

  const handleDelete = (dose: Dose) => {
    Alert.alert(
      t('deleteMedication'),
      `${t('areYouSureDelete')} ${dose.medName}?`,
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('delete'),
          style: "destructive",
          onPress: async () => {
            const uid = auth.currentUser?.uid;
            if (!uid) return;

            try {
              const doseRef = doc(db, "users", uid, "schedule", dose.id);
              await deleteDoc(doseRef);
            } catch (e: any) {
              Alert.alert("Failed to delete", e?.message ?? "Unknown error");
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (dose: Dose) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const doseRef = doc(db, "users", uid, "schedule", dose.id);
      await updateDoc(doseRef, {
        enabled: !dose.enabled,
      });
    } catch (e: any) {
      Alert.alert("Failed to update", e?.message ?? "Unknown error");
    }
  };

  // manual notify button (still useful for testing)
  const onNotify = async (dose: Dose) => {
    const ok = await ensureNotificationPermissions();
    if (!ok) return Alert.alert("Notifications disabled", "Enable notifications in settings.");

    const { hh, mm } = parseHHMM(dose.time);

    await scheduleDoseNotification({
      title: "Time to take your dose",
      body: `${dose.medName}${dose.dose ? ` • ${dose.dose}` : ""}`,
      hour: hh,
      minute: mm,
    });

    Alert.alert("Scheduled", `Reminder set for ${dose.time} (next occurrence).`);
  };

  /**
   * Manually trigger device dispense
   * 
   * Performs safety checks before dispensing:
   * - Verifies device is linked
   * - Checks if dispense is blocked
   * - Verifies allergies
   * 
   * Shows user alerts for any issues.
   */
  const triggerDispense = async () => {
    if (!devicePIN) {
      Alert.alert("No device linked", "Please link a device first from the device link page.");
      return;
    }

    // Check if dispense is blocked (e.g., due to allergy warning)
    if (blockDispense) {
      Alert.alert(
        "⚠️ Dispense Blocked",
        safetyWarning || "This medication may cause an allergic reaction. Dispense blocked for your safety.",
        [{ text: "OK" }]
      );
      return;
    }

    // Check allergies before dispensing
    const nextDose = doses.find((d) => d.enabled);
    if (nextDose) {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const userAllergies = await getUserAllergies(uid);
        if (userAllergies.length > 0) {
          const allergyCheck = await checkAllergy(nextDose.medName, userAllergies);

          if (allergyCheck.hasAllergy && allergyCheck.shouldBlock) {
            Alert.alert(
              "🚫 Dispense Blocked",
              `${allergyCheck.message}\n\nDispense blocked for your safety.`,
              [{ text: "OK" }]
            );
            return;
          }
        }
      }
    }

    try {
      // Send dispense command to device via Realtime Database
      const dispenseRef = ref(rtdb, `devices/${devicePIN}/dispense`);
      await set(dispenseRef, true);
      Alert.alert("Dispense triggered", "The device will dispense a dose now.");
    } catch (error: any) {
      console.error("Error triggering dispense:", error);
      Alert.alert("Failed", "Could not trigger dispense. Make sure the device is online.");
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setMedName(suggestion);
    setShowSuggestions(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!showTutorial}
        nestedScrollEnabled={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.greeting, { color: colors.textPrimary, fontSize: getScaledFontSize(16) }]}>
              {t('hello')}{userName ? `, ${userName}` : ""}! 👋
            </Text>
            <Text style={[styles.h1, { color: colors.textPrimary, fontSize: getScaledFontSize(28) }]}>{t('yourMedications')}</Text>
          </View>
        </View>

        {/* Next Dose Card */}
        <View style={[styles.nextCard, { backgroundColor: colors.primary }]}>
          <View style={styles.nextCardHeader}>
            <Text style={styles.nextCardIcon}>⏰</Text>
            <Text style={styles.nextTitle}>{t('nextDose')}</Text>
          </View>
          <Text style={styles.nextValue}>
            {nextDose ? (
              <>
                <Text style={styles.nextTime}>{nextDose.time}</Text>
                <Text style={styles.nextMedName}> • {nextDose.medName}</Text>
              </>
            ) : (
              t('noScheduleYet')
            )}
          </Text>
        </View>

        {/* Safety Warning */}
        {blockDispense && safetyWarning && (
          <View style={[styles.safetyWarning, { backgroundColor: '#fee2e2', borderColor: '#ef4444' }]}>
            <Text style={styles.safetyWarningIcon}>🚫</Text>
            <View style={styles.safetyWarningContent}>
              <Text style={styles.safetyWarningTitle}>{t('dispenseBlocked')}</Text>
              <Text style={styles.safetyWarningText}>{safetyWarning}</Text>
            </View>
          </View>
        )}

        {/* Device Dispense Button */}
        {devicePIN && (
          <TouchableOpacity
            style={[styles.dispenseBtn, { backgroundColor: colors.success }]}
            onPress={triggerDispense}
            activeOpacity={0.8}
          >
            <Text style={styles.dispenseBtnText}>💊 {t('dispenseDoseNow')}</Text>
          </TouchableOpacity>
        )}

        {/* Add medication form */}
        {!editingDose ? (
          <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>{t('addNewMedication')}</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder={t('medicationNamePlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={medName}
                onChangeText={(text) => {
                  setMedName(text);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (medName.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
              />

              {/* Show loading indicator */}
              {suggestionsLoading && medName.trim().length >= 2 && (
                <View style={styles.suggestionsLoading}>
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    {t('findingMedications')}
                  </Text>
                </View>
              )}

              {/* Show AI suggestions dropdown */}
              {showSuggestions && aiSuggestions.length > 0 && !suggestionsLoading && (
                <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ScrollView
                    style={styles.suggestionsList}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                  >
                    {aiSuggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.suggestionItem,
                          { backgroundColor: colors.surface },
                          index === aiSuggestions.length - 1 && styles.suggestionItemLast
                        ]}
                        onPress={() => handleSuggestionSelect(suggestion)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>
                          💊 {suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder={t('numberOfPillsPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              value={doseNumber}
              onChangeText={setDoseNumber}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.input, styles.timePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setIsEditingTime(false);
                setShowTimePicker(true);
              }}
            >
              <Text style={[styles.timePickerText, { color: colors.textPrimary }]}>
                {t('time')}: {formatTime(selectedHour, selectedMinute)}
              </Text>
              <Text style={[styles.timePickerArrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={addMedication} activeOpacity={0.8}>
              <Text style={styles.btnText}>{t('addToSchedule')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>{t('editMedication')}</Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder={t('medicationNamePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              value={editMedName}
              onChangeText={setEditMedName}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder={t('numberOfPillsPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              value={editDoseNumber}
              onChangeText={setEditDoseNumber}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.input, styles.timePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setIsEditingTime(true);
                setShowEditTimePicker(true);
              }}
            >
              <Text style={[styles.timePickerText, { color: colors.textPrimary }]}>
                {t('time')}: {formatTime(editSelectedHour, editSelectedMinute)}
              </Text>
              <Text style={[styles.timePickerArrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>

            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn, { backgroundColor: colors.border }]}
                onPress={() => {
                  setEditingDose(null);
                  setEditMedName("");
                  setEditDoseNumber("");
                  setEditSelectedHour(8);
                  setEditSelectedMinute(0);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.btnText, styles.cancelBtnText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleSaveEdit} activeOpacity={0.8}>
                <Text style={styles.btnText}>{t('saveChanges')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Schedule Section */}
        <View style={styles.scheduleSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('yourSchedule')}</Text>
          {doses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noMedicationsScheduled')}</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>{t('addOneAbove')}</Text>
            </View>
          ) : (
            <View style={styles.doseList}>
              {doses.map((item) => (
                <DoseCard
                  key={item.id}
                  item={item}
                  onNotify={onNotify}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker || showEditTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowTimePicker(false);
          setShowEditTimePicker(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Time</Text>

            <View style={styles.pickerContainer}>
              {/* Hours Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Hour</Text>
                <ScrollView
                  style={styles.pickerScrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContent}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.pickerItem,
                        (isEditingTime ? editSelectedHour : selectedHour) === i && styles.pickerItemSelected,
                        { backgroundColor: (isEditingTime ? editSelectedHour : selectedHour) === i ? colors.primary : 'transparent' }
                      ]}
                      onPress={() => {
                        if (isEditingTime) {
                          setEditSelectedHour(i);
                        } else {
                          setSelectedHour(i);
                        }
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        { color: (isEditingTime ? editSelectedHour : selectedHour) === i ? '#fff' : colors.textPrimary }
                      ]}>
                        {i.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Minutes Picker */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Minute</Text>
                <ScrollView
                  style={styles.pickerScrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerContent}
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.pickerItem,
                        (isEditingTime ? editSelectedMinute : selectedMinute) === i && styles.pickerItemSelected,
                        { backgroundColor: (isEditingTime ? editSelectedMinute : selectedMinute) === i ? colors.primary : 'transparent' }
                      ]}
                      onPress={() => {
                        if (isEditingTime) {
                          setEditSelectedMinute(i);
                        } else {
                          setSelectedMinute(i);
                        }
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        { color: (isEditingTime ? editSelectedMinute : selectedMinute) === i ? '#fff' : colors.textPrimary }
                      ]}>
                        {i.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowTimePicker(false);
                  setShowEditTimePicker(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setShowTimePicker(false);
                  setShowEditTimePicker(false);
                }}
              >
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {showTutorial && (
        <Tutorial
          visible={showTutorial}
          onClose={() => {
            setShowTutorial(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignSystem.layout.containerPadding,
    paddingBottom: DesignSystem.spacing['3xl'],
  },
  header: {
    marginBottom: DesignSystem.spacing.xl,
    marginTop: DesignSystem.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: DesignSystem.typography.fontSize.lg,
    marginBottom: DesignSystem.spacing.xs,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    opacity: 1,
  },
  h1: {
    fontSize: DesignSystem.typography.fontSize['3xl'],
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    letterSpacing: DesignSystem.typography.letterSpacing.tight,
  },

  nextCard: {
    padding: DesignSystem.layout.cardPadding,
    borderRadius: DesignSystem.borderRadius.lg,
    marginBottom: DesignSystem.spacing.lg,
    ...DesignSystem.shadows.md,
  },
  nextCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  nextCardIcon: {
    fontSize: DesignSystem.typography.fontSize['2xl'],
    marginRight: DesignSystem.spacing.sm,
  },
  nextTitle: {
    color: "#fff",
    fontWeight: DesignSystem.typography.fontWeight.bold,
    fontSize: DesignSystem.typography.fontSize.sm,
    opacity: 0.95,
    textTransform: "uppercase",
    letterSpacing: DesignSystem.typography.letterSpacing.wide,
  },
  nextValue: {
    fontSize: DesignSystem.typography.fontSize['2xl'],
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    color: "#fff",
  },
  nextTime: {
    fontSize: DesignSystem.typography.fontSize['3xl'],
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
  },
  nextMedName: {
    fontSize: DesignSystem.typography.fontSize.xl,
    opacity: 0.95,
  },

  formCard: {
    padding: DesignSystem.layout.cardPadding,
    borderRadius: DesignSystem.borderRadius.lg,
    marginBottom: DesignSystem.spacing.xl,
    ...DesignSystem.shadows.base,
  },
  formTitle: {
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    marginBottom: DesignSystem.spacing.base,
    fontSize: DesignSystem.typography.fontSize.lg,
  },
  input: {
    padding: DesignSystem.layout.inputPadding,
    borderRadius: DesignSystem.borderRadius.base,
    marginBottom: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.base,
    borderWidth: 1,
    fontWeight: DesignSystem.typography.fontWeight.regular,
  },
  btn: {
    padding: DesignSystem.layout.buttonPadding,
    borderRadius: DesignSystem.borderRadius.base,
    alignItems: "center",
    marginTop: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.md,
    flex: 1,
  },
  btnText: {
    color: "#fff",
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    fontSize: DesignSystem.typography.fontSize.base,
  },
  editButtons: {
    flexDirection: "row",
    gap: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.sm,
  },
  cancelBtn: {
    ...DesignSystem.shadows.sm,
  },
  cancelBtnText: {
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },

  scheduleSection: {
    marginTop: DesignSystem.spacing.sm,
  },
  sectionTitle: {
    fontSize: DesignSystem.typography.fontSize['2xl'],
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    marginBottom: DesignSystem.spacing.base,
  },
  doseList: {
    gap: DesignSystem.spacing.md,
    paddingBottom: 0,
  },
  dispenseBtn: {
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.base,
    alignItems: "center",
    marginTop: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.md,
  },
  dispenseBtnText: {
    color: "#fff",
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    fontSize: DesignSystem.typography.fontSize.lg,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DesignSystem.spacing['3xl'],
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: DesignSystem.spacing.base,
  },
  emptyText: {
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    marginBottom: DesignSystem.spacing.sm,
  },
  emptySubtext: {
    fontSize: DesignSystem.typography.fontSize.sm,
  },
  timePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: DesignSystem.layout.inputPadding,
  },
  timePickerText: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  timePickerArrow: {
    fontSize: DesignSystem.typography.fontSize.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: DesignSystem.borderRadius.xl,
    borderTopRightRadius: DesignSystem.borderRadius.xl,
    padding: DesignSystem.layout.cardPadding,
    paddingBottom: DesignSystem.spacing['2xl'],
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: DesignSystem.typography.fontSize.xl,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    marginBottom: DesignSystem.spacing.lg,
    textAlign: "center",
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: DesignSystem.spacing.lg,
    height: 300,
  },
  pickerColumn: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: DesignSystem.spacing.sm,
  },
  pickerLabel: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    marginBottom: DesignSystem.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: DesignSystem.typography.letterSpacing.wide,
  },
  pickerScrollView: {
    flex: 1,
    width: "100%",
  },
  pickerContent: {
    paddingVertical: DesignSystem.spacing.md,
  },
  pickerItem: {
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.base,
    marginVertical: DesignSystem.spacing.xs,
    alignItems: "center",
    minWidth: 80,
  },
  pickerItemSelected: {
    opacity: 1,
  },
  pickerItemText: {
    fontSize: DesignSystem.typography.fontSize.lg,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  modalButtons: {
    flexDirection: "row",
    gap: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: DesignSystem.layout.buttonPadding,
    borderRadius: DesignSystem.borderRadius.base,
    alignItems: "center",
  },
  modalButtonCancel: {
    ...DesignSystem.shadows.sm,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: DesignSystem.typography.fontWeight.bold,
    fontSize: DesignSystem.typography.fontSize.base,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: DesignSystem.spacing.md,
    zIndex: 1,
  },
  safetyWarning: {
    flexDirection: 'row',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.base,
    marginBottom: DesignSystem.spacing.md,
    borderWidth: 2,
    alignItems: 'flex-start',
  },
  safetyWarningIcon: {
    fontSize: 24,
    marginRight: DesignSystem.spacing.sm,
  },
  safetyWarningContent: {
    flex: 1,
  },
  safetyWarningTitle: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.bold,
    color: '#991b1b',
    marginBottom: DesignSystem.spacing.xs,
  },
  safetyWarningText: {
    fontSize: DesignSystem.typography.fontSize.sm,
    color: '#7f1d1d',
    lineHeight: DesignSystem.typography.lineHeight.relaxed * DesignSystem.typography.fontSize.sm,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    borderRadius: DesignSystem.borderRadius.base,
    borderWidth: 1,
    marginTop: DesignSystem.spacing.xs,
    ...DesignSystem.shadows.lg,
    zIndex: 1000,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  suggestionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.xs,
    paddingVertical: DesignSystem.spacing.xs,
  },
  loadingText: {
    fontSize: DesignSystem.typography.fontSize.sm,
  },
});
