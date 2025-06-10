const InventoryItem = require('../Entities/InventoryItem');
const InventoryDatabase = require('../Database/Inventory/InventoryDatabase');

class InventoryController 
{
  constructor() {
    this.collectionName = 'Office Inventory IT';
    this.inventoryDatabase = new InventoryDatabase();
  }

  async getAllInventory() {
    try {
      const items = await this.inventoryDatabase.retrieveAll();
      
      // Create InventoryItem objects for each database record
      const inventoryItems = items.map(item => {
        const inventoryItem = new InventoryItem();
        
        // Set all properties using setters
        inventoryItem.setCategory(item.Category);
        inventoryItem.setBrand(item.Brand);
        inventoryItem.setModel(item.Model);
        inventoryItem.setSerialNumber(item['Serial Number']);
        inventoryItem.setPurchaseDate(item['Purchase Date']);
        inventoryItem.setOriginalPrice(item['Original Price']);
        inventoryItem.setCurrentNetBookValue(item[' Current Net Book Value']);
        inventoryItem.setDurationSincePurchase(item['Duration since Purchase (mth) ']);
        inventoryItem.setWarrantyInformation(item['Warranty Information']);
        inventoryItem.setWarrantyStartDate(item['Warranty Start Date']);
        inventoryItem.setWarrantyEndDate(item['Warranty End Date']);
        inventoryItem.setAssignedUser(item['Assigned User']);
        inventoryItem.setLocation(item.Location);
        inventoryItem.setAssetsIdTag(item['Assets ID Tag']);
        inventoryItem.setStatus(item.Status);
        inventoryItem.setCheckInDate(item['Check-in Date']);
        inventoryItem.setCheckOutDate(item['Check-out Date']);
        inventoryItem.setOsType(item['OS Type']);
        inventoryItem.setOsVersion(item['OS Version']);
        inventoryItem.setDate(item.Date);
        inventoryItem.setTime(item.Time);
        inventoryItem.setIpAddressIPv4(item['IP address (IPv4)']);
        inventoryItem.setIpAddressIPv6(item['IP address (IPv6)']);
        inventoryItem.setMacAddress(item['MAC address']);
        inventoryItem.setNotes(item.Notes);
        inventoryItem.setLastAmendmentOn(item['Last Admendment On']);
        
        return inventoryItem;
      });
      
      return {
        success: true,
        data: inventoryItems
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

}

module.exports = InventoryController;
