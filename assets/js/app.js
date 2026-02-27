/**
 * app.js
 * نقطة تشغيل موحّدة لكل الصفحات:
 * - تهيئة الثيم
 * - تهيئة اللغة
 * - تمييز رابط الـ Navbar الحالي
 */

document.addEventListener("DOMContentLoaded", () => {
    // تهيئة الثيم
    if (typeof ThemeManager !== "undefined" && ThemeManager?.init) {
      ThemeManager.init();
    }
  
    // تهيئة اللغة (الأهم)
    if (typeof I18N !== "undefined" && I18N?.init) {
      I18N.init();
    }
  
    // تمييز الرابط الحالي في الـ Navbar (Active)
    const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href === path) a.classList.add("active");
    });
  });