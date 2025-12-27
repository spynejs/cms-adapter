let _type;

class DataConnector {

  constructor(props) {


  }


  async pruneSnapshots(){

  }


  listDataSnapshots(){

    return 'This method needs to be overwritten!'

  }



  async createDataSnapshot(){

    return 'This method needs to be overwritten!'
  }


  async updateData(){


    return 'This method needs to be overwritten!'

  }


  async createSnapshotAndUpdateData(){

    return 'This method needs to be overwritten!'

  }



}

module.exports = {DataConnector}
