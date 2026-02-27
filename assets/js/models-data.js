/**
 * models-data.js
 * مسؤول عن جلب بيانات النماذج من assets/data/models.json
 * ملاحظة أمنية:
 * - لا ننفذ أي نصوص، فقط JSON
 */

const ModelsData = (() => {
    async function loadModels() {
      const res = await fetch("assets/data/models.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load models.json");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("models.json must be an array");
      return data;
    }
  
    return { loadModels };
  })();