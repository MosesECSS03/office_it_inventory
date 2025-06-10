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
      console.log('Retrieved all inventory items:', items[0]);
      return items;
    } catch (error) {
      console.error('Error retrieving all inventory items:', error);
      throw error;
    }
  }
}

module.exports = InventoryDatabase;
