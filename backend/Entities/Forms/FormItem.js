class FormItem {
  constructor()
  {
    this._name = '';
    this._department = '';
    this._email = '';
    this._mobileNo = '';
    this._inventories = [];
    this._date = '';
    this._time = '';
  }

  // Getter methods
  getName() {
    return this._name;
  }

  getDepartment() {
    return this._department;
  }

  getEmail() {
    return this._email;
  }

  getMobileNo() {
    return this._mobileNo;
  }

  getInventories() {
    return this._inventories;
  }

  getDate() {
    return this._date;
  }

  getTime() {
    return this._time;
  }

  // Setter methods
  setName(name) {
    this._name = name;
  }

  setDepartment(department) {
    this._department = department;
  }

  setEmail(email) {
    this._email = email;
  }

  setMobileNo(mobileNo) {
    this._mobileNo = mobileNo;
  }

  setInventories(inventories) {
    this._inventories = inventories;
  }

  setDate(date) {
    this._date = date;
  }

  setTime(time) {
    this._time = time;
  }
}

module.exports = FormItem;
