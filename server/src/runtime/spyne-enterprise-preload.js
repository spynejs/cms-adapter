// --- Spyne Enterprise Preload ---
// Runs before entry.js, replaces DomElementTemplate in Webpack cache if enterprise code is available.
const { loadEDET } = require("../utils/load-edet.js");

console.log("🛠️ c executed.");

// Attempt to load any saved enterprise DomElementTemplate before waiting for live code injection
loadEDET();

  //console.log("🛠️ Spyne Enterprise Preload script executed.");

(function waitForWebpack(startTime = Date.now()) {
  const MAX_WAIT_TIME = 5000; // max 5 seconds
  const RETRY_INTERVAL = 100; // retry every 100ms

  if (typeof __webpack_require__ !== "undefined" && __webpack_require__.c) {
    const cache = __webpack_require__.c;
    //console.log("CACHE IS", cache);

    try {
      // Enterprise code must already be injected into the HTML or DefinePlugin

      const enterpriseCode =
          (typeof window !== "undefined" && window.SpyneEnterpriseCode) || null;
      if (!enterpriseCode) return;

      const entry = Object.entries(cache).find(([id]) =>
          /dom-element-template\.js$/.test(id)
      );

      //console.log("ENTRY EDOD IS ",entry)

      if (!entry) return;

      const [moduleId, moduleObj] = entry;
      const enterpriseModule = { exports: {} };
      const loaderFn = new Function("module", "exports", "require", enterpriseCode);
      loaderFn(enterpriseModule, enterpriseModule.exports, __webpack_require__);

      if (
          enterpriseModule.exports &&
          enterpriseModule.exports.DomElementTemplate
      ) {
        cache[moduleId] = enterpriseModule;
        console.log("🧩 Pre-entry: DomElementTemplate swapped with enterprise version.");
      }
    } catch (err) {
      console.error("❌ Failed to preload enterprise DomElementTemplate:", err);
    }

  } else if (Date.now() - startTime < MAX_WAIT_TIME) {
    setTimeout(() => waitForWebpack(startTime), RETRY_INTERVAL);
  } else {
    console.warn("⚠️ Spyne Enterprise Preload: __webpack_require__ not available after waiting.");
  }
})();
