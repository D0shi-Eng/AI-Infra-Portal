/**
 * compare-models.js
 * مقارنة 2–3 نماذج من models.json — عرض آمن (textContent فقط، لا innerHTML)
 */

document.addEventListener("DOMContentLoaded", async () => {
  const selectA = document.getElementById("modelSelectA");
  const selectB = document.getElementById("modelSelectB");
  const selectC = document.getElementById("modelSelectC");
  const btn = document.getElementById("modelCompareBtn");
  const tableWrap = document.getElementById("modelCompareTableWrap");
  const tableHead = document.getElementById("modelCompareTableHead");
  const tableBody = document.getElementById("modelCompareTableBody");

  if (!selectA || !selectB || !btn || !tableBody) return;

  function L(key) {
    try {
      return typeof I18N !== "undefined" && I18N.t ? I18N.t(key) : key;
    } catch { return key; }
  }

  function safeVal(v) {
    if (v === null || v === undefined) return "—";
    if (Array.isArray(v)) return v.join(", ");
    return String(v).trim() || "—";
  }

  let models = [];
  try {
    models = await ModelsData.loadModels();
  } catch {
    return;
  }

  function clearSelect(sel) {
    while (sel.firstChild) sel.removeChild(sel.firstChild);
  }

  [selectA, selectB, selectC].forEach((sel) => {
    if (!sel) return;
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = L("calc_select_model_none");
    sel.appendChild(opt0);
  });

  models.forEach((m) => {
    const name = safeVal(m.name) !== "—" ? m.name : m.id;
    [selectA, selectB, selectC].forEach((sel) => {
      if (!sel) return;
      const opt = document.createElement("option");
      opt.value = m.id || "";
      opt.textContent = name;
      sel.appendChild(opt);
    });
  });

  function getModel(id) {
    if (!id) return null;
    return models.find((m) => String(m.id || "").toLowerCase() === String(id).toLowerCase()) || null;
  }

  const rows = [
    { key: "name", labelAr: "الاسم", labelEn: "Name" },
    { key: "provider", labelAr: "الشركة", labelEn: "Provider" },
    { key: "type", labelAr: "النوع", labelEn: "Type" },
    { key: "paramsB", labelAr: "المعاملات (B)", labelEn: "Params (B)" },
    { key: "contextK", labelAr: "السياق (K)", labelEn: "Context (K)" },
    { key: "vram", labelAr: "VRAM (GB)", labelEn: "VRAM (GB)" },
    { key: "license", labelAr: "الترخيص", labelEn: "License" },
    { key: "notes", labelAr: "ملاحظات", labelEn: "Notes" },
  ];

  function render() {
    const idA = selectA.value;
    const idB = selectB.value;
    const idC = selectC ? selectC.value : "";
    const chosen = [idA, idB, idC].filter(Boolean);
    if (chosen.length < 2) {
      tableWrap.style.display = "none";
      return;
    }

    const list = [getModel(idA), getModel(idB), selectC && idC ? getModel(idC) : null].filter(Boolean);
    if (list.length < 2) {
      tableWrap.style.display = "none";
      return;
    }

    const lang = typeof I18N !== "undefined" && I18N.getSavedLang ? I18N.getSavedLang() : "ar";
    const isAr = lang === "ar";

    while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);
    if (tableHead) {
      while (tableHead.firstChild) tableHead.removeChild(tableHead.firstChild);
      const trHead = document.createElement("tr");
      const th0 = document.createElement("th");
      th0.setAttribute("scope", "col");
      th0.textContent = isAr ? "المعيار" : "Spec";
      trHead.appendChild(th0);
      list.forEach((m) => {
        const th = document.createElement("th");
        th.setAttribute("scope", "col");
        th.textContent = m.name || m.id || "";
        trHead.appendChild(th);
      });
      tableHead.appendChild(trHead);
    }

    rows.forEach((row) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.textContent = isAr ? row.labelAr : row.labelEn;
      th.setAttribute("scope", "row");
      tr.appendChild(th);

      list.forEach((model) => {
        const td = document.createElement("td");
        let val = "—";
        if (row.key === "vram") {
          const v = model.recommendedVramGb ?? model.minVramGb ?? model.vramGb ?? model.vram;
          val = safeVal(v);
        } else if (row.key === "paramsB") {
          val = model.paramsB != null ? model.paramsB + "B" : "—";
        } else if (row.key === "contextK") {
          val = model.contextK != null ? model.contextK + "K" : "—";
        } else {
          val = safeVal(model[row.key]);
        }
        td.textContent = val;
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });

    tableWrap.style.display = "block";
  }

  btn.addEventListener("click", render);
  selectA.addEventListener("change", render);
  selectB.addEventListener("change", render);
  if (selectC) selectC.addEventListener("change", render);
});
