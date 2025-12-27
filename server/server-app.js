#!/usr/bin/env node
const R = require('ramda');
const fs = require('fs');

const bodyParser = require('body-parser');
// create application/json parser
const jsonParser = bodyParser.json()
const prettier = require('prettier');

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const cors = require('cors');
const fse = require('fs-extra');
const path = require('path');
const express = require('express');
const mustacheExpress = require('mustache-express');
const {SnapshotsManager} = require('./src/snapshots-manager');
const {SnapshotsContainerView} = require('./dom-renders/snapshots-container-view');
//cms.log("RAMDA TEST IS ");

let _app = express();

const _serverOptions = {
  inflate: true,
  type: 'text/plain',
  limit: "25mb"
};
let _host = 'localhost';
let _port = 9010;
let _dataDirectory = '/';
let _snapshotsManager = new SnapshotsManager();

class ServerApp{


  constructor(serverOptions, autoStart=false) {


     _host =          serverOptions.host || _host;
     _port =          serverOptions.port || _port;
     _dataDirectory = serverOptions.dataDirectory || _dataDirectory;

     _app.use(bodyParser.raw(_serverOptions));
     _app.use(cors());
   // _app.set('view engine', 'ejs');

    _app.engine('mustache', mustacheExpress());

    _app.set('view engine', 'mustache');
    _app.set('views', __dirname + '/views');

    _app.use(express.urlencoded({ extended: false, limit:"25mb" }));
    _app.use(express.static(path.join(__dirname, 'public')));


    if (autoStart===true) {
      this.startServer();
    }

  }

  get app(){
    return _app;
  }


  startServer(){
    this._server =  _app.listen(_port, _host, function(err){
      if (err) console.log(err);
      console.log("Server listening on PORT", _port);
    });
    _app.get("/", this.appGetAdminPage);
    _app.get("/snapshot/:snapshotId", this.appGetSnapshotData);
    _app.get("/revert/:snapshotId", this.appPostRevertDataBySnapshotId);
    _app.post('/update', this.appPostUpdateDataFiles);

    _app.all('/mock/*path', express.json({ limit: '25mb' }), (req, res) => {
      const fail = req.query.fail === 'true'
      const delay = Number(req.query.delay || 0)

      const respond = () => {
        if (fail) {
          return res.status(500).json({
            ok: false,
            mock: true,
            error: 'Simulated mock failure',
            method: req.method,
            path: req.params.path
          })
        }

        res.json({
          ok: true,
          mock: true,
          method: req.method,
          path: req.params.path,
          query: req.query,
          headers: req.headers,
          received: req.body ?? null,
          timestamp: Date.now()
        })
      }

      delay > 0 ? setTimeout(respond, delay) : respond()
    })



  }

  stopServer(){
    const onServerClosed = ()=>console.log("SPYNE CMS SERVER CLOSED");
    process.on("SIGTERM", ()=>{
        if (this._server){
          this._server.close(onServerClosed);
        }
    })
  }


  async appPostUpdateDataFiles(req, res, buf){



    try{

      const {body} = req;
      const bodyIsEmpty = R.isEmpty(body);



      if (bodyIsEmpty){
        res.send('BODY IS EMPTY!');
        return;
      }
      const bufferBody = body.toString('utf8');
      const bodyJSON = JSON.parse(bufferBody);
      //console.log("buffer body is ",_dataDirectory,bodyJSON);
      try{
        await _snapshotsManager.updateFiles(bodyJSON);

      } catch(e){
        console.log("snapshot in server app went awry")
      }



       res.status(200).json({updated: true })

    } catch(e){
      console.log("ERROR ON POST BODY ",e);
    }

  }


  async appPostRevertDataBySnapshotId(req, res){
    const {snapshotId} = req.params;
    let msg = 'not updated';
    try{
       await _snapshotsManager.revertMainFile(snapshotId);
      msg =  'updated';
    } catch(e){
      msg = "error while updating";
    }
    res.json({msg,snapshotId});
  }


  async appGetSnapshotData(req, res){
    const {snapshotId} = req.params
    try{
      const snapshotData = await _snapshotsManager.getSnapshotDataById(snapshotId);
      const jsonObj = JSON.parse(snapshotData, null, 8);
       res.send(jsonObj);
    } catch(e){
       res.send("get snap shot error id ",e);
    }
 }

 async appGetAdminPage(req, res){
    try {
      const snapshotsListArr =  _snapshotsManager.listSnapshots();
      const snapshotsDomItems = SnapshotsContainerView.mapSnapshotsDataToDomItems(snapshotsListArr);
     // cms.log("snap shots list ",JSON.stringify(snapshotsListArr));
      res.render('index', {snapshotsDomItems});
    } catch(e){
      console.log('load index page error ',e);
    }
  }
}





module.exports = {ServerApp}
