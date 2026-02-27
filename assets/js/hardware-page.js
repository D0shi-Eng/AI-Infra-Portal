/**
 * hardware-page.js
 * بناء جدول سريع للهاردوير
 */

document.addEventListener("DOMContentLoaded", async () => {
    const table = document.getElementById("hwTable");
    if (!table) return;
  
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
      th("GPU"),
      th("VRAM"),
      th("Recommended LLM"),
      th("Notes"),
    ]));
    table.appendChild(thead);
  
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
  
    let items = [];
    try {
      items = await HardwareData.loadHardware();
    } catch {
      tbody.appendChild(tr([td("Failed to load hardware.json"), td(""), td(""), td("")]));
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
  });