/**
 * model-page.js
 * صفحة تفاصيل النموذج:
 * - قراءة id من الـ query string
 * - تحميل models.json عبر طبقة ModelsData
 * - عرض تفاصيل النموذج داخل أقسام (مواصفات/متطلبات/ملاحظات)
 * - تفعيل Accordion لكل قسم
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
  const breadcrumbModel = document.getElementById("breadcrumbModel");

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
    breadcrumbModel,
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

    const bodyId = "accordion-body-" + index;
    body.id = bodyId;
    head.setAttribute("tabindex", "0");
    head.setAttribute("role", "button");
    head.setAttribute("aria-expanded", "true");
    head.setAttribute("aria-controls", bodyId);

    const toggle = () => {
      const isOpen = item.classList.contains("open");
      ctx.accordionItems.forEach((other) => {
        other.classList.remove("open");
        const h = other.querySelector(".accordion-head");
        if (h) h.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        head.setAttribute("aria-expanded", "true");
      } else {
        head.setAttribute("aria-expanded", "false");
      }
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

  // تحديث مسار التنقل (Breadcrumb) باسم النموذج
  if (ctx.breadcrumbModel) ctx.breadcrumbModel.textContent = model.name || "—";

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

  setPageSeo(model);
  addShareButton(model);
  addCopySpecsButton(model);
}

function setPageSeo(model) {
  const name = (model.name || model.id || "").trim();
  if (name) {
    document.title = name + " • AI INFRA";
  }
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.setAttribute("name", "description");
    document.head.appendChild(metaDesc);
  }
  const descText = (model.notes || "").slice(0, 155);
  metaDesc.setAttribute("content", descText || name + " — مواصفات ومتطلبات تشغيل");

  let scriptJsonLd = document.getElementById("json-ld-model");
  if (scriptJsonLd) scriptJsonLd.remove();
  scriptJsonLd = document.createElement("script");
  scriptJsonLd.id = "json-ld-model";
  scriptJsonLd.type = "application/ld+json";
  const ld = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: model.name || model.id,
    applicationCategory: "DeveloperApplication",
    description: (model.notes || "").slice(0, 200),
  };
  if (model.provider) ld.author = { "@type": "Organization", name: model.provider };
  scriptJsonLd.textContent = JSON.stringify(ld);
  document.head.appendChild(scriptJsonLd);
}

function addShareButton(model) {
  const container = document.querySelector(".container");
  const existing = document.getElementById("modelShareBtn");
  if (existing || !container) return;
  const btn = document.createElement("button");
  btn.id = "modelShareBtn";
  btn.type = "button";
  btn.className = "btn";
  btn.textContent = I18N.t("btn_share");
  btn.style.marginBottom = "12px";
  btn.addEventListener("click", () => {
    const url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        btn.textContent = I18N.t("btn_share_done");
        setTimeout(() => { btn.textContent = I18N.t("btn_share"); }, 2000);
      }).catch(() => { fallbackCopy(url, btn); });
    } else {
      fallbackCopy(url, btn);
    }
  });
  const firstLink = container.querySelector("a.btn");
  if (firstLink && firstLink.nextSibling) {
    container.insertBefore(btn, firstLink.nextSibling);
  } else {
    container.insertBefore(btn, container.firstChild);
  }
}

function fallbackCopy(url, btn) {
  const ta = document.createElement("textarea");
  ta.value = url;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    btn.textContent = I18N.t("btn_share_done");
    setTimeout(() => { btn.textContent = I18N.t("btn_share"); }, 2000);
  } catch (_) {}
  document.body.removeChild(ta);
}

/**
 * زر نسخ المواصفات كنص منسق للمشاركة
 * ينسخ اسم النموذج والمزود والنوع والمتطلبات بصيغة نصية مرتبة
 */
function addCopySpecsButton(model) {
  const container = document.querySelector(".container");
  const existing = document.getElementById("modelCopySpecsBtn");
  if (existing || !container) return;

  const btn = document.createElement("button");
  btn.id = "modelCopySpecsBtn";
  btn.type = "button";
  btn.className = "btn";
  btn.textContent = I18N.t("copy_specs");
  btn.style.marginBottom = "12px";
  btn.style.marginInlineStart = "8px";

  btn.addEventListener("click", function () {
    // بناء النص المنسق بأمان — بدون innerHTML
    var lines = [];
    lines.push("📋 " + (model.name || "—"));
    lines.push("🏢 " + (model.provider || "—"));
    lines.push("📂 " + (model.type || "—"));
    if (model.paramsB) lines.push("⚙️ " + model.paramsB + "B params");
    if (model.contextK) lines.push("📏 " + model.contextK + "K context");
    if (model.recommendedVramGb) lines.push("🎮 VRAM: " + model.recommendedVramGb + " GB");
    if (model.recommendedRamGb) lines.push("💾 RAM: " + model.recommendedRamGb + " GB");
    lines.push("📜 " + (model.license || "—"));
    lines.push("🔗 " + location.href);

    var text = lines.join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = I18N.t("copy_specs_done");
        setTimeout(function () { btn.textContent = I18N.t("copy_specs"); }, 2000);
      }).catch(function () { fallbackCopy(text, btn); });
    } else {
      fallbackCopy(text, btn);
    }
  });

  // إدراج الزر بجانب زر المشاركة
  var shareBtn = document.getElementById("modelShareBtn");
  if (shareBtn && shareBtn.nextSibling) {
    container.insertBefore(btn, shareBtn.nextSibling);
  } else if (shareBtn) {
    shareBtn.parentNode.insertBefore(btn, shareBtn.nextSibling);
  } else {
    var firstLink = container.querySelector("a.btn");
    if (firstLink && firstLink.nextSibling) {
      container.insertBefore(btn, firstLink.nextSibling);
    } else {
      container.insertBefore(btn, container.firstChild);
    }
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