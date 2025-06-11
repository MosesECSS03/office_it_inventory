const dbConnection = require('../connection');
const { ObjectId } = require('mongodb');

/**
 * Inventory Database Operations
 * Handles all database operations for inventory management
 */
class InventoryDatabase {
  constructor() {
    this.collectionName = 'Office Inventory IT';
  }

  /**
   * Save a new inventory item to the database
   * @param {Object} inventoryData - The inventory data to save
   * @returns {Promise<Object>} The saved inventory item with generated ID
   */
  async save(inventoryData) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      // Add timestamp for when the item was saved to database
      const inventoryWithTimestamp = {
        ...inventoryData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await collection.insertOne(inventoryWithTimestamp);
      console.log('Inventory item saved successfully:', result.insertedId);
      
      // Return the saved item with the generated ID
      return {
        _id: result.insertedId,
        ...inventoryWithTimestamp
      };
    } catch (error) {
      console.error('Error saving inventory item:', error);
      throw error;
    }
  }

  /**
   * Retrieve all inventory items from the database
   * @returns {Promise<Array>} Array of inventory items
   */
  async retrieveAll() {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      const items = await collection.find({}).toArray();
      console.log('Retrieved all inventory items, count:', items.length);
      return items;
    } catch (error) {
      console.error('Error retrieving all inventory items:', error);
      throw error;
    }
  }

  /**
   * Retrieve a specific inventory item by ID
   * @param {string} itemId - The ID of the inventory item to retrieve
   * @returns {Promise<Object|null>} The inventory item or null if not found
   */
  async retrieveById(itemId) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const item = await collection.findOne({ _id: new ObjectId(itemId) });
      console.log('Retrieved inventory item by ID:', itemId, 'Found:', !!item);
      return item;
    } catch (error) {
      console.error('Error retrieving inventory item by ID:', error);
      throw error;
    }
  }

  /**
   * Retrieve inventory item by asset tag/inventory number
   * @param {string} assetTag - The asset tag/inventory number
   * @returns {Promise<Object|null>} The inventory item or null if not found
   */
  async retrieveByAssetTag(assetTag) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const item = await collection.findOne({ _assetsIdTag: assetTag });
      console.log('Retrieved inventory item by asset tag:', assetTag, 'Found:', !!item);
      return item;
    } catch (error) {
      console.error('Error retrieving inventory item by asset tag:', error);
      throw error;
    }
  }

  /**
   * Retrieve inventory items by brand
   * @param {string} brand - The brand name
   * @returns {Promise<Array>} Array of inventory items for the brand
   */
  async retrieveByBrand(brand) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const items = await collection.find({ _brand: new RegExp(brand, 'i') }).toArray();
      console.log('Retrieved inventory items for brand:', brand, 'Count:', items.length);
      return items;
    } catch (error) {
      console.error('Error retrieving inventory items by brand:', error);
      throw error;
    }
  }

  /**
   * Retrieve inventory items by category/type
   * @param {string} category - The category/type
   * @returns {Promise<Array>} Array of inventory items for the category
   */
  async retrieveByCategory(category) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const items = await collection.find({ _category: new RegExp(category, 'i') }).toArray();
      console.log('Retrieved inventory items for category:', category, 'Count:', items.length);
      return items;
    } catch (error) {
      console.error('Error retrieving inventory items by category:', error);
      throw error;
    }
  }

  /**
   * Search inventory items by multiple criteria
   * @param {Object} searchCriteria - Search criteria object
   * @returns {Promise<Array>} Array of matching inventory items
   */
  async search(searchCriteria) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const query = {};
      
      if (searchCriteria.assetTag) {
        query._assetsIdTag = new RegExp(searchCriteria.assetTag, 'i');
      }
      
      if (searchCriteria.brand) {
        query._brand = new RegExp(searchCriteria.brand, 'i');
      }
      
      if (searchCriteria.model) {
        query._model = new RegExp(searchCriteria.model, 'i');
      }
      
      if (searchCriteria.serialNumber) {
        query._serialNumber = new RegExp(searchCriteria.serialNumber, 'i');
      }
      
      if (searchCriteria.category) {
        query._category = new RegExp(searchCriteria.category, 'i');
      }
      
      const items = await collection.find(query).toArray();
      console.log('Search completed with criteria:', searchCriteria, 'Results:', items.length);
      return items;
    } catch (error) {
      console.error('Error searching inventory items:', error);
      throw error;
    }
  }

  /**
   * Update an inventory item
   * @param {string} itemId - The ID of the item to update
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} The updated inventory item
   */
  async update(itemId, updateData) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const updateWithTimestamp = {
        ...updateData,
        updatedAt: new Date()
      };
      
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(itemId) },
        { $set: updateWithTimestamp },
        { returnDocument: 'after' }
      );
      
      console.log('Inventory item updated successfully:', itemId);
      return result.value;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  /**
   * Update inventory item by asset tag
   * @param {string} assetTag - The asset tag of the item to update
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} The updated inventory item
   */
  async updateByAssetTag(assetTag, updateData) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const updateWithTimestamp = {
        ...updateData,
        updatedAt: new Date()
      };
      
      const result = await collection.findOneAndUpdate(
        { _assetsIdTag: assetTag },
        { $set: updateWithTimestamp },
        { returnDocument: 'after' }
      );
      
      console.log('Inventory item updated by asset tag successfully:', assetTag);
      return result.value;
    } catch (error) {
      console.error('Error updating inventory item by asset tag:', error);
      throw error;
    }
  }

  /**
   * Delete an inventory item
   * @param {string} itemId - The ID of the item to delete
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(itemId) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const result = await collection.deleteOne({ _id: new ObjectId(itemId) });
      console.log('Inventory item deletion result:', result.deletedCount > 0);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  /**
   * Delete inventory item by asset tag
   * @param {string} assetTag - The asset tag of the item to delete
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteByAssetTag(assetTag) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const result = await collection.deleteOne({ _assetsIdTag: assetTag });
      console.log('Inventory item deletion by asset tag result:', result.deletedCount > 0);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting inventory item by asset tag:', error);
      throw error;
    }
  }

  /**
   * Get available inventory items (not checked out)
   * @returns {Promise<Array>} Array of available inventory items
   */
  async getAvailableItems() {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const items = await collection.find({ 
        $or: [
          { _status: 'available' },
          { _status: { $exists: false } }, // Items without status field are considered available
          { _isCheckedOut: { $ne: true } }
        ]
      }).toArray();
      
      console.log('Retrieved available inventory items, count:', items.length);
      return items;
    } catch (error) {
      console.error('Error retrieving available inventory items:', error);
      throw error;
    }
  }

  /**
   * Get checked out inventory items
   * @returns {Promise<Array>} Array of checked out inventory items
   */
  async getCheckedOutItems() {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const items = await collection.find({ 
        $or: [
          { _status: 'checked_out' },
          { _isCheckedOut: true }
        ]
      }).toArray();
      
      console.log('Retrieved checked out inventory items, count:', items.length);
      return items;
    } catch (error) {
      console.error('Error retrieving checked out inventory items:', error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const totalItems = await collection.countDocuments();
      const availableItems = await collection.countDocuments({ 
        $or: [
          { _status: 'available' },
          { _status: { $exists: false } },
          { _isCheckedOut: { $ne: true } }
        ]
      });
      const checkedOutItems = await collection.countDocuments({ 
        $or: [
          { _status: 'checked_out' },
          { _isCheckedOut: true }
        ]
      });
      
      // Get brand distribution
      const brandStats = await collection.aggregate([
        { $group: { _id: '$_brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      // Get category distribution
      const categoryStats = await collection.aggregate([
        { $group: { _id: '$_category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      const stats = {
        totalItems,
        availableItems,
        checkedOutItems,
        utilizationRate: totalItems > 0 ? ((checkedOutItems / totalItems) * 100).toFixed(2) : 0,
        brandDistribution: brandStats,
        categoryDistribution: categoryStats,
        lastUpdated: new Date()
      };
      
      console.log('Inventory statistics:', stats);
      return stats;
    } catch (error) {
      console.error('Error getting inventory statistics:', error);
      throw error;
    }
  }

  /**
   * Bulk update multiple items
   * @param {Array} updates - Array of {filter, update} objects
   * @returns {Promise<Object>} Update result
   */
  async bulkUpdate(updates) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(this.collectionName);
      
      const bulkOps = updates.map(({ filter, update }) => ({
        updateOne: {
          filter,
          update: { 
            $set: { 
              ...update, 
              updatedAt: new Date() 
            } 
          }
        }
      }));
      
      const result = await collection.bulkWrite(bulkOps);
      console.log('Bulk update completed:', result.modifiedCount, 'items updated');
      return result;
    } catch (error) {
      console.error('Error performing bulk update:', error);
      throw error;
    }
  }
}

module.exports = InventoryDatabase;
