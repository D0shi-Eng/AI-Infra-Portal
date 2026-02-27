/**
 * model-page.js
 * صفحة تفاصيل النموذج:
 * - قراءة id من الـ query string
 * - تحميل models.json عبر طبقة ModelsData
 * - عرض تفاصيل النموذج داخل أقسام (مواصفات/متطلبات/ملاحظات)
 * - تفعيل Accordion لكل قسم
 *
 * ملاحظات أمنية:
 * - لا نستخدم innerHTML إطلاقاً (تفادي XSS)
 * - كل العقد تُبنى بـ createElement/textContent فقط
 * - أي رسالة للمستخدم تمر عبر طبقة i18n
 */

document.addEventListener("DOMContentLoaded", () => {
  const ctx = initElements();
  initAccordion(ctx);
  hydrateModelDetails(ctx);
});

/**
 * تهيئة واختيار العناصر الثابتة في الصفحة مرة واحدة
 */
function initElements() {
  const titleEl = document.getElementById("modelTitle");
  const nameEl = document.getElementById("modelName");
  const statusEl = document.getElementById("pageStatus");
  const specBodyEl = document.getElementById("specBody");
  const reqBodyEl = document.getElementById("reqBody");
  const notesBodyEl = document.getElementById("notesBody");
  const badgesEl = document.getElementById("badges");
  const reqNoteEl = document.getElementById("reqNote");

  const accordionItems = Array.from(
    document.querySelectorAll(".accordion-item")
  );

  return {
    titleEl,
    nameEl,
    statusEl,
    specBodyEl,
    reqBodyEl,
    notesBodyEl,
    badgesEl,
    reqNoteEl,
    accordionItems,
  };
}

/**
 * تفعيل الـ Accordion بحيث:
 * - النقر على العنوان يفتح/يغلق القسم
 * - دعم لوحة المفاتيح (Enter/Space)
 * - يعمل حتى لو فشل تحميل البيانات
 */
function initAccordion(ctx) {
  ctx.accordionItems.forEach((item, index) => {
    const head = item.querySelector(".accordion-head");
    const body = item.querySelector(".accordion-body");
    if (!head || !body) return;

    // نجعل العنوان قابلاً للتركيز والاستخدام بالكيبورد
    head.setAttribute("tabindex", "0");
    head.setAttribute("role", "button");

    const toggle = () => {
      const isOpen = item.classList.contains("open");
      ctx.accordionItems.forEach((other) => other.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    };

    head.addEventListener("click", toggle);
    head.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });

    // فتح كل الأقسام افتراضياً حتى تظهر المتطلبات والملاحظات دون الحاجة للنقر
    item.classList.add("open");
  });
}

/**
 * قراءة id من الـ URL ثم تحميل البيانات وعرضها
 */
async function hydrateModelDetails(ctx) {
  const rawId = getModelIdFromUrl();
  if (!rawId) {
    showStatus(ctx, "model_missing_id_title", "model_missing_id_message");
    return;
  }

  let models = [];
  try {
    models = await ModelsData.loadModels();
  } catch {
    showStatus(ctx, "model_title", "model_load_error");
    return;
  }

  const idLower = String(rawId).toLowerCase().trim();
  const model =
    models.find(
      (m) => String(m.id || "").toLowerCase().trim() === idLower
    ) || null;

  if (!model) {
    showStatus(ctx, "model_not_found_title", "model_not_found_message");
    return;
  }

  renderModel(ctx, model);
}

/**
 * استخراج modelId من الـ query string بطريقة آمنة
 */
function getModelIdFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return null;
    const trimmed = id.trim();
    return trimmed.length ? trimmed : null;
  } catch {
    return null;
  }
}

/**
 * عرض رسالة حالة للمستخدم (مترجمة)
 */
function showStatus(ctx, titleKey, messageKey) {
  if (ctx.nameEl) ctx.nameEl.textContent = "";
  if (ctx.titleEl && titleKey) {
    ctx.titleEl.textContent = I18N.t(titleKey);
  }
  if (ctx.statusEl && messageKey) {
    ctx.statusEl.textContent = I18N.t(messageKey);
  }

  // تفريغ الحقول حتى لا تبقى بيانات قديمة
  [ctx.specBodyEl, ctx.reqBodyEl, ctx.notesBodyEl].forEach((el) => {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  });
  if (ctx.badgesEl) {
    while (ctx.badgesEl.firstChild) ctx.badgesEl.removeChild(ctx.badgesEl.firstChild);
  }
  if (ctx.reqNoteEl) {
    ctx.reqNoteEl.textContent = "";
  }
}

