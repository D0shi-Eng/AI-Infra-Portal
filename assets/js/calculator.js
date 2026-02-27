/**
 * calculator.js
 * حاسبة VRAM/RAM محسّنة مع عرض بصري (أشرطة تقدم)
 */

document.addEventListener("DOMContentLoaded", () => {
  const paramsB = document.getElementById("paramsB");
  const quant = document.getElementById("quant");
  const contextK = document.getElementById("contextK");
  const btn = document.getElementById("calcBtn");
  const out = document.getElementById("calcOut");

  const bytesPerParam = {
    fp16: 2.0,
    int8: 1.0,
    q6: 0.75,
    q5: 0.65,
    q4: 0.55,
  };

  function round1(x) {
    return Math.round(x * 10) / 10;
  }

  function L(ar, en) {
    try {
      return (typeof I18N !== "undefined" && I18N.getSavedLang && I18N.getSavedLang() === "ar") ? ar : en;
    } catch { return ar; }
  }

  function createBar(container, label, value, maxVal, colorClass) {
    const row = document.createElement("div");
    row.className = "gauge-row";
    row.style.margin = "10px 0";

    const lbl = document.createElement("span");
    lbl.className = "gauge-label";
    lbl.style.minWidth = "100px";
    lbl.textContent = label;

    const bar = document.createElement("div");
    bar.className = "gauge-bar";

    const fill = document.createElement("div");
    fill.className = "gauge-fill";
    if (colorClass) fill.style.background = colorClass;
    fill.style.width = "0%";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fill.style.width = Math.min(100, (value / maxVal) * 100) + "%";
      });
    });

    bar.appendChild(fill);

    const val = document.createElement("span");
    val.className = "gauge-value";
    val.style.minWidth = "70px";
    val.textContent = "~ " + round1(value) + " GB";

    row.appendChild(lbl);
    row.appendChild(bar);
    row.appendChild(val);
    container.appendChild(row);
  }

  function calc() {
    while (out.firstChild) out.removeChild(out.firstChild);

    const pB = Number(paramsB.value || 0);
    const q = quant.value;
    const ctxK = Number(contextK.value || 0);

    const bpp = bytesPerParam[q] ?? 0.55;

    const weightsGB = (pB * 1e9 * bpp) / (1024 ** 3);
    const kvOverGB = Math.max(0, (ctxK / 8) * (pB / 7) * 0.8);
    const runtimeOverGB = Math.max(2, weightsGB * 0.15);
    const estimatedVram = weightsGB + kvOverGB + runtimeOverGB;
    const estimatedRam = Math.max(16, estimatedVram * 1.4);

    // Results title
    const title = document.createElement("div");
    title.style.cssText = "font-size:1.1rem; font-weight:800; margin-bottom:16px;";
    title.textContent = L("📊 نتائج التقدير", "📊 Estimation Results");
    out.appendChild(title);

    // VRAM bar
    createBar(out, L("VRAM المقدّر", "Est. VRAM"), estimatedVram, 80, null);

    // RAM bar
    createBar(out, L("RAM المقدّر", "Est. RAM"), estimatedRam, 160, "linear-gradient(90deg, #9d00ff, rgba(157,0,255,0.6))");

    // Divider
    const divider = document.createElement("div");
    divider.className = "card-divider";
    divider.style.margin = "18px 0";
    out.appendChild(divider);

    // Breakdown
    const breakTitle = document.createElement("div");
    breakTitle.style.cssText = "font-weight:700; margin-bottom:10px; font-size:0.92rem; opacity:0.8;";
    breakTitle.textContent = L("التفصيل:", "Breakdown:");
    out.appendChild(breakTitle);

    const items = [
      { label: L("ذاكرة الأوزان", "Weights Memory"), val: weightsGB },
      { label: L("هامش KV/سياق", "KV/Context Cache"), val: kvOverGB },
      { label: L("هامش التشغيل", "Runtime Overhead"), val: runtimeOverGB },
    ];

    const list = document.createElement("ul");
    list.className = "spec-list";

    items.forEach((item) => {
      const li = document.createElement("li");
      const k = document.createElement("span");
      k.className = "spec-key";
      k.textContent = item.label;
      const v = document.createElement("span");
      v.className = "spec-val";
      v.textContent = "~ " + round1(item.val) + " GB";
      li.appendChild(k);
      li.appendChild(v);
      list.appendChild(li);
    });

    out.appendChild(list);

    // Note
    const note = document.createElement("p");
    note.className = "muted";
    note.style.cssText = "margin-top:16px; font-size:0.85rem; line-height:1.7;";
    note.textContent = L(
      "⚠️ هذه تقديرات عملية وقد تختلف حسب المحرك (vLLM/llama.cpp) والكوانتايز الفعلي وطول السياق الحقيقي.",
      "⚠️ Practical estimates — varies by engine (vLLM/llama.cpp), real quantization, and context length."
    );
    out.appendChild(note);

    // GPU recommendation
    const gpuHint = document.createElement("div");
    gpuHint.style.cssText = "margin-top:12px; padding:12px 16px; border-radius:12px; border:1px solid rgba(0,245,255,0.15); background:rgba(0,245,255,0.04); font-size:0.88rem;";

    let rec = "";
    if (estimatedVram <= 8) rec = L("✅ مناسب لـ RTX 4060 (8GB)", "✅ Fits RTX 4060 (8GB)");
    else if (estimatedVram <= 12) rec = L("✅ مناسب لـ RTX 4070 (12GB)", "✅ Fits RTX 4070 (12GB)");
    else if (estimatedVram <= 16) rec = L("✅ مناسب لـ RTX 4080 (16GB)", "✅ Fits RTX 4080 (16GB)");
    else if (estimatedVram <= 24) rec = L("✅ مناسب لـ RTX 4090 (24GB)", "✅ Fits RTX 4090 (24GB)");
    else if (estimatedVram <= 48) rec = L("⚡ يحتاج RTX 6000 Ada (48GB) أو Multi-GPU", "⚡ Needs RTX 6000 Ada (48GB) or Multi-GPU");
    else rec = L("🔴 يحتاج A100/H100 (80GB) أو Multi-GPU", "🔴 Needs A100/H100 (80GB) or Multi-GPU");

    gpuHint.textContent = rec;
    out.appendChild(gpuHint);
  }

  btn.addEventListener("click", calc);
  calc();
});