import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Only set notification handler on native platforms (iOS/Android)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermissions() {
  // Notifications are not supported on web
  if (Platform.OS === 'web') {
    console.warn("Local notifications are not supported on web.");
    return false;
  }

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("dose-reminders", {
        name: "Dose reminders",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const res = await Notifications.requestPermissionsAsync();
      return res.status === "granted";
    }
    return true;
  } catch (error) {
    console.error("Error ensuring notification permissions:", error);
    return false;
  }
}

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
    // Use daily recurring trigger - automatically repeats every day
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: params.hour,
      minute: params.minute,
      channelId: Platform.OS === "android" ? "dose-reminders" : undefined,
    };

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

