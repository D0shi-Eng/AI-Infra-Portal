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
      footer_more: "المزيد",

      // ترتيب النماذج
      sort_label: "ترتيب حسب",
      sort_default: "الافتراضي",
      sort_name_asc: "الاسم (أ→ي)",
      sort_name_desc: "الاسم (ي→أ)",
      sort_params_asc: "الحجم (الأصغر)",
      sort_params_desc: "الحجم (الأكبر)",
      sort_vram_asc: "VRAM (الأقل)",
      sort_vram_desc: "VRAM (الأكثر)",

      // المفضلة
      fav_add: "إضافة للمفضلة",
      fav_remove: "إزالة من المفضلة",
      fav_filter_all: "الكل",
      fav_filter_favs: "المفضلة فقط",

      // مسار التنقل
      breadcrumb_home: "الرئيسية",
      breadcrumb_models: "النماذج",

      // ترقيم الصفحات
      pagination_prev: "السابق",
      pagination_next: "التالي",

      // نسخ المواصفات
      copy_specs: "نسخ المواصفات",
      copy_specs_done: "تم النسخ ✓",

      // ─── Auth — تسجيل الدخول ───
      auth_login: "تسجيل الدخول",
      auth_logout: "خروج",
      auth_login_title: "تسجيل الدخول",
      auth_google: "الدخول بـ Google",
      auth_or: "أو",
      auth_email_placeholder: "البريد الإلكتروني",
      auth_password_placeholder: "كلمة المرور",
      auth_email_login: "دخول بالبريد",
      auth_fill_fields: "يرجى تعبئة جميع الحقول",
      auth_error: "حدث خطأ أثناء تسجيل الدخول",
      auth_wrong_password: "كلمة المرور غير صحيحة",
      auth_invalid_email: "بريد إلكتروني غير صالح",
      auth_email_exists: "هذا البريد مسجل مسبقاً",
      auth_weak_password: "كلمة المرور ضعيفة (6 أحرف على الأقل)",
      auth_too_many: "محاولات كثيرة، حاول لاحقاً",
      auth_network_error: "خطأ في الاتصال",

      // ─── Nav — التنقل ───
      nav_guide: "المرشد",
      nav_learn: "تعلّم AI",
      nav_forum: "المنتدى",
      nav_pricing: "الاشتراك",

      // ─── Footer — التذييل ───
      footer_premium: "المميز",

      // ─── Guide — مرشد اختيار النموذج ───
      guide_title: "🧭 مرشد اختيار النموذج",
      guide_subtitle: "أجب على 4 أسئلة بسيطة وبنرشّح لك أفضل النماذج اللي تناسب احتياجاتك",
      guide_quick_title: "⚡ اختصارات سريعة",
      guide_quick_desc: "اضغط على السيناريو اللي يشبه حالتك واحصل على توصيات فورية",
      guide_wizard_title: "🎯 المرشد التفاعلي",
      guide_wizard_desc: "خلنا نساعدك تلاقي النموذج المثالي — أجب على الأسئلة التالية",
      guide_tips_title: "💡 نصائح ومفاهيم أساسية",
      guide_tips_desc: "معلومات مهمة تساعدك تفهم الفرق بين النماذج وتختار بذكاء",

      // ─── Learn — صفحة التعلّم ───
      learn_title: "تعلّم الذكاء الاصطناعي",
      learn_subtitle: "كورسات مجانية من أفضل الجامعات والمنصات — مجمّعة في مكان واحد",
      learn_search_placeholder: "ابحث عن كورس…",
      learn_all_levels: "جميع المستويات",
      learn_beginner: "مبتدئ",
      learn_intermediate: "متوسط",
      learn_advanced: "متقدم",
      learn_all_categories: "جميع التصنيفات",
      learn_cat_general: "عام",
      learn_cat_ml: "تعلم آلة",
      learn_cat_dl: "تعلم عميق",
      learn_cat_nlp: "معالجة لغة",
      learn_cat_cv: "رؤية حاسوب",
      learn_cat_llm: "نماذج لغوية",
      learn_cat_image: "توليد صور",
      learn_cat_rl: "تعلم معزز",
      learn_free: "مجاني",
      learn_open_course: "فتح الكورس",
      learn_no_results: "لا توجد كورسات مطابقة",

      // ─── Forum — المنتدى ───
      forum_title: "منتدى المجتمع",
      forum_subtitle: "شارك أفكارك واسأل أسئلتك — حصري للمشتركين",
      forum_new_post: "موضوع جديد",
      forum_all: "الكل",
      forum_cat_general: "عام",
      forum_cat_technical: "تقني",
      forum_cat_projects: "مشاريع",
      forum_cat_requests: "طلبات",
      forum_sort_newest: "الأحدث",
      forum_sort_popular: "الأكثر تفاعلاً",
      forum_no_posts: "لا توجد مواضيع بعد. كن أول من يكتب!",
      forum_post_title_placeholder: "عنوان الموضوع",
      forum_post_body_placeholder: "اكتب محتوى الموضوع…",
      forum_submit: "نشر",
      forum_cancel: "إلغاء",
      forum_err_title_short: "العنوان قصير جداً (3 أحرف على الأقل)",
      forum_err_body_short: "المحتوى قصير جداً (10 أحرف على الأقل)",
      forum_err_submit: "حدث خطأ أثناء النشر",
      forum_err_load: "حدث خطأ أثناء تحميل المواضيع",
      forum_replies: "الردود",
      forum_reply_btn: "ردّ",
      forum_reply_placeholder: "اكتب ردّك…",
      forum_close: "إغلاق",

      // ─── Ask AI — اسأل المنصة ───
      ask_subtitle_new: "تحدّث مع مساعد ذكي يعرف كل شيء عن البنية التحتية للذكاء الاصطناعي",
      ask_chat_title: "مساعد AI INFRA",
      ask_clear: "مسح المحادثة",
      ask_input_placeholder: "اكتب سؤالك هنا…",
      ask_send: "إرسال",
      ask_welcome: "مرحباً! أنا مساعد AI INFRA. اسألني عن النماذج، الهاردوير، أو أي شيء يخص الذكاء الاصطناعي.",
      ask_cleared: "تم مسح المحادثة",
      ask_error: "حدث خطأ. حاول مرة أخرى.",

      // ─── Paywall — حاجز الاشتراك ───
      paywall_title: "محتوى حصري للمشتركين",
      paywall_desc: "اشترك للوصول إلى المنتدى ومساعد AI والمحتوى الحصري",
      paywall_login: "تسجيل الدخول",
      paywall_subscribe: "اشترك الآن",
      paywall_price_hint: "يبدأ من 19 ر.س/شهر",

      // ─── Pricing — الأسعار ───
      pricing_title: "خطط الاشتراك",
      pricing_subtitle: "اختر الخطة المناسبة لك وابدأ الاستفادة من كل الأدوات",
      pricing_free_title: "مجاني",
      pricing_monthly_title: "شهري",
      pricing_yearly_title: "سنوي",
      pricing_currency: "ر.س",
      pricing_per_month: "/شهر",
      pricing_per_year: "/سنة",
      pricing_equiv: "≈ 8.25 ر.س/شهر",
      pricing_popular: "الأكثر شعبية",
      pricing_save: "وفّر 57%",
      pricing_free_f1: "دليل النماذج كامل",
      pricing_free_f2: "حاسبة المتطلبات",
      pricing_free_f3: "مقارنة كروت الشاشة",
      pricing_free_f4: "إرشادات الهاردوير",
      pricing_free_f5: "صفحة تعلّم AI",
      pricing_pro_f1: "كل مزايا المجاني",
      pricing_pro_f2: "المنتدى الحصري",
      pricing_pro_f3: "اسأل المنصة (AI)",
      pricing_pro_f4: "دعم أولوية",
      pricing_pro_f5: "محتوى حصري",
      pricing_free_btn: "ابدأ مجاناً",
      pricing_subscribe_monthly: "اشترك شهرياً",
      pricing_subscribe_yearly: "اشترك سنوياً",
      pricing_coming_soon: "نظام الدفع قيد التجهيز — سيتم تفعيله قريباً!",
      pricing_payment_success: "تم الاشتراك بنجاح! 🎉 مرحباً بك في مجتمع AI INFRA",
      pricing_payment_cancel: "تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى.",
      pricing_free_f6: "✖ المنتدى",
      pricing_free_f7: "✖ اسأل AI",
      pricing_faq_title: "الأسئلة الشائعة",
      pricing_faq_q1: "كيف أشترك؟",
      pricing_faq_a1: "سجّل دخولك بـ Google أو بريدك الإلكتروني، ثم اختر خطة الاشتراك المناسبة وأكمل الدفع بأمان.",
      pricing_faq_q2: "هل يمكنني إلغاء الاشتراك؟",
      pricing_faq_a2: "نعم، يمكنك إلغاء اشتراكك في أي وقت. ستستمر في الوصول حتى نهاية الفترة المدفوعة.",
      pricing_faq_q3: "ما المحتوى الحصري؟",
      pricing_faq_a3: "يشمل الوصول إلى المنتدى، مساعد AI للإجابة عن أسئلتك، ومحتوى تعليمي متقدم.",
      pricing_faq_q4: "هل الدفع آمن؟",
      pricing_faq_a4: "نستخدم بوابات دفع موثوقة ومشفرة. لا نحتفظ ببيانات بطاقتك على خوادمنا.",
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
      footer_more: "More",

      // Sort
      sort_label: "Sort by",
      sort_default: "Default",
      sort_name_asc: "Name (A→Z)",
      sort_name_desc: "Name (Z→A)",
      sort_params_asc: "Size (Smallest)",
      sort_params_desc: "Size (Largest)",
      sort_vram_asc: "VRAM (Lowest)",
      sort_vram_desc: "VRAM (Highest)",

      // Favorites
      fav_add: "Add to favorites",
      fav_remove: "Remove from favorites",
      fav_filter_all: "All",
      fav_filter_favs: "Favorites only",

      // Breadcrumb
      breadcrumb_home: "Home",
      breadcrumb_models: "Models",

      // Pagination
      pagination_prev: "Previous",
      pagination_next: "Next",

      // Copy specs
      copy_specs: "Copy specs",
      copy_specs_done: "Copied ✓",

      // ─── Auth ───
      auth_login: "Sign In",
      auth_logout: "Logout",
      auth_login_title: "Sign In",
      auth_google: "Sign in with Google",
      auth_or: "or",
      auth_email_placeholder: "Email address",
      auth_password_placeholder: "Password",
      auth_email_login: "Sign in with Email",
      auth_fill_fields: "Please fill in all fields",
      auth_error: "An error occurred during sign in",
      auth_wrong_password: "Incorrect password",
      auth_invalid_email: "Invalid email address",
      auth_email_exists: "This email is already registered",
      auth_weak_password: "Weak password (at least 6 characters)",
      auth_too_many: "Too many attempts, try again later",
      auth_network_error: "Network error",

      // ─── Nav ───
      nav_guide: "Guide",
      nav_learn: "Learn AI",
      nav_forum: "Forum",
      nav_pricing: "Pricing",

      // ─── Footer ───
      footer_premium: "Premium",

      // ─── Guide ───
      guide_title: "🧭 Model Finder Guide",
      guide_subtitle: "Answer 4 simple questions and we'll recommend the best models for you",
      guide_quick_title: "⚡ Quick Shortcuts",
      guide_quick_desc: "Click on a scenario that matches your situation and get instant recommendations",
      guide_wizard_title: "🎯 Interactive Guide",
      guide_wizard_desc: "Let us help you find the perfect model — answer the following questions",
      guide_tips_title: "💡 Tips & Key Concepts",
      guide_tips_desc: "Important info to help you understand the differences between models and choose wisely",

      // ─── Learn ───
      learn_title: "Learn Artificial Intelligence",
      learn_subtitle: "Free courses from top universities and platforms — all in one place",
      learn_search_placeholder: "Search for a course…",
      learn_all_levels: "All Levels",
      learn_beginner: "Beginner",
      learn_intermediate: "Intermediate",
      learn_advanced: "Advanced",
      learn_all_categories: "All Categories",
      learn_cat_general: "General",
      learn_cat_ml: "Machine Learning",
      learn_cat_dl: "Deep Learning",
      learn_cat_nlp: "NLP",
      learn_cat_cv: "Computer Vision",
      learn_cat_llm: "LLMs",
      learn_cat_image: "Image Generation",
      learn_cat_rl: "Reinforcement Learning",
      learn_free: "Free",
      learn_open_course: "Open Course",
      learn_no_results: "No matching courses found",

      // ─── Forum ───
      forum_title: "Community Forum",
      forum_subtitle: "Share ideas and ask questions — exclusive for subscribers",
      forum_new_post: "New Post",
      forum_all: "All",
      forum_cat_general: "General",
      forum_cat_technical: "Technical",
      forum_cat_projects: "Projects",
      forum_cat_requests: "Requests",
      forum_sort_newest: "Newest",
      forum_sort_popular: "Most Popular",
      forum_no_posts: "No posts yet. Be the first to write!",
      forum_post_title_placeholder: "Post title",
      forum_post_body_placeholder: "Write your post content…",
      forum_submit: "Publish",
      forum_cancel: "Cancel",
      forum_err_title_short: "Title too short (at least 3 characters)",
      forum_err_body_short: "Content too short (at least 10 characters)",
      forum_err_submit: "An error occurred while publishing",
      forum_err_load: "An error occurred while loading posts",
      forum_replies: "Replies",
      forum_reply_btn: "Reply",
      forum_reply_placeholder: "Write your reply…",
      forum_close: "Close",

      // ─── Ask AI ───
      ask_subtitle_new: "Chat with a smart assistant that knows everything about AI infrastructure",
      ask_chat_title: "AI INFRA Assistant",
      ask_clear: "Clear Chat",
      ask_input_placeholder: "Type your question here…",
      ask_send: "Send",
      ask_welcome: "Hello! I'm the AI INFRA assistant. Ask me about models, hardware, or anything AI-related.",
      ask_cleared: "Chat cleared",
      ask_error: "An error occurred. Please try again.",

      // ─── Paywall ───
      paywall_title: "Exclusive Content for Subscribers",
      paywall_desc: "Subscribe to access the forum, AI assistant, and exclusive content",
      paywall_login: "Sign In",
      paywall_subscribe: "Subscribe Now",
      paywall_price_hint: "Starting from 19 SAR/month",

      // ─── Pricing ───
      pricing_title: "Subscription Plans",
      pricing_subtitle: "Choose the right plan and unlock all tools",
      pricing_free_title: "Free",
      pricing_monthly_title: "Monthly",
      pricing_yearly_title: "Yearly",
      pricing_currency: "SAR",
      pricing_per_month: "/month",
      pricing_per_year: "/year",
      pricing_equiv: "≈ 8.25 SAR/month",
      pricing_popular: "Most Popular",
      pricing_save: "Save 57%",
      pricing_free_f1: "Full Models Directory",
      pricing_free_f2: "Requirements Calculator",
      pricing_free_f3: "GPU Comparison",
      pricing_free_f4: "Hardware Guidance",
      pricing_free_f5: "Learn AI Page",
      pricing_pro_f1: "All Free features",
      pricing_pro_f2: "Exclusive Forum",
      pricing_pro_f3: "Ask the Platform (AI)",
      pricing_pro_f4: "Priority Support",
      pricing_pro_f5: "Exclusive Content",
      pricing_free_btn: "Start Free",
      pricing_subscribe_monthly: "Subscribe Monthly",
      pricing_subscribe_yearly: "Subscribe Yearly",
      pricing_coming_soon: "Payment system is being set up — coming soon!",
      pricing_payment_success: "Subscription activated! 🎉 Welcome to AI INFRA community",
      pricing_payment_cancel: "Payment was cancelled. You can try again.",
      pricing_free_f6: "✖ Forum",
      pricing_free_f7: "✖ Ask AI",
      pricing_faq_title: "Frequently Asked Questions",
      pricing_faq_q1: "How do I subscribe?",
      pricing_faq_a1: "Sign in with Google or email, then choose a plan and complete the secure payment.",
      pricing_faq_q2: "Can I cancel my subscription?",
      pricing_faq_a2: "Yes, you can cancel anytime. You'll retain access until the end of the paid period.",
      pricing_faq_q3: "What is exclusive content?",
      pricing_faq_a3: "It includes access to the forum, AI assistant for answering your questions, and advanced educational content.",
      pricing_faq_q4: "Is payment secure?",
      pricing_faq_a4: "We use trusted and encrypted payment gateways. Your card details are never stored on our servers.",
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