/**
 * auth.js
 * إدارة تسجيل الدخول والخروج وحالة المستخدم
 * يعتمد على: firebase-config.js
 * 
 * يُضيف زر تسجيل الدخول في الـ Navbar تلقائياً
 * يدعم: Google + Email/Password
 */

const Auth = (() => {
  let _currentUser = null;
  let _userDoc = null;
  let _listeners = [];

  // ═══════════════════════════════════════════════════════════
  // استماع لتغيّر حالة المصادقة
  // ═══════════════════════════════════════════════════════════

  /** بدء الاستماع لحالة المصادقة */
  function init() {
    FirebaseConfig.init();
    firebase.auth().onAuthStateChanged(async function (user) {
      _currentUser = user;
      if (user) {
        // جلب أو إنشاء وثيقة المستخدم في Firestore
        await _ensureUserDoc(user);
      } else {
        _userDoc = null;
      }
      _updateUI();
      _notifyListeners();
    });
  }

  // ═══════════════════════════════════════════════════════════
  // تسجيل الدخول
  // ═══════════════════════════════════════════════════════════

  /** تسجيل الدخول بـ Google */
  async function signInWithGoogle() {
    try {
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await firebase.auth().signInWithPopup(provider);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        console.error("خطأ تسجيل الدخول:", err);
        alert(I18N.t("auth_error"));
      }
    }
  }

  /** تسجيل الدخول بـ Email + Password */
  async function signInWithEmail(email, password) {
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        // إنشاء حساب جديد تلقائياً
        await firebase.auth().createUserWithEmailAndPassword(email, password);
      } else {
        throw err;
      }
    }
  }

  /** تسجيل الخروج */
  async function signOut() {
    await firebase.auth().signOut();
  }

  // ═══════════════════════════════════════════════════════════
  // وثيقة المستخدم في Firestore
  // ═══════════════════════════════════════════════════════════

  /** إنشاء أو تحديث وثيقة المستخدم */
  async function _ensureUserDoc(user) {
    try {
      var db = FirebaseConfig.db();
      var ref = db.collection("users").doc(user.uid);
      var snap = await ref.get();

      if (!snap.exists) {
        // مستخدم جديد — إنشاء وثيقة
        var doc = {
          displayName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          isPremium: false,
          subscriptionEnd: null,
          joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await ref.set(doc);
        _userDoc = doc;
        _userDoc.isPremium = false;
      } else {
        _userDoc = snap.data();
      }
    } catch (err) {
      console.error("خطأ في وثيقة المستخدم:", err);
      _userDoc = { isPremium: false };
    }
  }

  // ═══════════════════════════════════════════════════════════
  // تحديث واجهة المستخدم
  // ═══════════════════════════════════════════════════════════

  /** تحديث أزرار الـ Navbar حسب حالة المستخدم */
  function _updateUI() {
    var authArea = document.getElementById("authArea");
    if (!authArea) return;

    // مسح المحتوى السابق
    while (authArea.firstChild) authArea.removeChild(authArea.firstChild);

    if (_currentUser) {
      // ─── مستخدم مسجّل: صورة + اسم + خروج ───
      var wrapper = document.createElement("div");
      wrapper.className = "auth-user";

      // صورة المستخدم
      if (_currentUser.photoURL) {
        var img = document.createElement("img");
        img.src = _currentUser.photoURL;
        img.alt = _currentUser.displayName || "";
        img.className = "auth-avatar";
        img.referrerPolicy = "no-referrer";
        wrapper.appendChild(img);
      }

      // اسم المستخدم
      var name = document.createElement("span");
      name.className = "auth-name";
      name.textContent = _currentUser.displayName || _currentUser.email || "";
      wrapper.appendChild(name);

      // شارة المشترك
      if (_userDoc && _userDoc.isPremium) {
        var badge = document.createElement("span");
        badge.className = "auth-badge-premium";
        badge.textContent = "PRO";
        wrapper.appendChild(badge);
      }

      // زر الخروج
      var logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.className = "btn btn-sm auth-logout-btn";
      logoutBtn.textContent = I18N.t("auth_logout");
      logoutBtn.addEventListener("click", signOut);
      wrapper.appendChild(logoutBtn);

      authArea.appendChild(wrapper);
    } else {
      // ─── زائر: زر تسجيل الدخول ───
      var loginBtn = document.createElement("button");
      loginBtn.type = "button";
      loginBtn.className = "btn btn-sm auth-login-btn";
      loginBtn.textContent = I18N.t("auth_login");
      loginBtn.addEventListener("click", function () {
        _showLoginModal();
      });
      authArea.appendChild(loginBtn);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // نافذة تسجيل الدخول
  // ═══════════════════════════════════════════════════════════

  function _showLoginModal() {
    // إزالة أي modal سابق
    var old = document.getElementById("authModal");
    if (old) old.remove();

    var overlay = document.createElement("div");
    overlay.id = "authModal";
    overlay.className = "auth-modal-overlay";

    var modal = document.createElement("div");
    modal.className = "auth-modal";

    // عنوان
    var title = document.createElement("h2");
    title.textContent = I18N.t("auth_login_title");
    modal.appendChild(title);

    // زر Google
    var googleBtn = document.createElement("button");
    googleBtn.type = "button";
    googleBtn.className = "btn auth-google-btn";
    googleBtn.textContent = I18N.t("auth_google");
    googleBtn.addEventListener("click", async function () {
      await signInWithGoogle();
      overlay.remove();
    });
    modal.appendChild(googleBtn);

    // فاصل
    var sep = document.createElement("div");
    sep.className = "auth-separator";
    sep.textContent = I18N.t("auth_or");
    modal.appendChild(sep);

    // حقل البريد
    var emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.className = "auth-input";
    emailInput.placeholder = I18N.t("auth_email_placeholder");
    emailInput.dir = "ltr";
    modal.appendChild(emailInput);

    // حقل كلمة المرور
    var passInput = document.createElement("input");
    passInput.type = "password";
    passInput.className = "auth-input";
    passInput.placeholder = I18N.t("auth_password_placeholder");
    passInput.dir = "ltr";
    modal.appendChild(passInput);

    // رسالة خطأ
    var errMsg = document.createElement("p");
    errMsg.className = "auth-error";
    modal.appendChild(errMsg);

    // زر دخول بالإيميل
    var emailBtn = document.createElement("button");
    emailBtn.type = "button";
    emailBtn.className = "btn auth-email-btn";
    emailBtn.textContent = I18N.t("auth_email_login");
    emailBtn.addEventListener("click", async function () {
      var email = emailInput.value.trim();
      var pass = passInput.value;
      if (!email || !pass) {
        errMsg.textContent = I18N.t("auth_fill_fields");
        return;
      }
      try {
        errMsg.textContent = "";
        emailBtn.disabled = true;
        await signInWithEmail(email, pass);
        overlay.remove();
      } catch (err) {
        errMsg.textContent = _friendlyError(err);
        emailBtn.disabled = false;
      }
    });
    modal.appendChild(emailBtn);

    // زر إغلاق
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "auth-close-btn";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", function () {
      overlay.remove();
    });
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);

    // إغلاق بالنقر خارج النافذة
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
  }

  /** رسالة خطأ ودّية حسب كود Firebase */
  function _friendlyError(err) {
    var map = {
      "auth/wrong-password": I18N.t("auth_wrong_password"),
      "auth/invalid-email": I18N.t("auth_invalid_email"),
      "auth/email-already-in-use": I18N.t("auth_email_exists"),
      "auth/weak-password": I18N.t("auth_weak_password"),
      "auth/too-many-requests": I18N.t("auth_too_many"),
      "auth/network-request-failed": I18N.t("auth_network_error")
    };
    return map[err.code] || I18N.t("auth_error");
  }

  // ═══════════════════════════════════════════════════════════
  // دوال عامة
  // ═══════════════════════════════════════════════════════════

  /** إضافة مستمع لتغيّرات المصادقة */
  function onAuthChange(fn) {
    _listeners.push(fn);
  }

  function _notifyListeners() {
    _listeners.forEach(function (fn) {
      try { fn(_currentUser, _userDoc); } catch (_) { }
    });
  }

  /** الحصول على المستخدم الحالي */
  function getUser() { return _currentUser; }

  /** الحصول على بيانات المستخدم من Firestore */
  function getUserDoc() { return _userDoc; }

  /** هل المستخدم مشترك؟ */
  function isPremium() {
    if (!_userDoc) return false;
    if (!_userDoc.isPremium) return false;
    // التحقق من تاريخ انتهاء الاشتراك
    if (_userDoc.subscriptionEnd) {
      var end = _userDoc.subscriptionEnd.toDate ? _userDoc.subscriptionEnd.toDate() : new Date(_userDoc.subscriptionEnd);
      if (end < new Date()) return false;
    }
    return true;
  }

  return {
    init: init,
    signInWithGoogle: signInWithGoogle,
    signInWithEmail: signInWithEmail,
    signOut: signOut,
    onAuthChange: onAuthChange,
    getUser: getUser,
    getUserDoc: getUserDoc,
    isPremium: isPremium
  };
})();
