const webpack = require('webpack');
const { ServerCMS } = require('../server/server-cms');
const { findAvailablePort } = require('../server/src/utils/find-available-port');
const SpyneRegistry  = require('../server/src/spyne-registry');
const {checkToStartRegistryServer} = require("../server/server-spyne-registry-app");
const getPortModule = require('get-port'); // or './path/to/your/module'
const getPort = getPortModule.default || getPortModule;


const {portNumbers} = require('get-port');

const pluginName = "SpyneCmsServerWebpackPlugin";

module.exports = class SpyneCmsServerWebpackPlugin {
  constructor(config={ host: 'localhost', port: 8223}) {
    this._host = config.host;
    this._requestedPort = config.port;
    this._requestedPortEnd = Number(config.port)+20;
    this._cmsServer = null;
  }

  async getPortOld() {
    if (this._requestedPort) return this._requestedPort;
    try {
      return await findAvailablePort(8223, 10);
    } catch (e) {
      console.warn('⚠️ Port find error', e);
      return 3010;
    }
  }



  apply(compiler) {
    compiler.hooks.emit.tapPromise(pluginName, async (compilation) => {
      // 🚦 Prevent starting the server more than once
      if (this._cmsServer && this._cmsServer.isRunning) {
        return;
      }

      const host = this._host;
      //const port = await this.getPort();




      const port = await getPort({port: portNumbers(this._requestedPort, this._requestedPortEnd)});
      console.log("get port is ",getPort, {port});

      new webpack.DefinePlugin({
        CMS_HOST_SERVER: JSON.stringify(host),
        CMS_HOST_PORT: JSON.stringify(port),
        CMS_URL: JSON.stringify(`http://${host}:${port}`),
      }).apply(compiler);

      const dataDirectory = compiler.options.resolve.alias.data;
      const serverOptions = { host, port, dataDirectory };

      console.log('🟢 CMS Server Options', serverOptions);

      this._cmsServer = new ServerCMS(serverOptions);

      // Start server only if not already running
      if (!this._cmsServer.isRunning) {
        await this._cmsServer.startServer();
        this._cmsServer.isRunning = true;
        await checkToStartRegistryServer();
        const registry = new SpyneRegistry();
        registry.registerService(process.cwd(), 'localhost', port, 'cms');
      }

    //


    });

    compiler.hooks.shutdown.tap('SpyneCmsServerWebpackPlugin', () => {
      if (this._cmsServer) {
        this._cmsServer.stopServer();
        this._cmsServer.isRunning = false;
      }
    });
  }
};
