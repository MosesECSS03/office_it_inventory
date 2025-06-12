const InventoryItem = require('../../Entities/Inventory/InventoryItem');
const InventoryDatabase = require('../../Database/Inventory/InventoryDatabase');

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

  async updateInventory(inventories, userName) {
    try {
      console.log('Updating inventory with inventories:', inventories);
      console.log('User name:', userName);
      
      // Handle inventory updates based on inventories array
      if (inventories && inventories.length > 0) {
        const updatePromises = inventories.map(async (inventoryItem) => {
          if (inventoryItem.ecssInventoryNo) {
            // Get the existing inventory item data first
            const existingItem = await this.inventoryDatabase.retrieveByAssetTag(inventoryItem.ecssInventoryNo);
            
            // Update existing inventory item by asset tag
            const updateData = {
              'Notes': inventoryItem.notes || '',
              'Last Admendment On': new Date().toLocaleDateString('en-GB')
            };

            // Set fields based on action type
            if (inventoryItem.action === 'checkin') {
              // For check-in (return): use old data and set Location and Check-in Date
              updateData['Location'] = inventoryItem.location || '';
              updateData['Check-in Date'] = new Date().toLocaleDateString('en-GB');
              updateData['Check-out Date'] = ''; // Clear check-out date on return";
              updateData['Assigned User'] = ''; // Clear assigned user on return
            } else if (inventoryItem.action !== 'checkin') {
              // For check-out, update, or add new: set Assigned User and Check-out Date
              updateData['Location'] =  '';
              updateData['Assigned User'] = userName || '';
              updateData['Check-out Date'] = new Date().toLocaleDateString('en-GB');
              updateData['Check-in Date'] = ''; // Clear check-out date on return";
            }
            
            return await this.inventoryDatabase.updateByAssetTag(inventoryItem.ecssInventoryNo, updateData);
          }
        });
        
        const results = await Promise.all(updatePromises.filter(promise => promise));
        
        return {
          success: true,
          message: 'Inventory updated successfully',
          updatedItems: results.length
        };
      }
      
      return {
        success: true,
        message: 'No inventory items to update'
      };
    } catch (error) {
      console.error('Error updating inventory:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

}

module.exports = InventoryController;
