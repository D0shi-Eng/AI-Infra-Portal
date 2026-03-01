/**
 * app.js
 * نقطة تشغيل موحّدة لكل الصفحات:
 * - تهيئة الثيم واللغة
 * - Navbar active + scroll effect
 * - Scroll reveal animations
 * - Footer year
 */

document.addEventListener("DOMContentLoaded", () => {
  // Theme
  if (typeof ThemeManager !== "undefined" && ThemeManager?.init) {
    ThemeManager.init();
  }

  // Language
  if (typeof I18N !== "undefined" && I18N?.init) {
    I18N.init();
  }

  // A11y: aria-label لأزرار اللغة والثيم
  const langBtn = document.getElementById("langToggle");
  const themeBtn = document.getElementById("themeToggle");
  if (langBtn && typeof I18N !== "undefined" && I18N.t) {
    langBtn.setAttribute("aria-label", I18N.t("aria_label_lang"));
  }
  if (themeBtn && typeof I18N !== "undefined" && I18N.t) {
    themeBtn.setAttribute("aria-label", I18N.t("aria_label_theme"));
  }

  // Skip link للمحتوى (يُظهر عند التركيز فقط)
  if (!document.querySelector(".skip-link")) {
    const skip = document.createElement("a");
    skip.href = "#main";
    skip.className = "skip-link";
    skip.textContent = (typeof I18N !== "undefined" && I18N.t ? I18N.t("skip_link") : "انتقال للمحتوى");
    document.body.insertBefore(skip, document.body.firstChild);
  }

  // همبرغر موبايل: زر لفتح/إغلاق القائمة
  const navbar = document.querySelector(".navbar");
  const navLinks = document.querySelector(".nav-links");
  if (navbar && navLinks) {
    let menuBtn = document.getElementById("navMenuBtn");
    if (!menuBtn) {
      menuBtn = document.createElement("button");
      menuBtn.id = "navMenuBtn";
      menuBtn.type = "button";
      menuBtn.className = "nav-menu-btn";
      menuBtn.setAttribute("aria-label", (typeof I18N !== "undefined" && I18N.t ? I18N.t("aria_label_menu") : "فتح القائمة"));
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.textContent = "☰";
      navbar.querySelector(".nav-left").appendChild(menuBtn);
    }
    menuBtn.addEventListener("click", () => {
      const open = navbar.classList.toggle("nav-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", (e) => {
      if (navbar.classList.contains("nav-open") && !navbar.contains(e.target)) {
        navbar.classList.remove("nav-open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Active nav link
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.classList.add("active");
  });

  // ─── Navbar scroll effect ───
  const navbarScroll = document.querySelector(".navbar");
  if (navbarScroll) {
    let lastScroll = 0;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y > 60) {
        navbarScroll.classList.add("scrolled");
      } else {
        navbarScroll.classList.remove("scrolled");
      }
      lastScroll = y;
    }, { passive: true });
  }

  // ─── Scroll Reveal ───
  const revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if (revealEls.length > 0 && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  // ─── Footer Year ───
  const yearEl = document.getElementById("footerYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});