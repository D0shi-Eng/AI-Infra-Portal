/**
 * router.js
 * مسؤول عن:
 * - بناء رابط تفاصيل النموذج بطريقة آمنة
 */

const Router = (() => {
  function toModelDetails(id) {
    if (id === null || id === undefined || String(id).trim() === "") return;
    const safeId = encodeURIComponent(String(id).trim());
    const base = new URL(location.href);
    const dir = base.pathname.replace(/\/?[^/]*$/, "") || "/";
    base.pathname = (dir === "/" ? "" : dir) + "/model.html";
    base.search = "?id=" + safeId;
    location.href = base.toString();
  }

  function getQueryParam(name) {
    const url = new URL(location.href);
    return url.searchParams.get(name);
  }

  return { toModelDetails, getQueryParam };
})();