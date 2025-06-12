const FormItem = require('../../Entities/Forms/FormItem');
const FormDatabase = require('../../Database/Forms/FormDatabase');

class FormsController 
{
  constructor() {
    this.collectionName = 'Checkin/Checkout Forms';
    this.formDatabase = new FormDatabase();
  }

  createForm(formData) {
    return new Promise((resolve, reject) => {
      try {
        // Validate form data
        if (!formData) {
          reject({
            status: 'error',
            message: 'Invalid form data'
          });
          return;
        }
        
        // Save the form item to the database
        this.formDatabase.save(this.collectionName, formData)
          .then(savedItem => {
            resolve({
              status: 'success',
              message: 'Form created successfully',
              data: savedItem
            });
          })
          .catch(err => {
            reject({
              status: 'error',
              message: 'Failed to save form to database',
              data: null,
              error: err.message || err
            });
          });
      } catch (error) {
        reject({
          status: 'error',
          message: 'An unexpected error occurred while creating the form'
        });
      }
    });
  }

  updateForm(formData) {
    return new Promise((resolve, reject) => {
      try {
        // Validate form data
        if (!formData) {
          reject({
            status: 'error',
            message: 'Invalid form data'
          });
          return;
        }
        
        // Update the existing form/inventory data for the employee
        this.formDatabase.updateEmployeeInventory(this.collectionName, formData)
          .then(updatedItem => {
            resolve({
              status: 'success',
              message: 'Form updated successfully',
              data: updatedItem
            });
          })
          .catch(err => {
            reject({
              status: 'error',
              message: 'Failed to update form in database',
              data: null,
              error: err.message || err
            });
          });
      } catch (error) {
        reject({
          status: 'error',
          message: 'An unexpected error occurred while updating the form'
        });
      }
    });
  }

  getEmployeeCurrentInventory(employeeInfo) {
    return new Promise((resolve, reject) => {
      try {
        // Validate employee info
        if (!employeeInfo || !employeeInfo.name || !employeeInfo.email || !employeeInfo.mobileNo) {
          reject({
            status: 'error',
            message: 'Employee name, email, and mobile number are required'
          });
          return;
        }
        
        // Get current inventory for the employee
        this.formDatabase.getCurrentInventoryByEmployee(this.collectionName, employeeInfo)
          .then(currentInventory => {
            console.log("Current Inventory:", currentInventory[0].inventories);
            const responseData = new FormItem();
            responseData.setId(currentInventory[0]._id); // Assuming department is part of employeeInfo
            responseData.setName(currentInventory[0].name);
            responseData.setEmail(currentInventory[0].email);
            responseData.setMobileNo(currentInventory[0].mobileNo);
            responseData.setInventories(currentInventory[0].inventories); // currentInventory is already an array of inventory items

            console.log("Format:", responseData);
            
            resolve({
              status: 'success',
              message: 'Current inventory retrieved successfully',
              data: responseData
            });
          })
          .catch(err => {
            reject({
              status: 'error',
              message: 'Failed to retrieve current inventory from database',
              data: null,
              error: err.message || err
            });
          });
      } catch (error) {
        reject({
          status: 'error',
          message: 'An unexpected error occurred while retrieving current inventory'
        });
      }
    });
  }

  getEmployeeForms(employeeInfo) {
    return new Promise((resolve, reject) => {
      try {
        // Validate employee info
        if (!employeeInfo || !employeeInfo.name || !employeeInfo.email || !employeeInfo.mobileNo) {
          reject({
            status: 'error',
            message: 'Employee name, email, and mobile number are required'
          });
          return;
        }
        
        // Get all forms for the employee
        this.formDatabase.findByEmployee(this.collectionName, employeeInfo)
          .then(forms => {
            console.log("Forms found for employee:", forms);
            // Format forms using FormItem pattern
            const formattedForms = forms.map(form => {
              const formItem = new FormItem();
              if (form) {
                formItem.setName(form.name || '');
                formItem.setDepartment(form.department || '');
                formItem.setEmail(form.email || '');
                formItem.setMobileNo(form.mobileNo || '');
                formItem.setInventories(form.inventories || []);
                formItem.setDate(form.date || '');
                formItem.setTime(form.time || '');
              }
              return {
                _id: form._id,
                name: formItem.getName(),
                department: formItem.getDepartment(),
                email: formItem.getEmail(),
                mobileNo: formItem.getMobileNo(),
                inventories: formItem.getInventories(),
                date: formItem.getDate(),
                time: formItem.getTime()
              };
            });
            
            resolve({
              status: 'success',
              message: 'Employee forms retrieved successfully',
              data: formattedForms
            });
          })
          .catch(err => {
            reject({
              status: 'error',
              message: 'Failed to retrieve employee forms from database',
              data: null,
              error: err.message || err
            });
          });
      } catch (error) {
        reject({
          status: 'error',
          message: 'An unexpected error occurred while retrieving employee forms'
        });
      }
    });
  }
}

module.exports = FormsController;
