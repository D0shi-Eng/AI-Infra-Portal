/**
 * i18n.js
 * مسؤول عن:
 * - إدارة اللغة (عربي/إنجليزي) مع حفظ الاختيار في localStorage
 * - تطبيق النصوص على العناصر التي تحمل data-i18n
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
      model_missing_id_title: "لا يوجد معرّف نموذج",
      model_missing_id_message:
        "لفتح هذه الصفحة، انتقل إلى دليل النماذج ثم اختر نموذجاً، أو أضف ‎?id=<معرّف_النموذج> إلى الرابط.",
      model_not_found_title: "النموذج غير موجود",
      model_not_found_message:
        "لم يتم العثور على نموذج بهذا المعرّف. تأكد أنك تستخدم رابطاً صحيحاً من دليل النماذج.",
      model_load_error:
        "تعذّر تحميل بيانات النماذج حالياً. حاول لاحقاً أو تأكد من اتصالك بالإنترنت.",

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
      about_subtitle: "بوابة تقنية لتبسيط اختيار النموذج والهاردوير — قابلة للتوسع",
      about_benefits_title: "فوائد المنصة",
      about_benefits_1: "تساعدك تختار النموذج المناسب حسب جهازك وميزانيتك.",
      about_benefits_2: "توضح متطلبات التشغيل بشكل عملي (VRAM/RAM) بدون تعقيد.",
      about_benefits_3: "تختصر وقت التجارب العشوائية وتقلل الهدر في الموارد.",
      about_benefits_4: "تقارن بين الـ GPUs لتحديد الخيار الأنسب لتشغيل النماذج محلياً.",
      about_benefits_5: "حاسبة تقديرية لمتطلبات التشغيل حسب حجم النموذج وطريقة الضغط.",
      about_message_title: "رسالة للمستخدم",
      about_message_text:
        "هذه المنصة صُممت لتكون مرجعًا عمليًا لاختيار النماذج والعتاد بثقة. حالياً نقدم الأدوات مجاناً وبأداء عالي على GitHub Pages. مستقبلاً سنوسّع المحتوى ونضيف توصيات أعمق، وعند توفر مخزون فعلي قد نطلق متجرًا مخصصًا لتجهيزات الذكاء الاصطناعي.",

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

      // stats
      stat_models: "نماذج ذكاء اصطناعي",
      stat_gpus: "كرت شاشة",
      stat_quant: "مستويات كوانتايز",
      stat_langs: "لغة مدعومة",

      // features
      features_title: "ماذا نقدّم لك؟",
      features_subtitle: "أدوات عملية تختصر وقتك وتساعدك تختار صح",
      feat_models_title: "دليل النماذج",
      feat_models_desc: "استعرض النماذج مع متطلبات التشغيل والفلاتر الذكية",
      feat_calc_title: "حاسبة المتطلبات",
      feat_calc_desc: "قدّر VRAM و RAM بناءً على حجم النموذج والكوانتايز",
      feat_compare_title: "مقارنة GPU",
      feat_compare_desc: "قارن كروت الشاشة واعرف الأنسب لتشغيل النماذج محلياً",
      feat_hw_title: "إرشادات التجميع",
      feat_hw_desc: "توصيات عملية لبناء جهاز حسب حجم النموذج",
      feat_theme_title: "وضع ليلي/نهاري",
      feat_theme_desc: "تصميم احترافي يتكيّف مع تفضيلاتك البصرية",
      feat_future_title: "قابل للتوسع",
      feat_future_desc: "بنية جاهزة لمتجر تجهيزات AI ولوحة إدارة مستقبلية",

      // footer
      footer_desc: "منصة تقنية متخصصة لتبسيط فهم متطلبات تشغيل نماذج الذكاء الاصطناعي وربطها بالبنية التحتية المناسبة.",
      footer_nav: "التنقّل",
      footer_tools: "الأدوات",
      footer_soon: "قريباً",
      footer_store: "متجر التجهيزات",
      footer_api: "API مطورين",
      footer_community: "المجتمع",
      footer_rights: "جميع الحقوق محفوظة.",

      empty: "لا توجد نتائج مطابقة.",
      loading: "جارٍ التحميل…",

      compare_models_title: "مقارنة النماذج",
      compare_models_subtitle: "اختر نموذجين أو ثلاثة للمقارنة",
      compare_models_btn: "قارن النماذج",
      gpu_models_title: "أي نموذج يناسب كرتّي؟",
      gpu_models_subtitle: "اختر كرت الشاشة لعرض النماذج المناسبة",
      gpu_models_select: "اختر الكرت",
      gpu_models_empty: "لا توجد نماذج تناسب هذا الكرت في القاعدة.",
      nav_lessons: "الدروس",
      nav_recommendations: "التوصيات",
      nav_ask: "اسأل المنصة",
      lessons_title: "دروس المنصة",
      lessons_subtitle: "محتوى موجّه حسب مستواك",
      lessons_intro: "من مبتدئ إلى خبير: خطوات عملية لاختيار النماذج، حساب المتطلبات، ومقارنة العتاد. كل فئة لها أدواتها وطريقة حساب واضحة.",
      lessons_beginner: "مبتدئ",
      lessons_how_calc: "كيف تحسب وتستفيد",
      lessons_tools: "الأدوات الموصى بها",
      lessons_beginner_goal: "تهدف هذه المرحلة إلى فهم أساسيات النماذج (صغير / متوسط / كبير)، وربط حجم النموذج باحتياج VRAM وRAM، ومعرفة أي كرت يناسبك للبداية.",
      lessons_beginner_steps: "ادخل إلى الحاسبة ← أدخل عدد المعاملات (مثلاً 7 أو 8 للنماذج الصغيرة) ← اختر مستوى الكوانتايز (مثل Q4 للتوازن) ← راجع تقدير VRAM وRAM ← قارن النتيجة مع جدول الهاردوير لمعرفة أي كرت يكفي.",
      lessons_intermediate_goal: "التركيز على المقارنة بين نماذج وكروت لاتخاذ قرار شراء أو ترقية. تفهم كيف تقارن VRAM والتكلفة والأداء قبل الشراء.",
      lessons_intermediate_steps: "استخدم مقارنة GPU لاختيار كرتين ومقارنة VRAM والتوصيات ← استخدم قسم «مقارنة النماذج» في نفس الصفحة لمقارنة نموذجين أو ثلاثة ← راجع صفحة التوصيات لنطاقات الأسعار والتجميعات المناسبة لمستواك.",
      lessons_expert_goal: "استغلال كل الأدوات معاً: الفلاتر، مقارنة النماذج، الحاسبة مع اختيار نموذج، و«أي نموذج يناسب كرتّي» لتحقيق أقصى استفادة من المنصة.",
      lessons_expert_steps: "في الحاسبة: اختر «نموذجاً» من القائمة لملء المعاملات والسياق تلقائياً ثم راجع التقدير ← في الهاردوير: اختر كرتك لترى قائمة النماذج المناسبة ← استخدم دليل النماذج مع الفلاتر ومقارنة النماذج لاختيار نموذج ثم ربطه بالعتاد والتوصيات.",
      recommendations_title: "توصيات العتاد",
      recommendations_subtitle: "تجميعات مقترحة حسب مستواك مع سعر تقريبي",
      calc_select_model: "اختر نموذجاً (اختياري)",
      calc_select_model_none: "— بدون نموذج —",
      btn_share: "نسخ الرابط",
      btn_share_done: "تم النسخ",
      footer_updated: "آخر تحديث: الأحد 1 مارس 2026",
      ask_title: "اسأل المنصة",
      ask_subtitle: "سيتم تفعيل المحادثة مع نموذج ذكاء اصطناعي عند توفر خادم آمن (لا مفتاح API في المتصفح).",
      aria_label_lang: "تبديل اللغة",
      aria_label_theme: "تبديل الوضع الليلي/النهاري",
      aria_label_menu: "فتح القائمة",
      skip_link: "انتقال للمحتوى",
      footer_credit: "Built and developed by: Eng:Abdulrahman",
      footer_contact: "Contact:",
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
      model_missing_id_title: "Missing model identifier",
      model_missing_id_message:
        "To open this page, use the models directory and pick a model, or append ‎?id=<MODEL_ID> to the URL.",
      model_not_found_title: "Model not found",
      model_not_found_message:
        "No model was found with this identifier. Make sure you used a valid link from the models directory.",
      model_load_error:
        "Failed to load model data. Please try again later or check your connection.",

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
      about_subtitle: "A technical portal to simplify choosing models & hardware — expandable",
      about_benefits_title: "Platform Benefits",
      about_benefits_1: "Helps you pick the right model based on your hardware and budget.",
      about_benefits_2: "Clear, practical requirements (VRAM/RAM) without complexity.",
      about_benefits_3: "Saves time by reducing trial-and-error and resource waste.",
      about_benefits_4: "Compares GPUs to choose the best option for local inference.",
      about_benefits_5: "A requirements calculator based on model size and quantization.",
      about_message_title: "Message to Users",
      about_message_text:
        "This platform is built to help you choose AI models and hardware with confidence. Today it runs as a fast, free static portal on GitHub Pages. Over time, we'll expand the database, add deeper recommendations, and once real inventory is available, we may launch a dedicated AI hardware store.",

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

      // stats
      stat_models: "AI Models",
      stat_gpus: "GPUs Listed",
      stat_quant: "Quantization Levels",
      stat_langs: "Languages Supported",

      // features
      features_title: "What We Offer",
      features_subtitle: "Practical tools to save time and make confident decisions",
      feat_models_title: "Models Directory",
      feat_models_desc: "Browse models with runtime requirements and smart filters",
      feat_calc_title: "Requirements Calculator",
      feat_calc_desc: "Estimate VRAM & RAM based on model size and quantization",
      feat_compare_title: "GPU Comparison",
      feat_compare_desc: "Compare GPUs and find the best fit for local inference",
      feat_hw_title: "Build Guidance",
      feat_hw_desc: "Practical hardware recommendations by model tier",
      feat_theme_title: "Dark/Light Mode",
      feat_theme_desc: "Professional design that adapts to your visual preference",
      feat_future_title: "Expandable",
      feat_future_desc: "Ready for an AI hardware store and admin dashboard",

      // footer
      footer_desc: "A specialized technical platform for understanding AI model requirements and matching them with the right infrastructure.",
      footer_nav: "Navigation",
      footer_tools: "Tools",
      footer_soon: "Coming Soon",
      footer_store: "Hardware Store",
      footer_api: "Developer API",
      footer_community: "Community",
      footer_rights: "All rights reserved.",

      empty: "No matching results.",
      loading: "Loading…",

      compare_models_title: "Compare Models",
      compare_models_subtitle: "Select two or three models to compare",
      compare_models_btn: "Compare Models",
      gpu_models_title: "Which models fit my GPU?",
      gpu_models_subtitle: "Select your GPU to see suitable models",
      gpu_models_select: "Select GPU",
      gpu_models_empty: "No models in the database fit this GPU.",
      nav_lessons: "Lessons",
      nav_recommendations: "Recommendations",
      nav_ask: "Ask",
      lessons_title: "Platform Lessons",
      lessons_subtitle: "Content by skill level",
      lessons_intro: "From beginner to expert: practical steps to choose models, estimate requirements, and compare hardware. Each level has its tools and a clear way to calculate.",
      lessons_beginner: "Beginner",
      lessons_how_calc: "How to calculate and benefit",
      lessons_tools: "Recommended tools",
      lessons_beginner_goal: "This level focuses on understanding model sizes (small / medium / large), linking model size to VRAM and RAM needs, and knowing which GPU is enough to start.",
      lessons_beginner_steps: "Open the calculator → Enter parameter count (e.g. 7 or 8 for small models) → Choose quantization (e.g. Q4 for balance) → Review VRAM and RAM estimate → Compare with the hardware table to see which GPU fits.",
      lessons_intermediate_goal: "Focus on comparing models and GPUs to decide on purchases or upgrades. You learn how to compare VRAM, cost, and performance before buying.",
      lessons_intermediate_steps: "Use GPU compare to pick two cards and compare VRAM and recommendations → Use the «Compare models» section on the same page to compare two or three models → Check the recommendations page for price ranges and builds for your level.",
      lessons_expert_goal: "Use all tools together: filters, model comparison, calculator with model selector, and «Which models fit my GPU» to get the most from the platform.",
      lessons_expert_steps: "In the calculator: select a model from the list to auto-fill parameters and context, then review the estimate → In hardware: select your GPU to see which models fit → Use the models directory with filters and model comparison, then link choices to hardware and recommendations.",
      recommendations_title: "Hardware Recommendations",
      recommendations_subtitle: "Suggested builds by level with approximate price",
      calc_select_model: "Select a model (optional)",
      calc_select_model_none: "— None —",
      btn_share: "Copy link",
      btn_share_done: "Copied",
      footer_updated: "Last updated: Sun 1 Mar 2026",
      ask_title: "Ask the Platform",
      ask_subtitle: "AI chat will be enabled when a secure backend is available (no API key in the browser).",
      aria_label_lang: "Toggle language",
      aria_label_theme: "Toggle dark/light mode",
      aria_label_menu: "Open menu",
      skip_link: "Skip to content",
      footer_credit: "Built and developed by: Eng:Abdulrahman",
      footer_contact: "Contact:",
    },
  };

  function getSavedLang() {
    const v = localStorage.getItem(STORAGE_KEY);
    return supported.includes(v) ? v : "ar";
  }

  function setLang(lang) {
    if (!supported.includes(lang)) return;
    localStorage.setItem(STORAGE_KEY, lang);
    location.reload();
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

  let initialized = false;

  function init() {
    apply();
    if (initialized) return;
    initialized = true;
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