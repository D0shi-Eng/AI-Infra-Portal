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

  // Active nav link
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.classList.add("active");
  });

  // ─── Navbar scroll effect ───
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    let lastScroll = 0;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y > 60) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
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