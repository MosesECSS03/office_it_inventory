const dbConnection = require('../connection');
const { ObjectId } = require('mongodb');

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
      // Make email and mobile number optional for matching
      const query = {
        $and: [
          { 'name': { $regex: new RegExp(employeeInfo.name, 'i') } },
          { 'employeeId': employeeInfo.employeeId }
        ]
      };
      
      // Only add email to query if it's provided and not empty
      if (employeeInfo.email && employeeInfo.email.trim()) {
        query.$and.push({ 'email': { $regex: new RegExp(employeeInfo.email, 'i') } });
      }
      
      // Only add mobile number to query if it's provided and not empty
      if (employeeInfo.mobileNo && employeeInfo.mobileNo.trim()) {
        query.$and.push({ 'mobileNo': employeeInfo.mobileNo });
      }
      
      // Get all forms for this employee, sorted by date to process chronologically
      const forms = await collection.find(query).toArray();
      console.log("Forms found for employee123:", forms[0]?.inventories);
      return forms;
    } catch (error) {
      console.error('Error getting current inventory by employee:', error);
      throw error;
    }
  }

  async updateEmployeeInventory(collectionName, formData) {
    try {
      // Validate required fields
      if (!formData.name || !formData.employeeId || !formData.email) {
        throw new Error('Employee name, employee ID, and email are required');
      }

      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(collectionName);
      
      // Check if employeeFormObjectId is provided for targeted update
      if (formData.employeeFormObjectId) {
        console.log('Updating specific form with ObjectId:', formData.employeeFormObjectId);
        
        // Validate ObjectId format
        if (!ObjectId.isValid(formData.employeeFormObjectId)) {
          throw new Error(`Invalid ObjectId format: ${formData.employeeFormObjectId}`);
        }
        
        const documentId = new ObjectId(formData.employeeFormObjectId);
        
        // First, get the existing document to work with current inventories
        const existingDocument = await collection.findOne({ _id: documentId });
        if (!existingDocument) {
          throw new Error(`No document found with ID: ${formData.employeeFormObjectId}`);
        }
        
        // Get current inventories from the document (handle both field names)
        let currentInventories = existingDocument.inventories || existingDocument._inventories || [];
        console.log('Current inventories before update:', currentInventories);
        
        // Process new inventory items if provided
        if (formData.inventories && formData.inventories.length > 0) {
          // Separate items by action type
          const checkoutItems = [];
          const checkinItems = [];
          const updateItems = [];
          
          formData.inventories.forEach(item => {
            if (item.ecssInventoryNo && item.ecssInventoryNo.trim()) {
              const inventoryItem = {
                ecssInventoryNo: item.ecssInventoryNo.trim(),
                itemDescription: item.itemDescription || '',
                condition: item.condition,
                notes: item.notes || '',
                location: item.location || '',
                updatedAt: new Date()
              };

              if (item.action === 'checkin') {
                // Items being returned (checked in)
                checkinItems.push({
                  ...inventoryItem,
                  action: 'checkin',
                  returnDate: formData.date || new Date().toISOString().split('T')[0],
                  returnTime: formData.time || new Date().toTimeString().split(' ')[0]
                });
              } else if (item.action === 'checkout') {
                // New items being checked out
                checkoutItems.push({
                  ...inventoryItem,
                  action: 'checkout',
                  checkoutDate: formData.date || new Date().toISOString().split('T')[0],
                  checkoutTime: formData.time || new Date().toTimeString().split(' ')[0]
                });
              } else {
                // Items being updated (condition, notes, etc.)
                updateItems.push({
                  ...inventoryItem,
                  action: item.action || 'update'
                });
              }
            }
          });
          
          console.log('Processing items:', {
            checkoutItems: checkoutItems.length,
            checkinItems: checkinItems.length,
            updateItems: updateItems.length
          });
          
          // Log details of items being processed
          if (checkoutItems.length > 0) {
            console.log('Checkout items:', checkoutItems.map(item => item.ecssInventoryNo));
          }
          if (checkinItems.length > 0) {
            console.log('Checkin items:', checkinItems.map(item => item.ecssInventoryNo));
          }
          if (updateItems.length > 0) {
            console.log('Update items:', updateItems.map(item => item.ecssInventoryNo));
          }
          
          // Log current inventory items for comparison
          console.log('Current inventory items:', currentInventories.map(item => item.ecssInventoryNo));
          
          // Start with current inventories
          let updatedInventories = [...currentInventories];
          
          // Remove checked-in items from current inventory
          if (checkinItems.length > 0) {
            const checkinInventoryNos = checkinItems.map(item => item.ecssInventoryNo);
            const itemsBeforeRemoval = updatedInventories.length;
            
            updatedInventories = updatedInventories.filter(item => 
              !checkinInventoryNos.includes(item.ecssInventoryNo)
            );
            
            const itemsRemoved = itemsBeforeRemoval - updatedInventories.length;
            console.log(`Removed ${itemsRemoved} checked-in items from inventory`);
            
            // Log which items were successfully found and removed vs not found
            checkinInventoryNos.forEach(inventoryNo => {
              const wasInInventory = currentInventories.some(item => item.ecssInventoryNo === inventoryNo);
              if (wasInInventory) {
                console.log(`✓ Successfully returned item: ${inventoryNo}`);
              } else {
                console.log(`⚠ Warning: Item ${inventoryNo} was not found in current inventory`);
              }
            });
          }
          
          // Add new checkout items to current inventory
          if (checkoutItems.length > 0) {
            // Check for duplicates before adding
            checkoutItems.forEach(newItem => {
              const existingIndex = updatedInventories.findIndex(item => 
                item.ecssInventoryNo === newItem.ecssInventoryNo
              );
              if (existingIndex === -1) {
                updatedInventories.push(newItem);
                console.log(`Added new checkout item: ${newItem.ecssInventoryNo}`);
              } else {
                console.log(`Warning: Item ${newItem.ecssInventoryNo} already exists in inventory, skipping`);
              }
            });
          }
          
          // Update existing items that aren't being returned or newly checked out
          if (updateItems.length > 0) {
            let updatedCount = 0;
            let addedCount = 0;
            
            updateItems.forEach(updateItem => {
              const existingIndex = updatedInventories.findIndex(item => 
                item.ecssInventoryNo === updateItem.ecssInventoryNo
              );
              if (existingIndex !== -1) {
                // Update the existing item with new data
                updatedInventories[existingIndex] = {
                  ...updatedInventories[existingIndex], // Keep any existing fields
                  ...updateItem // Override with new data
                };
                console.log(`Updated existing item ${updateItem.ecssInventoryNo}`);
                updatedCount++;
              } else {
                // Add item if it doesn't exist (treat as new assignment)
                const newItem = {
                  ...updateItem,
                  action: 'checkout', // Change action to checkout since it's being added
                  checkoutDate: formData.date || new Date().toISOString().split('T')[0],
                  checkoutTime: formData.time || new Date().toTimeString().split(' ')[0]
                };
                updatedInventories.push(newItem);
                console.log(`Added new item ${updateItem.ecssInventoryNo} (was marked for update but not found in inventory)`);
                addedCount++;
              }
            });
            console.log(`Updated ${updatedCount} existing items and added ${addedCount} new items to inventory`);
          }
          
          currentInventories = updatedInventories;
        }
        
        // Prepare update data
        const updateData = {
          $set: {
            name: formData.name,
            employeeId: formData.employeeId,
            department: formData.department || existingDocument.department,
            email: formData.email,
            mobileNo: formData.mobileNo,
            inventories: currentInventories, // Use consistent field name
            date: formData.date || new Date().toISOString().split('T')[0],
            time: formData.time || new Date().toTimeString().split(' ')[0],
            formType: formData.formType || 'update',
            lastUpdated: new Date()
          }
        };
        
        // Remove _inventories field if it exists to maintain consistency
        if (existingDocument._inventories) {
          updateData.$unset = { _inventories: "" };
        }

        const result = await collection.updateOne(
          { _id: documentId },
          updateData
        );
        
        console.log('Employee inventory update result:', result);
        console.log('Updated inventories count:', currentInventories.length);
        
        if (result.matchedCount === 0) {
          throw new Error(`No document found with ID: ${formData.employeeFormObjectId}`);
        }
        
        return {
          _id: documentId,
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          inventoriesCount: currentInventories.length,
          message: 'Employee inventory updated successfully',
          updatedInventories: currentInventories
        };
      }
      
      // If no employeeFormObjectId provided, create a new form entry
      console.log('Creating new form entry for employee inventory');
      
      // Check if this is primarily a return operation (checkin items)
      const hasCheckinItems = formData.inventories && formData.inventories.some(item => item.action === 'checkin');
      
      if (hasCheckinItems) {
        // For return operations without a form ID, we need to find the employee's existing form
        console.log('Return operation detected, searching for existing employee form...');
        
        const query = {
          name: formData.name,
          employeeId: formData.employeeId,
          email: formData.email,
          mobileNo: formData.mobileNo,
          formType: { $ne: 'return' } // Exclude return records from search
        };
        
        // Find the most recent form for this employee
        const existingForms = await collection.find(query).sort({ _id: -1 }).toArray();
        
        if (existingForms.length > 0) {
          const existingForm = existingForms[0];
          console.log('Found existing form for return operation:', existingForm._id);
          
          // Use the existing form ID and process as an update
          formData.employeeFormObjectId = existingForm._id.toString();
          
          // Recursively call this method with the found form ID
          return this.updateEmployeeInventory(collectionName, formData);
        } else {
          throw new Error(`Cannot process return: No existing checkout record found for employee ${formData.name}`);
        }
      } else {
        // This is a new checkout operation, create a new form entry
        const newFormData = {
          name: formData.name,
          employeeId: formData.employeeId,
          department: formData.department || '',
          email: formData.email,
          mobileNo: formData.mobileNo,
          inventories: [],
          date: formData.date || new Date().toISOString().split('T')[0],
          time: formData.time || new Date().toTimeString().split(' ')[0],
          formType: formData.formType || 'checkout',
          createdAt: new Date(),
          lastUpdated: new Date()
        };

        // Process new inventory items for checkout
        if (formData.inventories && formData.inventories.length > 0) {
          const checkoutItems = [];
          
          formData.inventories.forEach(item => {
            if (item.ecssInventoryNo && item.ecssInventoryNo.trim()) {
              const inventoryItem = {
                ecssInventoryNo: item.ecssInventoryNo.trim(),
                itemDescription: item.itemDescription || '',
                condition: item.condition || 'Good',
                notes: item.notes || '',
                location: item.location || '',
                action: 'checkout',
                checkoutDate: formData.date || new Date().toISOString().split('T')[0],
                checkoutTime: formData.time || new Date().toTimeString().split(' ')[0],
                updatedAt: new Date()
              };
              checkoutItems.push(inventoryItem);
            }
          });
          
          newFormData.inventories = checkoutItems;
          console.log(`Creating new form with ${checkoutItems.length} checkout items`);
        }

        const result = await collection.insertOne(newFormData);
        console.log('New form created successfully:', result.insertedId);
        
        return {
          _id: result.insertedId,
          inventoriesCount: newFormData.inventories.length,
          message: 'New employee form created successfully',
          updatedInventories: newFormData.inventories
        };
      }
    } catch (error) {
      console.error('Error in updateEmployeeInventory:', error);
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
      // Make email and mobile number optional for matching
      const query = {
        $and: [
          { 'name': { $regex: new RegExp(employeeInfo.name, 'i') } },
          { 'employeeId': employeeInfo.employeeId }
        ]
      };
      
      // Only add email to query if it's provided and not empty
      if (employeeInfo.email && employeeInfo.email.trim()) {
        query.$and.push({ 'email': { $regex: new RegExp(employeeInfo.email, 'i') } });
      }
      
      // Only add mobile number to query if it's provided and not empty
      if (employeeInfo.mobileNo && employeeInfo.mobileNo.trim()) {
        query.$and.push({ 'mobileNo': employeeInfo.mobileNo });
      }
      
      // Get all forms for this employee, sorted by date (newest first)
      const forms = await collection.find(query).sort({ date: -1, time: -1 }).toArray();
      console.log("All forms found for employee:", forms.length);
      return forms;
    } catch (error) {
      console.error('Error finding forms by employee:', error);
      throw error;
    }
  }

  async getAllEmployees(collectionName) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(collectionName);
      
      // Get unique employees based on employeeId
      const employees = await collection.aggregate([
        {
          $group: {
            _id: "$employeeId",
            name: { $first: "$name" },
            employeeId: { $first: "$employeeId" },
            email: { $first: "$email" },
            mobileNo: { $first: "$mobileNo" },
            department: { $first: "$department" },
            latestDate: { $max: "$date" }
          }
        },
        {
          $sort: { name: 1 } // Sort by name alphabetically
        },
        {
          $project: {
            _id: 0,
            employeeId: 1,
            name: 1,
            email: 1,
            mobileNo: 1,
            department: 1
          }
        }
      ]).toArray();
      
      console.log('Unique employees found:', employees);
      return employees;
    } catch (error) {
      console.error('Error getting all employees:', error);
      throw error;
    }
  }

  async getEmployeeByCode(collectionName, employeeCode) {
    try {
      // Ensure connection is established
      await dbConnection.connect();
      const db = dbConnection.getDatabase();
      const collection = db.collection(collectionName);
      
      // Find the most recent record for this employee code
      const employee = await collection.findOne(
        { employeeId: employeeCode },
        { sort: { date: -1, time: -1 } } // Get the most recent record
      );
      
      if (!employee) {
        return null;
      }
      
      // Return just the employee details (not inventories)
      return {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        mobileNo: employee.mobileNo,
        department: employee.department
      };
    } catch (error) {
      console.error('Error getting employee by code:', error);
      throw error;
    }
  }
}

module.exports = FormDatabase;