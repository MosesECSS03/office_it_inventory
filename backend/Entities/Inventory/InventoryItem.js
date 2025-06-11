/**
 * InventoryItem Entity
 * Represents an IT inventory item in the system
 */
class InventoryItem {
  constructor() {
    this._category = '';
    this._brand = '';
    this._model = '';
    this._serialNumber = '';
    this._purchaseDate = '';
    this._originalPrice = '';
    this._currentNetBookValue = '';
    this._durationSincePurchase = '';
    this._warrantyInformation = '';
    this._warrantyStartDate = '';
    this._warrantyEndDate = '';
    this._assignedUser = '';
    this._location = '';
    this._assetsIdTag = '';
    this._status = '';
    this._checkInDate = '';
    this._checkOutDate = '';
    this._osType = '';
    this._osVersion = '';
    this._date = '';
    this._time = '';
    this._ipAddressIPv4 = '';
    this._ipAddressIPv6 = '';
    this._macAddress = '';
    this._notes = '';
    this._lastAmendmentOn = '';
  }

  // Category getter and setter
  getCategory() {
    return this._category;
  }

  setCategory(category) {
    this._category = category;
  }

  // Brand getter and setter
  getBrand() {
    return this._brand;
  }

  setBrand(brand) {
    this._brand = brand;
  }

  // Model getter and setter
  getModel() {
    return this._model;
  }

  setModel(model) {
    this._model = model;
  }

  // Serial Number getter and setter
  getSerialNumber() {
    return this._serialNumber;
  }

  setSerialNumber(serialNumber) {
    this._serialNumber = serialNumber;
  }

  // Purchase Date getter and setter
  getPurchaseDate() {
    return this._purchaseDate;
  }

  setPurchaseDate(purchaseDate) {
    this._purchaseDate = purchaseDate;
  }

  // Original Price getter and setter
  getOriginalPrice() {
    return this._originalPrice;
  }

  setOriginalPrice(originalPrice) {
    this._originalPrice = originalPrice;
  }

  // Current Net Book Value getter and setter
  getCurrentNetBookValue() {
    return this._currentNetBookValue;
  }

  setCurrentNetBookValue(currentNetBookValue) {
    this._currentNetBookValue = currentNetBookValue;
  }

  // Duration since Purchase getter and setter
  getDurationSincePurchase() {
    return this._durationSincePurchase;
  }

  setDurationSincePurchase(durationSincePurchase) {
    this._durationSincePurchase = durationSincePurchase;
  }

  // Warranty Information getter and setter
  getWarrantyInformation() {
    return this._warrantyInformation;
  }

  setWarrantyInformation(warrantyInformation) {
    this._warrantyInformation = warrantyInformation;
  }

  // Warranty Start Date getter and setter
  getWarrantyStartDate() {
    return this._warrantyStartDate;
  }

  setWarrantyStartDate(warrantyStartDate) {
    this._warrantyStartDate = warrantyStartDate;
  }

  // Warranty End Date getter and setter
  getWarrantyEndDate() {
    return this._warrantyEndDate;
  }

  setWarrantyEndDate(warrantyEndDate) {
    this._warrantyEndDate = warrantyEndDate;
  }

  // Assigned User getter and setter
  getAssignedUser() {
    return this._assignedUser;
  }

  setAssignedUser(assignedUser) {
    this._assignedUser = assignedUser;
  }

  // Location getter and setter
  getLocation() {
    return this._location;
  }

  setLocation(location) {
    this._location = location;
  }

  // Assets ID Tag getter and setter
  getAssetsIdTag() {
    return this._assetsIdTag;
  }

  setAssetsIdTag(assetsIdTag) {
    this._assetsIdTag = assetsIdTag;
  }

  // Status getter and setter
  getStatus() {
    return this._status;
  }

  setStatus(status) {
    this._status = status;
  }

  // Check-in Date getter and setter
  getCheckInDate() {
    return this._checkInDate;
  }

  setCheckInDate(checkInDate) {
    this._checkInDate = checkInDate;
  }

  // Check-out Date getter and setter
  getCheckOutDate() {
    return this._checkOutDate;
  }

  setCheckOutDate(checkOutDate) {
    this._checkOutDate = checkOutDate;
  }

  // OS Type getter and setter
  getOsType() {
    return this._osType;
  }

  setOsType(osType) {
    this._osType = osType;
  }

  // OS Version getter and setter
  getOsVersion() {
    return this._osVersion;
  }

  setOsVersion(osVersion) {
    this._osVersion = osVersion;
  }

  // Date getter and setter
  getDate() {
    return this._date;
  }

  setDate(date) {
    this._date = date;
  }

  // Time getter and setter
  getTime() {
    return this._time;
  }

  setTime(time) {
    this._time = time;
  }

  // IP Address (IPv4) getter and setter
  getIpAddressIPv4() {
    return this._ipAddressIPv4;
  }

  setIpAddressIPv4(ipAddressIPv4) {
    this._ipAddressIPv4 = ipAddressIPv4;
  }

  // IP Address (IPv6) getter and setter
  getIpAddressIPv6() {
    return this._ipAddressIPv6;
  }

  setIpAddressIPv6(ipAddressIPv6) {
    this._ipAddressIPv6 = ipAddressIPv6;
  }

  // MAC Address getter and setter
  getMacAddress() {
    return this._macAddress;
  }

  setMacAddress(macAddress) {
    this._macAddress = macAddress;
  }

  // Notes getter and setter
  getNotes() {
    return this._notes;
  }

  setNotes(notes) {
    this._notes = notes;
  }

  // Last Amendment On getter and setter
  getLastAmendmentOn() {
    return this._lastAmendmentOn;
  }

  setLastAmendmentOn(lastAmendmentOn) {
    this._lastAmendmentOn = lastAmendmentOn;
  }
}

module.exports = InventoryItem;
