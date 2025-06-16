const express = require('express');
const router = express.Router();
const InventoryController = require('../Controllers/Inventory/InventoryController');

router.post('/', async (req, res) => 
{
  const io = req.app.get('io'); // Get the Socket.IO instance
  try{
    if(req.body.purpose === 'retrieve') {
      var controller = new InventoryController();
      const inventoryData = await controller.getAllInventory();
      console.log('Retrieved inventory data:', inventoryData);
      res.json(inventoryData);
    }
    else if(req.body.purpose === 'create') {
      var controller = new InventoryController();
      const result = await controller.createInventoryItem(req.body.data);
      if (io) {
        io.emit('inventory-updated', {
          message: 'Inventory updated successfully',
          inventories: req.body.data,
        });
      }
      res.json(result);
    }
    else if(req.body.purpose === 'update') {
      console.log('Updating inventory item:', req.body.data);
      var controller = new InventoryController();
      const result = await controller.updateInventoryItem(req.body.data);
      if (io) {
        io.emit('inventory-updated', {
          message: 'Inventory updated successfully',
          inventories: req.body.data,
        });
      }
      res.json(result);
    }
    else if(req.body.purpose === 'update') {
      console.log('Updating inventory item:', req.body.data);
      var controller = new InventoryController();
      const result = await controller.updateInventoryItem(req.body.data);
      if (io) {
        io.emit('inventory-updated', {
          message: 'Inventory updated successfully',
          inventories: req.body.data,
        });
      }
      res.json(result);
    }
    else if(req.body.purpose === 'delete') 
    {
      console.log('Deleting inventory item:', req.body);
      var controller = new InventoryController();
      
      // Determine which identifier to use for deletion
      let result;
      if (req.body.serialNumber) {
        result = await controller.deleteInventoryItemBySerialNumber(req.body.serialNumber);
      } else if (req.body.assetsIdTag) {
        result = await controller.deleteInventoryItemByAssetsTag(req.body.assetsIdTag);
      } else {
        return res.json({ 
          success: false, 
          error: 'No valid identifier provided. Please provide either serialNumber or assetsIdTag.' 
        });
      }
      
      if (io) {
        io.emit('inventory-updated', {
          message: 'Inventory item deleted successfully',
          action: 'delete',
          identifier: req.body.serialNumber || req.body.assetsIdTag,
        });
      }
      res.json(result);
    }
  }
  catch (error) {
    console.error('Error in POST /inventory:', error);
    res.json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;