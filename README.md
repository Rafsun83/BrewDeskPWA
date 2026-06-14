# ☕ BrewDesk — Coffee & Snack Request PWA

A **Progressive Web App (PWA)** built with React + Vite. Employees request coffee/snacks from their phones; staff see the live queue and serve them. Works on **Android and iOS** — install directly from the browser, no app store needed.

> 📝 **Rule: after changing anything in the app, update this README file so it always matches the code.**

---

## Features

### 👤 Employee / User side
- 🪪 **Profile (no name faking)**: register once with name, email, employee ID and a photo. The ID is locked to that browser's `localStorage` — nobody can order under someone else's name.
- 🙋 **Order menu**: pick coffee, tea or snacks from a responsive grid, set quantity, add a note, send the request and watch its status change to "Served ✓".
- 🔔 **Call staff to my desk**: tap the call button — staff phone vibrates and sees the call pinned above the queue. Staff taps "On my way 👋" then "Done ✓" when finished.
- 📊 **Health Insights panel** (side-by-side with menu on desktop, below on mobile):
  - Health score ring showing % of healthy orders (based on **served orders only** — updates after staff marks an order as served, not when placed).
  - Horizontal bar chart of most-ordered items, colour-coded green / orange / red by health rating.
  - Auto-generated tip (e.g. "You've had Samosa 18× — try Fruits instead!").
  - Category summary: Healthy / Moderate / Unhealthy counts.
- 🟢 **Health dot on every menu card**: small coloured dot (top-right corner) shows at a glance whether an item is healthy, moderate or unhealthy before ordering.
- 💊 **Health badge in order modal**: when you tap an item to order, the sheet shows its health rating and approximate calories (e.g. `🔴 Unhealthy ~260 kcal`).

### 🧑‍🍳 Staff panel (PIN: **1234**)
- Live pending queue — auto-refreshes every 3 seconds with a pulsing **● Live** badge.
- 3-stat header row: 🔔 Active calls / ⏳ Pending orders / ✅ Served today.
- Responsive queue grid: 1 column on mobile, 2 columns on desktop.
- "On my way 👋" and "Done ✓" action buttons on each call card.
- Served history with inline "Clear all" row.
- Web notification + vibration alert when a new request arrives.

### 🛡️ Admin panel (PIN: **9090**)
- Employee stats row: 👥 Total / ⏳ Pending approval / ✅ Approved.
- Responsive employee grid: 1 column on mobile, 2 columns on desktop.
- Approve / Revoke / Remove actions per employee.
- Status pills: green "Approved" or red "Pending" badge on each card.
- Pending employees get a red border + tinted card background.

### 🌐 Shared live queue
- All phones read/write the same **Firebase Realtime Database**.
- Falls back to browser `localStorage` if no DB URL is configured.

---

## Menu health ratings

Every item in `src/data/menu.js` has a `health` and `cal` field used by the Health Insights panel.

| Rating | Color | Items |
|---|---|---|
| `good` | 🟢 Green | Espresso, Black Coffee, Green Tea, Red Tea, Water, Fruits |
| `moderate` | 🟡 Orange | Cappuccino, Latte, Milk Tea, White Coffee, Juice, Sandwich, Noodles |
| `bad` | 🔴 Red | Cold Coffee, Samosa, Singara, Biscuits, Cake, Chips, Chanachur |

To change a rating, edit the `health` field in `src/data/menu.js`.

---

## Project structure

```
BrewDeskPWA/
├── index.html                  # PWA entry point (viewport-fit=cover, apple-mobile-web-app tags)
├── vite.config.js              # Vite + PWA plugin config (manifest, Workbox)
├── package.json
├── public/
│   ├── icon-192.png            # PWA icon
│   ├── icon-512.png            # PWA icon
│   └── favicon.png
└── src/
    ├── main.jsx                # React entry
    ├── App.jsx                 # Root: screen router
    ├── index.css               # Global CSS + responsive classes (menu-grid, staff-queue, admin-grid, order-layout…)
    ├── config.js               # ✏️ Firebase URL + staff & admin PINs
    ├── db.js                   # Database layer: requests + calls + employees (localStorage wrapper)
    ├── notify.js               # Staff alerts: vibration + Web Notification API
    ├── theme.js                # Colors, border radii, shadow
    ├── data/
    │   └── menu.js             # ✏️ Edit to change menu items, health ratings, calories
    └── screens/
        ├── RoleSelect.jsx      # Home: choose User, Staff or Admin (centered, max 460px)
        ├── RegisterScreen.jsx  # User: create / edit profile (photo, email, ID)
        ├── OrderScreen.jsx     # User: order menu + Health Insights side-by-side
        ├── StaffScreen.jsx     # Staff: live queue, call cards, served history
        └── AdminScreen.jsx     # Admin: approve & manage employee profiles
```

---

# 🚀 How to run and deploy

## Step 0 — Install requirements (one time)
Install **Node.js LTS** from https://nodejs.org (v18 or newer).

## Step 1 — Create the shared database
Same Firebase setup — takes ~5 minutes, free tier is enough.

1. Go to https://console.firebase.google.com → Add project → name it (e.g. `brewdesk`).
2. Build → Realtime Database → Create database → Start in test mode → Enable.
3. Copy the database URL (looks like `https://brewdesk-xxxxx-default-rtdb.firebaseio.com`).
4. Paste it in `src/config.js`:
   ```js
   export const DB_URL = 'https://brewdesk-xxxxx-default-rtdb.firebaseio.com';
   ```
