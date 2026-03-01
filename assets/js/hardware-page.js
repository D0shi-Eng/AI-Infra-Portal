/**
 * hardware-page.js
 * بناء جدول سريع للهاردوير + قسم "أي نموذج يناسب كرتّي"
 */

document.addEventListener("DOMContentLoaded", async () => {
    const table = document.getElementById("hwTable");
    const gpuSelect = document.getElementById("gpuModelsSelect");
    const gpuList = document.getElementById("gpuModelsList");

    function L(ar, en) {
      try {
        return (typeof I18N !== "undefined" && I18N.getSavedLang && I18N.getSavedLang() === "ar") ? ar : en;
      } catch { return ar; }
    }
  
    function th(text) {
      const el = document.createElement("th");
      el.textContent = text;
      return el;
    }
  
    function td(text) {
      const el = document.createElement("td");
      el.textContent = text;
      return el;
    }
  
    function tr(cells) {
      const row = document.createElement("tr");
      cells.forEach((c) => row.appendChild(c));
      return row;
    }
  
    // Header
    const thead = document.createElement("thead");
    thead.appendChild(tr([
      th(L("كرت الشاشة", "GPU")),
      th(L("ذاكرة الفيديو", "VRAM")),
      th(L("النموذج الموصى به", "Recommended LLM")),
      th(L("ملاحظات", "Notes")),
    ]));
    table.appendChild(thead);
  
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
  
    let items = [];
    try {
      items = await HardwareData.loadHardware();
    } catch {
      tbody.appendChild(tr([td(L("فشل تحميل hardware.json", "Failed to load hardware.json")), td(""), td(""), td("")]));
      return;
    }
  
    items.forEach((g) => {
      tbody.appendChild(tr([
        td(g.name || "-"),
        td(g.vramGb ? `${g.vramGb}GB` : "-"),
        td(g.recommended || "-"),
        td(g.notes || "-"),
      ]));
    });

    if (gpuSelect && gpuList) {
      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = L("اختر الكرت", "Select GPU");
      gpuSelect.appendChild(opt0);
      items.forEach((g, idx) => {
        const opt = document.createElement("option");
        opt.value = String(idx);
        opt.textContent = g.name || "-";
        gpuSelect.appendChild(opt);
      });

      let models = [];
      try {
        models = await ModelsData.loadModels();
      } catch { /* ignore */ }

      function getReqVram(m) {
        const v = m.recommendedVramGb ?? m.minVramGb ?? m.vramGb ?? m.vram;
        if (v === null || v === undefined) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      }

      function renderModelsForGpu() {
        const val = gpuSelect.value;
        if (val === "") {
          gpuList.textContent = "";
          return;
        }
        const idx = parseInt(val, 10);
        const gpu = items[idx];
        const vramGb = gpu && (gpu.vramGb != null) ? Number(gpu.vramGb) : null;
        if (!Number.isFinite(vramGb)) {
          gpuList.textContent = "";
          return;
        }
        while (gpuList.firstChild) gpuList.removeChild(gpuList.firstChild);
        const suitable = models.filter((m) => {
          const need = getReqVram(m);
          if (need === null) return false;
          return need <= vramGb;
        });
        if (suitable.length === 0) {
          const p = document.createElement("p");
          p.className = "muted";
          p.textContent = L("لا توجد نماذج تناسب هذا الكرت في القاعدة.", "No models in the database fit this GPU.");
          gpuList.appendChild(p);
          return;
        }
        suitable.slice(0, 50).forEach((m) => {
          const a = document.createElement("a");
          a.href = "model.html?id=" + encodeURIComponent(String(m.id || ""));
          a.textContent = m.name || m.id || "";
          a.style.marginRight = "8px";
          a.style.marginBottom = "4px";
          a.style.display = "inline-block";
          gpuList.appendChild(a);
        });
        if (suitable.length > 50) {
          const more = document.createElement("span");
          more.className = "muted";
          more.textContent = " +" + (suitable.length - 50) + " " + (I18N.getSavedLang() === "ar" ? "أخرى" : "more");
          gpuList.appendChild(more);
        }
      }

      gpuSelect.addEventListener("change", renderModelsForGpu);
    }
  });