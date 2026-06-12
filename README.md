# ☕ BrewDesk — Coffee & Snack Request App

A React Native (Expo) app where users request coffee/snacks and staff see the queue and serve them. With the **shared online database** (free Firebase, see below) every phone sees the **same live queue** — employees order from their own phones and the staff phone sees all of them.

> 📝 **Rule: after changing anything in the app, update this README file so it always matches the code.**

## Features
- 🪪 **Employee profiles (no name faking)**: each employee registers once with their **name, email, employee ID and a profile photo** (camera or gallery). The employee ID gets **locked to that phone** with a secret device token, so nobody can order under someone else's name. Orders always go out under the registered profile.
- 🛡️ **Admin panel** (PIN protected, default PIN: **9090**): new registrations start as *"Waiting for admin approval"* and can't order until an admin approves them. Admins can approve, revoke or remove profiles — removing a profile frees the employee ID (e.g. when someone gets a new phone and needs to register again).
- 🙋 **User side**: pick coffee/tea/snacks from a menu, set quantity, add a note (e.g. "less sugar"), send the request, and watch its status change to "Served ✓". Profile (name, email, photo) can be edited any time — only the employee ID is fixed.
- 🧑‍🍳 **Staff panel** (PIN protected, default PIN: **1234**): live pending queue (auto-refreshes every 3 seconds) showing **who ordered, with their profile photo**, "Serve" button, delete requests, served history with clear option, pending/served counters.
- 🔔 **New-request alert**: when a new request lands in the queue, the staff phone **vibrates and plays the notification sound** (a notification banner also shows what was ordered). The first time the staff panel opens, Android asks for notification permission — tap **Allow**. If permission is denied, the phone still vibrates.
- 🙋‍♂️ **Call staff to my desk**: an employee can tap **"🔔 Call staff to my desk"** (no order needed). The staff phone vibrates and shows *"<name> is calling you"*, and the call appears as a highlighted card pinned above the pending queue. Staff taps **"On my way 👋"** — the employee's screen flips to *"Staff is on the way!"* — and then **"Done ✓"** after helping them, which clears the call. The employee can cancel the call while it's still unanswered.
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
    ├── config.js               # ✏️ Firebase database URL + staff & admin PINs
    ├── db.js                   # Database layer: requests + staff calls + employee profiles
    ├── notify.js               # Staff alerts: vibration + notification sound
    ├── theme.js                # Colors & styles
    ├── data/menu.js            # ✏️ Edit this to change menu items
    └── screens/
        ├── RoleSelect.js       # Home: choose User, Staff (PIN) or Admin (PIN)
        ├── RegisterScreen.js   # User: create / edit profile (photo, email, ID)
        ├── OrderScreen.js      # User: order food
        ├── StaffScreen.js      # Staff: serve requests
        └── AdminScreen.js      # Admin: approve & manage employee profiles
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
       "employees": { ".read": true, ".write": true },
       "calls": { ".read": true, ".write": true },
       "$other": { ".read": false, ".write": false }
     }
   }
   ```
   then click **Publish**. (This makes the data writable by anyone who knows your database URL — fine for an office snack list, just don't share the URL publicly. The `employees` node is where profiles, photos and approvals are stored; the `calls` node holds active "call staff to my desk" requests.)

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
- **Staff PIN / Admin PIN** → edit `STAFF_PIN` (default `1234`) and `ADMIN_PIN` (default `9090`) in `src/config.js`
- **Menu items** → edit `src/data/menu.js`
- **App name / package** → edit `app.json`
- **Colors** → edit `src/theme.js`

## How employee profiles work
1. The first time someone opens the user side, they **register**: name, email, employee ID and a photo (taken with the camera or picked from the gallery — automatically resized before upload).
2. Registering **claims the employee ID** in the database together with a random secret token that only that phone stores. If the ID is already taken, registration is rejected — so one employee can't register or order under another employee's identity.
3. The profile starts as **"Waiting for admin approval"** — the menu is locked until an admin approves it from the **Admin panel**.
4. If someone **changes phones**, an admin removes their old profile (Admin panel → Remove). That frees the employee ID so it can be registered again from the new phone.
5. Profiles (including photos, stored as small base64 images) live under the `employees` node in Firebase; orders carry the registered name + employee ID, and the staff panel shows the requester's photo.

> ⚠️ Honest limitation: with the open database rules above, the protection works **through the app** (which is the realistic concern in an office), but anyone who knows your database URL could still write to it directly with developer tools. For airtight security you'd need Firebase Authentication + stricter rules.

## How the database works
- **Shared mode** (`DB_URL` set in `src/config.js`): all requests, staff calls and employee profiles are stored in your Firebase Realtime Database, so every phone — employees, staff and admin — sees the **same live data**. Requires internet on each phone.
- **Local mode** (`DB_URL` empty): data is saved with AsyncStorage on **each phone separately**. Only useful when everyone uses one shared device (e.g. a tablet at the coffee counter). Profiles are auto-approved in this mode, since there's no shared queue for an admin to watch.
