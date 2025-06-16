const InventoryItem = require('../../Entities/Inventory/InventoryItem');
const InventoryDatabase = require('../../Database/Inventory/InventoryDatabase');
const { formatDateForFrontend, formatDateForDatabase } = require('../../utils/dateUtils');

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
        
        // Set all properties using setters with date formatting
        inventoryItem.setCategory(item.Category);
        inventoryItem.setBrand(item.Brand);
        inventoryItem.setModel(item.Model);
        inventoryItem.setSerialNumber(item['Serial Number']);
        inventoryItem.setPurchaseDate(formatDateForFrontend(item['Purchase Date']));
        inventoryItem.setOriginalPrice(item['Original Price']);
        inventoryItem.setCurrentNetBookValue(item[' Current Net Book Value']);
        inventoryItem.setDurationSincePurchase(item['Duration since Purchase (mth) ']);
        inventoryItem.setWarrantyInformation(item['Warranty Information']);
        inventoryItem.setWarrantyStartDate(formatDateForFrontend(item['Warranty Start Date']));
        inventoryItem.setWarrantyEndDate(formatDateForFrontend(item['Warranty End Date']));
        inventoryItem.setAssignedUser(item['Assigned User']);
        inventoryItem.setLocation(item.Location);
        inventoryItem.setAssetsIdTag(item['Assets ID Tag']);
        inventoryItem.setStatus(item.Status);
        inventoryItem.setCheckInDate(formatDateForFrontend(item['Check-in Date']));
        inventoryItem.setCheckOutDate(formatDateForFrontend(item['Check-out Date']));
        inventoryItem.setOsType(item['OS Type']);
        inventoryItem.setOsVersion(item['OS Version']);
        inventoryItem.setDate(formatDateForFrontend(item.Date));
        inventoryItem.setTime(item.Time);
        inventoryItem.setIpAddressIPv4(item['IP address (IPv4)']);
        inventoryItem.setIpAddressIPv6(item['IP address (IPv6)']);
        inventoryItem.setMacAddress(item['MAC address']);
        inventoryItem.setNotes(item.Notes);
        inventoryItem.setLastAmendmentOn(formatDateForFrontend(item['Last Admendment On']));
        
        // Handle User History as array, not date
        const userHistory = item['User History'];
        console.log('User History:', userHistory);
        inventoryItem.setUserHistory(userHistory);
        
        // Return the inventoryItem object
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

  async createInventoryItem(inventoryData) {
    try {
      console.log('Creating new inventory item:', inventoryData);
      
      // Add timestamp fields
      const dataWithTimestamps = {
        ...inventoryData,
        'Last Admendment On': new Date().toLocaleDateString('en-GB')
      };
      
      const result = await this.inventoryDatabase.save(dataWithTimestamps);
      
      return {
        success: true,
        message: 'Inventory item created successfully',
        data: result
      };
    } catch (error) {
      console.error('Error creating inventory item:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateInventoryItem(inventoryData) {
    try {
      console.log('Updating inventory item by serial number:', inventoryData['Serial Number'], inventoryData);
      
      // Extract serial number from the data
      const serialNumber = inventoryData['Serial Number'];
      if (!serialNumber) {
        throw new Error('Serial Number is required for updating inventory item');
      }
      
      // Add timestamp fields
     const dataWithTimestamps = {
        ...inventoryData,
        'Last Admendment On': new Date().toLocaleDateString('en-GB'),
        updatedAt: new Date()
      };

      console.log('Data with timestamps:', dataWithTimestamps);
      
      const result = await this.inventoryDatabase.updateInvetoryBySerialNumber(dataWithTimestamps);
      
      return {
        success: true,
        message: 'Inventory item updated successfully',
        data: result
      };
    } catch (error) {
      console.error('Error updating inventory item:', error);
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

  async deleteInventoryItemBySerialNumber(serialNumber) {
    try {
      console.log('Deleting inventory item by serial number:', serialNumber);
      
      if (!serialNumber) {
        throw new Error('Serial Number is required for deleting inventory item');
      }
      
      const result = await this.inventoryDatabase.deleteBySerialNumber(serialNumber);
      
      return {
        success: true,
        message: `Inventory item with serial number "${serialNumber}" deleted successfully`,
        data: result
      };
    } catch (error) {
      console.error('Error deleting inventory item by serial number:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async deleteInventoryItemByAssetsTag(assetsIdTag) {
    try {
      console.log('Deleting inventory item by assets ID tag:', assetsIdTag);
      
      if (!assetsIdTag) {
        throw new Error('Assets ID Tag is required for deleting inventory item');
      }
      
      const result = await this.inventoryDatabase.deleteByAssetsTag(assetsIdTag);
      
      return {
        success: true,
        message: `Inventory item with assets ID tag "${assetsIdTag}" deleted successfully`,
        data: result
      };
    } catch (error) {
      console.error('Error deleting inventory item by assets ID tag:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = InventoryController;
