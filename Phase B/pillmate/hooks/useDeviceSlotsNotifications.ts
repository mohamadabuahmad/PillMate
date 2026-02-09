/**
 * Device Slots Notifications Hook
 * 
 * Monitors device pill slots in real-time via Firebase Realtime Database.
 * Sends notifications when:
 * - A slot becomes empty (pillCount === 0)
 * - A slot becomes low (pillCount <= lowThreshold)
 * 
 * Prevents duplicate notifications by tracking which slots have already been notified.
 * Automatically resets notification state when slots are refilled.
 */
import { ref, onValue, off } from "firebase/database";
import { collection, getDocs } from "firebase/firestore";
import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { auth, db, rtdb } from "../src/firebase";

// Configure notification handler (only on native platforms)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Hook to monitor device slots and send notifications for low/empty pills
 * 
 * Sets up a real-time listener on the device's slots data in Realtime Database.
 * Tracks notification state to avoid duplicate alerts.
 */
export function useDeviceSlotsNotifications() {
  useEffect(() => {
    // Notifications are not supported on web
    if (Platform.OS === 'web') {
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    let slotsRef: ReturnType<typeof ref> | null = null;
    let unsubscribe: (() => void) | null = null;
    // Track which slots have been notified (to avoid duplicate notifications)
    const notifiedSlots = new Set<string>(); // Format: "slotNumber:status" (e.g., "1:empty", "2:low")
    let isSchedulingNotification = false; // Prevent concurrent notification scheduling

    // Get device PIN and setup monitoring
    const setupMonitoring = async () => {
      try {
        const devicesRef = collection(db, "users", uid, "devices");
        const snapshot = await getDocs(devicesRef);
        if (!snapshot.empty) {
          const deviceData = snapshot.docs[0].data();
          const devicePIN = deviceData.devicePIN;
          if (devicePIN) {
            slotsRef = ref(rtdb, `devices/${devicePIN}/slots`);
            
            unsubscribe = onValue(slotsRef, async (snapshot) => {
              if (!snapshot.exists()) return;

              const slotsData = snapshot.val();
              const notifications: string[] = [];
              const newNotifiedSlots = new Set<string>();

              // Check each slot
              for (let i = 1; i <= 7; i++) {
                const slot = slotsData[i];
                if (!slot) continue;

                const { medicationName, pillCount, lowThreshold } = slot;

                // Skip if no medication assigned
                if (!medicationName) continue;

                const slotKey = `${i}:${medicationName}`;
                let shouldNotify = false;
                let status = "";
                let message = "";

                // Check if slot is empty
                if (pillCount === 0) {
                  status = "empty";
                  const emptyKey = `${i}:empty`;
                  // Only notify if we haven't notified about this slot being empty before
                  if (!notifiedSlots.has(emptyKey)) {
                    shouldNotify = true;
                    message = `Slot ${i} (${medicationName}) is empty! Please refill.`;
                    newNotifiedSlots.add(emptyKey);
                  }
                }
                // Check if slot is low
                else if (pillCount > 0 && pillCount <= lowThreshold) {
                  status = "low";
                  const lowKey = `${i}:low`;
                  // Only notify if we haven't notified about this slot being low before
                  if (!notifiedSlots.has(lowKey)) {
                    shouldNotify = true;
                    message = `Slot ${i} (${medicationName}) is low! Only ${pillCount} pills remaining. Please refill soon.`;
                    newNotifiedSlots.add(lowKey);
                  }
                }

                // If slot is now OK (was low/empty but pills were refilled), remove from notified set
                if (pillCount > lowThreshold && (notifiedSlots.has(`${i}:empty`) || notifiedSlots.has(`${i}:low`))) {
                  // Slot was refilled, remove from notified set so we can notify again if it goes low
                  notifiedSlots.delete(`${i}:empty`);
                  notifiedSlots.delete(`${i}:low`);
                }

                if (shouldNotify && message) {
                  notifications.push(message);
                }
              }

              // Update notified slots set
              newNotifiedSlots.forEach(key => notifiedSlots.add(key));

              // Send notification only if there are new alerts (not already notified)
              // Prevent concurrent scheduling to avoid iOS errors
              if (notifications.length > 0 && !isSchedulingNotification && Platform.OS !== 'web') {
                isSchedulingNotification = true;
                try {
                  // Send immediate notification using time interval trigger (minimum 1 second for iOS)
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: notifications.length === 1 
                        ? "⚠️ Device Pill Alert" 
                        : "⚠️ Device Pills Running Low",
                      body: notifications.length === 1 
                        ? notifications[0] 
                        : `${notifications.length} slots need attention:\n${notifications.slice(0, 3).join("\n")}${notifications.length > 3 ? `\n...and ${notifications.length - 3} more` : ""}`,
                      sound: true,
                      priority: Notifications.AndroidNotificationPriority.HIGH,
                    },
                    trigger: {
                      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                      seconds: 1, // Minimum 1 second for iOS compatibility
                    },
                  });
                } catch (error) {
                  // If scheduling fails, log error but don't crash the app
                  // This can happen on iOS if there are too many notifications or system restrictions
                  console.warn("Failed to schedule notification (this is non-critical):", error);
                } finally {
                  // Reset flag after a short delay to allow next notification
                  setTimeout(() => {
                    isSchedulingNotification = false;
                  }, 2000);
                }
              }
            });
          }
        }
      } catch (error) {
        console.error("Error setting up slot monitoring:", error);
      }
    };

    setupMonitoring();

    // Cleanup on unmount
    return () => {
      if (slotsRef && unsubscribe) {
        off(slotsRef, 'value', unsubscribe);
      }
    };
  }, []);
}
