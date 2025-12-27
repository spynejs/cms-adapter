const path = require('path');
const fs = require('fs');
const os = require('os');

class SpyneRegistry {
  constructor() {
    this.filePath = this._resolveRegistryFile();
    this.registry = this._readRegistryFile();
  }

  // -----------------------------
  //  FILE MANAGEMENT
  // -----------------------------
  _resolveRegistryFile() {
    // 1. Environment override
    if (process.env.SPYNE_REGISTRY_PATH) {
      return process.env.SPYNE_REGISTRY_PATH;
    }

    // 2. Home directory preferred
    try {
      const home = os.homedir();
      if (home && fs.existsSync(home)) {
        const file = path.join(home, '.spyne-dev-registry.json');
        this._ensureFile(file);
        return file;
      }
    } catch (err) {
      console.warn('⚠️ Cannot access home directory:', err.message);
    }

    // 3. Fallback to tmp directory
    const tmp = os.tmpdir();
    const file = path.join(tmp, 'spyne-dev-registry.json');
    this._ensureFile(file);
    return file;
  }

  _ensureFile(file) {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(file)) fs.writeFileSync(file, '{}');
  }

  _readRegistryFile() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '{}');
    } catch (err) {
      console.warn('⚠️ Could not read registry file:', err.message);
      return {};
    }
  }

  _writeRegistryFile() {
    try {
      console.log("writing registry is ",this.registry);
      fs.writeFileSync(this.filePath, JSON.stringify(this.registry, null, 2));
    } catch (err) {
      console.warn('⚠️ Could not write registry file:', err.message);
    }
  }

  // -----------------------------
  //  CRUD OPERATIONS
  // -----------------------------
  getAll() {
    return this.registry;
  }

  get(dir) {
    return this.registry[dir] || null;
  }

  set(dir, data) {
    this.registry[dir] = { ...(this.registry[dir] || {}), ...data, updated: Date.now() };
    this._writeRegistryFile();
    return this.registry[dir];
  }

  delete(dir) {
    if (this.registry[dir]) {
      delete this.registry[dir];
      this._writeRegistryFile();
    }
  }

  clear() {
    this.registry = {};
    this._writeRegistryFile();
  }

  // -----------------------------
  //  SERVER INTEGRATION
  // -----------------------------
  /**
   * Called by CMS plugin when CMS server starts.
   * @param {string} dir - project directory
   * @param {string} host - CMS host
   * @param {number} port - CMS port
   * @param {string} type - service type (default 'cms')
   */
  registerService(dir, host, port, type = 'cms') {
    // Ensure we have a valid structure
    if (!dir) return console.warn('⚠️ registerService called without directory');

    const now = Date.now();

    // Always overwrite the specific service entry (not shallow merge)
    const existing = this.registry[dir] || {};
    existing[type] = { host, port, updated: now };

    this.registry[dir] = existing;
    this._writeRegistryFile();

    console.log(`🧩 Registered ${type} server for ${dir} → ${host}:${port}`);
  }

  /**
   * Optionally start the registry server process if not running.
   * This can spawn the spyne-registry Express app.
   */
  ensureRegistryServerStarted() {
    const net = require('net');
    const { spawn } = require('child_process');
    const REGISTRY_PORT = 52931;

    return new Promise((resolve) => {
      const client = net.createConnection({ port: REGISTRY_PORT }, () => {
        client.end();
        resolve(true);
      });

      client.on('error', () => {
        console.log('🧩 Starting Spyne Registry server...');
        const proc = spawn('node', ['server-spyne-registry.js'], {
          detached: true,
          stdio: 'ignore',
        });
        proc.unref();
        setTimeout(() => resolve(true), 500);
      });
    });
  }
}

module.exports = SpyneRegistry;
