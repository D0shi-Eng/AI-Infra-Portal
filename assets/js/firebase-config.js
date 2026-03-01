/**
 * firebase-config.js
 * إعدادات Firebase — تهيئة المشروع والخدمات الأساسية
 * يُحمّل عبر Firebase SDK من CDN (compat mode)
 */

const FirebaseConfig = (() => {
  // إعدادات المشروع من Firebase Console
  const config = {
    apiKey: "AIzaSyD6HExCGJvdFJK3aSwzUDVTK5FXvqAi1iw",
    authDomain: "ai-infra-724f0.firebaseapp.com",
    projectId: "ai-infra-724f0",
    storageBucket: "ai-infra-724f0.firebasestorage.app",
    messagingSenderId: "853720547386",
    appId: "1:853720547386:web:ae87775a9a6d29028c7503",
    measurementId: "G-EYZLRYT9D2"
  };

  let _initialized = false;

  /** تهيئة Firebase — يُنادى مرة واحدة فقط */
  function init() {
    if (_initialized) return;
    if (typeof firebase === "undefined") {
      console.warn("Firebase SDK غير محمّل");
      return;
    }
    firebase.initializeApp(config);
    _initialized = true;
  }

  /** الحصول على Firestore */
  function db() {
    if (!_initialized) init();
    return firebase.firestore();
  }

  /** الحصول على Auth */
  function auth() {
    if (!_initialized) init();
    return firebase.auth();
  }

  return { init, db, auth };
})();
