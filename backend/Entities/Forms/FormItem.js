class FormItem {
  constructor()
  {
    this._id = '';
    this._name = '';
    this._employeeCode = '';
    this._department = '';
    this._email = '';
    this._mobileNo = '';
    this.inventories = [];
    this._date = '';
    this._time = '';
  }

  // Getter methods
  getId() {
    return this._id;
  }

  // Getter methods
  getName() {
    return this._name;
  }

  getEmployeeCode() {
    return this._employeeCode;
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
    return this.inventories;
  }

  getDate() {
    return this._date;
  }

  getTime() {
    return this._time;
  }

  // Setter methods
  setId(_id) {
    this._id = _id;
  }

  setName(name) {
    this._name = name;
  }

  setEmployeeCode(employeeCode) {
    this._employeeCode = employeeCode;
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
    this.inventories = inventories;
  }

  setDate(date) {
    this._date = date;
  }

  setTime(time) {
    this._time = time;
  }
}

module.exports = FormItem;
