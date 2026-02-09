/**
 * Notifications Module
 * 
 * Handles local notifications for medication reminders.
 * Notifications are scheduled daily at the specified time for each medication.
 * Note: Notifications are not supported on web platform.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notification handler for native platforms (iOS/Android)
// This determines how notifications are displayed when the app is in foreground
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,    // Show notification banner
      shouldShowList: true,       // Show in notification list
      shouldPlaySound: true,      // Play notification sound
      shouldSetBadge: false,      // Don't update app badge
    }),
  });
}

/**
 * Ensure notification permissions are granted
 * 
 * Requests notification permissions if not already granted.
 * On Android, also creates a notification channel with high importance.
 * 
 * @returns Promise<boolean> - true if permissions granted, false otherwise
 */
export async function ensureNotificationPermissions() {
  // Notifications are not supported on web
  if (Platform.OS === 'web') {
    console.warn("Local notifications are not supported on web.");
    return false;
  }

  try {
    // Android requires notification channels for proper notification display
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("dose-reminders", {
        name: "Dose reminders",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    // Check current permission status
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      // Request permissions if not granted
      const res = await Notifications.requestPermissionsAsync();
      return res.status === "granted";
    }
    return true;
  } catch (error) {
    console.error("Error ensuring notification permissions:", error);
    return false;
  }
}

/**
 * Schedule a daily recurring medication reminder notification
 * 
 * Creates a notification that repeats every day at the specified time.
 * The notification will automatically fire daily until cancelled.
 * 
 * @param params - Notification parameters
 * @param params.title - Notification title
 * @param params.body - Notification body text
 * @param params.hour - Hour (0-23) when notification should fire
 * @param params.minute - Minute (0-59) when notification should fire
 * @returns Promise<string | null> - Notification ID or null if failed/unsupported
 */
export async function scheduleDoseNotification(params: {
  title: string;
  body: string;
  hour: number;
  minute: number;
}) {
  // Notifications are not supported on web
  if (Platform.OS === 'web') {
    console.warn("Local notifications are not supported on web. Notification would have been scheduled for:", params.hour, ":", params.minute);
    return null;
  }

  try {
    // Use daily recurring trigger - automatically repeats every day at the same time
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: params.hour,
      minute: params.minute,
      channelId: Platform.OS === "android" ? "dose-reminders" : undefined,
    };

    // Schedule the notification with sound enabled
    return await Notifications.scheduleNotificationAsync({
      content: { title: params.title, body: params.body, sound: true },
      trigger,
    });
  } catch (error) {
    console.error("Error scheduling notification:", error);
    throw error;
  }
}

export async function cancelAllDoseNotifications() {
  // Notifications are not supported on web
  if (Platform.OS === 'web') {
    console.warn("Local notifications are not supported on web.");
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error canceling notifications:", error);
    // Don't throw - it's okay if canceling fails
  }
}

/**
 * Parse time string in HH:MM format to hour and minute numbers
 * 
 * @param time - Time string in format "HH:MM" (e.g., "08:30")
 * @returns Object with hh (hour) and mm (minute) as numbers
 * @throws Error if time format is invalid
 */
export function parseHHMM(time: string) {
  try {
    const [hh, mm] = time.split(":").map((n: string) => parseInt(n, 10));
    if (isNaN(hh) || isNaN(mm)) {
      throw new Error(`Invalid time format: ${time}`);
    }
    return { hh, mm };
  } catch (error) {
    console.error("Error parsing time:", error);
    throw error;
  }
}

export async function getAllScheduledNotifications() {
  // Notifications are not supported on web
  if (Platform.OS === 'web') {
    console.warn("Local notifications are not supported on web.");
    return [];
  }

  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
}

