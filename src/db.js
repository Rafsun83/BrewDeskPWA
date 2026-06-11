// Database layer.
//
// Two modes, picked automatically from DB_URL in src/config.js:
//  - SHARED  (DB_URL set): Firebase Realtime Database over plain HTTPS.
//    Every phone reads/writes the same queue, so staff see all orders.
//  - LOCAL   (DB_URL empty): AsyncStorage on this phone only (old behavior).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB_URL } from './config';

const REQUESTS_KEY = '@brewdesk/requests';
const NAME_KEY = '@brewdesk/last-name';

const BASE = (DB_URL || '').replace(/\/+$/, '');
export const isShared = BASE !== '';

// last successful fetch, shown if a refresh fails (e.g. brief network drop)
let lastKnown = [];

// ---- Shared mode: Firebase Realtime Database REST calls ----

async function fb(path, options = {}) {
  const res = await fetch(`${BASE}${path}.json`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Database error (HTTP ${res.status})`);
  return res.json();
}

// ---- Local mode helpers ----

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
  if (isShared) {
    try {
      const data = await fb('/requests');
      lastKnown = data ? Object.values(data) : [];
    } catch (e) {
      // network hiccup: keep showing the last list we got
    }
    return [...lastKnown].sort((a, b) => b.createdAt - a.createdAt);
  }
  const list = await readAll();
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addRequest({ itemId, itemName, emoji, qty, note, requester }) {
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
  if (isShared) {
    await fb(`/requests/${req.id}`, { method: 'PUT', body: JSON.stringify(req) });
    return req;
  }
  const list = await readAll();
  list.push(req);
  await writeAll(list);
  return req;
}

export async function markServed(id) {
  if (isShared) {
    await fb(`/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'served', servedAt: Date.now() }),
    });
    return;
  }
  const list = await readAll();
  const next = list.map((r) =>
    r.id === id ? { ...r, status: 'served', servedAt: Date.now() } : r
  );
  await writeAll(next);
}

export async function deleteRequest(id) {
  if (isShared) {
    await fb(`/requests/${id}`, { method: 'DELETE' });
    return;
  }
  const list = await readAll();
  await writeAll(list.filter((r) => r.id !== id));
}

export async function clearServed() {
  if (isShared) {
    const all = await getRequests();
    const removals = {};
    all.filter((r) => r.status === 'served').forEach((r) => (removals[r.id] = null));
    if (Object.keys(removals).length > 0) {
      await fb('/requests', { method: 'PATCH', body: JSON.stringify(removals) });
    }
    return;
  }
  const list = await readAll();
  await writeAll(list.filter((r) => r.status !== 'served'));
}

// remember the last name typed by the user (always per-phone)
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
