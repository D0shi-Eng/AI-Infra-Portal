/**
 * subscription.js
 * التحقق من اشتراك المستخدم وعرض جدار الدفع
 * يعتمد على: auth.js, firebase-config.js
 * 
 * الاستخدام:
 *   Subscription.guard("containerId")
 *   — يعرض محتوى الـ container إذا المستخدم مشترك
 *   — يعرض جدار الاشتراك إذا غير مشترك أو غير مسجّل
 */

const Subscription = (() => {

  /**
   * حماية محتوى — يعرض جدار اشتراك إذا المستخدم غير مشترك
   * @param {string} containerId - معرّف العنصر المحمي
   * @param {object} options - خيارات إضافية
   */
  function guard(containerId, options) {
    var opts = options || {};
    var container = document.getElementById(containerId);
    if (!container) return;

    // إخفاء المحتوى مبدئياً
    container.style.display = "none";

    Auth.onAuthChange(function (user, userDoc) {
      if (user && Auth.isPremium()) {
        // مشترك — إظهار المحتوى
        container.style.display = "";
        _removePaywall(containerId);
      } else {
        // غير مشترك — إظهار جدار الاشتراك
        container.style.display = "none";
        _showPaywall(containerId, user, opts);
      }
    });

    // حالة أولية قبل ما يحمّل Firebase
    if (!Auth.getUser()) {
      _showPaywall(containerId, null, opts);
    }
  }

  /** إزالة جدار الاشتراك */
  function _removePaywall(containerId) {
    var wall = document.getElementById("paywall-" + containerId);
    if (wall) wall.remove();
  }

  /** عرض جدار الاشتراك */
  function _showPaywall(containerId, user, opts) {
    var wallId = "paywall-" + containerId;
    if (document.getElementById(wallId)) return;

    var container = document.getElementById(containerId);
    if (!container) return;

    var wall = document.createElement("div");
    wall.id = wallId;
    wall.className = "paywall";

    // أيقونة القفل
    var icon = document.createElement("div");
    icon.className = "paywall-icon";
    icon.textContent = "🔒";
    wall.appendChild(icon);

    // عنوان
    var title = document.createElement("h2");
    title.className = "paywall-title";
    title.textContent = I18N.t("paywall_title");
    wall.appendChild(title);

    // وصف
    var desc = document.createElement("p");
    desc.className = "paywall-desc";
    desc.textContent = opts.description || I18N.t("paywall_desc");
    wall.appendChild(desc);

    // أزرار حسب حالة المستخدم
    if (!user) {
      // غير مسجّل — زر تسجيل دخول أولاً
      var loginBtn = document.createElement("button");
      loginBtn.type = "button";
      loginBtn.className = "btn paywall-btn";
      loginBtn.textContent = I18N.t("auth_login");
      loginBtn.addEventListener("click", function () {
        Auth.signInWithGoogle();
      });
      wall.appendChild(loginBtn);
    }

    // زر الاشتراك (دائماً)
    var subBtn = document.createElement("a");
    subBtn.href = "pricing.html";
    subBtn.className = "btn paywall-btn paywall-btn-primary";
    subBtn.textContent = I18N.t("paywall_subscribe");
    wall.appendChild(subBtn);

    // السعر
    var price = document.createElement("p");
    price.className = "paywall-price";
    price.textContent = I18N.t("paywall_price_hint");
    wall.appendChild(price);

    container.parentNode.insertBefore(wall, container);
  }

  return { guard: guard };
})();
