/**
 * render.js
 * مسؤول عن:
 * - بناء بطاقات النماذج المحسّنة مع أشرطة VRAM
 * - الفلاتر والبحث
 */

document.addEventListener("DOMContentLoaded", async () => {
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
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }

  function fillSelect(select, labelKey, items) {
    while (select.firstChild) select.removeChild(select.firstChild);
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = I18N.t(labelKey) + ": " + (I18N.getSavedLang() === "ar" ? "الكل" : "All");
    select.appendChild(allOpt);
    items.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }

  /**
   * تحديد فئة النموذج (صغير/متوسط/كبير/سحابي) بناء على المعاملات
   */
  function getModelTier(model) {
    const p = model.paramsB;
    if (!p) return { cls: "tier-cloud", label: I18N.getSavedLang() === "ar" ? "سحابي" : "Cloud" };
    if (p <= 13) return { cls: "tier-small", label: I18N.getSavedLang() === "ar" ? "صغير" : "Small" };
    if (p <= 40) return { cls: "tier-medium", label: I18N.getSavedLang() === "ar" ? "متوسط" : "Medium" };
    return { cls: "tier-large", label: I18N.getSavedLang() === "ar" ? "كبير" : "Large" };
  }

  /**
   * حساب نسبة VRAM ل عرض شريط التقدم (Max = 80GB)
   */
  function vramPercent(vram) {
    if (!vram) return 0;
    return Math.min(100, (vram / 80) * 100);
  }

  /**
   * أيقونة نوع النموذج
   */
  function typeIcon(type) {
    const t = (type || "").toLowerCase();
    if (t.includes("code")) return "💻";
    if (t.includes("image") || t.includes("gen")) return "🎨";
    if (t.includes("asr") || t.includes("audio") || t.includes("speech")) return "🎙️";
    if (t.includes("video")) return "🎬";
    if (t.includes("embed")) return "📐";
    return "🧠";
  }

  /**
   * بناء بطاقة نموذج محسّنة
   */
  function buildCard(model) {
    const card = document.createElement("article");
    card.className = "neon-card";
    card.tabIndex = 0;

    // ─ Header: Title + Tier
    const header = document.createElement("div");
    header.className = "card-header";

    const titleWrap = document.createElement("div");

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = safeText(model.name);

    const provider = document.createElement("div");
    provider.className = "card-provider";
    provider.textContent = safeText(model.provider);

    titleWrap.appendChild(title);
    titleWrap.appendChild(provider);

    const tier = getModelTier(model);
    const tierBadge = document.createElement("span");
    tierBadge.className = "tier-indicator " + tier.cls;
    tierBadge.textContent = tier.label;

    header.appendChild(titleWrap);
    header.appendChild(tierBadge);
    card.appendChild(header);

    // ─ Type + Params row
    const infoRow = document.createElement("div");
    infoRow.className = "card-meta";
    infoRow.style.margin = "8px 0";

    const typeSpan = document.createElement("span");
    typeSpan.textContent = typeIcon(model.type) + " " + safeText(model.type);
    infoRow.appendChild(typeSpan);

    if (model.paramsB) {
      const paramSpan = document.createElement("span");
      paramSpan.textContent = "⚙️ " + model.paramsB + "B params";
      infoRow.appendChild(paramSpan);
    }

    if (model.contextK) {
      const ctxSpan = document.createElement("span");
      ctxSpan.textContent = "📏 " + model.contextK + "K ctx";
      infoRow.appendChild(ctxSpan);
    }

    card.appendChild(infoRow);

    // ─ Divider
    const divider = document.createElement("div");
    divider.className = "card-divider";
    card.appendChild(divider);

    // ─ VRAM Gauge
    if (model.recommendedVramGb) {
      const gaugeRow = document.createElement("div");
      gaugeRow.className = "gauge-row";

      const gLabel = document.createElement("span");
      gLabel.className = "gauge-label";
      gLabel.textContent = "VRAM";

      const gBar = document.createElement("div");
      gBar.className = "gauge-bar";

      const gFill = document.createElement("div");
      gFill.className = "gauge-fill";
      gFill.style.width = "0%";
      // Animate on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          gFill.style.width = vramPercent(model.recommendedVramGb) + "%";
        });
      });

      gBar.appendChild(gFill);

      const gVal = document.createElement("span");
      gVal.className = "gauge-value";
      gVal.textContent = model.recommendedVramGb + " GB";

      gaugeRow.appendChild(gLabel);
      gaugeRow.appendChild(gBar);
      gaugeRow.appendChild(gVal);
      card.appendChild(gaugeRow);
    }

    // ─ RAM Gauge
    if (model.recommendedRamGb) {
      const ramRow = document.createElement("div");
      ramRow.className = "gauge-row";

      const rLabel = document.createElement("span");
      rLabel.className = "gauge-label";
      rLabel.textContent = "RAM";

      const rBar = document.createElement("div");
      rBar.className = "gauge-bar";

      const rFill = document.createElement("div");
      rFill.className = "gauge-fill";
      rFill.style.width = "0%";
      rFill.style.background = "linear-gradient(90deg, #9d00ff, rgba(157,0,255,0.6))";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          rFill.style.width = Math.min(100, (model.recommendedRamGb / 160) * 100) + "%";
        });
      });

      rBar.appendChild(rFill);

      const rVal = document.createElement("span");
      rVal.className = "gauge-value";
      rVal.textContent = model.recommendedRamGb + " GB";

      ramRow.appendChild(rLabel);
      ramRow.appendChild(rBar);
      ramRow.appendChild(rVal);
      card.appendChild(ramRow);
    }

    // ─ Badges
    const badges = document.createElement("div");
    badges.className = "badges";
    badges.style.marginTop = "12px";

    // Open/Closed
    const openBadge = document.createElement("span");
    openBadge.className = model.open === true
      ? "badge badge--open"
      : "badge badge--closed";
    openBadge.textContent = model.open === true ? I18N.t("badge_open") : I18N.t("badge_closed");
    badges.appendChild(openBadge);

    // MoE
    if (model.moe === true) {
      const moeBadge = document.createElement("span");
      moeBadge.className = "badge badge--moe";
      moeBadge.textContent = I18N.t("badge_moe");
      badges.appendChild(moeBadge);
    }

    // Modalities
    const mods = Array.isArray(model.modalities) ? model.modalities : [];
    mods.slice(0, 3).forEach((m) => {
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = safeText(m);
      badges.appendChild(b);
    });

    // License
    if (model.license) {
      const licBadge = document.createElement("span");
      licBadge.className = "badge";
      licBadge.textContent = "📜 " + safeText(model.license);
      badges.appendChild(licBadge);
    }

    card.appendChild(badges);

    const goToDetails = () => {
      const id = model && (model.id !== undefined && model.id !== null) ? String(model.id).trim() : "";
      if (id && typeof Router !== "undefined" && Router.toModelDetails) Router.toModelDetails(id);
    };

    // ─ Details Button
    const btn = document.createElement("button");
    btn.className = "card-details-btn";
    btn.textContent = I18N.getSavedLang() === "ar" ? "عرض التفاصيل" : "View Details";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      goToDetails();
    });
    card.appendChild(btn);

    // ─ Card click
    card.addEventListener("click", (e) => {
      if (e.target === btn) return;
      goToDetails();
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") goToDetails();
    });

    return card;
  }

  // ─── Load Data ───
  let allModels = [];
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

  // ─── Filters ───
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

    if (countLabel) {
      const label = I18N.t("models_count");
      countLabel.textContent = label + ": " + filtered.length;
    }

    while (grid.firstChild) grid.removeChild(grid.firstChild);
    if (filtered.length === 0) {
      if (emptyState) {
        emptyState.style.display = "block";
        emptyState.textContent = I18N.t("empty");
      }
    } else {
      if (emptyState) emptyState.style.display = "none";
      filtered.forEach((m) => grid.appendChild(buildCard(m)));
    }
  }

  // Events
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

  // Initial render
  applyFilters();
});