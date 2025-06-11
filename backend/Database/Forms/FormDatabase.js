const dbConnection = require('../connection');
const FormItem = require('../../Entities/Forms/FormItem');

class FormDatabase {
  constructor() {
  }

  async save(collectionName, formData) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(collectionName);
      const form = formData;
      const result = await collection.insertOne(form);
      console.log('Form saved successfully:', result);
      
      // Return the saved document with the generated _id
      return {
        _id: result.insertedId,
        ...form
      };
    } catch (error) {
      console.error('Error saving form:', error);
      throw error;
    }
  }

  async getCurrentInventoryByEmployee(collectionName, employeeInfo) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(collectionName);
      
      // Build query to find forms for the employee
      const query = {
        $and: [
          { 'name': { $regex: new RegExp(employeeInfo.name, 'i') } },
          { 'email': { $regex: new RegExp(employeeInfo.email, 'i') } },
          { 'mobileNo': employeeInfo.mobileNo }
        ]
      };
      
      // Get all forms for this employee, sorted by date to process chronologically
      const forms = await collection.find(query).toArray();
      console.log("Forms:", forms);
      
      // Track current inventory status for each item
      const inventoryStatus = {};
      
      // Process all forms chronologically to get current status
      forms.forEach(form => {
        if (form.inventories && Array.isArray(form.inventories)) {
          form.inventories.forEach(inventory => {
            const key = inventory.ecssInventoryNo;
            
            if (inventory.action === 'checkout') {
              // Item was checked out
              inventoryStatus[key] = {
                ...inventory,
                status: 'checked_out',
                checkoutDate: form.submissionData?.date || '',
                checkoutTime: form.submissionData?.time || ''
              };
            } else if (inventory.action === 'checkin') {
              // Item was returned
              delete inventoryStatus[key];
            } else if (inventory.action === 'update') {
              // Item details were updated
              if (inventoryStatus[key]) {
                inventoryStatus[key] = {
                  ...inventoryStatus[key],
                  ...inventory,
                  status: 'checked_out' // Still checked out, just updated
                };
              }
            }
          });
        }
      });
      
      // Return currently checked out items with proper structure
      const inventoryItems = Object.values(inventoryStatus).map(inventory => {
        // Create a structured inventory item
        return {
          ecssInventoryNo: inventory.ecssInventoryNo || '',
          itemDescription: {
            brand: inventory.itemDescription?.brand || '',
            model: inventory.itemDescription?.model || '',
            serialNumber: inventory.itemDescription?.serialNumber || ''
          },
          condition: inventory.condition || '',
          notes: inventory.notes || '',
          action: inventory.action || 'checkout',
          status: inventory.status || 'checked_out',
          checkoutDate: inventory.checkoutDate || '',
          checkoutTime: inventory.checkoutTime || ''
        };
      });

      console.log(`Current inventory for employee ${employeeInfo.name}:`, inventoryItems);
      
      return inventoryItems;
    } catch (error) {
      console.error('Error getting current inventory by employee:', error);
      throw error;
    }
  }

  async findByEmployee(collectionName, employeeInfo) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(collectionName);
      
      // Build query to find forms for the employee
      const query = {
        $and: [
          { 'submissionData.name': { $regex: new RegExp(employeeInfo.name, 'i') } },
          { 'submissionData.email': { $regex: new RegExp(employeeInfo.email, 'i') } },
          { 'submissionData.mobileNo': employeeInfo.mobileNo }
        ]
      };
      
      // Find all forms for this employee, sorted by most recent first
      const forms = await collection.find(query).sort({ 'submissionData.date': -1 }).toArray();
      console.log(`Found ${forms.length} forms for employee:`, employeeInfo);
      
      return forms;
    } catch (error) {
      console.error('Error finding forms by employee:', error);
      throw error;
    }
  }
}

module.exports = FormDatabase;