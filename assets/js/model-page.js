/**
 * model-page.js
 * صفحة تفاصيل النموذج:
 * - قراءة id من query
 * - جلب models.json
 * - إيجاد النموذج وعرض تفاصيله
 * ملاحظة أمنية:
 * - بناء DOM بطريقة آمنة بدون innerHTML
 */

document.addEventListener("DOMContentLoaded", async () => {
    const id = Router.getQueryParam("id");
    const nameEl = document.getElementById("modelName");
    const specsEl = document.getElementById("specs");
    const badgesEl = document.getElementById("badges");
    const reqsEl = document.getElementById("reqs");
    const reqNoteEl = document.getElementById("reqNote");
    const notesEl = document.getElementById("notes");
  
    function addMeta(container, label, value) {
      const span = document.createElement("span");
      span.textContent = `• ${label}: ${value}`;
      container.appendChild(span);
    }
  
    function addBadge(text) {
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = text;
      badgesEl.appendChild(b);
    }
  
    if (!id) {
      nameEl.textContent = "Missing model id";
      return;
    }
  
    let models = [];
    try {
      models = await ModelsData.loadModels();
    } catch {
      nameEl.textContent = "Failed to load models.json";
      return;
    }
  
    const model = models.find((m) => String(m.id) === String(id));
    if (!model) {
      nameEl.textContent = "Model not found";
      return;
    }
  
    nameEl.textContent = model.name;
  
    // Specs
    addMeta(specsEl, "Provider", model.provider || "-");
    addMeta(specsEl, "Type", model.type || "-");
    addMeta(specsEl, "Family", model.family || "-");
    addMeta(specsEl, "Params", model.paramsB ? `${model.paramsB}B` : "-");
    addMeta(specsEl, "Context", model.contextK ? `${model.contextK}K` : "-");
    addMeta(specsEl, "License", model.license || "-");
  
    // Badges
    addBadge(model.open ? I18N.t("badge_open") : I18N.t("badge_closed"));
    if (model.moe) addBadge(I18N.t("badge_moe"));
    (Array.isArray(model.modalities) ? model.modalities : []).forEach(addBadge);
    (Array.isArray(model.languages) ? model.languages : []).slice(0, 3).forEach((l) => addBadge(l));
  
    // Requirements
    addMeta(reqsEl, "Min VRAM", model.minVramGb ? `${model.minVramGb}GB` : "-");
    addMeta(reqsEl, "Recommended VRAM", model.recommendedVramGb ? `${model.recommendedVramGb}GB` : "-");
    addMeta(reqsEl, "Min RAM", model.minRamGb ? `${model.minRamGb}GB` : "-");
    addMeta(reqsEl, "Recommended RAM", model.recommendedRamGb ? `${model.recommendedRamGb}GB` : "-");
  
    reqNoteEl.textContent =
      model.requirementsNote ||
      (I18N.getSavedLang() === "ar"
        ? "هذه تقديرات عملية وقد تختلف حسب الكوانتايز، طول السياق، والباك-إند."
        : "Practical estimates; varies by quantization, context length, and backend.");
  
    // Notes
    notesEl.textContent = model.notes || (I18N.getSavedLang() === "ar" ? "لا توجد ملاحظات." : "No notes.");
  });