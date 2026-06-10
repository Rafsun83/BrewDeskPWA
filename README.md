# ☕ BrewDesk — Coffee & Snack Request App

A React Native (Expo) app where users request coffee/snacks and staff see the queue and serve them. All data is stored **locally on the phone** using AsyncStorage — **no external database, no internet needed** after install.

## Features
- 🙋 **User side**: pick coffee/tea/snacks from a menu, set quantity, add a note (e.g. "less sugar"), send the request, and watch its status change to "Served ✓".
- 🧑‍🍳 **Staff panel** (PIN protected, default PIN: **1234**): live pending queue (auto-refreshes every 3 seconds), "Serve" button, delete requests, served history with clear option, pending/served counters.
- 💾 Local database (AsyncStorage) — data survives app restarts.

## Project structure
```
BrewDesk/
├── App.js                      # Root: switches between screens
├── index.js                    # Expo entry point
├── app.json                    # App name, Android package name
├── eas.json                    # Build config (APK output)
├── package.json
└── src/
    ├── db.js                   # Local database (AsyncStorage)
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

## Step 1 — Install project dependencies
Open a terminal **inside the BrewDesk folder** and run:
```bash
npm install
npx expo install --fix
```

## Step 2 — Test on your phone first (optional but recommended)
1. Install the **Expo Go** app from Google Play Store on your phone.
2. Run:
```bash
npx expo start
```
3. Scan the QR code with the Expo Go app (phone and computer must be on the same Wi-Fi). The app opens instantly.

## Step 3 — Build the APK (cloud build, no Android Studio needed)
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
- `eas login` → enter your Expo account email & password.
- The first time, it will ask *"Generate a new Android Keystore?"* → press **Y** (yes).
- The build runs on Expo's servers (free tier) and takes about 10–20 minutes.

## Step 4 — Download & install on your mobile
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
- **Menu items** → edit `src/data/menu.js`
- **Staff PIN** → edit `STAFF_PIN` in `src/screens/RoleSelect.js` (default `1234`)
- **App name / package** → edit `app.json`
- **Colors** → edit `src/theme.js`

## Note about the local database
AsyncStorage saves data on **each phone separately**. Both the user and staff use the **same device** (e.g. a tablet at the coffee counter), or the user hands requests on one shared phone. If you later want multiple phones to share one live queue, you'd need a small server or a sync service (like Firebase) — happy to upgrade it when you're ready.
