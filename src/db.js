// Database layer.
//
// Two modes, picked automatically from DB_URL in src/config.js:
//  - SHARED  (DB_URL set): Firebase Realtime Database over plain HTTPS.
//    Every phone reads/writes the same queue, so staff see all orders.
//  - LOCAL   (DB_URL empty): AsyncStorage on this phone only (old behavior).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB_URL } from './config';

const REQUESTS_KEY = '@brewdesk/requests';
const SESSION_KEY = '@brewdesk/session'; // { employeeId, deviceToken }
const LOCAL_EMPLOYEES_KEY = '@brewdesk/employees'; // local mode registry

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
  if (!res.ok) {
    const err = new Error(`Database error (HTTP ${res.status})`);
    // 401/403 = Firebase rules are blocking this node, not a network problem
    if (res.status === 401 || res.status === 403) err.code = 'denied';
    throw err;
  }
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

export async function addRequest({ itemId, itemName, emoji, qty, note, requester, requesterId }) {
  const req = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId,
    itemName,
    emoji,
    qty,
    note: note || '',
    requester: requester || 'Guest',
    requesterId: requesterId || '',
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

// ---- Staff calls ----
//
// An employee can "call" staff to their desk without ordering anything.
// Stored at /calls/{id}. status flow: 'pending' (waiting for staff)
// -> 'coming' (staff tapped "On my way"). When staff arrives they tap
// "Done", which deletes the call. The employee can cancel while pending.

const CALLS_KEY = '@brewdesk/calls';
let lastKnownCalls = [];

async function readCalls() {
  try {
    const raw = await AsyncStorage.getItem(CALLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function writeCalls(list) {
  await AsyncStorage.setItem(CALLS_KEY, JSON.stringify(list));
}

export async function getCalls() {
  if (isShared) {
    try {
      const data = await fb('/calls');
      lastKnownCalls = data ? Object.values(data) : [];
    } catch (e) {
      // network hiccup: keep showing the last list we got
    }
    return [...lastKnownCalls].sort((a, b) => b.createdAt - a.createdAt);
  }
  const list = await readCalls();
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addCall({ callerName, callerId }) {
  const call = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    callerName: callerName || 'Guest',
    callerId: callerId || '',
    status: 'pending', // 'pending' | 'coming'
    createdAt: Date.now(),
    comingAt: null,
  };
  if (isShared) {
    await fb(`/calls/${call.id}`, { method: 'PUT', body: JSON.stringify(call) });
    return call;
  }
  const list = await readCalls();
  list.push(call);
  await writeCalls(list);
  return call;
}

export async function setCallStatus(id, status) {
  const patch = { status };
  if (status === 'coming') patch.comingAt = Date.now();
  if (isShared) {
    await fb(`/calls/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    return;
  }
  const list = await readCalls();
  await writeCalls(list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

export async function deleteCall(id) {
  if (isShared) {
    await fb(`/calls/${id}`, { method: 'DELETE' });
    return;
  }
  const list = await readCalls();
  await writeCalls(list.filter((c) => c.id !== id));
}

// ---- Employee profiles ----
//
// Each employee registers once: name + email + employee ID + photo.
// The profile is stored at /employees/{employeeId} together with a random
// deviceToken that is also kept in this phone's AsyncStorage. Only the
// phone holding the matching token "owns" that identity, so nobody can
// order under someone else's name. New profiles start unapproved and an
// admin must approve them from the admin panel before ordering.

function makeToken() {
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join('');
}

// Employee IDs become Firebase keys, so only allow safe characters.
export function isValidEmployeeId(id) {
  return /^[A-Za-z0-9_-]{2,30}$/.test(id);
}

async function readLocalEmployees() {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_EMPLOYEES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

async function writeLocalEmployees(map) {
  await AsyncStorage.setItem(LOCAL_EMPLOYEES_KEY, JSON.stringify(map));
}

async function readSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function fetchEmployee(employeeId) {
  if (isShared) return fb(`/employees/${employeeId}`);
  const map = await readLocalEmployees();
  return map[employeeId] || null;
}

export async function getEmployees() {
  const data = isShared ? await fb('/employees') : await readLocalEmployees();
  return data
    ? Object.values(data).sort((a, b) => a.createdAt - b.createdAt)
    : [];
}

// Claim an employee ID. Throws {code:'taken'} if someone already owns it.
export async function registerEmployee({ employeeId, name, email, photo }) {
  const existing = await fetchEmployee(employeeId);
  if (existing) {
    const err = new Error('Employee ID already registered');
    err.code = 'taken';
    throw err;
  }
  const profile = {
    employeeId,
    name,
    email,
    photo: photo || '',
    deviceToken: makeToken(),
    // local mode has no admin watching a shared queue — auto approve
    approved: !isShared,
    createdAt: Date.now(),
  };
  if (isShared) {
    await fb(`/employees/${employeeId}`, { method: 'PUT', body: JSON.stringify(profile) });
  } else {
    const map = await readLocalEmployees();
    map[employeeId] = profile;
    await writeLocalEmployees(map);
  }
  await AsyncStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ employeeId, deviceToken: profile.deviceToken })
  );
  return profile;
}

// Update name/email/photo of the profile this phone owns.
export async function updateMyProfile({ name, email, photo }) {
  const session = await readSession();
  if (!session) throw new Error('Not registered');
  const patch = { name, email, photo: photo || '' };
  if (isShared) {
    await fb(`/employees/${session.employeeId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  } else {
    const map = await readLocalEmployees();
    if (map[session.employeeId]) {
      map[session.employeeId] = { ...map[session.employeeId], ...patch };
      await writeLocalEmployees(map);
    }
  }
  return getMyProfile();
}

// The profile registered from this phone, fresh from the database.
// Returns null (and clears the session) if the profile was removed by an
// admin or the ID was re-registered from another phone.
export async function getMyProfile() {
  const session = await readSession();
  if (!session) return null;
  let profile;
  try {
    profile = await fetchEmployee(session.employeeId);
  } catch (e) {
    // network hiccup — keep the session, caller can retry
    const err = new Error('offline');
    err.code = 'offline';
    throw err;
  }
  if (!profile || profile.deviceToken !== session.deviceToken) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
  return profile;
}

// ---- Admin actions ----

export async function setEmployeeApproved(employeeId, approved) {
  if (isShared) {
    await fb(`/employees/${employeeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ approved }),
    });
    return;
  }
  const map = await readLocalEmployees();
  if (map[employeeId]) {
    map[employeeId].approved = approved;
    await writeLocalEmployees(map);
  }
}

export async function deleteEmployee(employeeId) {
  if (isShared) {
    await fb(`/employees/${employeeId}`, { method: 'DELETE' });
    return;
  }
  const map = await readLocalEmployees();
  delete map[employeeId];
  await writeLocalEmployees(map);
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
