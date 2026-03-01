/**
 * learn-page.js
 * صفحة تعلّم الذكاء الاصطناعي — عرض الكورسات مع بحث وفلترة
 * الكورسات مجانية ومفتوحة للجميع
 */

(function () {
  "use strict";

  var courses = [];
  var lang = "ar";

  // ═══════════════════════════════════════════════════════════
  // تحميل البيانات
  // ═══════════════════════════════════════════════════════════

  async function loadCourses() {
    try {
      var res = await fetch("assets/data/courses.json");
      if (!res.ok) throw new Error("فشل تحميل الكورسات");
      courses = await res.json();
      lang = (typeof I18N !== "undefined" && I18N.getSavedLang) ? I18N.getSavedLang() : "ar";
      renderCourses();
    } catch (err) {
      console.error(err);
      var grid = document.getElementById("coursesGrid");
      if (grid) {
        var msg = document.createElement("p");
        msg.className = "muted";
        msg.textContent = "تعذّر تحميل الكورسات";
        grid.appendChild(msg);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // الفلترة والبحث
  // ═══════════════════════════════════════════════════════════

  function getFiltered() {
    var search = (document.getElementById("courseSearch") || {}).value || "";
    search = search.trim().toLowerCase();
    var level = (document.getElementById("levelFilter") || {}).value || "";
    var category = (document.getElementById("categoryFilter") || {}).value || "";

    return courses.filter(function (c) {
      // فلترة بالمستوى
      if (level && c.level !== level) return false;
      // فلترة بالتصنيف
      if (category && c.category !== category) return false;
      // بحث نصي
      if (search) {
        var searchable = [
          c.title, c.titleAr, c.provider, c.category,
          c.description, c.descriptionAr
        ].join(" ").toLowerCase();
        if (searchable.indexOf(search) === -1) return false;
      }
      return true;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // عرض الكورسات
  // ═══════════════════════════════════════════════════════════

  function renderCourses() {
    var grid = document.getElementById("coursesGrid");
    var countEl = document.getElementById("courseCount");
    if (!grid) return;

    // مسح المحتوى السابق
    while (grid.firstChild) grid.removeChild(grid.firstChild);

    var filtered = getFiltered();

    // عدد النتائج
    if (countEl) {
      countEl.textContent = filtered.length + " " + (lang === "ar" ? "كورس" : "courses");
    }

    if (filtered.length === 0) {
      var empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = (lang === "ar") ? "لا توجد نتائج" : "No results";
      grid.appendChild(empty);
      return;
    }

    filtered.forEach(function (course) {
      grid.appendChild(buildCourseCard(course));
    });
  }

  /** بناء بطاقة كورس واحد (DOM آمن — بدون innerHTML) */
  function buildCourseCard(course) {
    var card = document.createElement("article");
    card.className = "neon-card course-card";

    // الشارات (المستوى + التصنيف)
    var badges = document.createElement("div");
    badges.className = "course-badges";

    var levelBadge = document.createElement("span");
    levelBadge.className = "badge badge-level badge-" + course.level;
    levelBadge.textContent = _levelLabel(course.level);
    badges.appendChild(levelBadge);

    var catBadge = document.createElement("span");
    catBadge.className = "badge badge-category";
    catBadge.textContent = _categoryLabel(course.category);
    badges.appendChild(catBadge);

    if (course.free) {
      var freeBadge = document.createElement("span");
      freeBadge.className = "badge badge-free";
      freeBadge.textContent = lang === "ar" ? "مجاني" : "Free";
      badges.appendChild(freeBadge);
    }

    card.appendChild(badges);

    // عنوان الكورس
    var title = document.createElement("h3");
    title.className = "course-title";
    title.textContent = lang === "ar" ? course.titleAr : course.title;
    card.appendChild(title);

    // المقدّم
    var provider = document.createElement("p");
    provider.className = "course-provider";
    provider.textContent = course.provider;
    card.appendChild(provider);

    // الوصف
    var desc = document.createElement("p");
    desc.className = "course-desc";
    desc.textContent = lang === "ar" ? course.descriptionAr : course.description;
    card.appendChild(desc);

    // معلومات إضافية
    var meta = document.createElement("div");
    meta.className = "course-meta";

    var duration = document.createElement("span");
    duration.textContent = "⏱ " + course.duration;
    meta.appendChild(duration);

    var language = document.createElement("span");
    language.textContent = "🌐 " + (course.language === "ar" ? "عربي" : "English");
    meta.appendChild(language);

    card.appendChild(meta);

    // زر الذهاب للكورس
    var link = document.createElement("a");
    link.href = course.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "btn course-link-btn";
    link.textContent = lang === "ar" ? "ابدأ الكورس ←" : "Start Course →";
    card.appendChild(link);

    return card;
  }

  // ═══════════════════════════════════════════════════════════
  // تسميات ودّية
  // ═══════════════════════════════════════════════════════════

  function _levelLabel(level) {
    var labels = {
      ar: { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" },
      en: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" }
    };
    return (labels[lang] || labels.ar)[level] || level;
  }

  function _categoryLabel(cat) {
    var labels = {
      ar: {
        general: "عام", ml: "تعلّم آلة", "deep-learning": "تعلّم عميق",
        nlp: "معالجة لغة", cv: "رؤية حاسوبية", llm: "نماذج كبيرة",
        image: "توليد صور", rl: "تعلّم معزّز"
      },
      en: {
        general: "General", ml: "Machine Learning", "deep-learning": "Deep Learning",
        nlp: "NLP", cv: "Computer Vision", llm: "LLMs",
        image: "Image Gen", rl: "Reinforcement Learning"
      }
    };
    return (labels[lang] || labels.ar)[cat] || cat;
  }

  // ═══════════════════════════════════════════════════════════
  // أحداث
  // ═══════════════════════════════════════════════════════════

  function bindEvents() {
    var search = document.getElementById("courseSearch");
    var level = document.getElementById("levelFilter");
    var category = document.getElementById("categoryFilter");

    if (search) search.addEventListener("input", renderCourses);
    if (level) level.addEventListener("change", renderCourses);
    if (category) category.addEventListener("change", renderCourses);
  }

  // ═══════════════════════════════════════════════════════════
  // تهيئة
  // ═══════════════════════════════════════════════════════════

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bindEvents();
      loadCourses();
    });
  } else {
    bindEvents();
    loadCourses();
  }
})();
