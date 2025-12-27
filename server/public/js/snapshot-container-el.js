

class SnapshotContainerEl {

  constructor(snapshotEl) {

    this.mainEl = snapshotEl;
    this.prevTarget = undefined;

    this.submitBtn  = snapshotEl.querySelector('button.snapshot-submit-btn');
    this.checkboxesAll = snapshotEl.querySelectorAll('input.form-check-input');

    this.init();
  }

  onSubmitClicked(e){

    ///revert/:snapshotId

    //fetch('http://example.com/movies.json')
    //   .then(response => response.json())
    //   .then(data => cms.log(data));

    /**
     * TODO: An an alert acknowledgment that update was successful
     *
     *
     * */

    const selected = this.mainEl.querySelector('input.form-check-input:checked');
    const snapshotId = selected.dataset.fileVersion;

    const url = `/revert/${snapshotId}`;

    //cms.log('on submit btn clicked1 ',{selected},e);
    const onReturnedRevertMsg = (data)=>{

      console.log('data is ',data);
    }


    fetch(url)
        .then(response => response.json())
        .then(onReturnedRevertMsg);


  }

  onInputChangeEvent(e){
    const {target} = e;
    const isPrevSelected =  target === this.prevTarget;

    let disableSubmitBtn = true;

    const onToggleSelectedInput = (inputEl)=>{
      const isTarget = target === inputEl
      inputEl.checked = isTarget && isPrevSelected===false;
      if (inputEl.checked){
        disableSubmitBtn = false;
      }

    }

    this.checkboxesAll.forEach(onToggleSelectedInput);
    if (isPrevSelected === true){
      this.prevTarget = undefined
    } else {
      this.prevTarget = target;
    }

    this.submitBtn.classList.toggle('disable-btn', disableSubmitBtn);

    //cms.log('input change event is ',{_mainEl, target});

  }

  init(){

    const forEachInput = (inputEl)=>inputEl.addEventListener('change', this.onInputChangeEvent.bind(this), false);
    this.checkboxesAll.forEach(forEachInput);

    this.submitBtn.addEventListener('click', this.onSubmitClicked.bind(this), false);

  }








}

