/**
 * i18n.js
 * مسؤول عن:
 * - إدارة اللغة (عربي/إنجليزي) مع حفظ الاختيار في localStorage
 * - تطبيق النصوص على العناصر التي تحمل data-i18n
 * ملاحظة أمنية:
 * - لا نستخدم innerHTML إطلاقاً لتفادي XSS
 */

const I18N = (() => {
  const STORAGE_KEY = "lang";
  const supported = ["ar", "en"];

  const translations = {
    ar: {
      brand: "AI INFRA",
      nav_home: "الرئيسية",
      nav_models: "النماذج",
      nav_hardware: "الهاردوير",
      nav_compare: "مقارنة GPU",
      nav_calc: "حاسبة",
      nav_about: "عن المنصة",

      // index
      title: "منصة البنية التحتية للذكاء الاصطناعي",
      subtitle: "استكشف النماذج • احسب المتطلبات • جهّز منصتك",
      explore: "استكشاف النماذج",
      quick_models: "اذهب إلى دليل النماذج",
      quick_calc: "افتح حاسبة المتطلبات",
      quick_compare: "قارن كروت الشاشة",

      // models
      models_title: "دليل نماذج الذكاء الاصطناعي",
      models_subtitle: "بحث + فلاتر + متطلبات تشغيل (RAM/VRAM) مع توصيات",
      search_placeholder: "ابحث باسم النموذج أو الشركة أو النوع…",
      filter_type: "النوع",
      filter_provider: "الشركة",
      filter_modality: "الوسائط",
      filter_license: "الترخيص",
      filter_reset: "إعادة الضبط",
      models_count: "عدد النتائج",

      // model
      model_title: "تفاصيل النموذج",
      model_specs: "المواصفات",
      model_requirements: "المتطلبات",
      model_notes: "ملاحظات",
      back_to_models: "عودة إلى الدليل",

      // hardware
      hardware_title: "متطلبات تشغيل النماذج",
      hardware_subtitle: "إرشادات عملية لتجميع جهاز أو سيرفر حسب نوع النموذج",
      hw_table_title: "جدول توصيات سريعة",

      // compare
      compare_title: "مقارنة كروت الشاشة",
      compare_subtitle: "قارن VRAM وملاءمة تشغيل LLMs على جهازك",

      // calculator
      calc_title: "حاسبة متطلبات تشغيل النموذج",
      calc_subtitle: "قدّر VRAM/RAM بناءً على عدد المعاملات ودرجة الكوانتايز",
      calc_params_label: "عدد المعاملات (B)",
      calc_quant_label: "الكوانتايز",
      calc_context_label: "طول السياق (اختياري)",
      calc_btn: "احسب",
      calc_result: "النتيجة",

      // about
      about_title: "عن المنصة",
      about_subtitle: "بوابة تقنية لتبسيط اختيار النموذج والهاردوير — قابلة للتوسع إلى متجر مستقبلاً",
      about_security: "الأمان",
      about_security_points:
        "لا نستخدم innerHTML • لا سكربتات طرف ثالث غير ضرورية • قابل لإضافة CSP • تصميم قابل للترقية إلى Backend لاحقاً",

      // common
      badge_open: "مفتوح",
      badge_closed: "مغلق",
      badge_moe: "MoE",
      badge_text: "نصي",
      badge_vision: "رؤية",
      badge_audio: "صوت",
      badge_image: "صور",
      badge_video: "فيديو",
      badge_multimodal: "متعدد",

      empty: "لا توجد نتائج مطابقة.",
      loading: "جارٍ التحميل…",
    },
    en: {
      brand: "AI INFRA",
      nav_home: "Home",
      nav_models: "Models",
      nav_hardware: "Hardware",
      nav_compare: "GPU Compare",
      nav_calc: "Calculator",
      nav_about: "About",

      // index
      title: "AI Infrastructure Portal",
      subtitle: "Explore Models • Calculate Requirements • Build Your Stack",
      explore: "Explore Models",
      quick_models: "Go to Models Directory",
      quick_calc: "Open Requirements Calculator",
      quick_compare: "Compare GPUs",

      // models
      models_title: "AI Models Directory",
      models_subtitle: "Search + filters + practical RAM/VRAM requirements & recommendations",
      search_placeholder: "Search by model name, company, or type…",
      filter_type: "Type",
      filter_provider: "Provider",
      filter_modality: "Modality",
      filter_license: "License",
      filter_reset: "Reset",
      models_count: "Results",

      // model
      model_title: "Model Details",
      model_specs: "Specs",
      model_requirements: "Requirements",
      model_notes: "Notes",
      back_to_models: "Back to Directory",

      // hardware
      hardware_title: "Model Hardware Requirements",
      hardware_subtitle: "Practical build guidance based on model size and use-case",
      hw_table_title: "Quick Recommendation Table",

      // compare
      compare_title: "GPU Comparison",
      compare_subtitle: "Compare VRAM and suitability for running LLMs locally",

      // calculator
      calc_title: "Model Requirements Calculator",
      calc_subtitle: "Estimate VRAM/RAM based on parameter count and quantization",
      calc_params_label: "Parameters (B)",
      calc_quant_label: "Quantization",
      calc_context_label: "Context length (optional)",
      calc_btn: "Calculate",
      calc_result: "Result",

      // about
      about_title: "About",
      about_subtitle: "A technical portal to simplify choosing models & hardware — expandable into a store later",
      about_security: "Security",
      about_security_points:
        "No innerHTML • minimal third-party scripts • CSP-ready • backend-ready architecture",

      // common
      badge_open: "Open",
      badge_closed: "Closed",
      badge_moe: "MoE",
      badge_text: "Text",
      badge_vision: "Vision",
      badge_audio: "Audio",
      badge_image: "Image",
      badge_video: "Video",
      badge_multimodal: "Multi",

      empty: "No matching results.",
      loading: "Loading…",
    },
  };

  function getSavedLang() {
    const v = localStorage.getItem(STORAGE_KEY);
    return supported.includes(v) ? v : "ar";
  }

  function setLang(lang) {
    if (!supported.includes(lang)) return;
    localStorage.setItem(STORAGE_KEY, lang);
    apply();
  }

  function t(key) {
    const lang = getSavedLang();
    return translations[lang][key] ?? key;
  }

  function apply() {
    const lang = getSavedLang();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    // طبّق النصوص على كل العناصر اللي تحمل data-i18n
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = translations[lang][key];
      if (typeof value === "string") el.textContent = value;
    });

    // placeholder (لازم تعامل خاص لأنه attribute)
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const value = translations[lang][key];
      if (typeof value === "string") el.setAttribute("placeholder", value);
    });

    // تحديث زر اللغة إن وجد
    const btn = document.getElementById("langToggle");
    if (btn) btn.textContent = lang === "ar" ? "EN" : "AR";
  }

  function init() {
    apply();
    const btn = document.getElementById("langToggle");
    if (btn) {
      btn.addEventListener("click", () => {
        const current = getSavedLang();
        setLang(current === "ar" ? "en" : "ar");
      });
    }
  }

  return { init, t, getSavedLang, setLang, apply };
})();
// تشغيل تلقائي كشبكة أمان (حتى لو app.js ما اشتغل)
document.addEventListener("DOMContentLoaded", () => {
  if (I18N?.init) I18N.init();
});