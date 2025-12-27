class SnapshotsContainerView {

  constructor(dataArr) {





  }

  static mapSnapshotsDataToDomItems(snapshotsData){

    const mapDataToDomItems = (obj)=>{
      const {currentSnapshots} = obj;
      //console.log('currentSnapshots is ',obj);
      return SnapshotsContainerView.createSnapshotContainerDomData(currentSnapshots);

    }


   // cms.log("SNAPSHOTS DATA ",snapshotsData);

    return snapshotsData.map(mapDataToDomItems);


  }


  static createSnapshotContainerDomData(snapshotsArr){

    const {dataFileName} = snapshotsArr[0];
    const snapshotsLabel = dataFileName;
    const snapshotsUl        = SnapshotsContainerView.createSnapshotUnorderedList(snapshotsArr);
    const snapshotsSubmitBtn = SnapshotsContainerView.createContainerSubmitBtn(dataFileName);

    return {snapshotsLabel, snapshotsUl, snapshotsSubmitBtn};

  }


  static createSnapshotUnorderedList(snapshotsArr){

    const snapshotsUnorderedListReducer = (elStr, snapshotObj)=>{
      const item = SnapshotsContainerView.createSnapshotItem(snapshotObj);
      elStr+=item;
      return elStr;
    }


    const snapShotListItems = snapshotsArr.reduce(snapshotsUnorderedListReducer, '');

    return `<ul><li class="titles"><p class="title-1">Saved Versions</p><p>Size</p><p>Select</p></li>
${snapShotListItems}</ul>`;
  }


  static createSnapshotItem(snapShotObj){
    const {dataFileName,fileName, fullDate, sizeUnit} = snapShotObj;

    const link = SnapshotsContainerView.createLink(fileName, fullDate);
    const sizeTxt = SnapshotsContainerView.createSizeTxt(sizeUnit);
    const checkBox = SnapshotsContainerView.createCheckBox(dataFileName, fileName);
    return`
           <li class="snapshot-item" data-file-name="${dataFileName}" data-file-version="${fileName}">
              ${link} ${sizeTxt} ${checkBox}</li>`

  }


  static createLink(snapShotId, dateStr){
    return ` <a href="/snapshot/${snapShotId}" target="_blank" class="underline pr-5 decoration-transparent hover:decoration-inherit transition duration-300 ease-in-out">${dateStr}</a> `
  }


  static createSizeTxt(sizeUnit){
    return ` <p>${sizeUnit}</p> `
  }



  static createCheckBox(dataFileName, fileName){

    return ` <div class="flex justify-center">
                    <div>
                        <div class="snapshot-item-checkbox form-check">
                            <input data-file-name="${dataFileName}" data-file-version="${fileName}" class="form-check-input appearance-none h-4 w-4 border border-gray-300 rounded-sm bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2 cursor-pointer" type="checkbox" value="" id="flexCheckDefault">
                           <!-- <label class="form-check-label inline-block text-gray-800" for="flexCheckDefault">
                                Default checkbox
                            </label>-->
                        </div>
                    </div>
                </div> `



  }


  static createContainerSubmitBtn(datafileName){

    return `   <button type="button" data-file-name="${datafileName}"  class="disable-btn snapshot-submit-btn inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">Update</button>
              `
  }








}


module.exports = {SnapshotsContainerView}
