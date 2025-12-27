'use strict';



const onDocumentReady = ()=>{

  const snapshotsContainers = document.querySelectorAll('.snapshot-container');

  console.log('doc has loaded ',{snapshotsContainers});

  const addSnapshotContainerClass = (el) => {
    const controller = new SnapshotContainerEl(el);
  }

  snapshotsContainers.forEach(addSnapshotContainerClass);

}


const checkDocReadyState = ()=>{
  if (document.readyState==='complete'){
    onDocumentReady();
  } else {
    requestAnimationFrame(checkDocReadyState)
  }
}
checkDocReadyState();




