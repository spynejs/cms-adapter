/**
 * registry-auth.js
 * CommonJS version for the Spyne server plugin.
 * Handles /auth/callback verification and /auth/status.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const zlib = require("zlib");

const { fetch } = require('undici');

const REGISTRY_FILE = path.join(os.homedir(), ".spyne-dev-registry.json");
const PUBLIC_KEY_URL = "https://spynejs.com/.well-known/spyne-public.pem";
const FILE_MODE = 0o600;

// ---------- Helpers ----------

// Local deterministic secret for obfuscation
function localObfuscationKey() {
  const uname = os.userInfo().username || "user";
  const host = os.hostname();
  return crypto
  .createHmac("sha256", "spyne-local-salt-v1")
  .update(`${uname}:${host}`)
  .digest();
}

// Reversible obfuscation
function obscurePlain(text) {
  const key = localObfuscationKey();
  const buf = Buffer.from(String(text), "utf8");
  const out = Buffer.allocUnsafe(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] ^ key[i % key.length];
  return out.toString("base64").replace(/=+$/, "");
}

function revealObscure(token) {
  const key = localObfuscationKey();
  const buf = Buffer.from(String(token), "base64");
  const out = Buffer.allocUnsafe(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] ^ key[i % key.length];
  return out.toString("utf8");
}

// Role <-> code mappings
const ROLE_TO_CODE = { free: 1001, premium: 2002, enterprise: 3003 };
const CODE_TO_ROLE = Object.fromEntries(
    Object.entries(ROLE_TO_CODE).map(([k, v]) => [String(v), k])
);

// ---------- Registry Helpers ----------

function readRegistry() {
  try {
    if (!fs.existsSync(REGISTRY_FILE)) {
      const initial = { user: null, applications: {} };
      writeRegistry(initial);
      return initial;
    }
    const raw = fs.readFileSync(REGISTRY_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("readRegistry error:", err);
    return { user: null, applications: {} };
  }
}

function writeRegistry(obj) {
  try {
    const tmp = REGISTRY_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), { mode: FILE_MODE });
    fs.renameSync(tmp, REGISTRY_FILE);
    fs.chmodSync(REGISTRY_FILE, FILE_MODE);
  } catch (err) {
    console.error("writeRegistry error:", err);
  }
}

function updateRegistryUser({ name, role, sub, email, picture, edet, tokenExp }) {
  const registry = readRegistry();
  const roleCode = ROLE_TO_CODE[role] || ROLE_TO_CODE.free;
  const userBlock = {
    name: name || email || "",
    code: obscurePlain(String(roleCode)),
    id: sub || "",
    email: email || "",
    picture: picture || "no picture",
    edet,
    expiresAt: String(tokenExp || 0),
    updated: Date.now(),
  };
  registry.user = userBlock;
  registry.user.checksum = obscurePlain(
      `${userBlock.email}:${userBlock.edet}:${userBlock.code}`
  );
  writeRegistry(registry);
  return registry;
}

function validatePayload(payload) {
  if (!payload || !payload.sub || !payload.email || !payload.role) return false;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) return false;
  return true;
}

// ---------- Express Handlers ----------

let _cachedPublicKey = null;
let _cachedPublicKeyTs = 0;

async function getPublicKey() {
  if (_cachedPublicKey && Date.now() - _cachedPublicKeyTs < 60 * 60 * 1000)
    return _cachedPublicKey;
  const res = await fetch(PUBLIC_KEY_URL);
  if (!res.ok) throw new Error("Failed to fetch Spyne public key");
  const pem = await res.text();
  _cachedPublicKey = pem;
  _cachedPublicKeyTs = Date.now();
  return pem;
}

/**
 * /auth/callback
 * Receives token, verifies, updates registry user block.
 */
/**
 * /auth/callback
 * Receives token, verifies, updates registry user block.
 */


