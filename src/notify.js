// Staff alerts: vibration + Web Notification when a new request arrives.
const VIBRATION_PATTERN = [0, 400, 250, 400];

export async function initStaffAlerts() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

export function alertNewRequests(fresh) {
  if (navigator.vibrate) navigator.vibrate(VIBRATION_PATTERN);
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    const first = fresh[0];
    const title = fresh.length === 1
      ? `☕ New request: ${first.qty} × ${first.itemName}`
      : `☕ ${fresh.length} new requests`;
    const body = fresh.length === 1
      ? `From ${first.requester}${first.note ? ` — "${first.note}"` : ''}`
      : fresh.map(r => `${r.qty} × ${r.itemName} (${r.requester})`).join(', ');
    new Notification(title, { body, icon: '/icon-192.png' });
  }
}

export function alertNewCalls(fresh) {
  if (navigator.vibrate) navigator.vibrate(VIBRATION_PATTERN);
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    const title = fresh.length === 1
      ? `🔔 ${fresh[0].callerName} is calling you`
      : `🔔 ${fresh.length} people are calling you`;
    const body = fresh.length === 1
      ? 'They need you at their desk — open the staff panel.'
      : fresh.map(c => c.callerName).join(', ');
    new Notification(title, { body, icon: '/icon-192.png' });
  }
}
