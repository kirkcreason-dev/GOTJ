/* ============================================================
   GOTJ 2026 — Firebase config for cross-device alert sync
   ------------------------------------------------------------
   SETUP (one time):
   1. Go to console.firebase.google.com and create a project
      (e.g. "gotj-companion").
   2. Click the </> (Web) icon to add a web app, then COPY the
      firebaseConfig object it shows you and paste it below,
      replacing the placeholder values.
   3. In the project: Build > Firestore Database > Create database.
      Choose a region, start in test mode (or paste the rules from
      the chat). Done — alerts now sync to every device.
   ============================================================ */

var FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAQJwpam8ywji-_B1XPskql2Z3sqx4H_2U",
  authDomain:        "psychopathic-app.firebaseapp.com",
  projectId:         "psychopathic-app",
  storageBucket:     "psychopathic-app.firebasestorage.app",
  messagingSenderId: "463749636495",
  appId:             "1:463749636495:web:c75ae1b0e0134f78be6bfa"
};

/* Initializes Firestore only if a real config is present.
   Until you paste your config, the app keeps working with the
   per-device localStorage feed (no sync). */
window.GOTJ_DB = null;
try {
  if (window.firebase && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.projectId.indexOf("PASTE") === -1) {
    firebase.initializeApp(FIREBASE_CONFIG);
    window.GOTJ_DB = firebase.firestore();
  }
} catch (e) {
  console.warn("Firebase not initialized:", e);
}
