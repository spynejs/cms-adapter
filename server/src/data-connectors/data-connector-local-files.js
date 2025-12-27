const R = require('ramda');
const {StringUtils} = require('../utils/string-utils');
const {getFileAsStringAsync} = require('../utils/file-utils');
const {DataConnector} = require('./data-connector');
/*const ROARR = globalThis.ROARR = globalThis.ROARR || {};
ROARR.write = (message) => {
  console.log(JSON.stringify(message));
};*/

const path = require('path');
const date = require('date-and-time');

const _snapshotDir = path.join(__dirname, '../../.snapshots/');

const fs = require('fs');
const fse = require('fs-extra');
let _dataPath;
let _snapshotPath;
let _snapshotAmt = 12;


class DataConnectorLocalFiles extends DataConnector {

  constructor(props={}) {

    const {dataPath, snapshotPath, snapshotAmt} = props;

    _dataPath =   dataPath || _dataPath;
    _snapshotPath = snapshotPath || _snapshotPath;
    _snapshotAmt  =  snapshotAmt || _snapshotAmt;


    super();

    //console.log("LOCAL DATA CONNECTOR ",_dataPath);

  }


  static createSnapshotdFileName(mainFileName){
    const timeStamp = StringUtils.getDateString();
    return String(mainFileName).replace(/(.*)(\.\w{3,6})/g, `$1_${timeStamp}$2`)

  }

  static getMainFileName(snapshotFileName){
    return  String(snapshotFileName).replace(/(.*)(_\d{2}-\d{2}-\d{4}-\d{4})(\.\w{3,6})/g, "$1$3");

  }

  static async readFile(fileLoc, options={encoding:'utf-8'}){
    try{
      return await fse.readFile(fileLoc, options);
    } catch(e){
      console.log("ERROR READING FILE ",e);
      return false;
    }

  }

  static async writeFile(fileLoc, fileStr, options={encoding:'utf-8'}) {

    //console.log("WRITING FILE IS ",{fileLoc, fileStr})

    try {
      const fileToSave = await fse.writeFile(fileLoc, fileStr, options);
      return true;
    } catch (e) {
      console.log("ERROR IN FILE TO SAVE ", e);
      return false;
    }



  }



  static sortSnapshotsByDate(snapshotArr, maxSnapshotAmt=_snapshotAmt){


    const sortByDate = R.compose(R.splitAt(maxSnapshotAmt), R.reverse,R.sortBy(R.prop('date')));

    //return snapshotArr;
    let [currentSnapshots, oldSnapshots] = sortByDate(snapshotArr);
    //return sortByDate(snapshotArr);
    //cms.log("SNAP SHOTS ",maxSnapshotAmt);

    return {currentSnapshots, oldSnapshots}
  }


