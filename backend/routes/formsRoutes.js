const express = require('express');
const router = express.Router();
const FormsController = require('../Controllers/Forms/FormsController');
const InventoryController = require('../Controllers/Inventory/InventoryController');

router.post('/', async (req, res) => 
{
  const io = req.app.get('io'); // Get the Socket.IO instance
  console.log('Received POST request on /forms with body:', req.body);
  try{
    if(req.body.purpose === 'new') {
      var inventories = req.body.submissionData.inventories;
      var userName = req.body.submissionData.name;
      
      var controller = new FormsController();
      const result = await controller.createForm(req.body.submissionData);
            
      const controller1 = new InventoryController();
      const inventoryResult = await controller1.updateInventory(inventories, userName);
      
      if (!inventoryResult.success) {
        console.error('Inventory update failed:', inventoryResult.error);
        return res.json({ status: 'error', success: false, message: inventoryResult.error || 'Inventory update failed' });
      } else {
        console.log('Inventory updated successfully:', inventoryResult.message);
      }

      // Emit real-time update to connected clients
      if (io) {
        io.emit('inventory-updated', {
          message: 'Inventory updated successfully',
          inventories: inventories,
        });
      }

      
      // Return consistent success response
      res.json({ status: 'success', success: true, message: 'Equipment checked out successfully', data: result });
    }
    else if(req.body.purpose === 'update') {
      console.log('Updating form with data:', req.body.submissionData);
      var inventories = req.body.submissionData.inventories;
      var userName = req.body.submissionData.name;
      console.log('Inventories to update:', inventories);
      const controller = new FormsController();
      const result = await controller.updateForm(req.body.submissionData);
      
      const controller1 = new InventoryController();
      const inventoryResult = await controller1.updateInventory(inventories, userName);
      
      if (!inventoryResult.success) {
        console.error('Inventory update failed:', inventoryResult.error);
        // You might want to handle this error differently based on your business logic
      } else {
        console.log('Inventory updated successfully:', inventoryResult.message);
      }

      // Emit real-time update to connected clients
      if (io) {
        io.emit('inventory-updated', {
          message: 'Inventory updated successfully',
          inventories: inventories,
        });
      }
      
      // Return consistent success response
      res.json({ status: 'success', success: true, message: 'Equipment updated successfully', data: result });
    }
    else if(req.body.purpose === 'existing') {
      const controller = new FormsController();
      const result = await controller.getEmployeeCurrentInventory(req.body.employeeInfo);
      //console.log('Retrieved current inventory for employee inventory:', result.data);
      res.json(result);
    }
  }
  catch (error) {
    console.error('Error in POST /forms:', error);
    res.json({ status: 'error', success: false, message: 'Internal server error' });
  }
});

module.exports = router;