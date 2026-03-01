/**
 * render.js
 * مسؤول عن:
 * - بناء بطاقات النماذج المحسّنة مع أشرطة VRAM/RAM
 * - الفلاتر والبحث مع debounce لتحسين الأداء
 * - ترتيب النماذج (اسم، حجم، VRAM)
 * - ترقيم الصفحات (Pagination) لتخفيف الحمل على المتصفح
 * - نظام المفضلة مع حفظ في localStorage
 */

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("grid");
  if (!grid) return;

  // ─── عناصر الصفحة الأساسية ───
  const emptyState = document.getElementById("emptyState");
  const countLabel = document.getElementById("countLabel");
  const searchInput = document.getElementById("searchInput");
  const typeSelect = document.getElementById("typeSelect");
  const providerSelect = document.getElementById("providerSelect");
  const modalitySelect = document.getElementById("modalitySelect");
  const licenseSelect = document.getElementById("licenseSelect");
  const resetBtn = document.getElementById("resetBtn");
  const sortSelect = document.getElementById("sortSelect");
  const favFilterBtn = document.getElementById("favFilterBtn");

  // ─── عناصر ترقيم الصفحات ───
  const paginationEl = document.getElementById("pagination");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfoEl = document.getElementById("pageInfo");

  // ─── ثوابت الترقيم ───
  var ITEMS_PER_PAGE = 24;
  var currentPage = 1;
  var currentFiltered = [];
  var showFavsOnly = false;

  // ═══════════════════════════════════════════════════════════
  // دوال مساعدة آمنة
  // ═══════════════════════════════════════════════════════════

  /** تحويل قيمة إلى نص آمن — يمنع حقن HTML عبر إنشاء عناصر DOM بدل innerHTML */
  function safeText(v) {
    return (v === null || v === undefined) ? "" : String(v);
  }

  /** تحويل لحروف صغيرة مع إزالة الفراغات */
  function normalize(v) {
    return safeText(v).toLowerCase().trim();
  }

  /** استخراج القيم الفريدة من مصفوفة مع ترتيبها */
  function unique(values) {
    return Array.from(new Set(values.filter(Boolean))).sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // نظام المفضلة — يحفظ معرّفات النماذج في localStorage
  // ═══════════════════════════════════════════════════════════

  var FAV_KEY = "aiinfra_favorites";

  /** قراءة المفضلة من التخزين المحلي بشكل آمن */
  function getFavorites() {
    try {
      var raw = localStorage.getItem(FAV_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  /** حفظ المفضلة في التخزين المحلي */
  function saveFavorites(favs) {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    } catch (_) {
      // في حال امتلاء التخزين لا نكسر التطبيق
    }
  }

  /** التحقق إن كان نموذج في المفضلة */
  function isFavorite(modelId) {
    return getFavorites().indexOf(String(modelId)) !== -1;
  }

  /** إضافة أو إزالة نموذج من المفضلة */
  function toggleFavorite(modelId) {
    var favs = getFavorites();
    var id = String(modelId);
    var idx = favs.indexOf(id);
    if (idx === -1) {
      favs.push(id);
    } else {
      favs.splice(idx, 1);
    }
    saveFavorites(favs);
    return idx === -1; // يرجع true إذا تمت الإضافة
  }

  // ═══════════════════════════════════════════════════════════
  // بناء واجهة الفلاتر
  // ═══════════════════════════════════════════════════════════

  /** بناء خيارات الـ select من القيم الفريدة */
  function fillSelect(select, labelKey, items) {
    while (select.firstChild) select.removeChild(select.firstChild);
    var allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = I18N.t(labelKey) + ": " + (I18N.getSavedLang() === "ar" ? "الكل" : "All");
    select.appendChild(allOpt);
    items.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }

  /** بناء خيارات الترتيب */
  function fillSortSelect() {
    if (!sortSelect) return;
    var options = [
      { value: "",             label: I18N.t("sort_default") },
      { value: "name_asc",     label: I18N.t("sort_name_asc") },
      { value: "name_desc",    label: I18N.t("sort_name_desc") },
      { value: "params_asc",   label: I18N.t("sort_params_asc") },
      { value: "params_desc",  label: I18N.t("sort_params_desc") },
      { value: "vram_asc",     label: I18N.t("sort_vram_asc") },
      { value: "vram_desc",    label: I18N.t("sort_vram_desc") }
    ];
    while (sortSelect.firstChild) sortSelect.removeChild(sortSelect.firstChild);
    options.forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.label;
      sortSelect.appendChild(opt);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // تحديد فئة النموذج (صغير/متوسط/كبير/سحابي)
  // ═══════════════════════════════════════════════════════════

  function getModelTier(model) {
    var p = model.paramsB;
    if (!p) return { cls: "tier-cloud", label: I18N.getSavedLang() === "ar" ? "سحابي" : "Cloud" };
    if (p <= 13) return { cls: "tier-small", label: I18N.getSavedLang() === "ar" ? "صغير" : "Small" };
    if (p <= 40) return { cls: "tier-medium", label: I18N.getSavedLang() === "ar" ? "متوسط" : "Medium" };
    return { cls: "tier-large", label: I18N.getSavedLang() === "ar" ? "كبير" : "Large" };
  }

  /** حساب نسبة VRAM لعرض شريط التقدم (Max = 80GB) */
  function vramPercent(vram) {
    if (!vram) return 0;
    return Math.min(100, (vram / 80) * 100);
  }

  /** أيقونة نوع النموذج */
  function typeIcon(type) {
    var t = (type || "").toLowerCase();
    if (t.includes("code")) return "💻";
    if (t.includes("image") || t.includes("gen")) return "🎨";
    if (t.includes("asr") || t.includes("audio") || t.includes("speech")) return "🎙️";
    if (t.includes("video")) return "🎬";
    if (t.includes("embed")) return "📐";
    return "🧠";
  }

  // ═══════════════════════════════════════════════════════════
  // بناء بطاقة نموذج — استخدام DOM API فقط (بدون innerHTML لمنع XSS)
  // ═══════════════════════════════════════════════════════════

  function buildCard(model) {
    var card = document.createElement("article");
    card.className = "neon-card";
    card.tabIndex = 0;

    // ─ زر المفضلة
    var favBtn = document.createElement("button");
    favBtn.className = "fav-btn";
    favBtn.type = "button";
    favBtn.setAttribute("aria-label", isFavorite(model.id) ? I18N.t("fav_remove") : I18N.t("fav_add"));
    favBtn.textContent = isFavorite(model.id) ? "★" : "☆";
    if (isFavorite(model.id)) favBtn.classList.add("fav-active");
    favBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var added = toggleFavorite(model.id);
      favBtn.textContent = added ? "★" : "☆";
      favBtn.classList.toggle("fav-active", added);
      favBtn.setAttribute("aria-label", added ? I18N.t("fav_remove") : I18N.t("fav_add"));
    });
    card.appendChild(favBtn);

    // ─ Header: العنوان + فئة الحجم
    var header = document.createElement("div");
    header.className = "card-header";

    var titleWrap = document.createElement("div");

    var title = document.createElement("div");
    title.className = "card-title";
    title.textContent = safeText(model.name);

    var provider = document.createElement("div");
    provider.className = "card-provider";
    provider.textContent = safeText(model.provider);

    titleWrap.appendChild(title);
    titleWrap.appendChild(provider);

    var tier = getModelTier(model);
    var tierBadge = document.createElement("span");
    tierBadge.className = "tier-indicator " + tier.cls;
    tierBadge.textContent = tier.label;

    header.appendChild(titleWrap);
    header.appendChild(tierBadge);
    card.appendChild(header);

    // ─ صف المعلومات: النوع + البارامترات + السياق
    var infoRow = document.createElement("div");
    infoRow.className = "card-meta";
    infoRow.style.margin = "8px 0";

    var typeSpan = document.createElement("span");
    typeSpan.textContent = typeIcon(model.type) + " " + safeText(model.type);
    infoRow.appendChild(typeSpan);

    if (model.paramsB) {
      var paramSpan = document.createElement("span");
      paramSpan.textContent = "⚙️ " + model.paramsB + "B params";
      infoRow.appendChild(paramSpan);
    }

    if (model.contextK) {
      var ctxSpan = document.createElement("span");
      ctxSpan.textContent = "📏 " + model.contextK + "K ctx";
      infoRow.appendChild(ctxSpan);
    }

    card.appendChild(infoRow);

    // ─ فاصل مرئي
    var divider = document.createElement("div");
    divider.className = "card-divider";
    card.appendChild(divider);

    // ─ شريط VRAM
    if (model.recommendedVramGb) {
      card.appendChild(buildGaugeRow("VRAM", model.recommendedVramGb, 80, "var(--gradient-neon)"));
    }

    // ─ شريط RAM
    if (model.recommendedRamGb) {
      card.appendChild(buildGaugeRow("RAM", model.recommendedRamGb, 160, "linear-gradient(90deg, #9d00ff, rgba(157,0,255,0.6))"));
    }

    // ─ الشارات (مفتوح/مغلق، MoE، Modalities، الترخيص)
    var badges = document.createElement("div");
    badges.className = "badges";
    badges.style.marginTop = "12px";

    var openBadge = document.createElement("span");
    openBadge.className = model.open === true ? "badge badge--open" : "badge badge--closed";
    openBadge.textContent = model.open === true ? I18N.t("badge_open") : I18N.t("badge_closed");
    badges.appendChild(openBadge);

    if (model.moe === true) {
      var moeBadge = document.createElement("span");
      moeBadge.className = "badge badge--moe";
      moeBadge.textContent = I18N.t("badge_moe");
      badges.appendChild(moeBadge);
    }

    var mods = Array.isArray(model.modalities) ? model.modalities : [];
    mods.slice(0, 3).forEach(function (m) {
      var b = document.createElement("span");
      b.className = "badge";
      b.textContent = safeText(m);
      badges.appendChild(b);
    });

    if (model.license) {
      var licBadge = document.createElement("span");
      licBadge.className = "badge";
      licBadge.textContent = "📜 " + safeText(model.license);
      badges.appendChild(licBadge);
    }

    card.appendChild(badges);

    // ─ دالة الانتقال لصفحة التفاصيل
    var goToDetails = function () {
      var id = model && (model.id !== undefined && model.id !== null) ? String(model.id).trim() : "";
      if (id && typeof Router !== "undefined" && Router.toModelDetails) Router.toModelDetails(id);
    };

    // ─ زر عرض التفاصيل
    var btn = document.createElement("button");
    btn.className = "card-details-btn";
    btn.textContent = I18N.getSavedLang() === "ar" ? "عرض التفاصيل" : "View Details";
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      goToDetails();
    });
    card.appendChild(btn);

    // ─ النقر على البطاقة كاملة
    card.addEventListener("click", function (e) {
      if (e.target === btn || e.target === favBtn) return;
      goToDetails();
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter") goToDetails();
    });

    return card;
  }

  /**
   * بناء صف شريط تقدم (VRAM أو RAM)
   * @param {string} label - تسمية الشريط
   * @param {number} value - القيمة بالجيجابايت
   * @param {number} max - الحد الأقصى للقياس
   * @param {string} gradient - خلفية الشريط
   */
  function buildGaugeRow(label, value, max, gradient) {
    var gaugeRow = document.createElement("div");
    gaugeRow.className = "gauge-row";

    var gLabel = document.createElement("span");
    gLabel.className = "gauge-label";
    gLabel.textContent = label;

    var gBar = document.createElement("div");
    gBar.className = "gauge-bar";

    var gFill = document.createElement("div");
    gFill.className = "gauge-fill";
    gFill.style.width = "0%";
    if (gradient) gFill.style.background = gradient;

    // تحريك الشريط بتأخير لضمان الانيميشن
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        gFill.style.width = Math.min(100, (value / max) * 100) + "%";
      });
    });

    gBar.appendChild(gFill);

    var gVal = document.createElement("span");
    gVal.className = "gauge-value";
    gVal.textContent = value + " GB";

    gaugeRow.appendChild(gLabel);
    gaugeRow.appendChild(gBar);
    gaugeRow.appendChild(gVal);
    return gaugeRow;
  }

  // ═══════════════════════════════════════════════════════════
  // Debounce — تأخير تنفيذ البحث لتحسين الأداء
  // ═══════════════════════════════════════════════════════════

  var debounceTimer = null;
  function debounce(fn, delay) {
    return function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fn, delay);
    };
  }

  // ═══════════════════════════════════════════════════════════
  // تحميل البيانات
  // ═══════════════════════════════════════════════════════════

  var allModels = [];
  try {
    if (emptyState) emptyState.style.display = "none";
    allModels = await ModelsData.loadModels();
  } catch (err) {
    if (emptyState) {
      emptyState.style.display = "block";
      emptyState.textContent = I18N.t("model_load_error");
    }
    return;
  }

  // ─── بناء الفلاتر من البيانات ───
  var types = unique(allModels.map(function (m) { return m.type; }));
  var providers = unique(allModels.map(function (m) { return m.provider; }));
  var modalities = unique(allModels.flatMap(function (m) { return Array.isArray(m.modalities) ? m.modalities : []; }));
  var licenses = unique(allModels.map(function (m) { return m.license; }));

  fillSelect(typeSelect, "filter_type", types);
  fillSelect(providerSelect, "filter_provider", providers);
  fillSelect(modalitySelect, "filter_modality", modalities);
  fillSelect(licenseSelect, "filter_license", licenses);
  fillSortSelect();

  // ═══════════════════════════════════════════════════════════
  // الفلترة + الترتيب + عرض النتائج مع ترقيم الصفحات
  // ═══════════════════════════════════════════════════════════

  function applyFilters() {
    var q = normalize(searchInput.value);
    var typeV = typeSelect.value;
    var providerV = providerSelect.value;
    var modalityV = modalitySelect.value;
    var licenseV = licenseSelect.value;
    var favs = getFavorites();

    // ─── فلترة النماذج ───
    var filtered = allModels.filter(function (m) {
      // بناء نص البحث من جميع الحقول القابلة للبحث
      var hay = [
        m.name, m.provider, m.type, m.family, m.license,
        ...(Array.isArray(m.modalities) ? m.modalities : []),
        ...(Array.isArray(m.languages) ? m.languages : [])
      ].map(normalize).join(" ");

      if (q && !hay.includes(q)) return false;
      if (typeV && m.type !== typeV) return false;
      if (providerV && m.provider !== providerV) return false;
      if (licenseV && m.license !== licenseV) return false;
      if (modalityV) {
        var mods = Array.isArray(m.modalities) ? m.modalities : [];
        if (mods.indexOf(modalityV) === -1) return false;
      }
      // فلتر المفضلة
      if (showFavsOnly && favs.indexOf(String(m.id)) === -1) return false;
      return true;
    });

    // ─── ترتيب النماذج ───
    var sortVal = sortSelect ? sortSelect.value : "";
    if (sortVal) {
      filtered.sort(function (a, b) {
        switch (sortVal) {
          case "name_asc":
            return (a.name || "").localeCompare(b.name || "");
          case "name_desc":
            return (b.name || "").localeCompare(a.name || "");
          case "params_asc":
            return (a.paramsB || 0) - (b.paramsB || 0);
          case "params_desc":
            return (b.paramsB || 0) - (a.paramsB || 0);
          case "vram_asc":
            return (a.recommendedVramGb || 0) - (b.recommendedVramGb || 0);
          case "vram_desc":
            return (b.recommendedVramGb || 0) - (a.recommendedVramGb || 0);
          default:
            return 0;
        }
      });
    }

    currentFiltered = filtered;

    // ─── تحديث العداد ───
    if (countLabel) {
      var label = I18N.t("models_count");
      countLabel.textContent = label + ": " + filtered.length;
    }

    // ─── ضبط الصفحة الحالية وعرض النتائج ───
    var totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    renderPage();
  }

  /**
   * عرض صفحة محددة من النتائج المفلترة
   * يقسم النتائج إلى صفحات لتحسين الأداء عند وجود 200+ نموذج
   */
  function renderPage() {
    var totalPages = Math.max(1, Math.ceil(currentFiltered.length / ITEMS_PER_PAGE));
    var start = (currentPage - 1) * ITEMS_PER_PAGE;
    var end = Math.min(start + ITEMS_PER_PAGE, currentFiltered.length);
    var pageItems = currentFiltered.slice(start, end);

    // تفريغ الشبكة
    while (grid.firstChild) grid.removeChild(grid.firstChild);

    if (currentFiltered.length === 0) {
      if (emptyState) {
        emptyState.style.display = "block";
        emptyState.textContent = I18N.t("empty");
      }
      if (paginationEl) paginationEl.style.display = "none";
    } else {
      if (emptyState) emptyState.style.display = "none";
      // بناء البطاقات للصفحة الحالية فقط
      pageItems.forEach(function (m) { grid.appendChild(buildCard(m)); });

      // تحديث أزرار الترقيم
      if (paginationEl) {
        if (totalPages > 1) {
          paginationEl.style.display = "flex";
          prevPageBtn.disabled = (currentPage <= 1);
          nextPageBtn.disabled = (currentPage >= totalPages);
          prevPageBtn.textContent = I18N.t("pagination_prev");
          nextPageBtn.textContent = I18N.t("pagination_next");
          if (pageInfoEl) {
            pageInfoEl.textContent = currentPage + " / " + totalPages;
          }
        } else {
          paginationEl.style.display = "none";
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ربط الأحداث
  // ═══════════════════════════════════════════════════════════

  // البحث مع تأخير 300ms لتقليل عمليات الفلترة أثناء الكتابة
  var debouncedFilter = debounce(function () {
    currentPage = 1;
    applyFilters();
  }, 300);

  searchInput.addEventListener("input", debouncedFilter);

  // الفلاتر المنسدلة — تعمل فوراً بدون تأخير
  [typeSelect, providerSelect, modalitySelect, licenseSelect].forEach(function (el) {
    el.addEventListener("change", function () {
      currentPage = 1;
      applyFilters();
    });
  });

  // الترتيب
  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      currentPage = 1;
      applyFilters();
    });
  }

  // زر المفضلة — يبدّل بين عرض الكل وعرض المفضلة
  if (favFilterBtn) {
    favFilterBtn.addEventListener("click", function () {
      showFavsOnly = !showFavsOnly;
      favFilterBtn.classList.toggle("fav-active", showFavsOnly);
      favFilterBtn.textContent = showFavsOnly ? "★" : "☆";
      favFilterBtn.setAttribute("aria-label",
        showFavsOnly ? I18N.t("fav_filter_all") : I18N.t("fav_filter_favs"));
      currentPage = 1;
      applyFilters();
    });
  }

  // أزرار ترقيم الصفحات
  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", function () {
      if (currentPage > 1) {
        currentPage--;
        renderPage();
        // التمرير لأعلى الشبكة
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", function () {
      var totalPages = Math.ceil(currentFiltered.length / ITEMS_PER_PAGE);
      if (currentPage < totalPages) {
        currentPage++;
        renderPage();
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // زر إعادة الضبط — يرجع كل الفلاتر والترتيب للحالة الافتراضية
  resetBtn.addEventListener("click", function () {
    searchInput.value = "";
    typeSelect.value = "";
    providerSelect.value = "";
    modalitySelect.value = "";
    licenseSelect.value = "";
    if (sortSelect) sortSelect.value = "";
    showFavsOnly = false;
    if (favFilterBtn) {
      favFilterBtn.classList.remove("fav-active");
      favFilterBtn.textContent = "☆";
    }
    currentPage = 1;
    applyFilters();
  });

  // ─── العرض الأول ───
  applyFilters();
});