5. ⚠️ **Set permanent rules** (test mode expires after 30 days):
   ```json
   {
     "rules": {
       "requests":  { ".read": true, ".write": true },
       "employees": { ".read": true, ".write": true },
       "calls":     { ".read": true, ".write": true },
       "$other":    { ".read": false, ".write": false }
     }
   }
   ```

## Step 2 — Install project dependencies
```bash
npm install
```

## Step 3 — Run locally (for testing)
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. To test on a phone on the same Wi-Fi, use your computer's local IP address instead of `localhost`.

## Step 4 — Build for production
```bash
npm run build
```
Creates a `dist/` folder with the optimised PWA (service worker + manifest included).

## Step 5 — Deploy

### Option A — Vercel (recommended, free CLI)
```bash
npm install -g vercel
vercel --prod
```

### Option B — Netlify (drag-and-drop)
1. Run `npm run build`
2. Go to https://netlify.com → drag the `dist/` folder onto the dashboard.

### Option C — Any static file server
Upload `dist/` to Nginx, Apache, GitHub Pages, etc.
Ensure the server sends all routes to `index.html` (needed for PWA navigation fallback).

## Step 6 — Install on phones ("Add to Home Screen")

**Android Chrome:**
1. Open the hosted URL in Chrome.
2. Tap the install banner or menu → **Add to Home Screen**.
3. BrewDesk appears as a full-screen app icon.

**iOS Safari:**
1. Open the URL in Safari.
2. Tap **Share** → **Add to Home Screen** → **Add**.

---

## Building as a native Android APK

If you want to distribute BrewDesk as an `.apk` instead of (or alongside) the PWA:

### Option A — PWABuilder Studio (VS Code extension)
1. Install the **PWABuilder Studio** extension in VS Code.
2. Run `npm run dev` in the terminal to start the local server.
3. Click the PWABuilder icon in the VS Code sidebar.
4. Click **"Package for Store"** → **Android**.
5. Fill in the signing key form:
   - Package ID: `com.questionpro.brewdesk`
   - Signing key: **Generate new**
   - Alias: `brewdesk`
6. Click **Generate** → download the `.zip` → install the signed `.apk` on your phone.

> ⚠️ If you see **"Timed out waiting for Google Play packaging job"** — PWABuilder's server is overloaded. Wait a few minutes and retry, or use Option B below.

### Option B — Capacitor (local build, no server needed)
Requires **Android Studio** installed.

```bash
# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize
npx cap init BrewDesk com.questionpro.brewdesk --web-dir dist

# 3. Add Android platform
npx cap add android

# 4. Build PWA + sync into Android project
npm run build
npx cap sync

# 5. Open in Android Studio → Build → Build APK(s)
npx cap open android
```

Inside Android Studio: **Build → Build Bundle(s)/APK(s) → Build APK(s)** → locate `app-debug.apk` → transfer to phone and install.

---

## Customizing

| What | Where |
|---|---|
| Firebase URL | `DB_URL` in `src/config.js` |
| Staff PIN | `STAFF_PIN` in `src/config.js` (default: `1234`) |
| Admin PIN | `ADMIN_PIN` in `src/config.js` (default: `9090`) |
| Menu items | `src/data/menu.js` — add/remove items, change `health` and `cal` |
| Health ratings | `health: 'good' \| 'moderate' \| 'bad'` field on each item in `menu.js` |
| Colors / theme | `src/theme.js` |
| App name / icons | `manifest` object in `vite.config.js`, replace `public/icon-192.png` and `public/icon-512.png` |

---

## Platform notes

| Feature | Android Chrome | iOS Safari 16.4+ |
|---|---|---|
| Add to Home Screen | Auto install banner | Manual: Share → Add to Home Screen |
| Push Notifications | ✅ After install | ✅ Only after Add to Home Screen |
| Vibration on new orders | ✅ | ❌ iOS ignores `navigator.vibrate()` |
| Camera for profile photo | ✅ | ✅ (opens native camera) |
| Offline after first load | ✅ (Workbox service worker) | ✅ (Workbox service worker) |
| Health Insights sidebar | ✅ Side-by-side on desktop | ✅ Stacked below menu on mobile |

---

## How employee profiles work
1. First open → **Register**: name, email, employee ID, optional photo.
2. Registration **claims the employee ID** in the database with a secret token stored in `localStorage`. Duplicate IDs are rejected.
3. Profile starts as **"Waiting for admin approval"** — cannot order until an admin approves.
4. **Changed phone/browser?** → admin removes the old profile (Admin panel → Remove), freeing the ID to re-register.
5. Photos are resized to 256 px JPEG via the Canvas API before upload.

## How the database works
- **Shared mode** (`DB_URL` set): all phones read/write the same Firebase Realtime Database via REST API.
- **Local mode** (`DB_URL` empty): data is saved in `localStorage` on that browser only. Profiles are auto-approved. Good for a single shared kiosk device.

## How Health Insights work
- Every menu item has a `health` rating (`good` / `moderate` / `bad`) and approximate `cal` value in `src/data/menu.js`.
- The Health Insights panel only counts orders with `status === 'served'` — placing an order does **not** update the score. The panel updates automatically (every 4 s) as staff mark orders served.
- Health score = `(served healthy qty / total served qty) × 100`.
- The bar chart shows the top 8 most-served items, coloured by health rating.