  listDataSnapshots(mainFileName=false, folderPath=_snapshotDir){
    let dataFileNameArr;


      const getDataFromFileName = (fileName)=> {
      return String(fileName).replace(/(.*_)(\d{2}-\d{2}-\d{4})(-)(\d{2})(\d{2})(\.\w{3,6})/g, "$2 $4:$5")
    }

    const getFileObj = (fileName)=>{
      const fileDate = Date.parse(getDataFromFileName(fileName))
      const dateFormatted = date.format(new Date(fileDate), 'ddd, MMM DD YYYY HH:mm A');
      const dataFileName = String(DataConnectorLocalFiles.getMainFileName(fileName));


      return {
        date:fileDate,
        dateFormatted,
        fileName,
        folderPath,
        dataFileName
      }

    }


    const matchDataFilesReduce2 = (str, acc)=>{
      const isMatch = String(str).match(/(.*)(_\d{2}-\d{2}-\d{4}-\d{4})(\.\w{3,6})/)
      if (isMatch){
        const mainFile = DataConnectorLocalFiles.getMainFileName(str);
        //console.log('main file is ', {str, acc});
        acc.push(getFileObj(str));
        //acc.push(str);
      }

      return acc;
    }

    const matchDataFilesReducer= (acc, str)=>{
      const isMatch = String(str).match(/(.*)(_\d{2}-\d{2}-\d{4}-\d{4})(\.\w{3,6})/)
      if (isMatch){
        acc.push(getFileObj(str));
      }

      return acc;
    }


    const matchDataFilesReducer2 = (str, acc)=>{
      const isMatch = String(str).match(/(.*)(_\d{2}-\d{2}-\d{4}-\d{4})(\.\w{3,6})/)
     // cms.log('is match ', {str, isMatch})
      if (isMatch){
        const mainFile = DataConnectorLocalFiles.getMainFileName(str);
        //cms.log('main file is ', {str, acc});
        acc.push(getFileObj(str));
        //acc.push(str);
      }

      return acc;
    }


    let files = fse.readdirSync(folderPath);


      const formatTime = (date)=>{
        function formateTime(all, $1, $2, $3, $4){
          const hourFill = $1 || "&nbsp;";
          return `${hourFill}${$2}${$4}`;
        }
        const re = /^(\d{2}:)?(.*)(\s)([ap]m)$/gm
        return date.toLocaleTimeString().toLowerCase().replace(re, formateTime);
      }


      const sizeUnitsFn = byteVal => {
        var units=["Bytes", "kb", "mb", "gb", "tb"];
        var kounter=0;
        var kb= 1024;
        var div=byteVal/1;
        while(div>=kb){
          kounter++;
          div= div/kb;
        }
        return `${div.toFixed(1)}${units[kounter]}`;

      }


      const getFileStats = (str)=>{

        const isMatch = String(str).match(/(.*)(_\d{2}-\d{2}-\d{4}-\d{4})(\.\w{3,6})/)


        const fileName = str;
        const filePath = `${folderPath}${fileName}`;

          const {size,atime,mtime,ctime,birthtime} = fs.statSync(filePath);
          const lastModified = birthtime;
          const dateFn = new Date(lastModified)
          //const day = "MAY ";// date.toLocaleDateString('en-us', { weekday:"short", year:"numeric", month:"short", day:"numeric"})
          const day = date.format(dateFn, 'ddd, MMM DD YYYY');

          const time = formatTime(dateFn);
          const fullDate = `${day}, ${time}`;
          const sizeUnit = sizeUnitsFn(size);
          const dataFileName = DataConnectorLocalFiles.getMainFileName(fileName);
          const dataId = dataFileName;


        return {fileName,dataFileName,folderPath,dataId,lastModified,date,day,time,fullDate,sizeUnit,size};

      }

      const fileStatsReducer = (acc, str) => {
        const isMatch = String(str).match(/(.*)(_\d{2}-\d{2}-\d{4}-\d{4})(\.\w{3,6})/)

        if (isMatch){


          //cms.log('main file is ', {str, acc});
          acc.push(getFileStats(str));
          //acc.push(str);
        }

        return acc;
      }


      const fileStats = files.reduce(fileStatsReducer, []);


   // files = files.reduce(matchDataFilesReducer, []);
    //cms.log("FILES IS ",R.clone(files));

    //  cms.log('files is ',dataFileName);


    const reduceToObjWithKeys = (arr, acc) =>{
      const {dataFileName} = arr[0];
      const obj = DataConnectorLocalFiles.sortSnapshotsByDate(arr);
      obj['dataId'] = dataFileName;

      acc.push(obj);
      return acc;
    }



    const arrClean = R.compose(R.reduceRight(reduceToObjWithKeys, []),R.collectBy(R.prop('dataFileName')),R.reduceRight(matchDataFilesReducer2, []))(files);
    //const arrClean = R.compose(R.reduceRight(matchDataFilesReducer2, []), R.clone)(files);

    const fileStatsClean = R.compose(R.reduceRight(reduceToObjWithKeys, []),R.collectBy(R.prop('dataFileName')))(fileStats);




    if (mainFileName!==false) {
      dataFileNameArr = R.compose(R.head, R.filter(R.propEq('dataId', mainFileName)))(fileStatsClean);

    }

    //console.log("data  clean is \n",{dataFileNameArr}, JSON.stringify(fileStatsClean));

   // cms.log('files ',fileStats);
    return dataFileNameArr !== undefined ? dataFileNameArr : fileStatsClean;


   // return DataConnectorLocalFiles.sortSnapshotsByDate(files);

  }


  static async removeFiles(filesLocArr){

    const removeFile = async (fileLocStr)=>{
      try {
        await fse.remove(fileLocStr)
        //cms.log('success! ');
      } catch (err) {
        console.error(fileLocStr, err);
      }


    }

    if(filesLocArr !== undefined && filesLocArr.length>0){
       filesLocArr.forEach(removeFile);
    }

  }

  async pruneSnapshots(dataFileName) {
    const oldSnapshots = this.listDataSnapshots(dataFileName, _snapshotDir);
    const createFileLocArr = (o)=>`${o.folderPath}/${o.fileName}`;

    //console.log("OLD SNAPSHOTS ",{dataFileName, oldSnapshots, createFileLocArr})

    const oldFilesLocArr = oldSnapshots.map(createFileLocArr);
    await DataConnectorLocalFiles.removeFiles(oldFilesLocArr);

  }


 async createDataSnapshot(filePath, fileName){

   const snapshotName = DataConnectorLocalFiles.createSnapshotdFileName(fileName);

   const fileLoc = `${filePath}${fileName}`;
   const snapshotLoc = `${_snapshotDir}${snapshotName}`;

   const fileStr = await DataConnectorLocalFiles.readFile(fileLoc)
   const fileToSave = await DataConnectorLocalFiles.writeFile(snapshotLoc, fileStr)



   return {rendered:fileToSave, readFile:fileStr, fileName:snapshotName};
  }


