#!/usr/bin/env node

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const mustacheExpress = require('mustache-express');
const path = require('path');
const net = require('net');
const bodyParser = require("body-parser");
const zlib = require('zlib'); // For gzip decompression

const SpyneRegistry = require('./src/spyne-registry');

const {
  authCallbackHandler,
  authStatusHandler,
    readRegistry,
    revealObscure, obscurePlain
} = require("./src/utils/registry-auth")
const registryAuth = require("./src/utils/registry-auth");

const { verifySpyneAuthToken } = require('./src/utils/server-spyne-auth-verify');

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 52931;

class ServerSpyneRegistryApp {
  constructor(serverOptions = {}, autoStart = false) {
    this.host = serverOptions.host || DEFAULT_HOST;
    this.port = serverOptions.port || DEFAULT_PORT;
    this.app = express();
    this.registry = new SpyneRegistry();

    // -------------------------------
    //  Express / Middleware setup
    // -------------------------------
    this.app.use(express.json({ limit: '25mb' }));
    this.app.use(express.urlencoded({ extended: false, limit: '25mb' }));
    this.app.use(cors());

    this.app.use(bodyParser.json({ limit: "2mb" }));
    this.app.use(bodyParser.urlencoded({ extended: true, limit: "2mb" }));
    this.app.get("/auth/callback", authCallbackHandler);
    this.app.post("/auth/callback", authCallbackHandler);
    this.app.get("/auth/status", authStatusHandler);


    // View engine
    this.app.engine('mustache', mustacheExpress());
    this.app.set('view engine', 'mustache');
    this.app.set('views', path.join(__dirname, 'views'));


    // Manage enterprise DomElementTemplate (EDET)
    this.app.post("/registry/edet/add",    this.addEDET.bind(this));
    this.app.post("/registry/edet/remove", this.removeEDET.bind(this));
// 🧪 Testing helper — simulate EDET setup
    this.app.post("/registry/edet/test-setup", this.testSetupEDET.bind(this));

    // Static files
    this.app.use(express.static(path.join(__dirname, 'public')));

    // Bind methods to preserve context
    this.appGetIndexPage = this.appGetIndexPage.bind(this);
    this.getAllEntries = this.getAllEntries.bind(this);
    this.getEntryByDir = this.getEntryByDir.bind(this);
    this.appVerifyToken = this.appVerifyToken.bind(this);
    this.registerEntry = this.registerEntry.bind(this);
    this.deleteEntry = this.deleteEntry.bind(this);


    // -------------------------------
    //  Routes
    // -------------------------------
    this.app.get('/', this.appGetIndexPage);

    // Core API routes
    this.app.get('/registry/all', this.getAllEntries);
    this.app.get('/registry/lookup', this.getEntryByDir); // ?dir=<path>
   // this.app.get('/auth/callback', this.appVerifyToken);

    this.app.post('/registry/register', this.registerEntry);

    this.app.post("/auth/callback/test", (req, res) => {
      res.send("Hello World from test");
    });

    // ⚙️ Testing-only route to clear user auth info
    this.app.post('/auth/clear', this.clearUserAuth.bind(this));
    this.app.post('/auth/clear/premium', this.clearUserPremiumRole.bind(this));

    this.app.delete('/registry/remove', this.deleteEntry);


    // Generic 404 handler
    this.app.use((req, res) => res.status(404).send('Not Found'));
    // Error handler
    this.app.use((err, req, res, next) => {
      console.error('Registry server error:', err);
      res.status(500).send('Internal Server Error');
    });

    if (autoStart) this.startServer();
  }

  startServer() {
    this._server = this.app.listen(this.port, this.host, (err) => {
      if (err) {
        console.error('❌ Failed to start Spyne Registry:', err);
      } else {
        console.log(`🧩 Spyne Registry listening at http://${this.host}:${this.port}`);
      }
    });
  }

  stopServer() {
    if (this._server) {
      this._server.close(() => console.log('🛑 Spyne Registry server closed'));
    }
  }



