/**
 * calculator.js
 * تقدير VRAM/RAM:
 * - الفكرة: ذاكرة الأوزان + هامش للكاش/السياق/المشغل
 * - تقديرات عملية (ليست ضمان)
 */

document.addEventListener("DOMContentLoaded", () => {
    const paramsB = document.getElementById("paramsB");
    const quant = document.getElementById("quant");
    const contextK = document.getElementById("contextK");
    const btn = document.getElementById("calcBtn");
    const out = document.getElementById("calcOut");
  
    // bytes per parameter estimates
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
  
    function calc() {
      const pB = Number(paramsB.value || 0);
      const q = quant.value;
      const ctxK = Number(contextK.value || 0);
  
      const bpp = bytesPerParam[q] ?? 0.55;
  
      // weights memory: params * bytes
      const weightsGB = (pB * 1e9 * bpp) / (1024 ** 3);
  
      // overhead factors (runtime, kv-cache, fragmentation)
      // KV cache grows with context; this is a simplified practical heuristic
      const kvOverGB = Math.max(0, (ctxK / 8) * (pB / 7) * 0.8); // heuristic
      const runtimeOverGB = Math.max(2, weightsGB * 0.15);
  
      const estimatedVram = weightsGB + kvOverGB + runtimeOverGB;
  
      // RAM: usually needs more than VRAM for loaders + OS + buffers
      const estimatedRam = Math.max(16, estimatedVram * 1.4);
  
      const lang = I18N.getSavedLang();
  
      out.textContent =
        (lang === "ar"
          ? `تقدير VRAM: ~ ${round1(estimatedVram)}GB
  تقدير RAM:  ~ ${round1(estimatedRam)}GB
  
  تفصيل:
  - ذاكرة الأوزان: ~ ${round1(weightsGB)}GB
  - هامش KV/سياق:  ~ ${round1(kvOverGB)}GB
  - هامش تشغيل:    ~ ${round1(runtimeOverGB)}GB
  
  ملاحظة: هذه تقديرات عملية وقد تختلف حسب المحرك (vLLM/llama.cpp) والكوانتايز الفعلي وطول السياق الحقيقي.`
          : `Estimated VRAM: ~ ${round1(estimatedVram)}GB
  Estimated RAM:  ~ ${round1(estimatedRam)}GB
  
  Breakdown:
  - Weights:  ~ ${round1(weightsGB)}GB
  - KV/ctx:   ~ ${round1(kvOverGB)}GB
  - Runtime:  ~ ${round1(runtimeOverGB)}GB
  
  Note: Practical estimates vary by engine (vLLM/llama.cpp), real quant, and context usage.`);
  
    }
  
    btn.addEventListener("click", calc);
    calc();
  });