/**
 * router.js
 * مسؤول عن:
 * - بناء رابط تفاصيل النموذج بطريقة آمنة
 */

const Router = (() => {
    function toModelDetails(id) {
      const safeId = encodeURIComponent(String(id || ""));
      location.href = `model.html?id=${safeId}`;
    }
  
    function getQueryParam(name) {
      const url = new URL(location.href);
      return url.searchParams.get(name);
    }
  
    return { toModelDetails, getQueryParam };
  })();