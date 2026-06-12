// Staff alerts: sound + vibration when a new request arrives.
//
// Uses a local notification (system sound + banner, also visible in the
// notification tray) plus Vibration as a fallback that works even when
// the notification permission is denied.
import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';

const VIBRATION_PATTERN = [0, 400, 250, 400];
const CHANNEL_ID = 'new-requests';

// Play the sound and show the banner even while the app is open in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Call once when the staff panel opens: sets up the Android channel
// (channels control sound/vibration on Android 8+) and asks permission.
export async function initStaffAlerts() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'New requests',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: VIBRATION_PATTERN,
        enableVibrate: true,
      });
    }
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch (e) {
    // Notifications unavailable (e.g. permission denied) — vibration still works.
  }
}

// Vibrate and post a notification describing the new request(s).
export async function alertNewRequests(fresh) {
  Vibration.vibrate(VIBRATION_PATTERN);
  try {
    const first = fresh[0];
    const title =
      fresh.length === 1
        ? `☕ New request: ${first.qty} × ${first.itemName}`
        : `☕ ${fresh.length} new requests`;
    const body =
      fresh.length === 1
        ? `From ${first.requester}${first.note ? ` — “${first.note}”` : ''}`
        : fresh.map((r) => `${r.qty} × ${r.itemName} (${r.requester})`).join(', ');
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        vibrate: VIBRATION_PATTERN,
      },
      // null = fire immediately; on Android route through our loud channel
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
    });
  } catch (e) {
    // Notification failed — the vibration above already alerted the staff.
  }
}

// Vibrate and post a notification when an employee calls staff to their desk.
export async function alertNewCalls(fresh) {
  Vibration.vibrate(VIBRATION_PATTERN);
  try {
    const title =
      fresh.length === 1
        ? `🔔 ${fresh[0].callerName} is calling you`
        : `🔔 ${fresh.length} people are calling you`;
    const body =
      fresh.length === 1
        ? 'They need you at their desk — tap "On my way" in the staff panel.'
        : fresh.map((c) => c.callerName).join(', ');
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        vibrate: VIBRATION_PATTERN,
      },
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
    });
  } catch (e) {
    // Notification failed — the vibration above already alerted the staff.
  }
}
