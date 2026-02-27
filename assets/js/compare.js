/**
 * compare.js
 * مسؤول عن:
 * - تحميل قائمة كروت الشاشة من assets/data/hardware.json
 * - تعبئة القائمتين المنسدلتين GPU A و GPU B
 * - عرض مقارنة عملية (VRAM + توصية + ملاحظات)
 *
 * ملاحظات أمنية:
 * - لا نستخدم innerHTML إطلاقاً لتجنب XSS
 * - نبني DOM بعناصر آمنة (textContent)
 */

document.addEventListener("DOMContentLoaded", async () => {
  const gpuASelect = document.getElementById("gpuA");
  const gpuBSelect = document.getElementById("gpuB");
  const compareBtn = document.getElementById("cmpBtn");

  const aMeta = document.getElementById("aMeta");
  const bMeta = document.getElementById("bMeta");
  const verdict = document.getElementById("verdict");

  // تأكد أن هذه الصفحة هي compare.html (وجود العناصر يعني أنها الصفحة الصحيحة)
  if (!gpuASelect || !gpuBSelect || !compareBtn || !aMeta || !bMeta || !verdict) return;

  /**
   * تفريغ عنصر DOM من أبنائه
   */
  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  /**
   * إضافة سطر معلومات بشكل آمن
   */
  function addLine(container, label, value) {
    const line = document.createElement("span");
    line.textContent = `• ${label}: ${value}`;
    container.appendChild(line);
  }

  /**
   * نصوص حسب اللغة الحالية (عربي/إنجليزي)
   */
  function L(ar, en) {
    try {
      return (typeof I18N !== "undefined" && I18N.getSavedLang && I18N.getSavedLang() === "ar") ? ar : en;
    } catch {
      return ar; // افتراضي عربي
    }
  }

  /**
   * تحويل VRAM إلى رقم آمن
   */
  function toNumber(n) {
    const x = Number(n);
    return Number.isFinite(x) ? x : 0;
  }

  // تحميل بيانات GPU
  let gpus = [];
  try {
    if (typeof HardwareData === "undefined" || !HardwareData.loadHardware) {
      verdict.textContent = "HardwareData is missing. Ensure hardware-data.js is loaded before compare.js";
      return;
    }

    gpus = await HardwareData.loadHardware();
  } catch (err) {
    verdict.textContent = L("فشل تحميل بيانات كروت الشاشة (hardware.json).", "Failed to load GPU data (hardware.json).");
    return;
  }

  if (!Array.isArray(gpus) || gpus.length === 0) {
    verdict.textContent = L("لا توجد بيانات GPU حالياً.", "No GPU data found.");
    return;
  }

  /**
   * تعبئة select بقائمة GPUs
   */
  function fillSelect(select) {
    clear(select);

    gpus.forEach((gpu, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);

      const name = gpu?.name ? String(gpu.name) : `GPU ${idx + 1}`;
      const vram = gpu?.vramGb != null ? `${gpu.vramGb}GB` : "?GB";

      opt.textContent = `${name} (${vram})`;
      select.appendChild(opt);
    });
  }

  fillSelect(gpuASelect);
  fillSelect(gpuBSelect);

  // اختيار افتراضي: A=الأول، B=الثاني (إن وجد)
  gpuASelect.value = "0";
  gpuBSelect.value = String(Math.min(1, gpus.length - 1));

  /**
   * بناء مقارنة فعلية
   */
  function computeComparison() {
    const aIdx = Number(gpuASelect.value);
    const bIdx = Number(gpuBSelect.value);

    const A = gpus[aIdx];
    const B = gpus[bIdx];

    if (!A || !B) return;

    // عرض تفاصيل A و B
    clear(aMeta);
    clear(bMeta);

    addLine(aMeta, L("الاسم", "Name"), A.name || "-");
    addLine(aMeta, L("VRAM", "VRAM"), A.vramGb != null ? `${A.vramGb}GB` : "-");
    addLine(aMeta, L("الأنسب لـ", "Best For"), A.recommended || "-");
    addLine(aMeta, L("ملاحظات", "Notes"), A.notes || "-");

    addLine(bMeta, L("الاسم", "Name"), B.name || "-");
    addLine(bMeta, L("VRAM", "VRAM"), B.vramGb != null ? `${B.vramGb}GB` : "-");
    addLine(bMeta, L("الأنسب لـ", "Best For"), B.recommended || "-");
    addLine(bMeta, L("ملاحظات", "Notes"), B.notes || "-");

    // حكم المقارنة
    const aV = toNumber(A.vramGb);
    const bV = toNumber(B.vramGb);

    if (aV === 0 && bV === 0) {
      verdict.textContent = L(
        "لا توجد معلومات VRAM كافية للحكم. حدّث hardware.json وأعد المحاولة.",
        "Not enough VRAM data to judge. Update hardware.json and try again."
      );
      return;
    }

    if (aV === bV) {
      verdict.textContent = L(
        "كلاهما متقارب في VRAM. اختر حسب السعر، التوفر، استهلاك الطاقة، والتبريد.",
        "Both are similar in VRAM. Choose based on price, availability, power, and thermals."
      );
      return;
    }

    const winner = aV > bV ? "A" : "B";
    const diff = Math.abs(aV - bV);

    // توصية عامة مرتبطة بالحجم
    const hint =
      diff >= 24
        ? L("فرق كبير — مناسب للنماذج الضخمة والسياق الطويل.", "Big gap — better for large models and long context.")
        : diff >= 8
        ? L("فرق واضح — أفضل لتجربة نماذج أكبر بأريحية.", "Clear gap — better for running larger models comfortably.")
        : L("فرق بسيط — قد يكون السعر والتبريد أهم من فرق VRAM هنا.", "Small gap — price and thermals may matter more here.");

    verdict.textContent = L(
      `GPU ${winner} يتفوق بـ +${diff}GB VRAM. ${hint}`,
      `GPU ${winner} wins by +${diff}GB VRAM. ${hint}`
    );
  }

  // أحداث
  compareBtn.addEventListener("click", computeComparison);

  // تحديث مباشر عند تغيير الاختيار
  gpuASelect.addEventListener("change", computeComparison);
  gpuBSelect.addEventListener("change", computeComparison);

  // أول تشغيل
  computeComparison();
});