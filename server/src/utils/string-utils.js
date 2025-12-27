const R = require('ramda');


class StringUtils{


  constructor() {



  }



  static setObjectToString(val){
    return typeof val === 'string' ? val : JSON.stringify(val);
  }

  static setStringToObject(val){
    typeof val   === 'object' ? val   : JSON.parse(val);

  }

  static conformTrailingSlash(path){
    const lastChar = String(path).substr(-1); // Selects the last character
    if (lastChar !== '/') {         // If the last character is not a slash
      path = path + '/';            // Append a slash to it.
    }
    return path;
  }




  static getDateString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day =`${date.getDate()}`.padStart(2, '0');
    const hours =`${date.getHours()}`.padStart(2, '0');
    const mins =`${date.getMinutes()}`.padStart(2, '0');
    return `${month}-${day}-${year}-${hours}${mins}`
  }



}

module.exports = {StringUtils}
