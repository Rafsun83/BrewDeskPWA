// 🔧 Shared database setup — so ALL phones see the same live queue.
//
// 1. Go to https://console.firebase.google.com and click "Add project"
//    (any name, e.g. "brewdesk"; you can disable Google Analytics).
// 2. In the left menu: Build → Realtime Database → "Create database"
//    → choose any location → "Start in test mode".
// 3. Copy the database URL shown at the top of the Data tab.
//    It looks like:  https://brewdesk-xxxxx-default-rtdb.firebaseio.com
// 4. Paste it below between the quotes, then restart / rebuild the app.
//
// Leave it as '' (empty) to store data only on this phone (old behavior,
// no internet needed — but phones won't see each other's orders).
export const DB_URL = "https://brewdesk-8516b-default-rtdb.firebaseio.com/";

// PIN for the staff panel (serving orders).
export const STAFF_PIN = '1234';

// PIN for the admin panel (approving & managing employee profiles).
// Keep this different from the staff PIN and share it only with admins.
export const ADMIN_PIN = '9090';