async function authCallbackHandler(req, res) {
  //let token = req.query.token || (req.body && req.body.token);
  let token = req.body?.token || req.query?.token;


  if (!token) return res.status(400).send("Missing token");

  try {
    console.log("TOKEN RAW (first 120):", token.slice(0, 120));

    // --- Step 1: Clean and decode ---
    token = decodeURIComponent(token.trim());  // decode URL entities
    token = token.replace(/\s+/g, "+");        // restore '+' replaced by spaces
    token = token.replace(/^"+|"+$/g, "");     // remove stray quotes

    console.log("Cleaned token length:", token.length);

    // --- Step 2: Convert to buffer ---
    //const buf = Buffer.from(token, "base64");

    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "===".slice((normalized.length + 3) % 4);
    const buf = Buffer.from(normalized + pad, "base64");
    console.log("Normalized token (first 60):", normalized.slice(0, 60));
    console.log("Magic bytes:", buf[0].toString(16), buf[1].toString(16));

    console.log("Buffer length:", buf.length);
    console.log("Magic bytes:", buf[0].toString(16), buf[1].toString(16));

    // --- Step 3: Check gzip header ---
    if (buf[0] === 0x1f && buf[1] === 0x8b) {
      console.log("🗜️ Detected gzip compression, decompressing...");
      try {
        token = zlib.gunzipSync(buf).toString("utf8");
      } catch (gzipErr) {
        console.error("❌ Gunzip failed:", gzipErr.message);
        return res.status(400).send("Invalid gzip token data.");
      }
    } else {
      console.log("⚠️ Token not gzipped1; treating as plain JWT.");
      token = buf.toString("utf8");
    }

    // --- Step 4: Verify JWT ---
    console.log("🔑 Fetching Spyne public key...");
    const pub = await getPublicKey();

    console.log("🧩 Verifying token...");
    const payload = jwt.verify(token, pub, { algorithms: ["RS256"] });
    console.log("✅ Verified payload:", payload);

    // --- Step 5: Validate payload ---
    if (!validatePayload(payload)) {
      console.error("❌ Invalid payload structure:", payload);
      return res.status(400).send("Invalid token payload.");
    }


    // --- Step 6: Update registry ---
    updateRegistryUser({
      name: payload.name || payload.email || "Unknown",
      role: payload.role || "free",
      sub: payload.sub,
      email: payload.email,
      edet: payload.edet,
      picture: payload.picture,
      tokenExp: payload.exp || 0,
    });

    console.log("💾 Registry user updated successfully.");

    // --- Step 7: Respond success ---
    return res.send(`
      <html>
        <body style="font-family:sans-serif;text-align:center;padding:2rem;">
          <h2>✅ Login complete</h2>
          <p>Spyne registry updated successfully.</p>
          <script>setTimeout(()=>window.close(),1200)</script>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("authCallbackHandler error:", err);
    return res.status(401).send(`Authentication failed: ${err.message}`);
  }
}


/**
 * /auth/status
 * Returns safe, minimal user status.
 */
function authStatusHandler(req, res) {
  const registry = readRegistry();
  if (!registry.user) return res.json({ isAuthenticated: false });

  let role = "unknown";
  try {
    const codePlain = revealObscure(registry.user.code);
    role = CODE_TO_ROLE[String(codePlain)] || "unknown";
  } catch (e) {}

  let hint = "";
  try {
    const namePlain = revealObscure(registry.user.name);
    hint = (namePlain || "").split(" ")[0] || "";
  } catch (e) {}

  const resp = {
    isAuthenticated: true,
    role,
    userHint: hint,
    updatedAt: registry.user.updated || null,
    applicationsCount: Object.keys(registry.applications || {}).length,
  };

  res.json(resp);
}

/**
 * Internal helper for registry applications.
 */
function getApplications() {
  const registry = readRegistry();
  return registry.applications || {};
}

module.exports = {
  authCallbackHandler,
  authStatusHandler,
  getApplications,
  readRegistry,
  writeRegistry,
  revealObscure,
  obscurePlain,
  CODE_TO_ROLE
};
