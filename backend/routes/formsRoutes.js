const express = require('express');
const router = express.Router();
const FormsController = require('../Controllers/Forms/FormsController');

router.post('/', async (req, res) => 
{
  try{
    if(req.body.purpose === 'new') {
      var controller = new FormsController();
      const result = await controller.createForm(req.body.submissionData);
      res.json(result);
    }
    else if(req.body.purpose === 'existing') {
      const controller = new FormsController();
      const result = await controller.getEmployeeCurrentInventory(req.body.employeeInfo);
      console.log('Result:', result);
      res.json(result);
    }
  }
  catch (error) {
    console.error('Error in POST /forms:', error);
    res.json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;