/**
 * طبقة مساعدة لقراءة قيم المتطلبات من أكثر من schema
 * - تدعم وجود الحقول داخل requirements أو hardware أو system أو على المستوى الجذري للنموذج
 * - توفر قيمة افتراضية \"غير محدد\" عند غياب كل القيم
 */
function isValidValue(v) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

function pickFirst(...vals) {
  for (const v of vals) {
    if (isValidValue(v)) return v;
  }
  return null;
}

function getReqValue(model, keys) {
  const req = model && model.requirements ? model.requirements : null;
  const hw = model && model.hardware ? model.hardware : null;
  const sys = model && model.system ? model.system : null;

  for (const k of keys) {
    const v = pickFirst(
      req && req[k],
      hw && hw[k],
      sys && sys[k],
      model && model[k]
    );
    if (isValidValue(v)) return v;
  }
  return null;
}

function safeText(v) {
  return isValidValue(v) ? String(v) : "غير محدد";
}

function fillKeyValue(container, entries) {
  while (container.firstChild) container.removeChild(container.firstChild);
  Object.keys(entries).forEach((label) => {
    const value = entries[label];
    appendMeta(container, label, safeText(value));
  });
}

/**
 * بناء تفاصيل النموذج داخل الأقسام الثلاثة
 */
function renderModel(ctx, model) {
  if (ctx.statusEl) ctx.statusEl.textContent = "";
  if (ctx.nameEl) ctx.nameEl.textContent = model.name || "";

  // مواصفات
  if (ctx.specBodyEl) {
    appendMeta(ctx.specBodyEl, "Provider", model.provider || "-");
    appendMeta(ctx.specBodyEl, "Type", model.type || "-");
    appendMeta(ctx.specBodyEl, "Family", model.family || "-");
    appendMeta(
      ctx.specBodyEl,
      "Params",
      model.paramsB ? `${model.paramsB}B` : "-"
    );
    appendMeta(
      ctx.specBodyEl,
      "Context",
      model.contextK ? `${model.contextK}K` : "-"
    );
    appendMeta(ctx.specBodyEl, "License", model.license || "-");
  }

  // شارات
  if (ctx.badgesEl) {
    appendBadge(
      ctx.badgesEl,
      model.open ? I18N.t("badge_open") : I18N.t("badge_closed")
    );
    if (model.moe) appendBadge(ctx.badgesEl, I18N.t("badge_moe"));
    (Array.isArray(model.modalities) ? model.modalities : []).forEach((m) =>
      appendBadge(ctx.badgesEl, String(m))
    );
    (Array.isArray(model.languages) ? model.languages : [])
      .slice(0, 3)
      .forEach((l) => appendBadge(ctx.badgesEl, String(l)));
  }

  // المتطلبات
  if (ctx.reqBodyEl) {
    const reqBox = ctx.reqBodyEl;

    const vram = getReqValue(model, [
      "recommendedVramGb",
      "minVramGb",
      "vram",
      "vramGb",
      "gpuVram",
      "vramGB",
      "gpu_vram",
    ]);

    const ram = getReqValue(model, [
      "recommendedRamGb",
      "minRamGb",
      "ram",
      "ramGb",
      "systemRam",
      "memory",
      "system_ram",
    ]);

    const cpu = getReqValue(model, ["cpu", "processor", "cpuModel"]);
    const cooling = getReqValue(model, ["cooling", "cooler", "thermal"]);
    const notes = getReqValue(model, ["notes", "comment", "extra", "reqNotes"]);

    fillKeyValue(reqBox, {
      "VRAM المقترحة": vram,
      "RAM المقترحة": ram,
      CPU: cpu,
      تبريد: cooling,
      "ملاحظات تشغيل": notes,
    });
  }

  if (ctx.reqNoteEl) {
    ctx.reqNoteEl.textContent =
      model.requirementsNote ||
      (I18N.getSavedLang() === "ar"
        ? "هذه تقديرات عملية وقد تختلف حسب الكوانتايز، طول السياق، والباك-إند."
        : "Practical estimates; varies by quantization, context length, and backend.");
  }

  // الملاحظات
  if (ctx.notesBodyEl) {
    ctx.notesBodyEl.textContent =
      model.notes ||
      (I18N.getSavedLang() === "ar"
        ? "لا توجد ملاحظات."
        : "No notes.");
  }
}

/**
 * إضافة سطر ميتا بشكل آمن
 */
function appendMeta(container, label, value) {
  const span = document.createElement("span");
  span.textContent = `• ${label}: ${value}`;
  container.appendChild(span);
}

/**
 * إضافة شارة بشكل آمن
 */
function appendBadge(container, text) {
  const b = document.createElement("span");
  b.className = "badge";
  b.textContent = text;
  container.appendChild(b);
}