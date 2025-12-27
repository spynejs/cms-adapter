// --- Spyne EDET Loader ---
// Loads and applies the Enterprise DomElementTemplate module from registry if available.

// --- Spyne EDET Loader ---
// Loads enterprise DomElementTemplate if user has edet in registry.

async function loadEDET() {
  try {
    const res = await fetch("http://localhost:52931/registry/all"); // or /registry/lookup?dir=...
    if (!res.ok) return console.warn("⚠️ EDET: Failed to fetch registry info.");
    const registry = await res.json();

    const codeEncoded = registry.user?.edet;
    if (!codeEncoded) {
      console.log("🧩 No EDET code stored in registry.");
      return;
    }

    const edetCode = atob(codeEncoded); // base64 decode in browser

    const cache = __webpack_require__.c;
    const entry = Object.entries(cache).find(([id]) =>
        /dom-element-template\.js$/.test(id)
    );
    if (!entry) {
      console.warn("⚠️ EDET: DomElementTemplate module not found in cache.");
      return;
    }

    const [moduleId] = entry;
    const enterpriseModule = { exports: {} };
    const loaderFn = new Function("module", "exports", "require", edetCode);
    loaderFn(enterpriseModule, enterpriseModule.exports, __webpack_require__);

    if (enterpriseModule.exports?.DomElementTemplate) {
      cache[moduleId] = enterpriseModule;
      console.log("✅ EDET loaded and swapped successfully.");
    }
  } catch (err) {
    console.error("❌ Failed to load EDET:", err);
  }
}

module.exports = { loadEDET }
