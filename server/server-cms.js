const R = require('ramda');

const defaultOptions = {
  host: 'localhost',
  port: 9010,
  directory: '/data',
  maxSnapshotAmt: 12,
  autoStart: true
};

let _options;
let _serverApp;
let _host = 'localhost';
let _port = 9010;
let _serverStarted = false;

const { ServerApp } = require('./server-app');

class ServerCMS {
  constructor(options = {}, testMode = false) {
    _options = R.mergeLeft(options, defaultOptions);

    if (_options.dataDirectory === undefined) {
      console.warn('⚠️ Spyne Server CMS requires a Webpack resolve alias for "data".');
    }

    if (testMode === false) {
      _serverApp = new ServerApp(_options);
      this.startServer();
    }
  }

  startServer() {
    if (_serverStarted === true) {
      return;
    }

    _serverApp.startServer(_options);
    _serverStarted = true;

    // ✅ After the Express server starts, update the cookie
    //this.updateCmsCookie();
  }

  stopServer() {
    _serverApp.stopServer();
  }


  get options() {
    return _options;
  }
}

module.exports = { ServerCMS };
