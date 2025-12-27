const {ServerCMS} = require("./server-cms");


const loadServerApp = async()=>{

  try {
    await new ServerCMS();
  } catch(e){
    console.log('server loading error ',e);

  }

}


loadServerApp();
