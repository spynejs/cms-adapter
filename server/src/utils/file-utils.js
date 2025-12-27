
let _appPath;
let _promptInputHash;

const path  = require('path');
const R = require('ramda');
const fse = require('fs-extra');


const checkIfFileExists = (fileLoc) => fs.existsSync(fileLoc)
const checkIfFolderExists = (dir) => {
  try {
    if (fs.existsSync(dir)) {
      return true;
    }
  } catch(e) {
    console.log("An checkIfFolderExists error occurred.")
  }
  return false;
}


const onSaveFileToDir =  (fileStr, fileName,  fileDirectory) =>{
  const fileDirPath = fileDirectory+fileName;
  const fileExists = checkIfFileExists(fileDirPath);
  let fileHasSaved = false;
  let errorType;

  if (fileExists){
   // cms.warn('file already exists');
    const errObj = {fileDirPath}
    errorType = 'fileAlreadyExists';

    //ErrorLogger.log(JSON.stringify(errObj), errorType);

  } else {
    try {
      const data = fs.writeFileSync(fileDirPath, fileStr)
      //file written successfully
      fileHasSaved = true;

    } catch (err) {
      errorType='generic';

      console.log(err, 'onSaveSpyneFileToDir');
    }
  }

  return {fileExists, fileHasSaved,fileDirPath, errorType}

};



const getLocalFileDirectory = (_fileType)=>{
  let dirPath="";
  const fileTypePath = R.path([_fileType, 'path'])(_promptInputHash)

  try{
    dirPath = fs.existsSync(_appPath) ? _appPath+fileTypePath : './';
  } catch(e){
    console.log(e, 'getFileDirectory')
  }

  return dirPath;

}


const validateFileDirectory = (value)=>{
  const isValid = fs.existsSync(value);
  return isValid || 'File directory needs to exist.';
}





function copyDirSync(src, dest, options={}) {
  var srcPath = path.resolve(src);
  var destPath = path.resolve(dest);
  if(path.relative(srcPath, destPath).charAt(0) != ".") {
     console.warn("dest path must be out of src path");
  }
  var settings = Object.assign(Object.create(copyDirSync.options), options);
  copyDirSync0(srcPath, destPath, settings);
  function copyDirSync0(srcPath, destPath, settings) {
    var files = fs.readdirSync(srcPath);
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    }else if(!fs.lstatSync(destPath).isDirectory()) {
      if(settings.overwrite)
        throw new Error(`Cannot overwrite non-directory '${destPath}' with directory '${srcPath}'.`);
      return;
    }
    files.forEach(function(filename) {
      var childSrcPath = path.join(srcPath, filename);
      var childDestPath = path.join(destPath, filename);
      var type = fs.lstatSync(childSrcPath).isDirectory() ? "directory" : "file";
      if(!settings.filter(childSrcPath, type))
        return;
      if (type == "directory") {
        copyDirSync0(childSrcPath, childDestPath, settings);
      } else {
        fs.copyFileSync(childSrcPath, childDestPath, settings.overwrite ? 0 : fs.constants.COPYFILE_EXCL);
        if(!settings.preserveFileDate)
          fs.futimesSync(childDestPath, Date.now(), Date.now());
      }
    });
  }

    return true;

}
copyDirSync.options = {
  overwrite: true,
  preserveFileDate: true,
  filter: function(filepath, type) {
    return true;
  }
};

const copyFileSync = (source, target)=>{

  let targetFile = target;

  // If target is a directory, a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

const copyFolderRecursiveSync = (source, target) => {
  let files = [];

  // Check if folder needs to be created or integrated
  let targetFolder = target;// path.join(target);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function(file) {
      let curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
}

const removeDir = function(path) {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path)

    if (files.length > 0) {
      files.forEach(function(filename) {
        if (fs.statSync(path + "/" + filename).isDirectory()) {
          removeDir(path + "/" + filename)
        } else {
          fs.unlinkSync(path + "/" + filename)
        }
      })
      fs.rmdirSync(path)
    } else {
      fs.rmdirSync(path)
    }
  } else {
    console.log("Directory path not found.")
  }
}

const getFileAsStringAsync = async function (fileName) {
  //const filePath = path.resolve(fileName);
  //cms.log("FILENAME FILEPATH ",{fileName})
  try {
    return await fse.readFile(fileName, 'utf8')
  } catch (err){
   console.log("ERR IS ",err);
  }
}


const getFileAsync = async (props)=>{
  const fileName = getFileName(props);
  //cms.log('file name is ',{fileName});
  return  await getFileAsString(fileName);
}

const writeFileAsync = async (dest, file, options)=>{
  options = options || {encoding:'utf-8'};
  try {
    const fileToSave = await fse.writeFile(dest, file, options);
    //cms.log('file written ', {fileToSave});
    return true;
  } catch(e){
    console.log("ERR IS ",err);
    return false;
  }

}





module.exports = {getLocalFileDirectory, validateFileDirectory, onSaveFileToDir,checkIfFolderExists, checkIfFileExists, copyFolderRecursiveSync, removeDir, getFileAsStringAsync, getFileAsync, writeFileAsync}
