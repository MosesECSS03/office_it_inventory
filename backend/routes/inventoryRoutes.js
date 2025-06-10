const express = require('express');
const router = express.Router();
const InventoryController = require('../Controllers/InventoryController');

router.post('/', async (req, res) => 
{
  try{
    if(req.body.purpose === 'retrieve') {
      var controller = new InventoryController();
      const inventoryData = await controller.getAllInventory();
      res.json(inventoryData);
    }
  }
  catch (error) {
    console.error('Error in POST /inventory:', error);
    res.json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;