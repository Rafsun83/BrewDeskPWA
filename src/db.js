// Database layer — web version (localStorage replaces AsyncStorage).
//
// Two modes, picked from DB_URL in src/config.js:
//  - SHARED  (DB_URL set): Firebase Realtime Database over plain HTTPS.
//  - LOCAL   (DB_URL empty): localStorage on this browser only.
import { DB_URL } from './config.js';

const REQUESTS_KEY = '@brewdesk/requests';
const SESSION_KEY  = '@brewdesk/session';
const LOCAL_EMPLOYEES_KEY = '@brewdesk/employees';
const CALLS_KEY    = '@brewdesk/calls';

const BASE = (DB_URL || '').replace(/\/+$/, '');
export const isShared = BASE !== '';

let lastKnown = [];
let lastKnownCalls = [];

// ---- Shared mode: Firebase Realtime Database REST calls ----

async function fb(path, options = {}) {
  const res = await fetch(`${BASE}${path}.json`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = new Error(`Database error (HTTP ${res.status})`);
    if (res.status === 401 || res.status === 403) err.code = 'denied';
    throw err;
  }
  return res.json();
}

// ---- localStorage helpers (sync, wrapped async to match original API) ----

function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function lsRemove(key) { localStorage.removeItem(key); }

// ---- Requests ----

async function readAll() { return lsGet(REQUESTS_KEY) || []; }
async function writeAll(list) { lsSet(REQUESTS_KEY, list); }

export async function getRequests() {
  if (isShared) {
    try {
      const data = await fb('/requests');
      lastKnown = data ? Object.values(data) : [];
    } catch (e) { /* keep last known on network hiccup */ }
    return [...lastKnown].sort((a, b) => b.createdAt - a.createdAt);
  }
  return (await readAll()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addRequest({ itemId, itemName, emoji, qty, note, requester, requesterId }) {
  const req = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId, itemName, emoji, qty,
    note: note || '',
    requester: requester || 'Guest',
    requesterId: requesterId || '',
    status: 'pending',
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
  await writeAll((await readAll()).map(r =>
    r.id === id ? { ...r, status: 'served', servedAt: Date.now() } : r
  ));
}

export async function deleteRequest(id) {
  if (isShared) {
    await fb(`/requests/${id}`, { method: 'DELETE' });
    return;
  }
  await writeAll((await readAll()).filter(r => r.id !== id));
}

export async function clearServed() {
  if (isShared) {
    const all = await getRequests();
    const removals = {};
    all.filter(r => r.status === 'served').forEach(r => { removals[r.id] = null; });
    if (Object.keys(removals).length > 0)
      await fb('/requests', { method: 'PATCH', body: JSON.stringify(removals) });
    return;
  }
  await writeAll((await readAll()).filter(r => r.status !== 'served'));
}

// ---- Staff calls ----

async function readCalls() { return lsGet(CALLS_KEY) || []; }
async function writeCalls(list) { lsSet(CALLS_KEY, list); }

export async function getCalls() {
  if (isShared) {
    try {
      const data = await fb('/calls');
      lastKnownCalls = data ? Object.values(data) : [];
    } catch (e) { /* keep last known */ }
    return [...lastKnownCalls].sort((a, b) => b.createdAt - a.createdAt);
  }
  return (await readCalls()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addCall({ callerName, callerId }) {
  const call = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    callerName: callerName || 'Guest',
    callerId: callerId || '',
    status: 'pending',
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
  await writeCalls((await readCalls()).map(c => c.id === id ? { ...c, ...patch } : c));
}

export async function deleteCall(id) {
  if (isShared) {
    await fb(`/calls/${id}`, { method: 'DELETE' });
    return;
  }
  await writeCalls((await readCalls()).filter(c => c.id !== id));
}

// ---- Employee profiles ----

function makeToken() {
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join('');
}

export function isValidEmployeeId(id) {
  return /^[A-Za-z0-9_-]{2,30}$/.test(id);
}

async function readLocalEmployees() { return lsGet(LOCAL_EMPLOYEES_KEY) || {}; }
async function writeLocalEmployees(map) { lsSet(LOCAL_EMPLOYEES_KEY, map); }

function readSession() { return lsGet(SESSION_KEY); }

async function fetchEmployee(employeeId) {
  if (isShared) return fb(`/employees/${employeeId}`);
  return (await readLocalEmployees())[employeeId] || null;
}

export async function getEmployees() {
  const data = isShared ? await fb('/employees') : await readLocalEmployees();
  return data ? Object.values(data).sort((a, b) => a.createdAt - b.createdAt) : [];
}

export async function registerEmployee({ employeeId, name, email, photo }) {
  const existing = await fetchEmployee(employeeId);
  if (existing) {
    const err = new Error('Employee ID already registered');
    err.code = 'taken';
    throw err;
  }
  const profile = {
    employeeId, name, email,
    photo: photo || '',
    deviceToken: makeToken(),
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
  lsSet(SESSION_KEY, { employeeId, deviceToken: profile.deviceToken });
  return profile;
}

export async function updateMyProfile({ name, email, photo }) {
  const session = readSession();
  if (!session) throw new Error('Not registered');
  const patch = { name, email, photo: photo || '' };
  if (isShared) {
    await fb(`/employees/${session.employeeId}`, { method: 'PATCH', body: JSON.stringify(patch) });
  } else {
    const map = await readLocalEmployees();
    if (map[session.employeeId]) {
      map[session.employeeId] = { ...map[session.employeeId], ...patch };
      await writeLocalEmployees(map);
    }
  }
  return getMyProfile();
}

export async function getMyProfile() {
  const session = readSession();
  if (!session) return null;
  let profile;
  try {
    profile = await fetchEmployee(session.employeeId);
  } catch (e) {
    const err = new Error('offline');
    err.code = 'offline';
    throw err;
  }
  if (!profile || profile.deviceToken !== session.deviceToken) {
    lsRemove(SESSION_KEY);
    return null;
  }
  return profile;
}

export async function setEmployeeApproved(employeeId, approved) {
  if (isShared) {
    await fb(`/employees/${employeeId}`, { method: 'PATCH', body: JSON.stringify({ approved }) });
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

export function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return `${Math.floor(hr / 24)} d ago`;
}
