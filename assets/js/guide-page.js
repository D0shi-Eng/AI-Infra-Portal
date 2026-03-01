/**
 * guide-page.js — مرشد اختيار النموذج التفاعلي
 * ================================================
 * ويزارد ذكي من 4 خطوات يحلل احتياجات المستخدم
 * ويرشّح أفضل النماذج بنسبة تطابق مئوية
 */

const GuidePage = (() => {
  // ─── البيانات ───
  let allModels = [];
  let currentStep = 0;
  const totalSteps = 4;

  // اختيارات المستخدم
  const userChoices = {
    useCase: null,      // الاستخدام
    priority: null,     // الأولوية
    hardware: null,     // الجهاز
    language: null      // اللغة
  };

  // ─── حالات الاستخدام ───
  const useCases = [
    { id: "writing",   icon: "✍️",  ar: "كتابة نصوص ومقالات",    en: "Writing & Articles",     types: ["LLM"], modalities: ["Text", "Multi"] },
    { id: "coding",    icon: "💻",  ar: "برمجة وكتابة أكواد",     en: "Coding & Development",   types: ["LLM", "Code LLM"], modalities: ["Text", "Multi"] },
    { id: "chat",      icon: "💬",  ar: "محادثة ومساعد ذكي",      en: "Chat & Assistant",       types: ["LLM"], modalities: ["Text", "Multi"] },
    { id: "reasoning", icon: "🧠",  ar: "تحليل ومنطق متقدم",      en: "Reasoning & Analysis",   types: ["LLM"], modalities: ["Text", "Multi"] },
    { id: "image",     icon: "🎨",  ar: "توليد صور",              en: "Image Generation",       types: ["Image Gen"], modalities: ["Image"] },
    { id: "video",     icon: "🎬",  ar: "توليد فيديو",            en: "Video Generation",       types: ["Video Gen"], modalities: ["Video"] },
    { id: "vision",    icon: "👁️",  ar: "تحليل وفهم الصور",       en: "Vision & Image Analysis",types: ["Vision LLM", "Vision"], modalities: ["Multi", "Image"] },
    { id: "audio",     icon: "🎙️",  ar: "صوت (تحويل/توليد)",      en: "Audio (TTS/ASR)",        types: ["TTS", "ASR", "Audio LLM", "Music Gen"], modalities: ["Audio"] },
    { id: "embedding", icon: "📐",  ar: "تضمينات نصية (Embeddings)", en: "Text Embeddings",     types: ["Embedding"], modalities: ["Text"] },
    { id: "multi",     icon: "🔀",  ar: "متعدد المهام (كل شيء)",   en: "Multi-purpose (All)",    types: ["LLM"], modalities: ["Multi"] }
  ];

  // ─── الأولويات ───
  const priorities = [
    { id: "quality",   icon: "🏆", ar: "أعلى جودة وذكاء",       en: "Best Quality & Intelligence", desc_ar: "أريد أفضل نتائج بغض النظر عن السعر أو السرعة", desc_en: "Best results regardless of cost or speed" },
    { id: "speed",     icon: "⚡", ar: "سرعة في الاستجابة",      en: "Fast Response Time",          desc_ar: "أحتاج ردود سريعة حتى لو تنازلت قليلاً عن الجودة", desc_en: "Need fast responses even with slight quality tradeoff" },
    { id: "cost",      icon: "💰", ar: "أقل تكلفة (مجاني/رخيص)", en: "Lowest Cost (Free/Cheap)",    desc_ar: "أبي شيء مجاني أو رخيص يخلص الشغل", desc_en: "Free or cheap solution that gets the job done" },
    { id: "privacy",   icon: "🔒", ar: "خصوصية (تشغيل محلي)",    en: "Privacy (Run Locally)",       desc_ar: "أبي أشغل النموذج على جهازي بدون إنترنت", desc_en: "Run model on my device without internet" },
    { id: "balanced",  icon: "⚖️", ar: "توازن بين الكل",         en: "Balanced (All-around)",       desc_ar: "أبي شيء متوازن بين الجودة والسرعة والسعر", desc_en: "Good balance of quality, speed, and cost" }
  ];

  // ─── مستويات الهاردوير ───
  const hardwareLevels = [
    { id: "no_gpu",     icon: "🖥️", ar: "بدون GPU (CPU فقط)",           en: "No GPU (CPU only)",          maxVram: 0,  maxRam: 16 },
    { id: "low_gpu",    icon: "🎮", ar: "GPU خفيف (8GB VRAM أو أقل)",   en: "Light GPU (≤ 8GB VRAM)",     maxVram: 8,  maxRam: 16 },
    { id: "mid_gpu",    icon: "🔥", ar: "GPU متوسط (12-24GB VRAM)",     en: "Mid GPU (12-24GB VRAM)",     maxVram: 24, maxRam: 32 },
    { id: "high_gpu",   icon: "🚀", ar: "GPU قوي (48GB+ VRAM)",         en: "High GPU (48GB+ VRAM)",      maxVram: 999, maxRam: 128 },
    { id: "cloud",      icon: "☁️",  ar: "API سحابي (ما أبي أشغل محلي)", en: "Cloud API (no local setup)", maxVram: null, maxRam: null }
  ];

  // ─── اللغة المطلوبة ───
  const languageOptions = [
    { id: "ar_required", icon: "🇸🇦", ar: "العربية ضرورية",         en: "Arabic is required",    requiresAR: true },
    { id: "en_only",     icon: "🇺🇸", ar: "الإنجليزية كافية",       en: "English is enough",     requiresAR: false },
    { id: "multi",       icon: "🌍", ar: "متعدد اللغات",            en: "Multilingual",          requiresAR: false }
  ];

  // ─── سيناريوهات سريعة ───
  const quickScenarios = [
    { icon: "📝", ar: "أبي أكتب مقالات ومحتوى",           en: "I want to write articles",         choices: { useCase: "writing",   priority: "quality",  hardware: "cloud",   language: "ar_required" } },
    { icon: "💻", ar: "أبي أبرمج ويساعدني في الكود",       en: "I want coding assistance",          choices: { useCase: "coding",    priority: "quality",  hardware: "cloud",   language: "en_only" } },
    { icon: "🎨", ar: "أبي أصمم صور بالذكاء الاصطناعي",    en: "I want to generate AI images",      choices: { useCase: "image",     priority: "quality",  hardware: "cloud",   language: "en_only" } },
    { icon: "🔒", ar: "أبي نموذج يشتغل على جهازي (خصوصية)", en: "I want a private local model",      choices: { useCase: "chat",      priority: "privacy",  hardware: "mid_gpu", language: "en_only" } },
    { icon: "💰", ar: "أبي أرخص خيار ممكن",                en: "I want the cheapest option",        choices: { useCase: "chat",      priority: "cost",     hardware: "cloud",   language: "en_only" } },
    { icon: "🧠", ar: "أبي أقوى نموذج للتحليل والمنطق",    en: "I want the smartest reasoning model",choices: { useCase: "reasoning", priority: "quality",  hardware: "cloud",   language: "en_only" } },
    { icon: "🎬", ar: "أبي أولّد فيديوهات",                en: "I want to generate videos",         choices: { useCase: "video",     priority: "quality",  hardware: "high_gpu",language: "en_only" } },
    { icon: "🗣️", ar: "أبي تحويل صوت لنص أو العكس",       en: "I want speech-to-text or TTS",      choices: { useCase: "audio",     priority: "balanced", hardware: "cloud",   language: "ar_required" } }
  ];

  // ═══════════════════════════════════════════════════════════
  // خوارزمية تسجيل النقاط (Scoring Algorithm)
  // ═══════════════════════════════════════════════════════════

  function scoreModel(model) {
    let score = 0;
    let maxScore = 0;
    const lang = I18N ? I18N.current() : "ar";

    // 1. تطابق نوع الاستخدام (40 نقطة)
    maxScore += 40;
    const uc = useCases.find(u => u.id === userChoices.useCase);
    if (uc) {
      if (uc.types.includes(model.type)) score += 30;
      // مكافأة إضافية لتطابق الوسائط
      if (model.modalities && uc.modalities.some(m => model.modalities.includes(m))) score += 10;
    }

    // 2. الأولوية (30 نقطة)
    maxScore += 30;
    switch (userChoices.priority) {
      case "quality":
        // النماذج الكبيرة أو المغلقة من شركات كبرى
        if (!model.open && ["OpenAI", "Anthropic", "Google"].includes(model.provider)) score += 30;
        else if (model.paramsB && model.paramsB >= 70) score += 25;
        else if (model.paramsB && model.paramsB >= 30) score += 15;
        else if (!model.open) score += 20;
        else score += 10;
        break;
      case "speed":
        // النماذج الصغيرة أو المصممة للسرعة
        if (model.paramsB && model.paramsB <= 8) score += 30;
        else if (model.paramsB && model.paramsB <= 14) score += 25;
        else if (model.name.toLowerCase().includes("mini") || model.name.toLowerCase().includes("flash")) score += 28;
        else if (!model.paramsB && !model.open) score += 15; // API — سرعتها تعتمد على السيرفر
        else score += 5;
        break;
      case "cost":
        // النماذج المفتوحة أو المجانية
        if (model.open && model.license !== "Commercial") score += 30;
        else if (model.open) score += 25;
        else if (model.name.toLowerCase().includes("mini") || model.name.toLowerCase().includes("flash")) score += 15;
        else score += 5;
        break;
      case "privacy":
        // النماذج المفتوحة اللي تشتغل محلي
        if (model.open && model.paramsB) score += 30;
        else if (model.open) score += 20;
        else score += 0; // النماذج المغلقة ما تشتغل محلي
        break;
      case "balanced":
        if (model.open && model.paramsB && model.paramsB >= 7 && model.paramsB <= 30) score += 28;
        else if (!model.open && (model.name.toLowerCase().includes("mini") || model.name.toLowerCase().includes("flash"))) score += 25;
        else if (model.open) score += 18;
        else score += 12;
        break;
    }

    // 3. توافق الهاردوير (20 نقطة)
    maxScore += 20;
    const hw = hardwareLevels.find(h => h.id === userChoices.hardware);
    if (hw) {
      if (hw.id === "cloud") {
        // المستخدم يبي API — النماذج المغلقة أفضل
        if (!model.open) score += 20;
        else score += 10; // المفتوحة متاحة عبر API أيضاً
      } else if (hw.id === "no_gpu") {
        // بدون GPU — فقط النماذج الصغيرة جداً
        if (model.open && model.paramsB && model.paramsB <= 3) score += 20;
        else if (model.open && model.minRamGb && model.minRamGb <= hw.maxRam) score += 15;
        else if (model.open && model.paramsB && model.paramsB <= 7) score += 10;
        else score += 0;
      } else {
        // عنده GPU
        if (model.open && model.minVramGb && model.minVramGb <= hw.maxVram) score += 20;
        else if (model.open && model.recommendedVramGb && model.recommendedVramGb <= hw.maxVram) score += 18;
        else if (model.open && model.paramsB) {
          // تقدير VRAM تقريبي: params * 2 (FP16)
          const estVram = model.paramsB * 2;
          if (estVram <= hw.maxVram) score += 16;
          else if (estVram <= hw.maxVram * 1.5) score += 8; // ممكن بالكميّة (quantization)
          else score += 0;
        } else if (!model.open) {
          score += 5; // النماذج المغلقة ما تشتغل محلي
        }
      }
    }

    // 4. دعم اللغة (10 نقاط)
    maxScore += 10;
    const langPref = languageOptions.find(l => l.id === userChoices.language);
    if (langPref) {
      if (langPref.requiresAR) {
        if (model.languages && model.languages.includes("AR")) score += 10;
        else score += 0; // ما يدعم عربي = 0
      } else {
        score += 10; // الإنجليزية أو متعدد = كل النماذج مقبولة
      }
    }

    // حساب النسبة المئوية
    return Math.round((score / maxScore) * 100);
  }

  // ═══════════════════════════════════════════════════════════
  // بناء الواجهة
  // ═══════════════════════════════════════════════════════════

  function getLang() {
    return (typeof I18N !== "undefined" && I18N.current) ? I18N.current() : "ar";
  }

  function t(key) {
    if (typeof I18N !== "undefined" && I18N.t) return I18N.t(key);
    return key;
  }

  // ─── بناء الويزارد ───
  function buildWizard() {
    const wizard = document.getElementById("guideWizard");
    if (!wizard) return;

    const lang = getLang();
    const isAr = lang === "ar";

    // شريط التقدم
    const progressHTML = `
      <div class="wizard-progress">
        <div class="wizard-progress-bar">
          <div class="wizard-progress-fill" id="wizardProgressFill" style="width: ${((currentStep + 1) / totalSteps) * 100}%"></div>
        </div>
        <div class="wizard-steps-indicator">
          ${Array.from({ length: totalSteps }, (_, i) => `
            <div class="wizard-step-dot ${i <= currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}" data-step="${i}">
              <span class="dot-number">${i < currentStep ? '✓' : i + 1}</span>
              <span class="dot-label">${getStepLabel(i, isAr)}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // محتوى الخطوة الحالية
    let stepContent = "";
    switch (currentStep) {
      case 0: stepContent = buildStep1(isAr); break;
      case 1: stepContent = buildStep2(isAr); break;
      case 2: stepContent = buildStep3(isAr); break;
      case 3: stepContent = buildStep4(isAr); break;
    }

    wizard.innerHTML = progressHTML + `
      <div class="wizard-step-container" id="wizardStepContent">
        ${stepContent}
      </div>
    `;

    // ربط الأحداث
    attachStepEvents();
  }

  function getStepLabel(step, isAr) {
    const labels = isAr
      ? ["الاستخدام", "الأولوية", "الجهاز", "اللغة"]
      : ["Use Case", "Priority", "Hardware", "Language"];
    return labels[step];
  }

  // ─── الخطوة 1: الاستخدام ───
  function buildStep1(isAr) {
    return `
      <div class="wizard-step fade-in">
        <h2 class="wizard-question">${isAr ? "🎯 وش تبي تسوي بالنموذج؟" : "🎯 What do you want to do with the model?"}</h2>
        <p class="wizard-hint">${isAr ? "اختر المهمة الأساسية اللي تبي النموذج يسويها" : "Choose the primary task you need the model for"}</p>
        <div class="wizard-options-grid">
          ${useCases.map(uc => `
            <button class="wizard-option-card ${userChoices.useCase === uc.id ? 'selected' : ''}" data-choice="useCase" data-value="${uc.id}">
              <span class="option-icon">${uc.icon}</span>
              <span class="option-label">${isAr ? uc.ar : uc.en}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  // ─── الخطوة 2: الأولوية ───
  function buildStep2(isAr) {
    return `
      <div class="wizard-step fade-in">
        <h2 class="wizard-question">${isAr ? "⚖️ وش أهم شيء لك؟" : "⚖️ What matters most to you?"}</h2>
        <p class="wizard-hint">${isAr ? "اختر الأولوية اللي تهمك أكثر" : "Choose your top priority"}</p>
        <div class="wizard-options-list">
          ${priorities.map(p => `
            <button class="wizard-option-row ${userChoices.priority === p.id ? 'selected' : ''}" data-choice="priority" data-value="${p.id}">
              <span class="option-icon">${p.icon}</span>
              <div class="option-text">
                <span class="option-label">${isAr ? p.ar : p.en}</span>
                <span class="option-desc">${isAr ? p.desc_ar : p.desc_en}</span>
              </div>
              <span class="option-check">${userChoices.priority === p.id ? '✓' : ''}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  // ─── الخطوة 3: الهاردوير ───
  function buildStep3(isAr) {
    return `
      <div class="wizard-step fade-in">
        <h2 class="wizard-question">${isAr ? "💻 وش جهازك؟" : "💻 What's your hardware?"}</h2>
        <p class="wizard-hint">${isAr ? "اختر أقرب وصف لجهازك — يساعدنا نرشح نماذج تشتغل عندك" : "Choose the closest description — helps us recommend compatible models"}</p>
        <div class="wizard-options-list">
          ${hardwareLevels.map(h => `
            <button class="wizard-option-row ${userChoices.hardware === h.id ? 'selected' : ''}" data-choice="hardware" data-value="${h.id}">
              <span class="option-icon">${h.icon}</span>
              <div class="option-text">
                <span class="option-label">${isAr ? h.ar : h.en}</span>
              </div>
              <span class="option-check">${userChoices.hardware === h.id ? '✓' : ''}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  // ─── الخطوة 4: اللغة ───
  function buildStep4(isAr) {
    return `
      <div class="wizard-step fade-in">
        <h2 class="wizard-question">${isAr ? "🌍 تحتاج دعم عربي؟" : "🌍 Do you need Arabic support?"}</h2>
        <p class="wizard-hint">${isAr ? "بعض النماذج ما تدعم العربية — خلنا نصفّيها لك" : "Some models don't support Arabic — let us filter for you"}</p>
        <div class="wizard-options-grid wizard-options-3col">
          ${languageOptions.map(l => `
            <button class="wizard-option-card ${userChoices.language === l.id ? 'selected' : ''}" data-choice="language" data-value="${l.id}">
              <span class="option-icon">${l.icon}</span>
              <span class="option-label">${isAr ? l.ar : l.en}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  // ─── ربط أحداث الخطوة ───
  function attachStepEvents() {
    document.querySelectorAll("[data-choice]").forEach(btn => {
      btn.addEventListener("click", function () {
        const choice = this.dataset.choice;
        const value = this.dataset.value;
        userChoices[choice] = value;

        // تحديث الأزرار المحددة
        this.closest(".wizard-options-grid, .wizard-options-list")
          .querySelectorAll("[data-choice]").forEach(b => b.classList.remove("selected"));
        this.classList.add("selected");

        // انتقال تلقائي للخطوة التالية بعد 400ms
        setTimeout(() => {
          if (currentStep < totalSteps - 1) {
            currentStep++;
            buildWizard();
          } else {
            showResults();
          }
        }, 400);
      });
    });
  }

  // ─── عرض النتائج ───
  function showResults() {
    const wizard = document.getElementById("guideWizard");
    if (!wizard) return;

    const lang = getLang();
    const isAr = lang === "ar";

    // تسجيل النقاط لكل نموذج
    const scored = allModels
      .map(m => ({ model: m, score: scoreModel(m) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12); // أفضل 12

    const top3 = scored.slice(0, 3);
    const rest = scored.slice(3);

    wizard.innerHTML = `
      <div class="wizard-results fade-in">
        <div class="results-header">
          <h2>${isAr ? "🎉 النماذج المرشّحة لك" : "🎉 Recommended Models for You"}</h2>
          <p>${isAr ? "بناءً على اختياراتك — هذي أفضل النماذج اللي تناسبك" : "Based on your choices — here are the best models for you"}</p>
          <button class="wizard-restart-btn" id="wizardRestart">
            ${isAr ? "🔄 أعد الاختيار" : "🔄 Start Over"}
          </button>
        </div>

        ${top3.length > 0 ? `
          <div class="results-podium">
            ${top3.map((item, i) => buildResultCard(item, i, isAr, true)).join("")}
          </div>
        ` : `<p class="no-results">${isAr ? "ما لقينا نماذج مطابقة — جرب تغيير الاختيارات" : "No matching models found — try different choices"}</p>`}

        ${rest.length > 0 ? `
          <h3 class="results-more-title">${isAr ? "خيارات إضافية" : "More Options"}</h3>
          <div class="results-grid">
            ${rest.map((item, i) => buildResultCard(item, i + 3, isAr, false)).join("")}
          </div>
        ` : ""}

        <div class="results-summary">
          <h3>${isAr ? "📋 ملخص اختياراتك" : "📋 Your Choices Summary"}</h3>
          <div class="summary-tags">
            ${buildSummaryTag(isAr)}
          </div>
        </div>
      </div>
    `;

    // ربط زر إعادة البداية
    document.getElementById("wizardRestart")?.addEventListener("click", () => {
      Object.keys(userChoices).forEach(k => userChoices[k] = null);
      currentStep = 0;
      buildWizard();
      window.scrollTo({ top: document.getElementById("guideWizard").offsetTop - 100, behavior: "smooth" });
    });

    // تأثير الظهور المتتابع
    wizard.querySelectorAll(".result-card").forEach((card, i) => {
      card.style.animationDelay = `${i * 0.1}s`;
    });
  }

  // ─── بناء بطاقة نتيجة ───
  function buildResultCard(item, index, isAr, isPodium) {
    const m = item.model;
    const score = item.score;
    const medals = ["🥇", "🥈", "🥉"];
    const medal = index < 3 ? medals[index] : "";
    const scoreColor = score >= 80 ? "high" : score >= 50 ? "mid" : "low";

    const typeBadge = m.type || "";
    const openBadge = m.open
      ? (isAr ? "مفتوح المصدر" : "Open Source")
      : (isAr ? "مغلق" : "Closed");

    return `
      <div class="result-card ${isPodium ? 'podium-card' : ''} fade-in-up" data-rank="${index + 1}">
        ${medal ? `<span class="result-medal">${medal}</span>` : ""}
        <div class="result-score-ring score-${scoreColor}">
          <svg viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="var(--ring-bg)" stroke-width="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="var(--ring-color)" stroke-width="3"
              stroke-dasharray="${score}, 100" stroke-linecap="round" />
          </svg>
          <span class="score-text">${score}%</span>
        </div>
        <h3 class="result-name">${m.name}</h3>
        <span class="result-provider">${m.provider}</span>
        <div class="result-badges">
          <span class="badge badge-type">${typeBadge}</span>
          <span class="badge ${m.open ? 'badge-open' : 'badge-closed'}">${openBadge}</span>
          ${m.paramsB ? `<span class="badge badge-params">${m.paramsB}B</span>` : ""}
          ${m.contextK ? `<span class="badge badge-ctx">${m.contextK}K ctx</span>` : ""}
        </div>
        ${m.notes ? `<p class="result-notes">${m.notes}</p>` : ""}
        <a href="model.html?id=${m.id}" class="result-link">${isAr ? "عرض التفاصيل →" : "View Details →"}</a>
      </div>
    `;
  }

  // ─── ملخص الاختيارات ───
  function buildSummaryTag(isAr) {
    const tags = [];
    const uc = useCases.find(u => u.id === userChoices.useCase);
    const pr = priorities.find(p => p.id === userChoices.priority);
    const hw = hardwareLevels.find(h => h.id === userChoices.hardware);
    const ln = languageOptions.find(l => l.id === userChoices.language);

    if (uc) tags.push(`${uc.icon} ${isAr ? uc.ar : uc.en}`);
    if (pr) tags.push(`${pr.icon} ${isAr ? pr.ar : pr.en}`);
    if (hw) tags.push(`${hw.icon} ${isAr ? hw.ar : hw.en}`);
    if (ln) tags.push(`${ln.icon} ${isAr ? ln.ar : ln.en}`);

    return tags.map(t => `<span class="summary-tag">${t}</span>`).join("");
  }

  // ═══════════════════════════════════════════════════════════
  // السيناريوهات السريعة
  // ═══════════════════════════════════════════════════════════

  function buildQuickScenarios() {
    const container = document.getElementById("quickScenarios");
    if (!container) return;

    const isAr = getLang() === "ar";

    container.innerHTML = quickScenarios.map((s, i) => `
      <button class="scenario-card" data-scenario="${i}">
        <span class="scenario-icon">${s.icon}</span>
        <span class="scenario-text">${isAr ? s.ar : s.en}</span>
        <span class="scenario-arrow">${isAr ? "←" : "→"}</span>
      </button>
    `).join("");

    container.querySelectorAll(".scenario-card").forEach(card => {
      card.addEventListener("click", function () {
        const idx = parseInt(this.dataset.scenario);
        const scenario = quickScenarios[idx];

        // تعبئة الاختيارات
        Object.assign(userChoices, scenario.choices);
        currentStep = totalSteps; // تخطي الويزارد

        // عرض النتائج مباشرة
        showResults();
        window.scrollTo({ top: document.getElementById("guideWizard").offsetTop - 100, behavior: "smooth" });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // نصائح تفاعلية
  // ═══════════════════════════════════════════════════════════

  function buildTips() {
    const container = document.getElementById("guideTips");
    if (!container) return;

    const isAr = getLang() === "ar";

    const tips = isAr ? [
      { icon: "💡", title: "مفتوح vs مغلق", text: "النماذج المفتوحة (مثل Llama, Mistral) تقدر تشغّلها على جهازك مجاناً. المغلقة (مثل GPT-4, Claude) تحتاج اشتراك API لكن عادةً أذكى." },
      { icon: "📏", title: "حجم النموذج (Parameters)", text: "كل ما زاد عدد البارامترات (مثلاً 70B) كل ما زاد ذكاء النموذج — لكن يحتاج VRAM أكثر. نموذج 7B يشتغل على GPU 8GB." },
      { icon: "🔢", title: "Context Length", text: "النافذة السياقية (Context) تحدد كم نص يقدر النموذج يقرأ دفعة واحدة. 128K يعني يقدر يقرأ كتاب كامل." },
      { icon: "⚡", title: "الكميّة (Quantization)", text: "تقنية تقلل حجم النموذج بضغطه (مثل Q4, Q8). نموذج 70B بعد الكميّة ممكن يشتغل على GPU 24GB بدل 48GB." },
      { icon: "🔀", title: "MoE — خليط الخبراء", text: "بعض النماذج (مثل Mixtral) تستخدم تقنية MoE — النموذج كبير لكن يشغّل جزء بسيط فقط، فيكون سريع وذكي معاً." }
    ] : [
      { icon: "💡", title: "Open vs Closed", text: "Open models (Llama, Mistral) run locally for free. Closed models (GPT-4, Claude) need API subscription but are usually smarter." },
      { icon: "📏", title: "Model Size (Parameters)", text: "More parameters (e.g., 70B) = smarter model but needs more VRAM. A 7B model runs on an 8GB GPU." },
      { icon: "🔢", title: "Context Length", text: "Context window determines how much text the model can read at once. 128K means it can read an entire book." },
      { icon: "⚡", title: "Quantization", text: "Compression technique (Q4, Q8) reduces model size. A 70B model quantized can run on 24GB instead of 48GB VRAM." },
      { icon: "🔀", title: "MoE — Mixture of Experts", text: "Some models (Mixtral) use MoE — large model but only activates a small portion, making it fast and smart." }
    ];

    container.innerHTML = tips.map(tip => `
      <div class="tip-card">
        <span class="tip-icon">${tip.icon}</span>
        <h4 class="tip-title">${tip.title}</h4>
        <p class="tip-text">${tip.text}</p>
      </div>
    `).join("");
  }

  // ═══════════════════════════════════════════════════════════
  // التهيئة
  // ═══════════════════════════════════════════════════════════

  async function init() {
    try {
      const res = await fetch("assets/data/models.json");
      if (res.ok) allModels = await res.json();
    } catch (_) {
      console.warn("Guide: failed to load models.json");
    }

    buildWizard();
    buildQuickScenarios();
    buildTips();
  }

  // بدء عند تحميل الصفحة
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { init };
})();
