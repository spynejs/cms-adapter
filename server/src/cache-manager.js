const R = require('ramda');
const {StringUtils} = require('./utils/string-utils');
const {getFileAsStringAsync} = require('./utils/file-utils');
const path = require('path');

const _cacheDir = path.join(__dirname, '../.snapshots/');


const fse = require('fs-extra');
let _dataPath;
let _cachePath;
let _cacheAmt = 12;

class CacheManager{

  constructor(props={}) {

    const {dataPath, cachePath, cacheAmt} = props;

    _dataPath =   dataPath || _dataPath;
    _cachePath = cachePath || _cachePath;
    _cacheAmt  =  cacheAmt || _cacheAmt;
  }


  static createCachedFileName(mainFileName){
    const timeStamp = StringUtils.getDateString();
     return String(mainFileName).replace(/(.*)(\.\w{3,6})/g, `$1_${timeStamp}$2`)

  }

  static getMainFileName(cachedFileName){
   return  String(cachedFileName).replace(/(.*)(_\d{2}-\d{2}-\d{4}-\d{4})(\.\w{3,6})/g, "$1$3");

  }


  static async writeMainFileToCacheDir(filePath, fileName){
    const snapshotName = CacheManager.createCachedFileName(fileName);

    const fileLoc = `${filePath}${fileName}`;
    const cacheLoc = `${_cacheDir}${snapshotName}`;

    const fileStr = await fse.readFile(fileLoc, 'utf8');

    const options =  {encoding:'utf-8'};
     try {
       const fileToSave = await fse.writeFile(cacheLoc, fileStr, options);
     } catch(e){
       console.log("ERROR IN FILE TO SAVE ",e);

     }

    //cms.log('file str is ',fileStr);


    return {rendered:true, fileName:snapshotName};

  }




  static writeJsonToCache(json, fileName, cachePath=_cachePath){
    if (json===undefined || fileName===undefined){
      console.warn('JSON object nad fileName is required');
    }





  }
















}

module.exports = {CacheManager}
