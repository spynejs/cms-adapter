const test = require('node:test');
const assert = require('node:assert/strict');

const {ServerCMS} = require("../server/server-cms.js");


const _serverOptions =   {
    host: 'localhost',
    port: 3011,
    dataDirectory: '/Users/frankbatista/sites/spyne-plugin-json-cms-tmp/src/static/data'
}


test('should process files in server ', async()=>{
    const _serverCMS = new ServerCMS(_serverOptions);




    assert('should update main file', async()=>{

      const objUpdate = {
        image : {
          "id" : Math.random()
        }
      };







    })











})


test('should test server cms methods', () => {

  assert('should load server cms', () => {


    expect(ServerCMS).to.be.a('function');


    return true;

  });

  assert('should initialize server cms', ()=>{
    const serverCMS = new ServerCMS({dataDirectory:"/src/static/data/"}, true);


    //cms.log('Server cms is ', serverCMS.options);


    return true;


  })

  test('should test management of cached files ',()=>{

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



  })


});


test("should check update of json data files", ()=>{

  assert('should create a guid timestamp', ()=>{


  })

  assert('should validate json replacement data', ()=>{


  })

  assert('should replace current file and create old version',()=>{



  })




})
