// Local database built on AsyncStorage (stored on the phone itself).
// No internet or external database is required.
import AsyncStorage from '@react-native-async-storage/async-storage';

const REQUESTS_KEY = '@brewdesk/requests';
const NAME_KEY = '@brewdesk/last-name';

async function readAll() {
  try {
    const raw = await AsyncStorage.getItem(REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function writeAll(list) {
  await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
}

// ---- Public API ----

export async function getRequests() {
  const list = await readAll();
  // newest first
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addRequest({ itemId, itemName, emoji, qty, note, requester }) {
  const list = await readAll();
  const req = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId,
    itemName,
    emoji,
    qty,
    note: note || '',
    requester: requester || 'Guest',
    status: 'pending', // 'pending' | 'served'
    createdAt: Date.now(),
    servedAt: null,
  };
  list.push(req);
  await writeAll(list);
  return req;
}

export async function markServed(id) {
  const list = await readAll();
  const next = list.map((r) =>
    r.id === id ? { ...r, status: 'served', servedAt: Date.now() } : r
  );
  await writeAll(next);
}

export async function deleteRequest(id) {
  const list = await readAll();
  await writeAll(list.filter((r) => r.id !== id));
}

export async function clearServed() {
  const list = await readAll();
  await writeAll(list.filter((r) => r.status !== 'served'));
}

// remember the last name typed by the user
export async function saveLastName(name) {
  try {
    await AsyncStorage.setItem(NAME_KEY, name);
  } catch (e) {}
}

export async function getLastName() {
  try {
    return (await AsyncStorage.getItem(NAME_KEY)) || '';
  } catch (e) {
    return '';
  }
}

// helper: "5 min ago"
export function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return `${Math.floor(hr / 24)} d ago`;
}
