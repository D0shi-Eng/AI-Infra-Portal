/**
 * render.js
 * مسؤول عن:
 * - بناء UI لبطاقات النماذج وملء الفلاتر
 * - التعامل مع البحث والفلاتر
 * ملاحظة أمنية:
 * - لا نستخدم innerHTML إطلاقاً
 * - كل العناصر تُبنى بـ createElement + textContent
 */

document.addEventListener("DOMContentLoaded", async () => {
    // هذه الصفحة تعمل فقط إن وجد grid
    const grid = document.getElementById("grid");
    if (!grid) return;
  
    const emptyState = document.getElementById("emptyState");
    const countLabel = document.getElementById("countLabel");
  
    const searchInput = document.getElementById("searchInput");
    const typeSelect = document.getElementById("typeSelect");
    const providerSelect = document.getElementById("providerSelect");
    const modalitySelect = document.getElementById("modalitySelect");
    const licenseSelect = document.getElementById("licenseSelect");
    const resetBtn = document.getElementById("resetBtn");
  
    function safeText(v) {
      return (v === null || v === undefined) ? "" : String(v);
    }
  
    function normalize(v) {
      return safeText(v).toLowerCase().trim();
    }
  
    function unique(values) {
      return Array.from(new Set(values.filter(Boolean))).sort((a,b) => a.localeCompare(b));
    }
  
    function fillSelect(select, labelKey, items) {
      // مسح
      while (select.firstChild) select.removeChild(select.firstChild);
  
      const allOpt = document.createElement("option");
      allOpt.value = "";
      allOpt.textContent = `${I18N.t(labelKey)}: All`;
      select.appendChild(allOpt);
  
      items.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        select.appendChild(opt);
      });
    }
  
    function badge(label) {
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = label;
      return b;
    }
  
    function buildCard(model) {
      const card = document.createElement("article");
      card.className = "neon-card";
      card.tabIndex = 0;
  
      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = safeText(model.name);
  
      const meta = document.createElement("div");
      meta.className = "card-meta";
  
      const provider = document.createElement("span");
      provider.textContent = `• ${safeText(model.provider)}`;
  
      const type = document.createElement("span");
      type.textContent = `• ${safeText(model.type)}`;
  
      const params = document.createElement("span");
      const p = model.paramsB ? `${model.paramsB}B` : "-";
      params.textContent = `• Params: ${p}`;
  
      const req = document.createElement("span");
      const vram = model.recommendedVramGb ? `${model.recommendedVramGb}GB VRAM` : "-";
      req.textContent = `• ${vram}`;
  
      meta.appendChild(provider);
      meta.appendChild(type);
      meta.appendChild(params);
      meta.appendChild(req);
  
      const badges = document.createElement("div");
      badges.className = "badges";
  
      // open/closed
      badges.appendChild(badge(model.open === true ? I18N.t("badge_open") : I18N.t("badge_closed")));
  
      // modalities
      const mods = Array.isArray(model.modalities) ? model.modalities : [];
      mods.slice(0, 4).forEach((m) => badges.appendChild(badge(safeText(m))));
  
      // MoE
      if (model.moe === true) badges.appendChild(badge(I18N.t("badge_moe")));
  
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.style.marginTop = "12px";
      btn.textContent = I18N.getSavedLang() === "ar" ? "تفاصيل" : "Details";
      btn.addEventListener("click", () => Router.toModelDetails(model.id));
  
      card.addEventListener("click", (e) => {
        // إذا ضغط على الزر فهو أصلاً بيروح، ما نكرر
        if (e.target === btn) return;
        Router.toModelDetails(model.id);
      });
  
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter") Router.toModelDetails(model.id);
      });
  
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(badges);
      card.appendChild(btn);
  
      return card;
    }
  
    let allModels = [];
    try {
      // تحميل
      if (emptyState) emptyState.style.display = "none";
      allModels = await ModelsData.loadModels();
    } catch (err) {
      if (emptyState) {
        emptyState.style.display = "block";
        emptyState.textContent = "Failed to load models.json";
      }
      return;
    }
  
    // تجهيز الفلاتر
    const types = unique(allModels.map((m) => m.type));
    const providers = unique(allModels.map((m) => m.provider));
    const modalities = unique(allModels.flatMap((m) => Array.isArray(m.modalities) ? m.modalities : []));
    const licenses = unique(allModels.map((m) => m.license));
  
    fillSelect(typeSelect, "filter_type", types);
    fillSelect(providerSelect, "filter_provider", providers);
    fillSelect(modalitySelect, "filter_modality", modalities);
    fillSelect(licenseSelect, "filter_license", licenses);
  
    function applyFilters() {
      const q = normalize(searchInput.value);
      const typeV = typeSelect.value;
      const providerV = providerSelect.value;
      const modalityV = modalitySelect.value;
      const licenseV = licenseSelect.value;
  
      const filtered = allModels.filter((m) => {
        const hay = [
          m.name, m.provider, m.type, m.family, m.license,
          ...(Array.isArray(m.modalities) ? m.modalities : []),
          ...(Array.isArray(m.languages) ? m.languages : []),
        ].map(normalize).join(" ");
  
        if (q && !hay.includes(q)) return false;
        if (typeV && m.type !== typeV) return false;
        if (providerV && m.provider !== providerV) return false;
        if (licenseV && m.license !== licenseV) return false;
        if (modalityV) {
          const mods = Array.isArray(m.modalities) ? m.modalities : [];
          if (!mods.includes(modalityV)) return false;
        }
        return true;
      });
  
      // تحديث العدّاد
      if (countLabel) {
        const label = I18N.t("models_count");
        countLabel.textContent = `${label}: ${filtered.length}`;
      }
  
      // عرض
      while (grid.firstChild) grid.removeChild(grid.firstChild);
      if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = "block";
      } else {
        if (emptyState) emptyState.style.display = "none";
        filtered.forEach((m) => grid.appendChild(buildCard(m)));
      }
    }
  
    // أحداث
    [searchInput, typeSelect, providerSelect, modalitySelect, licenseSelect].forEach((el) => {
      el.addEventListener("input", applyFilters);
      el.addEventListener("change", applyFilters);
    });
  
    resetBtn.addEventListener("click", () => {
      searchInput.value = "";
      typeSelect.value = "";
      providerSelect.value = "";
      modalitySelect.value = "";
      licenseSelect.value = "";
      applyFilters();
    });
  
    // أول عرض
    applyFilters();
  });