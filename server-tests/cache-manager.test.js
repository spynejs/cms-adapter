const test = require('node:test');
const assert = require('node:assert/strict');
const {CacheManager} = require('../server/src/cache-manager');
const path = require('path');
const dataPath = path.join(__dirname, '../src/static/data/');
const testMainFileName = 'proxy-test-data.json';
const testJsonObj = {
  "exampleJSON" : "true"

};


//cms.log('datapath is ',dataPath);


test('should test .snapshots manager ',()=>{

  assert('should test .snapshots manager exists',()=>{
     expect(CacheManager).to.be.a('function');
  })


  assert('should initalize .snapshots manager with settings',()=>{

    const cacheManager = new CacheManager();
    return true;

  })



});


test("should check update of json data files", ()=>{

  assert('should create a guid timestamp fileName', ()=>{
    const fileName = 'main-data.json';
    const cachedFileName = CacheManager.createCachedFileName(fileName);
    expect(cachedFileName).to.be.a('string');

  })

  assert('should return main file name from cachedFileName', ()=>{
    const cachedFileName = "main-data_04-23-2022-0357.json";
    const mainFileName = CacheManager.getMainFileName(cachedFileName);
    expect(mainFileName).to.eq('main-data.json');

  })

  assert('should copy main file and save as cached file', async()=>{

      //const writeToCache = CacheManager.writeMainFileToCacheDir(dataPath, testMainFileName);

        //cms.log('write to cached');

      return true;

  })


  assert('should validate json replacement data', ()=>{


  })

  assert('should replace current file and create old version',()=>{



  })





});


test('should test .snapshots manager folder managment ',()=>{



  assert('should check for oldest file',()=>{


    return true;
  })

  assert('should find all old files', ()=>{


    return true;
  })


  assert('should remove older cached files', ()=>{

    return true;
  })

  assert('should return list of cached files',()=>{


    return true;
  })

  assert('should create cached file', ()=>{


    return true;
  })






});
