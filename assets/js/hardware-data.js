/**
 * hardware-data.js
 * جلب بيانات الهاردوير من hardware.json
 */

const HardwareData = (() => {
    async function loadHardware() {
      const res = await fetch("assets/data/hardware.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load hardware.json");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("hardware.json must be an array");
      return data;
    }
    return { loadHardware };
  })();