  /**
   * For testing purposes — encodes a given EDET source string and writes it
   * into the registry (simulates authenticated user with enterprise code).
   */
  testSetupEDET(req, res) {
    try {
      const registryPath = path.join(require("os").homedir(), ".spyne-dev-registry.json");
      if (!fs.existsSync(registryPath)) {
        return res.status(404).json({ error: "Registry file not found" });
      }

      // Either get code from request body or use default test EDET block
      const { edetSource } = req.body;
      if (!edetSource || typeof edetSource !== "string") {
        return res.status(400).json({ error: "Missing edetSource string." });
      }

      // Base64 encode the provided code
      const encoded = Buffer.from(edetSource, "utf8").toString("base64");

      // Read and update registry
      const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
      if (!registry.user) registry.user = {};
      registry.user.edet = encoded;
      registry.user.updated = Date.now();

      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), { mode: 0o600 });
      console.log("🧩 Test EDET setup complete.");

      return res.json({
        ok: true,
        message: "Test EDET encoded and saved to registry.",
        preview: encoded.slice(0, 80) + "..."
      });
    } catch (err) {
      console.error("❌ Failed to setup EDET:", err.message);
      return res.status(500).json({ error: "Failed to setup EDET." });
    }
  }


  addEDET(req, res) {
    try {
      const registryPath = path.join(require("os").homedir(), ".spyne-dev-registry.json");
      if (!fs.existsSync(registryPath)) {
        return res.status(404).json({ error: "Registry file not found" });
      }

      const { edet } = req.body;
      if (!edet || typeof edet !== "string") {
        return res.status(400).json({ error: "Missing or invalid edet string" });
      }

      let decodedEdet = null;
      // Try to decode as gzipped base64 first, fallback to normal base64
      try {
        // base64 decode
        const gzippedBuffer = Buffer.from(edet, 'base64');
        // Try gunzip
        decodedEdet = zlib.gunzipSync(gzippedBuffer).toString('utf8');
        console.log("🗜️ EDET gzip decompression succeeded.");
      } catch (gzipErr) {
        // If gunzip fails, fallback to normal base64
        try {
          decodedEdet = Buffer.from(edet, 'base64').toString('utf8');
        } catch (innerErr) {
          console.error("❌ Failed to decode EDET as base64:", innerErr.message);
          return res.status(400).json({ error: "Invalid EDET data: not valid base64 or gzip." });
        }
      }

      const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

      if (!registry.user) registry.user = {};
      // Save as the original base64 string (for compatibility), but could also save decodedEdet if desired
      registry.user.edet = edet;
      registry.user.updated = Date.now();

      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), { mode: 0o600 });

      console.log("💾 Added or updated EDET in registry.");
      return res.json({ ok: true, message: "EDET added or updated." });
    } catch (err) {
      console.error("❌ Failed to add EDET:", err.message);
      return res.status(500).json({ error: "Failed to add EDET." });
    }
  }




  /**
   * Removes the EDET code from the registry file.
   */
  removeEDET(req, res) {
    try {
      const registryPath = path.join(require("os").homedir(), ".spyne-dev-registry.json");
      if (!fs.existsSync(registryPath)) {
        return res.status(404).json({ error: "Registry file not found" });
      }

      const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
      if (registry.user && registry.user.edet) {
        delete registry.user.edet;
        registry.user.updated = Date.now();
        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), { mode: 0o600 });
        console.log("🧹 Removed EDET from registry.");
        return res.json({ ok: true, message: "EDET removed from registry." });
      }

      return res.json({ ok: false, message: "No EDET entry found to remove." });
    } catch (err) {
      console.error("❌ Failed to remove EDET:", err.message);
      return res.status(500).json({ error: "Failed to remove EDET." });
    }
  }


  async appVerifyToken(req, res) {
    let { token } = req.query;

    try {
      if (!token) {
        return res.status(400).send("Missing token");
      }

      // 🔹 Try to decode base64 + gunzip
      try {
        const compressed = Buffer.from(token, "base64");
        const uncompressed = zlib.gunzipSync(compressed).toString("utf8");
        token = uncompressed; // replace with real JWT
        console.log("🗜️ Token successfully decompressed.");
      } catch (gzipErr) {
        console.log("⚠️ Token not gzipped or already plain JWT — skipping gunzip.");
      }

      // Now verify normally
      const payload = await verifySpyneAuthToken(token);

      const registryPath = path.join(require('os').homedir(), '.spyne-dev-registry.json');
      const registry = fs.existsSync(registryPath)
          ? JSON.parse(fs.readFileSync(registryPath, 'utf8'))
          : {};

      registry.auth = { ...payload, updated: Date.now() };
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

      res.send('<h3>✅ Spyne login successful. You can close this tab.</h3>');
    } catch (err) {
      console.error("Auth verification failed:", err.message);
      res.status(401).send(`❌ Login failed: ${err.message}`);
    }
  }

  async appGetIndexPage(req, res) {
    const registry = readRegistry();
    let userBlock = null;

    if (registry.user) {
      try {
        const codePlain = revealObscure(registry.user.code);
        const role = registryAuth.CODE_TO_ROLE[String(codePlain)] || "unknown";

        userBlock = {
          name: registry.user.name,
          email: registry.user.email,
          picture: registry.user.picture,
          role,
          rolePremium: role !== "free" && role !== "unknown",
          updated: new Date(registry.user.updated).toLocaleString(),
        };
      } catch (e) {
        console.warn("Unable to decode user block:", e.message);
      }
    }

    const view = {
      hasUser: !!userBlock,
      user: userBlock,
      registryList: Object.entries(registry.applications || {}).map(
          ([dir, app]) => ({
            dir,
            cmsHost: app.cms?.host,
            cmsPort: app.cms?.port,
            updated: new Date(app.cms?.updated).toLocaleString(),
          })
      ),
      data: JSON.stringify(registry, null, 2),
    };

    const template = fs.readFileSync(
        path.join(__dirname, "views/index-registry.mustache"),
        "utf8"
    );
   // const html = Mustache.render(template, view);
  //  res.send(html);

    res.render('index-registry', view);
  }

  // -------------------------------
  //  Registry API Routes
  // -------------------------------

  getAllEntries(req, res) {
    this.registry.registry = this.registry._readRegistryFile();
    const data = this.registry.getAll();
    res.json(data);
  }


  getEntryByDir(req, res) {


    try {
      // 🧭 Read registry and check for app entry
      this.registry.registry = this.registry._readRegistryFile();
      const dir = req.query.dir;
      if (!dir) return res.status(400).json({ error: "Missing ?dir parameter" });

      const entry = this.registry.get(dir);
      if (!entry) return res.status(404).json({ error: "Entry not found" });

      // 🔐 Load full registry for user info
      const registry = this.registry._readRegistryFile();

      let userInfo = {
        isAuthenticated: false,
        name: null,
        picture: null,
        role: "unknown",
      };



      try {
        if (registry.user) {
          let role = registry.user.role || "unknown";

          // Always prefer decoded code if it exists and maps to a known role
          if (registry.user.code) {
            const codePlain = revealObscure(registry.user.code);
            const mappedRole = registryAuth.CODE_TO_ROLE[String(codePlain)];
            if (mappedRole) role = mappedRole;
          }

          const rawEdet = registry.user.edet;
          let edet = null;

            // Ensure EDET is always a base64 string
          if (rawEdet) {
            if (Buffer.isBuffer(rawEdet)) {
              edet = rawEdet.toString("base64");
            } else if (typeof rawEdet === "object" && rawEdet.type === "Buffer" && Array.isArray(rawEdet.data)) {
              edet = Buffer.from(rawEdet.data).toString("base64");
            } else if (typeof rawEdet === "string") {
              edet = rawEdet;
            }
          }


          const expected = obscurePlain( `${registry.user.email}:${registry.user.edet}:${registry.user.code}`);
          if (registry.user.checksum !== expected) {
            console.warn("⚠️ Role mismatch — possible manual edit detected.");
            //registry.user.role = "free"; // auto-reset
          }



          const name = registry?.user?.name || 'Anonymous';
          const picture = registry?.user?.picture || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAIAAAC2BqGFAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAeKADAAQAAAABAAAAeAAAAAAI4lXuAAABjElEQVR4Ae3SsQkAIQAEwfdbNTO2f8Qi3GiugYXhxlz7s/cC//uEwhUAHf0ANOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4NOhIIMp4dAR9ADk5AjFaww+RAAAAAElFTkSuQmCC';


          userInfo = {
            isAuthenticated: true,
            name,
            picture,
            role,
            edet,
          };
        }
      } catch (decodeErr) {
        console.warn("⚠️ Failed to decode user info:", decodeErr.message);
      }





      // ✅ Combine registry entry with user info
      const response = {
        ...entry,
        user: userInfo,
      };

      console.log("📦 Registry lookup response:", response);
      return res.json(response);
    } catch (err) {
      console.error("❌ Failed to process /registry/lookup:", err.message);
      return res.status(500).json({ error: "Internal registry lookup error." });
    }
  }


  registerEntry(req, res) {
    const { dir, host, port, type = 'cms' } = req.body;
    if (!dir || !port) {
      return res.status(400).json({ error: 'Missing dir/port' });
    }
    this.registry.registerService(dir, host, port, type);
    res.json({ ok: true });
  }

  deleteEntry(req, res) {
    const dir = req.body.dir || req.query.dir;
    if (!dir) return res.status(400).json({ error: 'Missing dir parameter' });
    this.registry.delete(dir);
    res.json({ ok: true });
  }


  /** Clears user authentication info from registry (for testing).
  *   Useful for simulating a fresh unauthenticated state.
  */
  clearUserAuth(req, res) {
    try {
      const registryPath = path.join(require('os').homedir(), '.spyne-dev-registry.json');

      if (!fs.existsSync(registryPath)) {
        return res.status(404).json({ error: 'Registry file not found' });
      }

      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

      // Remove the user block
      delete registry.user;

      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), { mode: 0o600 });
      console.log('🧹 Cleared user authentication info from registry.');
      res.json({ ok: true, message: 'User authentication cleared.' });
    } catch (err) {
      console.error('❌ Failed to clear user auth:', err.message);
      res.status(500).json({ error: 'Failed to clear user authentication info.' });
    }
  }

  /**
   * Clears user premium role from registry (for testing).
   * Useful for simulating a fresh unauthenticated or free-tier state.
   */
  clearUserPremiumRole(req, res) {
    try {
      const registryPath = path.join(require('os').homedir(), '.spyne-dev-registry.json');

      if (!fs.existsSync(registryPath)) {
        return res.status(404).json({ error: 'Registry file not found' });
      }

      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

      // Ensure the user object exists
      if (!registry.user) {
        registry.user = {};
      }

      // Downgrade role or clear it entirely
      registry.user.role = 'free';
      registry.user.isPremium = false;

      // Remove or invalidate any code that maps to premium
      delete registry.user.code; // ensures getEntryByDir won't decode to premium

      // Optionally clear other premium-related flags
      delete registry.user.subscription;
      delete registry.user.expiresAt;

      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), { mode: 0o600 });

      console.log('🧹 Cleared user premium role (set to free).');
      return res.json({ ok: true, message: 'User premium role downgraded to free.' });

    } catch (err) {
      console.error('❌ Failed to clear user premium role:', err.message);
      return res.status(500).json({ error: 'Failed to clear user premium role.' });
    }
  }
}








/**
 * Ensures the Spyne Registry server is running.
 * - Checks if the port is already in use.
 * - If not, starts it in the current process.
 */
const checkToStartRegistryServer = async (port = DEFAULT_PORT, host = DEFAULT_HOST) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const onConnected = () => {
      socket.destroy();
      console.log(`🧩 Spyne Registry already running at http://${host}:${port}`);
      resolve(true);
    };

    const onError = () => {
      console.log('🧩 No active Spyne Registry found, starting in current process...');
      const server = new ServerSpyneRegistryApp({ host, port });
      server.startServer();
      resolve(true);
    };

    socket.setTimeout(500);
    socket.once('connect', onConnected);
    socket.once('error', onError);
    socket.once('timeout', onError);
    socket.connect(port, host);
  });
};

module.exports = { ServerSpyneRegistryApp, checkToStartRegistryServer };

// ------------------------------------------
// CLI start (if this file is executed directly)
// ------------------------------------------
if (require.main === module) {
  const server = new ServerSpyneRegistryApp({}, true);
}