 async updateData(filePath, fileName, fileStr){

    // conform to string if object
    const updatedFileStr = StringUtils.setObjectToString(fileStr);

   const lastChar = filePath.substr(-1); // Selects the last character
   if (lastChar !== '/') {         // If the last character is not a slash
     filePath = filePath + '/';            // Append a slash to it.
   }

   const fileLoc = `${filePath}${fileName}`;
   let fileToSave;
   //console.log("FILE TO SAVE ",{fileLoc, filePath, updatedFileStr})
   try{
     fileToSave = await DataConnectorLocalFiles.writeFile(fileLoc, updatedFileStr);

     //console.log("FILE TO SAVE ",{fileLoc, fileToSave})
   }catch(e){
     console.log("ERR: updateData ",e);
   }

   return {rendered:fileToSave, fileName:fileName};

  }

  async getDataBySnapshotId(snapshotId){
    const snapshotLoc = `${_snapshotDir}${snapshotId}`;
    try {
      return await DataConnectorLocalFiles.readFile(snapshotLoc)
    } catch(e){
      console.log('get snapshot id is ',e);
    }

    return false;
  }

  async revertDataToSnapshot(snapshotId, dataFileName, dataPath=_dataPath){

    let updateData, snapshotStr;
    const mainFileName = dataFileName || DataConnectorLocalFiles.getMainFileName(snapshotId);
    const snapshotLoc = `${_snapshotDir}${snapshotId}`;
    try {
      snapshotStr = await DataConnectorLocalFiles.readFile(snapshotLoc)
    } catch(e){
      console.log("ERR: revertDataToSnapshot:snapshotStr ",e);
    }

    try {
      updateData = await this.updateData(dataPath, mainFileName, snapshotStr);
    } catch(e){
      console.log("ERR: revertDataToSnapshot:updateData ",e);
    }


    try {
      await this.pruneSnapshots(mainFileName);
    } catch(e){
      console.log("ERR: revertDataToSnapshot:pruneSnapshots ",e);

    }

    //console.log('snap and update ',{updateData, dataPath})
    return {rendered:true}


  }


 async createSnapshotAndUpdateData(filePath, fileName, updatedFileStr){

    const dataSnapshot = await this.createDataSnapshot(filePath, fileName);
    const updateData =   await this.updateData(filePath, fileName, updatedFileStr);

    await this.pruneSnapshots(fileName);


    //cms.log('snap and update ',{dataSnapshot, updateData})
    return {rendered:true}


  }

  static mergeDataUpdate(fileUpdate, origFile){
    const setToStr = (str) => typeof str === 'string' ? str : JSON.stringify(str);
    const setToObj =   (o) => typeof o   === 'object' ? o   : JSON.parse(o);

    const originalFile = setToObj(origFile);
    const updatedFile  = setToObj(fileUpdate);

    return setToStr(R.mergeLeft(originalFile, updatedFile));
  }


  async updateMultipleSnapshotsAndData(filesListArr){
    const filesUpdated = []
    try{
      for (const fileData of filesListArr) {
        const {dataDirectory, fileName, fileStr} = fileData;
        let fileDataDirectory = dataDirectory !== undefined ? StringUtils.conformTrailingSlash(dataDirectory) : StringUtils.conformTrailingSlash(_dataPath);
        const {readFile} = await this.createDataSnapshot(fileDataDirectory, fileName);
        //const fileToSend = DataConnectorLocalFiles.mergeDataUpdate(fileStr, readFile);
        const updateData =   await this.updateData(fileDataDirectory, fileName, fileStr);
        //console.log("UPDATE DATA1 ", {fileDataDirectory, fileName, fileStr, updateData})
        await this.pruneSnapshots(fileName);
        filesUpdated.push(fileName);
        // await this.createSnapshotAndUpdateData(dataDirectory, fileName, fileToSend);
      }
      return  {rendered:true, filesUpdated};
    } catch(e){
      console.error('running files error', e);
    }



/*    async function* fileToUpdateGenerator(){
      try{
        for (const fileData of filesListArr){
          yield fileData;
        }
      } catch(e){
        console.error('fileData not set ',e);

      }
    }


    const runFileUpdateGen = async()=>{




    }*/



  }


  async mergeUpdatesAndCreateSnapshotAndUpdateData(filePath, fileName, revisedParams){

    const {readFile} = await this.createDataSnapshot(filePath, fileName);
    const revisedObj = typeof revisedParams === "string" ? JSON.parse(revisedParams) : revisedParams;

    const fileObj = JSON.parse(readFile);

    const updatedFile = String(R.mergeAll([]))

    const updateData =   await this.updateData(filePath, fileName, updatedFileStr);

    await this.pruneSnapshots(fileName);


    //cms.log('snap and update ',{dataSnapshot, updateData})
    return {rendered:true}


  }





}

module.exports  = {DataConnectorLocalFiles};
