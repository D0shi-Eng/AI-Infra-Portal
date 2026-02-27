/**
 * compare.js
 * مقارنة GPU محسّنة مع أشرطة بصرية وتفاصيل أغنى
 * ملاحظات أمنية: لا نستخدم innerHTML
 */

document.addEventListener("DOMContentLoaded", async () => {
  const gpuASelect = document.getElementById("gpuA");
  const gpuBSelect = document.getElementById("gpuB");
  const compareBtn = document.getElementById("cmpBtn");

  const aMeta = document.getElementById("aMeta");
  const bMeta = document.getElementById("bMeta");
  const verdict = document.getElementById("verdict");

  if (!gpuASelect || !gpuBSelect || !compareBtn || !aMeta || !bMeta || !verdict) return;

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function L(ar, en) {
    try {
      return (typeof I18N !== "undefined" && I18N.getSavedLang && I18N.getSavedLang() === "ar") ? ar : en;
    } catch {
      return ar;
    }
  }

  function toNumber(n) {
    const x = Number(n);
    return Number.isFinite(x) ? x : 0;
  }

  /**
   * بناء بطاقة GPU محسّنة مع spec list
   */
  function buildGpuCard(container, gpu, label) {
    clear(container);

    // GPU Name header
    const nameEl = document.createElement("div");
    nameEl.style.cssText = "font-size:1.2rem; font-weight:800; margin-bottom:12px;";
    nameEl.textContent = gpu.name || label;
    container.appendChild(nameEl);

    // Spec list
    const list = document.createElement("ul");
    list.className = "spec-list";

    const specs = [
      { key: "VRAM", val: gpu.vramGb ? gpu.vramGb + " GB" : "-" },
      { key: L("الأنسب لـ", "Best For"), val: gpu.recommended || "-" },
      { key: L("ملاحظات", "Notes"), val: gpu.notes || "-" },
    ];

    specs.forEach((s) => {
      const li = document.createElement("li");
      const k = document.createElement("span");
      k.className = "spec-key";
      k.textContent = s.key;
      const v = document.createElement("span");
      v.className = "spec-val";
      v.textContent = s.val;
      li.appendChild(k);
      li.appendChild(v);
      list.appendChild(li);
    });

    container.appendChild(list);

    // VRAM bar
    if (gpu.vramGb) {
      const barWrap = document.createElement("div");
      barWrap.className = "compare-bar-wrapper";
      barWrap.style.marginTop = "16px";

      const barLabel = document.createElement("div");
      barLabel.className = "compare-bar-label";
      const labelText = document.createElement("span");
      labelText.textContent = "VRAM";
      const labelVal = document.createElement("span");
      labelVal.textContent = gpu.vramGb + " GB";
      barLabel.appendChild(labelText);
      barLabel.appendChild(labelVal);

      const bar = document.createElement("div");
      bar.className = "compare-bar";

      const fill = document.createElement("div");
      fill.className = label === "GPU A" ? "compare-bar-fill compare-bar-fill--a" : "compare-bar-fill compare-bar-fill--b";
      fill.style.width = "0%";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fill.style.width = Math.min(100, (gpu.vramGb / 80) * 100) + "%";
        });
      });

      bar.appendChild(fill);
      barWrap.appendChild(barLabel);
      barWrap.appendChild(bar);
      container.appendChild(barWrap);
    }
  }

  let gpus = [];
  try {
    if (typeof HardwareData === "undefined" || !HardwareData.loadHardware) {
      verdict.textContent = "HardwareData is missing.";
      return;
    }
    gpus = await HardwareData.loadHardware();
  } catch (err) {
    verdict.textContent = L("فشل تحميل بيانات كروت الشاشة.", "Failed to load GPU data.");
    return;
  }

  if (!Array.isArray(gpus) || gpus.length === 0) {
    verdict.textContent = L("لا توجد بيانات GPU حالياً.", "No GPU data found.");
    return;
  }

  function fillSelect(select) {
    clear(select);
    gpus.forEach((gpu, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      const name = gpu?.name ? String(gpu.name) : "GPU " + (idx + 1);
      const vram = gpu?.vramGb != null ? gpu.vramGb + "GB" : "?GB";
      opt.textContent = name + " (" + vram + ")";
      select.appendChild(opt);
    });
  }

  fillSelect(gpuASelect);
  fillSelect(gpuBSelect);
  gpuASelect.value = "0";
  gpuBSelect.value = String(Math.min(1, gpus.length - 1));

  function computeComparison() {
    const aIdx = Number(gpuASelect.value);
    const bIdx = Number(gpuBSelect.value);
    const A = gpus[aIdx];
    const B = gpus[bIdx];
    if (!A || !B) return;

    buildGpuCard(aMeta, A, "GPU A");
    buildGpuCard(bMeta, B, "GPU B");

    const aV = toNumber(A.vramGb);
    const bV = toNumber(B.vramGb);

    if (aV === 0 && bV === 0) {
      verdict.textContent = L(
        "لا توجد معلومات VRAM كافية للحكم.",
        "Not enough VRAM data to judge."
      );
      return;
    }

    if (aV === bV) {
      verdict.textContent = L(
        "كلاهما متقارب في VRAM. اختر حسب السعر والتوفر والتبريد.",
        "Both are similar in VRAM. Choose based on price, availability, and thermals."
      );
      return;
    }

    const winner = aV > bV ? "A" : "B";
    const winnerName = aV > bV ? A.name : B.name;
    const diff = Math.abs(aV - bV);

    const hint =
      diff >= 24
        ? L("فرق كبير — مناسب للنماذج الضخمة والسياق الطويل.", "Big gap — better for large models and long context.")
        : diff >= 8
        ? L("فرق واضح — أفضل لتجربة نماذج أكبر بأريحية.", "Clear gap — better for running larger models comfortably.")
        : L("فرق بسيط — قد يكون السعر والتبريد أهم.", "Small gap — price and thermals may matter more.");

    verdict.textContent = L(
      "🏆 " + winnerName + " (GPU " + winner + ") يتفوق بـ +" + diff + "GB VRAM. " + hint,
      "🏆 " + winnerName + " (GPU " + winner + ") wins by +" + diff + "GB VRAM. " + hint
    );
  }

  compareBtn.addEventListener("click", computeComparison);
  gpuASelect.addEventListener("change", computeComparison);
  gpuBSelect.addEventListener("change", computeComparison);
  computeComparison();
});