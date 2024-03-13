class Util {
  constructor() {}
  capitalize(str) {
    return str.replace(/(^\w|\s\w)/g, m => m.toUpperCase()); 
  }
}
module.exports = Util