const path = require('path');
const fse = require('fs-extra');
const R = require('ramda');

const {DataConnector} = require('./data-connectors/data-connector');
const {DataConnectorLocalFiles} = require('./data-connectors/data-connector-local-files');

let _type="localFiles";
let _snapshotsDir = path.resolve('server/.snapshots/');
let _dataDir = path.resolve('src/static/data/');
let _dataConnector;

class SnapshotsManager {

  constructor(props={}) {

    _type         = props.type || _type;
    _snapshotsDir = props.snapshotsDir || _snapshotsDir;
    _dataDir      = props.dataDir || _dataDir;

    _dataConnector = new DataConnectorLocalFiles({
      dataPath: _dataDir,
      snapshotsDir:_snapshotsDir});


  }



   listSnapshots(dataId){

     return _dataConnector.listDataSnapshots();

  }

  async getSnapshotDataById(snapshotId){
    try{
      return await _dataConnector.getDataBySnapshotId(snapshotId);
    } catch(e){
      console.log('getSnapshotDataById ',e);
    }
    return false;
  }

  async removeSnapshot(snapshotId){

    return 'removing snapshot';
  }

  async removeSnapshots(snapshotIdsArr){


  }

  async updateMainFile(dataId, newDataStr){


  }

  async updateFiles(filesListArr = []){
    try {
      return await _dataConnector.updateMultipleSnapshotsAndData(filesListArr);
    } catch (e){
      console.log("files data not parsing correctly");
    }

  }

  async revertMainFile(snapshotId){
    try{
      return await _dataConnector.revertDataToSnapshot(snapshotId);
    } catch(e){
      console.log('revert main file error file ',e);

    }

  }

  get type(){
    return _type;
  }
  get snapshotsDir(){
    return _snapshotsDir;
  }
  get dataDir(){
    return _dataDir;
  }

}

module.exports = {SnapshotsManager}
