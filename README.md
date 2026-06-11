# ☕ BrewDesk — Coffee & Snack Request App

A React Native (Expo) app where users request coffee/snacks and staff see the queue and serve them. With the **shared online database** (free Firebase, see below) every phone sees the **same live queue** — employees order from their own phones and the staff phone sees all of them.

## Features
- 🙋 **User side**: pick coffee/tea/snacks from a menu, set quantity, add a note (e.g. "less sugar"), send the request, and watch its status change to "Served ✓".
- 🧑‍🍳 **Staff panel** (PIN protected, default PIN: **1234**): live pending queue (auto-refreshes every 3 seconds), "Serve" button, delete requests, served history with clear option, pending/served counters.
- 🌐 **Shared live queue across all phones** via a free Firebase Realtime Database (5-minute setup, no server to run). Without it, the app falls back to phone-local storage.

## Project structure
```
BrewDesk/
├── App.js                      # Root: switches between screens
├── index.js                    # Expo entry point
├── app.json                    # App name, Android package name
├── eas.json                    # Build config (APK output)
├── package.json
└── src/
    ├── config.js               # ✏️ Paste your Firebase database URL here
    ├── db.js                   # Database layer (shared Firebase or local)
    ├── theme.js                # Colors & styles
    ├── data/menu.js            # ✏️ Edit this to change menu items
    └── screens/
        ├── RoleSelect.js       # Home: choose User or Staff (PIN)
        ├── OrderScreen.js      # User: order food
        └── StaffScreen.js      # Staff: serve requests
```

---

# 🚀 How to run and build the APK

## Step 0 — Install requirements (one time)
1. Install **Node.js LTS** from https://nodejs.org (v18 or newer).
2. Create a free **Expo account** at https://expo.dev/signup (needed for APK build).

## Step 1 — Create the shared database (so all phones see the same queue)
This takes about 5 minutes and is free. **Skip it only if you'll use a single shared device.**

1. Go to https://console.firebase.google.com and sign in with any Google account.
2. Click **Add project** → name it anything (e.g. `brewdesk`) → you can disable Google Analytics → **Create project**.
3. In the left menu: **Build → Realtime Database** → **Create database** → pick any location → choose **Start in test mode** → **Enable**.
4. On the **Data** tab, copy the database URL at the top. It looks like:
   ```
   https://brewdesk-xxxxx-default-rtdb.firebaseio.com
   ```
5. Open `src/config.js` in this project and paste the URL:
   ```js
   export const DB_URL = 'https://brewdesk-xxxxx-default-rtdb.firebaseio.com';
   ```
6. ⚠️ **Test mode rules expire after 30 days.** To keep it working, go to the **Rules** tab and set:
   ```json
   {
     "rules": {
       "requests": { ".read": true, ".write": true },
       "$other": { ".read": false, ".write": false }
     }
   }
   ```
   then click **Publish**. (This makes the queue writable by anyone who knows your database URL — fine for an office snack list, just don't share the URL publicly.)

> Phones now need an internet connection (any Wi-Fi or mobile data — they do **not** need to be on the same network). If `DB_URL` is left empty, the app works like before: data stays on each phone separately.

## Step 2 — Install project dependencies
Open a terminal **inside the BrewDesk folder** and run:
```bash
npm install
npx expo install --fix
```

## Step 3 — Test on your phone first (optional but recommended)
1. Install the **Expo Go** app from Google Play Store on your phone.
2. Run:
```bash
npx expo start
```
3. Scan the QR code with the Expo Go app (phone and computer must be on the same Wi-Fi). The app opens instantly.

## Step 4 — Build the APK (cloud build, no Android Studio needed)
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
- `eas login` → enter your Expo account email & password.
- The first time, it will ask *"Generate a new Android Keystore?"* → press **Y** (yes).
- The build runs on Expo's servers (free tier) and takes about 10–20 minutes.

## Step 5 — Download & install on your mobile
When the build finishes, the terminal prints a link like:
```
https://expo.dev/accounts/<your-name>/projects/brewdesk/builds/xxxx
```
1. Open that link **on your phone's browser** (or scan the QR code shown in the terminal).
2. Tap **Download** → you get `brewdesk.apk`.
3. Open the APK → Android will warn about unknown sources → tap **Install anyway / Allow from this source**.
4. Done! ☕ Open BrewDesk from your home screen.

---

## Customizing
- **Shared database URL** → edit `DB_URL` in `src/config.js` (see Step 1)
- **Menu items** → edit `src/data/menu.js`
- **Staff PIN** → edit `STAFF_PIN` in `src/screens/RoleSelect.js` (default `1234`)
- **App name / package** → edit `app.json`
- **Colors** → edit `src/theme.js`

## How the database works
- **Shared mode** (`DB_URL` set in `src/config.js`): all requests are stored in your Firebase Realtime Database, so every phone — employees and staff — sees the **same live queue**. Requires internet on each phone.
- **Local mode** (`DB_URL` empty): data is saved with AsyncStorage on **each phone separately**. Only useful when everyone uses one shared device (e.g. a tablet at the coffee counter).
- The name typed by the user is always remembered per-phone, in both modes.
