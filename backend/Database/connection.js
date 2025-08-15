const { MongoClient } = require('mongodb');

/**
 * MongoDB Connection Manager
 * Handles database connections and provides collection access
 */
class DatabaseConnection {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    
    // Database configuration
    //this.uri = 'mongodb+srv://moseslee:Mlxy6695@ecss-course.hejib.mongodb.net/?retryWrites=true&w=majority&appName=ECSS-Course';
    this.uri = 'mongodb+srv://moseslee:Mlxy6695@ecss-database.dstyrk4.mongodb.net/?retryWrites=true&w=majority&appName=ECSS-Database';
    this.databaseName = 'IT-Management-System';
  }

  /**
   * Connect to MongoDB
   * @returns {Promise<boolean>} Connection success status
   */
  async connect() {
    try {
      if (this.isConnected) {
        console.log('📊 Database already connected');
        return true;
      }

      console.log('🔗 Connecting to MongoDB...');
      
      this.client = new MongoClient(this.uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      await this.client.connect();
      this.db = this.client.db(this.databaseName);
      this.isConnected = true;

      console.log('✅ Successfully connected to MongoDB');
      console.log(`📊 Database: ${this.databaseName}`);
      
      // Test the connection
      await this.db.admin().ping();
      console.log('🏓 Database ping successful');

      return true;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get database instance
   * @returns {Object} MongoDB database instance
   */
  getDatabase() {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Get collection instance
   * @param {string} collectionName - Name of the collection
   * @returns {Object} MongoDB collection instance
   */
  getCollection(collectionName) {
    const db = this.getDatabase();
    return db.collection(collectionName);
  }

  /**
   * Check connection status
   * @returns {boolean} Connection status
   */
  isConnectionActive() {
    return this.isConnected && this.client && this.db;
  }

  /**
   * Get connection information
   * @returns {Object} Connection details
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      databaseName: this.databaseName,
      uri: this.uri.replace(/\/\/.*@/, '//***:***@') // Hide credentials
    };
  }

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.client) {
        await this.client.close();
        console.log('🔌 MongoDB connection closed');
      }
      this.isConnected = false;
      this.client = null;
      this.db = null;
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error.message);
    }
  }

  /**
   * Handle graceful shutdown
   */
  setupGracefulShutdown() {
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      await this.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      await this.close();
      process.exit(0);
    });
  }
}

// Create and export singleton instance
const dbConnection = new DatabaseConnection();

// Setup graceful shutdown
dbConnection.setupGracefulShutdown();

module.exports = dbConnection;
