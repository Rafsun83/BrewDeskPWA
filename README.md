# ☕ BrewDesk — Coffee & Snack Request PWA

A **Progressive Web App (PWA)** built with React + Vite. Employees request coffee/snacks from their phones; staff see the live queue and serve them. Works on **Android and iOS** — install directly from the browser, no app store needed.

> 📝 **Rule: after changing anything in the app, update this README file so it always matches the code.**

## Features
- 🪪 **Employee profiles (no name faking)**: register once with name, email, employee ID and a profile photo. The ID is locked to that browser's `localStorage`, so nobody can order under someone else's name.
- 🛡️ **Admin panel** (PIN protected, default PIN: **9090**): new registrations start as *"Waiting for admin approval"* and can't order until approved. Admins can approve, revoke or remove profiles.
- 🙋 **User side**: pick coffee/tea/snacks from a menu, set quantity, add a note, send the request, and watch its status change to "Served ✓".
- 🧑‍🍳 **Staff panel** (PIN protected, default PIN: **1234**): live pending queue (auto-refreshes every 3 seconds) showing who ordered with their profile photo, "Serve" button, delete, served history with clear option.
- 🔔 **New-request alert**: when a new request lands, the staff phone **vibrates and shows a web notification** banner (Android Chrome + iOS 16.4+ when added to home screen).
- 🙋‍♂️ **Call staff to my desk**: employee taps "🔔 Call staff to my desk". Staff phone vibrates and sees *"<name> is calling you"* pinned above the queue. Staff taps "On my way 👋" then "Done ✓" when finished.
- 🌐 **Shared live queue across all phones** via free Firebase Realtime Database. Falls back to browser-local storage if no URL is configured.

## Project structure
```
BrewDeskPWA/
├── index.html                  # PWA entry point
├── vite.config.js              # Vite + PWA plugin config
├── package.json
└── src/
    ├── main.jsx                # React entry
    ├── App.jsx                 # Root: screen router
    ├── index.css               # Global CSS reset
    ├── config.js               # ✏️ Firebase URL + staff & admin PINs
    ├── db.js                   # Database layer: requests + calls + employees
    ├── notify.js               # Staff alerts: vibration + Web Notification
    ├── theme.js                # Colors & styles
    ├── data/menu.js            # ✏️ Edit this to change menu items
    └── screens/
        ├── RoleSelect.jsx      # Home: choose User, Staff or Admin
        ├── RegisterScreen.jsx  # User: create / edit profile (photo, email, ID)
        ├── OrderScreen.jsx     # User: order food
        ├── StaffScreen.jsx     # Staff: serve requests
        └── AdminScreen.jsx     # Admin: approve & manage profiles
```

---

# 🚀 How to run and deploy

## Step 0 — Install requirements (one time)
Install **Node.js LTS** from https://nodejs.org (v18 or newer).

## Step 1 — Create the shared database (so all phones see the same queue)
Same Firebase setup as before — takes ~5 minutes and is free.

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
Open `http://localhost:5173` in your phone's browser (phone and computer must be on the same Wi-Fi), or use your computer's IP address.

## Step 4 — Build for production
```bash
npm run build
```
This creates a `dist/` folder with the optimised PWA (service worker + manifest included).

## Step 5 — Deploy (host anywhere)

### Option A — Netlify (free, drag-and-drop)
1. Run `npm run build`
2. Go to https://netlify.com → drag the `dist/` folder onto the Netlify dashboard
3. Netlify gives you a URL like `https://brewdesk-abc.netlify.app`

### Option B — Vercel (free CLI)
```bash
npm install -g vercel
vercel --prod
```

### Option C — Any static file server
Upload the `dist/` folder to any web host (Nginx, Apache, GitHub Pages, etc.).  
Make sure the server sends all routes to `index.html` (needed for PWA navigation fallback).

## Step 6 — Install on phones ("Add to Home Screen")

**Android Chrome:**
1. Open the hosted URL in Chrome.
2. A banner saying "Add BrewDesk to Home screen" appears automatically.
3. Tap **Install** — BrewDesk appears as an app icon.

**iOS Safari (iPhone/iPad):**
1. Open the URL in Safari.
2. Tap the **Share** button (rectangle with arrow) → **Add to Home Screen** → **Add**.
3. BrewDesk appears as a full-screen app on the home screen.

---

## Customizing
- **Firebase URL** → edit `DB_URL` in `src/config.js`
- **Staff PIN / Admin PIN** → edit `STAFF_PIN` and `ADMIN_PIN` in `src/config.js` (defaults: 1234 / 9090)
- **Menu items** → edit `src/data/menu.js`
- **Colors** → edit `src/theme.js`
- **App name / icons** → edit `manifest` in `vite.config.js` and replace `public/icon-192.png`, `public/icon-512.png`

## Platform notes

| Feature | Android Chrome | iOS Safari 16.4+ |
|---|---|---|
| Add to Home Screen | Auto install banner | Manual: Share → Add to Home Screen |
| Push Notifications | ✅ After install | ✅ Only after Add to Home Screen |
| Vibration on new orders | ✅ | ❌ iOS ignores `navigator.vibrate()` |
| Camera for profile photo | ✅ | ✅ (opens native camera) |
| Offline after first load | ✅ (service worker) | ✅ (service worker) |

## How employee profiles work
1. The first time someone opens the user side, they **register**: name, email, employee ID and a photo.
2. Registering **claims the employee ID** in the database together with a random secret token stored in that browser's `localStorage`. If the ID is already taken, registration is rejected.
3. The profile starts as **"Waiting for admin approval"** — locked until an admin approves it.
4. If someone **changes phones/browsers**, an admin removes the old profile (Admin panel → Remove), freeing the ID.
5. Photos are stored as small base64 JPEGs (resized to 256 px with the Canvas API before upload).

## How the database works
- **Shared mode** (`DB_URL` set): all phones read/write the same Firebase Realtime Database.
- **Local mode** (`DB_URL` empty): data is saved in `localStorage` on that browser only. Profiles are auto-approved. Good for a single shared device.
