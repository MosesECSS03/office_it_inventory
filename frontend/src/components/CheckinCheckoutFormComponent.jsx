import React, { Component } from 'react'
import axios from 'axios'
import '../css/CheckinCheckoutFormComponent.css'
import '../css/TableComponent.css'
import '../css/ModalComponents.css'

const baseURL = `${window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:3001" 
  : "https://ecss-it-inventory-backend.azurewebsites.net"}`;

class CheckinCheckoutFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: false,
      activeTab: 'new', // 'new' or 'existing'
      currentPage: 1,
      totalPages: 2,
      
      // Employee Details (Page 1)
      employeeDetails: {
        name: '',
        employeeId: '',
        department: '',
        email: '',
        mobileNo: '',
        date: new Date().toISOString().split('T')[0],
        signature: ''
      },
      
      // Table Data (Page 2)
      tableRows: this.createDefaultRows(4),
      isSubmitting: false,
      errors: {},
      successMessage: '',
      
      // Object IDs from page transition
      employeeFormObjectId: null, // Store the form object ID after fetching employee data
      
      // Search dropdown state
      searchDropdowns: {}, // Object to track dropdown state for each row
      searchSuggestions: {}, // Object to store suggestions for each row
      
      // Employee dropdown state for existing tab
      employees: [], // List of all employees
      showEmployeeDropdown: false, // Show/hide employee dropdown
      employeeSearchTerm: '', // Search term for employee dropdown
      showAllEmployees: false // Flag to show all employees on click
    };
    
    // Timeout for debouncing inventory fetch
    this.fetchInventoryTimeout = null;
    
    // Refs for dropdowns
    this.employeeInputRef = React.createRef();
    this.inventoryInputRefs = {}; // Store refs for inventory inputs by row index
  }

  componentDidMount() {
    // Add click listener to hide dropdowns when clicking outside
    document.addEventListener('click', this.handleDocumentClick);
    
    // Fetch all employees for dropdown immediately on mount
    this.fetchAllEmployees();
  }

  componentWillUnmount() {
    // Remove click listener
    document.removeEventListener('click', this.handleDocumentClick);
    
    // Clear any pending timeouts
    if (this.fetchInventoryTimeout) {
      clearTimeout(this.fetchInventoryTimeout);
    }
  }

  handleDocumentClick = (event) => {
    // Check if click is outside search dropdown containers
    if (!event.target.closest('.search-dropdown-container')) {
      this.hideAllSearchDropdowns();
    }
  }

  componentDidUpdate(prevProps) {
    // Log data when props change to help debug
    if (prevProps.data !== this.props.data) {
      console.log('CheckinCheckoutForm received data:', this.props.data);
      if (this.props.data && this.props.data.length > 0) {
        console.log('First item structure:', this.props.data[0]);
        console.log('Available asset tags:', this.props.data.map(item => 
          item._assetsIdTag || item.getAssetsIdTag?.()
        ).filter(Boolean));
      }
    }
    
    if (this.props.isVisible !== prevProps.isVisible) {
      this.setState({ isVisible: this.props.isVisible });
      if (this.props.isVisible) {
        this.openForm();
      }
    }
  }

  createDefaultRows = (count) => {
    const rows = [];
    for (let i = 0; i < count; i++) {
      rows.push({
        id: i + 1,
        ecssInventoryNo: '',
        itemDescription: {
          brand: '',
          model: '',
          serialNumber: ''
        },
        condition: '',
        notes: '',
        location: '', // Add location field for return functionality
        action: this.state?.activeTab === 'new' ? 'checkout' : 'checkout', // Default action based on tab - checkout for both new items and new items in existing tab
        isPrePopulated: false // Default rows are not pre-populated
      });
    }
    return rows;
  }

  openForm = () => {
    this.setState({ 
      isVisible: true,
      currentPage: 1,
      employeeDetails: {
        name: '',
        employeeId: '',
        department: '',
        email: '',
        mobileNo: '',
        date: new Date().toISOString().split('T')[0],
        signature: ''
      },
      tableRows: this.createDefaultRows(4),
      errors: {},
      successMessage: '',
      activeTab: 'new',
      activeSubTab: 'return'
    });
  }

  closeForm = () => {
    // Clear any pending timeouts
    if (this.fetchInventoryTimeout) {
      clearTimeout(this.fetchInventoryTimeout);
    }
    
    this.setState({ 
      isVisible: false,
      currentPage: 1,
      tableRows: this.createDefaultRows(4),
      errors: {},
      successMessage: '',
      activeTab: 'new',
      activeSubTab: 'return'
    });
  }

  // Fetch all employees for dropdown
  fetchAllEmployees = async () => {
    console.log('🔍 Fetching all employees for dropdown...');
    try {
      const response = await axios.post(`${baseURL}/forms`, {
        purpose: 'getAllEmployees'
      });
      
      console.log('📋 Employee fetch response:', response.data);
      
      if (response.data && response.data.status === 'success') {
        const employeeData = response.data.data || [];
        this.setState({ 
          employees: employeeData
        }, () => {
          console.log('✅ Employees loaded and state updated:', this.state.employees.length, 'employees');
          console.log('👥 Employee list:', this.state.employees);
        });
      } else {
        console.error('❌ Failed to fetch employees - invalid response');
        this.setState({ employees: [] });
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      this.setState({ employees: [] });
    }
  }

  handleTabChange = (tab) => {
    // Clear any pending timeouts
    if (this.fetchInventoryTimeout) {
      clearTimeout(this.fetchInventoryTimeout);
    }
    
    this.setState({ 
      activeTab: tab,
      activeSubTab: tab === 'existing' ? 'return' : 'return',
      currentPage: 1,
      tableRows: this.createDefaultRows(4),
      errors: {},
      successMessage: '',
      showEmployeeDropdown: false,
      employeeSearchTerm: ''
    });

    // Fetch employees when switching to existing tab - ensure they're loaded immediately
    if (tab === 'existing') {
      this.fetchAllEmployees();
    }
  }

  handleEmployeeDetailChange = (field, value) => {
    this.setState(prevState => ({
      employeeDetails: {
        ...prevState.employeeDetails,
        [field]: value
      }
    }));
    // Note: Auto-fetch for existing tab is now handled by employee selection, not manual field changes
  }

  checkAndFetchEmployeeInventory = () => {
    const { employeeDetails } = this.state;
    
    // Check if only required fields (name and employeeId) are filled
    if (employeeDetails.name && employeeDetails.name.trim() && 
        employeeDetails.employeeId && employeeDetails.employeeId.trim()) {
      
      // Debounce the API call to avoid too many requests
      clearTimeout(this.fetchInventoryTimeout);
      this.fetchInventoryTimeout = setTimeout(() => {
        this.fetchEmployeeCurrentInventory();
      }, 1000); // Wait 1 second after user stops typing
    }
  }

  fetchEmployeeCurrentInventory = async () => {
    const { employeeDetails } = this.state;
    
    try {
      const employeeInfo = {
        name: employeeDetails.name.trim(),
        employeeId: employeeDetails.employeeId.trim(),
        email: employeeDetails.email ? employeeDetails.email.trim() : '',
        mobileNo: employeeDetails.mobileNo ? employeeDetails.mobileNo.trim() : ''
      };

      const response = await axios.post(`${baseURL}/forms`, {employeeInfo, purpose: "existing"});

      if (response.data && response.data.status === 'success') {
        const responseData = response.data.data;
        console.log('Response data structure:', responseData);
        
        // The responseData is an array of form documents, each containing inventories
        let currentInventory = [];
        let formObjectId = null;
        
        if (responseData) {

          console.log('Processing latest form:', responseData);
          
          // Extract inventories from the form
          currentInventory = responseData.inventories || [];
          formObjectId = responseData._id;
          
          console.log('Current inventory items:', currentInventory);
          console.log('Form Object ID:', formObjectId);
          
          if (currentInventory.length > 0) {
            // Populate table with current inventory
            const populatedRows = [];
            
            currentInventory.forEach((item, index) => {
              console.log(`Processing inventory item ${index + 1}:`, item);
              console.log(`Item description structure:`, typeof item.itemDescription, item.itemDescription);
              
              // Handle different itemDescription formats
              let itemDesc = { brand: '', model: '', serialNumber: '' };
              if (item.itemDescription) {
                if (typeof item.itemDescription === 'object' && item.itemDescription !== null) {
                  // It's already an object
                  itemDesc = {
                    brand: item.itemDescription.brand || '',
                    model: item.itemDescription.model || '',
                    serialNumber: item.itemDescription.serialNumber || ''
                  };
                } else if (typeof item.itemDescription === 'string') {
                  // It's a string, might need to parse or leave empty
                  console.log('itemDescription is a string:', item.itemDescription);
                }
              }
              
              populatedRows.push({
                id: index + 1,
                ecssInventoryNo: item.ecssInventoryNo || '',
                itemDescription: itemDesc,
                condition: item.condition || '',
                notes: item.notes || '',
                location: '', // Add location field for return functionality
                action: 'update', // Default action for existing items
                isPrePopulated: true // Mark as pre-populated from database
              });
            });

            // Add empty rows if needed to have at least 4 rows
            while (populatedRows.length < 4) {
              populatedRows.push({
                id: populatedRows.length + 1,
                ecssInventoryNo: '',
                itemDescription: {
                  brand: '',
                  model: '',
                  serialNumber: ''
                },
                condition: '',
                notes: '',
                location: '', // Add location field for return functionality
                action: 'checkout', // Default action for empty rows in existing tab (new items to checkout)
                isPrePopulated: false // Mark as not pre-populated
              });
            }

            console.log('Populated rows for existing inventory:', populatedRows);

            this.setState({ 
              tableRows: populatedRows,
              employeeFormObjectId: formObjectId, // Store the form object ID
              errors: {}, // Clear any previous errors
              successMessage: `✅ Found ${currentInventory.length} equipment item(s) for ${employeeDetails.name}`
            });

            // Clear success message after 3 seconds
            setTimeout(() => {
              this.setState({ successMessage: '' });
            }, 3000);
          } else {
            // No inventory found in the form
            this.setState({ 
              tableRows: this.createDefaultRows(4),
              employeeFormObjectId: formObjectId, // Still store the form ID even if no inventory
              successMessage: '⚠️ No equipment currently checked out to this employee.',
              errors: {}
            });

            // Clear message after 3 seconds
            setTimeout(() => {
              this.setState({ successMessage: '' });
            }, 3000);
          }
        } else {
          // No forms found for this employee
          this.setState({ 
            tableRows: this.createDefaultRows(4),
            employeeFormObjectId: null,
            successMessage: '⚠️ No existing records found for this employee.',
            errors: {}
          });

          // Clear message after 3 seconds
          setTimeout(() => {
            this.setState({ successMessage: '' });
          }, 3000);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to retrieve inventory');
      }

    } catch (error) {
      console.error('Error fetching employee inventory:', error);
      
      let errorMessage = 'Failed to retrieve employee inventory.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.setState({
        errors: { 
          general: `❌ ${errorMessage}` 
        },
        successMessage: '',
        tableRows: this.createDefaultRows(4),
        employeeFormObjectId: null
      });

      // Clear error message after 5 seconds
      setTimeout(() => {
        this.setState({ errors: {} });
      }, 5000);
    }
  }

  // Fetch existing employee inventory data
  fetchExistingEmployeeInventory = async () => {
    const { employeeDetails } = this.state;
    
    try {
      // Prepare employee info for the backend
      const employeeInfo = {
        name: employeeDetails.name,
        employeeId: employeeDetails.employeeId,
        email: employeeDetails.email || '',
        mobileNo: employeeDetails.mobileNo || ''
      };
      
      console.log('Fetching existing inventory for employee:', employeeInfo);
      
      const response = await axios.post(`${baseURL}/forms`, {
        purpose: "existing",
        employeeInfo: employeeInfo
      });
      
      console.log('Employee inventory response:', response.data);
      
      if (response.data && response.data.status === 'success') {
        const responseData = response.data.data;
        const currentInventory = responseData._inventories; // Get inventories array from FormItem response
        
        // Store the form object ID if available
        const formObjectId = responseData._id;
        console.log('Form Object ID from response:', formObjectId);
        console.log('Current inventory items:', currentInventory[0].inventories);
        
        if (currentInventory[0].inventories.length > 0) {
          // Create table rows from the existing inventory and capture object IDs
          const newTableRows = [];
          
          currentInventory[0].inventories.forEach((item, index) => {
            
            newTableRows.push({
              ecssInventoryNo: item.ecssInventoryNo || '',
              itemDescription: {
                brand: item.itemDescription?.brand || '',
                model: item.itemDescription?.model || '',
                serialNumber: item.itemDescription?.serialNumber || ''
              },
              condition: item.condition,
              notes: item.notes || '',
              location: '', // Add location field for return functionality
              action: 'update', // Default action for existing items
              isPrePopulated: true // Mark as pre-populated from database
            });
          });
          
          // Add extra empty rows if needed (minimum 4 rows)
          while (newTableRows.length < 4) {
            newTableRows.push({
              ecssInventoryNo: '',
              itemDescription: {
                brand: '',
                model: '',
                serialNumber: ''
              },
              condition: '',
              notes: '',
              location: '', // Add location field for return functionality
              action: 'checkout', // Default action for empty rows in existing tab (new items to checkout)
              isPrePopulated: false // Mark as not pre-populated
            });
          }
          
          this.setState({ 
            tableRows: newTableRows,
            employeeFormObjectId: formObjectId // Store the form object ID
          });
          
          // Clear success message after 4 seconds
          setTimeout(() => {
            this.setState({ successMessage: '' });
          }, 4000);
          
        } else {
          // No items found, keep default empty rows but show info message
          this.setState({ 
            successMessage: `No existing inventory found for ${employeeDetails.name}. You can add new items below.`
          });
          
          // Clear message after 4 seconds
          setTimeout(() => {
            this.setState({ successMessage: '' });
          }, 4000);
        }
      } else {
        console.log('No inventory data found for employee:', employeeDetails.name);
        this.setState({ 
          successMessage: `No existing inventory found for ${employeeDetails.name}. You can add new items below.`
        });
        
        // Clear message after 4 seconds
        setTimeout(() => {
          this.setState({ successMessage: '' });
        }, 4000);
      }
      
    } catch (error) {
      console.error('Error fetching employee inventory:', error);
      
      // Set error message based on the type of error
      let errorMessage = `Failed to retrieve inventory for ${employeeDetails.name}. `;
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage += 'Employee not found in records.';
        } else if (error.response.status === 500) {
          errorMessage += 'Server error occurred.';
        } else {
          errorMessage += `Server responded with status ${error.response.status}.`;
        }
      } else if (error.request) {
        errorMessage += 'Unable to connect to server.';
      } else {
        errorMessage += 'An unexpected error occurred.';
      }
      
      this.setState({ 
        errors: { general: errorMessage }
      });
      
      // Clear error after 6 seconds
      setTimeout(() => {
        this.setState({ errors: {} });
      }, 6000);
    }
  }

  handleCellChange = (rowIndex, field, value) => {
    const updatedRows = [...this.state.tableRows];
    updatedRows[rowIndex][field] = value;
    
    // Auto-set action based on tab only if action is not already set
    if (field !== 'action' && !updatedRows[rowIndex]['action']) {
      if (this.state.activeTab === 'new') {
        updatedRows[rowIndex]['action'] = 'checkout';
      } else {
        updatedRows[rowIndex]['action'] = 'checkout'; // Default for new items in existing tab (adding new equipment to checkout)
      }
    }
    
    this.setState({ tableRows: updatedRows });
  }

  handleItemDescriptionChange = (rowIndex, field, value) => {
    const updatedRows = [...this.state.tableRows];
    
    // Ensure itemDescription exists before accessing it
    if (!updatedRows[rowIndex].itemDescription) {
      updatedRows[rowIndex].itemDescription = {
        brand: '',
        model: '',
        serialNumber: ''
      };
    }
    
    updatedRows[rowIndex].itemDescription[field] = value;
    
    // Auto-set action based on tab only if action is not already set
    if (!updatedRows[rowIndex]['action']) {
      if (this.state.activeTab === 'new') {
        updatedRows[rowIndex]['action'] = 'checkout';
      } else {
        updatedRows[rowIndex]['action'] = 'checkout'; // Default for new items in existing tab
      }
    }
    
    this.setState({ tableRows: updatedRows });
  }

  handleInventoryNoChange = (rowIndex, value) => {
    // Update the inventory number first
    this.handleCellChange(rowIndex, 'ecssInventoryNo', value);
    
    // If user cleared the field, clear all auto-populated data and show dropdown
    if (!value.trim()) {
      this.clearRowData(rowIndex);
      // Show all available suggestions when field is cleared
      const allSuggestions = this.getAllSuggestions();
      this.setState(prevState => ({
        searchSuggestions: {
          ...prevState.searchSuggestions,
          [rowIndex]: allSuggestions
        },
        searchDropdowns: {
          ...prevState.searchDropdowns,
          [rowIndex]: allSuggestions.length > 0
        }
      }));
      return;
    }
    
    // Check if this value no longer matches the previously auto-populated item
    const currentRow = this.state.tableRows[rowIndex];
    if (currentRow && currentRow.itemDescription && currentRow.itemDescription.brand) {
      // There was previously auto-populated data, check if current value still matches
      const inventoryItem = this.findInventoryItem(value.trim());
      if (!inventoryItem || 
          (inventoryItem._assetsIdTag || inventoryItem.getAssetsIdTag?.()) !== value.trim()) {
        // Value changed and no longer matches, clear the auto-populated data but keep the inventory number
        const updatedRows = [...this.state.tableRows];
        updatedRows[rowIndex] = {
          ...updatedRows[rowIndex],
          itemDescription: {
            brand: '',
            model: '',
            serialNumber: ''
          },
          condition: '',
          notes: ''
        };
        this.setState({ tableRows: updatedRows });
      }
    }
    
    // Get search suggestions for dropdown
    const suggestions = this.getSearchSuggestions(value);
    
    // Auto-populate if there's exactly one suggestion and user has typed something
    if (value.trim() && suggestions.length === 1) {
      // Auto-select the single suggestion
      this.populateRowWithItem(rowIndex, suggestions[0].value, suggestions[0].item);
      // Hide dropdown since we auto-populated
      this.hideSearchDropdown(rowIndex);
      return;
    }
    
    // Update search suggestions and dropdown state
    this.setState(prevState => ({
      searchSuggestions: {
        ...prevState.searchSuggestions,
        [rowIndex]: suggestions
      },
      searchDropdowns: {
        ...prevState.searchDropdowns,
        [rowIndex]: suggestions.length > 0 // Show dropdown if any suggestions available
      }
    }));
    
    // Auto-populate data if exact match found
    if (value.trim() && this.props.data && this.props.data.length > 0) {
      const inventoryItem = this.findInventoryItem(value.trim());
      
      if (inventoryItem) {
        this.populateRowWithItem(rowIndex, value, inventoryItem);
        // Hide dropdown when exact match is found
        this.hideSearchDropdown(rowIndex);
      }
    }
  }

  clearRowData = (rowIndex, keepInventoryNo = false) => {
    const updatedRows = [...this.state.tableRows];
    
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      ecssInventoryNo: keepInventoryNo ? updatedRows[rowIndex].ecssInventoryNo : '',
      itemDescription: {
        brand: '',
        model: '',
        serialNumber: ''
      },
      condition: '',
      notes: '',
      location: '' // Clear location field as well
    };
    
    this.setState({ tableRows: updatedRows });
    
    // Also clear search suggestions and dropdown state when clearing
    if (!keepInventoryNo) {
      this.setState(prevState => ({
        searchSuggestions: {
          ...prevState.searchSuggestions,
          [rowIndex]: []
        },
        searchDropdowns: {
          ...prevState.searchDropdowns,
          [rowIndex]: false
        }
      }));
    }
  }

  // Handle keyboard events for inventory input
  handleInventoryInputKeyDown = (rowIndex, e) => {
    if (e.key === 'Escape') {
      // Clear the field and all auto-populated data
      this.clearRowData(rowIndex);
      this.hideSearchDropdown(rowIndex);
    } else if (e.key === 'Delete' && e.ctrlKey) {
      // Ctrl+Delete to clear all data
      this.clearRowData(rowIndex);
      this.hideSearchDropdown(rowIndex);
    }
  }

  // Handle input focus to show all available items
  handleInventoryNoFocus = (rowIndex) => {
    // Get all suggestions (show all items when focused)
    const suggestions = this.getSearchSuggestions('') || this.getAllSuggestions();
    
    this.setState(prevState => ({
      searchSuggestions: {
        ...prevState.searchSuggestions,
        [rowIndex]: suggestions
      },
      searchDropdowns: {
        ...prevState.searchDropdowns,
        [rowIndex]: suggestions.length > 0
      }
    }));
  }

  // Handle input click to show all available items
  handleInventoryNoClick = (rowIndex) => {
    // Get all suggestions (show all items when clicked)
    const suggestions = this.getAllSuggestions();
    
    this.setState(prevState => ({
      searchSuggestions: {
        ...prevState.searchSuggestions,
        [rowIndex]: suggestions
      },
      searchDropdowns: {
        ...prevState.searchDropdowns,
        [rowIndex]: suggestions.length > 0
      }
    }));
  }

  findInventoryItem = (searchValue) => {
    // Use props data if available, otherwise use sample data for testing
    const dataToSearch = this.props.data;
    
    return dataToSearch.find(item => 
      (item._assetsIdTag || item.getAssetsIdTag?.()) === searchValue || 
      (item._serialNumber || item.getSerialNumber?.()) === searchValue
    );
  }

  populateRowWithItem = (rowIndex, value, inventoryItem) => {
    const updatedRows = [...this.state.tableRows];
    
    // Populate the item description and other fields based on the found item
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      ecssInventoryNo: value,
      itemDescription: {
        brand: inventoryItem._brand || inventoryItem.getBrand?.() || '',
        model: inventoryItem._model || inventoryItem.getModel?.() || '',
        serialNumber: inventoryItem._serialNumber || inventoryItem.getSerialNumber?.() || ''
      },
      condition: "", // Default since condition might not be in current data structure
      notes: inventoryItem._notes || inventoryItem.getNotes?.() || ''
    };
    
    // Auto-set action based on tab
    if (this.state.activeTab === 'new') {
      updatedRows[rowIndex]['action'] = 'checkout';
    } else {
      updatedRows[rowIndex]['action'] = 'update'; // Default for existing items
    }
    
    this.setState({ tableRows: updatedRows });
    console.log('Found and populated inventory item:', inventoryItem);
  }

  handleSuggestionSelect = (rowIndex, suggestion) => {
    console.log('Suggestion selected:', suggestion, 'for row:', rowIndex);
    // Populate the row with selected suggestion
    this.populateRowWithItem(rowIndex, suggestion.value, suggestion.item);
    // Hide the dropdown
    this.hideSearchDropdown(rowIndex);
  }

  hideSearchDropdown = (rowIndex) => {
    this.setState(prevState => ({
      searchDropdowns: {
        ...prevState.searchDropdowns,
        [rowIndex]: false
      }
    }));
  }

  hideAllSearchDropdowns = () => {
    this.setState({
      searchDropdowns: {}
    });
  }

  // Handle return action - sets action to 'checkin'
  handleReturnAction = (rowIndex) => {
    const updatedRows = [...this.state.tableRows];
    updatedRows[rowIndex].action = 'checkin';
    this.setState({ tableRows: updatedRows });
    console.log(`Row ${rowIndex} action set to 'checkin' for return operation`);
  }

  // Handle update action - sets action to 'update'
  handleUpdateAction = (rowIndex) => {
    const updatedRows = [...this.state.tableRows];
    updatedRows[rowIndex].action = 'update';
    this.setState({ tableRows: updatedRows });
    console.log(`Row ${rowIndex} action set to 'update' for update operation`);
  }

  addRow = () => {
    const newRowId = Math.max(...this.state.tableRows.map(row => row.id), 0) + 1;
    const newRow = {
      id: newRowId,
      ecssInventoryNo: '',
      itemDescription: {
        brand: '',
        model: '',
        serialNumber: ''
      },
      condition: '',
      notes: '',
      location: '', // Add location field for return functionality
      action: this.state.activeTab === 'new' ? 'checkout' : 'checkout', // Default action for new rows in existing tab is checkout
      isPrePopulated: false // New rows are not pre-populated
    };
    this.setState({ 
      tableRows: [...this.state.tableRows, newRow] 
    });
  }

  removeRow = (index) => {
    if (this.state.tableRows.length > 1) {
      const updatedRows = this.state.tableRows.filter((_, i) => i !== index);
      this.setState({ tableRows: updatedRows });
    }
  }

  nextPage = async () => {
    if (this.validateCurrentPage()) {
      // If moving from page 1 to page 2 for "existing" tab, fetch employee inventory
      if (this.state.currentPage === 1 && this.state.activeTab === 'existing') {
        await this.fetchExistingEmployeeInventory();
      }
      
      this.setState(prevState => ({
        currentPage: Math.min(prevState.currentPage + 1, prevState.totalPages)
      }));
    }
  }

  prevPage = () => {
    this.setState(prevState => ({
      currentPage: Math.max(prevState.currentPage - 1, 1)
    }));
  }

  validateCurrentPage = () => {
    const { currentPage, employeeDetails, activeTab } = this.state;
    let errors = {};
    
    if (currentPage === 1) {
      if (!employeeDetails.name.trim()) errors.employeeName = 'Employee name is required';
      if (!employeeDetails.employeeId.trim()) errors.employeeId = 'Employee ID is required';
      // Only require department for "New" tab
      if (activeTab === 'new' && !employeeDetails.department.trim()) errors.department = 'Department is required';
      // Only require email and mobile number for "New" tab (optional for existing tab)
      if (activeTab === 'new' && !employeeDetails.email.trim()) errors.email = 'Email is required';
      if (activeTab === 'new' && !employeeDetails.mobileNo.trim()) errors.mobileNo = 'Mobile number is required';
    }
    
    this.setState({ errors });
    return Object.keys(errors).length === 0;
  }

  validateRows = () => {
    const { tableRows, activeTab } = this.state;
    const errors = {};
    
    tableRows.forEach((row, index) => {
      const rowErrors = {};
      
      // Check if any field in the row has data
      const hasData = row.ecssInventoryNo.trim() || 
                     (row.itemDescription && Object.values(row.itemDescription).some(value => value.trim())) ||
                     row.notes.trim();
      
      // If row has data, validate required fields
      if (hasData) {
        if (!row.ecssInventoryNo.trim()) rowErrors.ecssInventoryNo = 'Required';
      }
      
      if (Object.keys(rowErrors).length > 0) {
        errors[`row_${index}`] = rowErrors;
      }
    });
    
    return errors;
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    
    // If not on the last page, go to next page instead of submitting
    if (this.state.currentPage < this.state.totalPages) {
      this.nextPage();
      return;
    }
    
    // Final validation and submission
    const errors = this.validateRows();
    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }

    // Combine page 1 and page 2 data for submission
    const { employeeDetails, tableRows } = this.state;
    
    // Filter out empty rows from page 2
    const validRows = tableRows.filter(row => 
      row.ecssInventoryNo.trim() || 
      (row.itemDescription && Object.values(row.itemDescription).some(value => value.trim())) ||
      row.notes.trim()
    );

    // For existing tab (update form), allow submission even if table is empty
    // This allows updating just employee details or processing returns
    if (validRows.length === 0 && this.state.activeTab === 'new') {
      this.setState({ 
        errors: { general: 'Please fill in equipment details in the table.' }
      });
      return;
    }

    this.setState({ isSubmitting: true, errors: {} });

    try {
      // Get current date and time
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format
      
      // Prepare inventories array from valid table rows
      const inventories = validRows.map(row => ({
        ecssInventoryNo: row.ecssInventoryNo,
        itemDescription: row.itemDescription,
        condition: row.condition,
        notes: row.notes,
        location: row.location || '', // Include location field
        action: row.action || (this.state.activeTab === 'new' ? 'checkout' : 'update'),
      }));
      
      // Determine the purpose based on the active tab
      const purpose = this.state.activeTab === 'new' ? 'new' : 'update';

      
      // Submit data in the required format
      const submissionData = {
        name: employeeDetails.name,
        employeeId: employeeDetails.employeeId, // Required employee ID
        department: employeeDetails.department || '', // Handle empty department for existing tab
        email: employeeDetails.email,
        mobileNo: employeeDetails.mobileNo,
        inventories: inventories,
        date: currentDate,
        time: currentTime,
        employeeFormObjectId: this.state.employeeFormObjectId || null // Include employee form object ID
      };

      console.log('Submitting data:', submissionData);

      const response = await axios.post(`${baseURL}/forms`, {submissionData, purpose});

      console.log('Response received:', response.data); // Debug log

      // Check if response indicates success
      if (response.data && response.data.status === 'success') {
        console.log('Success response detected, preparing to close form'); // Debug log
        const totalItems = validRows.length;
        let actionWord;
        
        if (this.state.activeTab === 'new') {
          actionWord = 'checked out';
        } else {
          // For existing tab, show different message based on whether there were items to update
          actionWord = totalItems > 0 ? 'updated' : 'processed';
        }
        
        const itemsMessage = totalItems > 0 
          ? `${totalItems} equipment item${totalItems !== 1 ? 's' : ''} ${actionWord} successfully.`
          : 'Employee information updated successfully.';
        
        this.setState({
          successMessage: `✅ Success! ${itemsMessage}`,
          isSubmitting: false,
          errors: {} // Clear any previous errors
        });

        // Refresh parent data if callback provided
        if (this.props.onSuccess) {
          this.props.onSuccess();
        }

        // Auto-close immediately for new checkouts, after 2 seconds for updates
        const closeDelay = this.state.activeTab === 'new' ? 1500 : 2000;
        console.log(`Setting auto-close timer for ${closeDelay}ms`); // Debug log
        setTimeout(() => {
          console.log('Auto-closing form now'); // Debug log
          this.handleClose();
        }, closeDelay);
      } else {
        // Handle case where request succeeded but server returned error status
        throw new Error(response.data?.message || 'Server returned an error status');
      }

    } catch (error) {
      console.error('Error submitting checkin/checkout:', error);
      
      let errorMessage = 'Failed to process request. Please try again.';
      
      // Provide more specific error messages based on error type
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 400) {
          errorMessage = 'Invalid form data. Please check your entries and try again.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error occurred. Please contact IT support if this persists.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      this.setState({
        errors: { 
          general: `❌ Error: ${errorMessage}` 
        },
        isSubmitting: false,
        successMessage: '' // Clear any previous success message
      });
    }
  }

  handleClose = () => {
    this.setState({ 
      isVisible: false,
      successMessage: '',
      errors: {},
      isSubmitting: false
    });
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  renderTabNavigation = () => {
    const { activeTab, activeSubTab } = this.state;
    
    return (
      <div className="tab-navigation">
        <div className="main-tabs">
          <button
            type="button"
            className={`tab-button ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => this.handleTabChange('new')}
          >
            New
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'existing' ? 'active' : ''}`}
            onClick={() => this.handleTabChange('existing')}
          >
            Existing
          </button>
        </div>
      </div>
    );
  }

  renderProgressBar = () => {
    const { currentPage, totalPages } = this.state;
    const progress = (currentPage / totalPages) * 100;
    
    return (
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="page-indicators">
          {[1, 2].map(page => (
            <button
              key={page}
              className={`page-indicator ${currentPage >= page ? 'completed' : ''} ${currentPage === page ? 'active' : ''}`}
              onClick={() => this.setState({ currentPage: page })}
              disabled={page > currentPage + 1}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    );
  }

  renderPage1 = () => {
    const { employeeDetails, equipmentTypes, errors, activeTab, activeSubTab } = this.state;
    const isCheckout = activeTab === 'new';
    
    const getFormHeaderTitle = () => {
      if (activeTab === 'new') {
        return 'Equipment Checkout Form';
      } else {
        return activeSubTab === 'return' ? 'Equipment Update Form' : 'Equipment Delete Form';
      }
    };
    
    return (
      <div className="form-page pdf-style-page">
        <div className="pdf-header">
          <h3 className="form-title">{getFormHeaderTitle()}</h3>
          <div className="form-subtitle">En Community Services Society</div>
        </div>

        <div className="employee-details-section">
          <h4>Employee Details</h4>
          
          {/* Conditional field ordering based on active tab */}
          {activeTab === 'existing' ? (
            // For existing tab: Employee ID first (searchable dropdown), then auto-populated fields
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Employee ID: <span className="required">*</span></label>
                  <div className="search-dropdown-container" style={{ position: 'relative' }}>
                    <input
                      ref={this.employeeInputRef}
                      type="text"
                      value={this.state.employeeSearchTerm || ''}
                      onChange={(e) => this.handleEmployeeCodeChange(e.target.value)}
                      onClick={() => {
                        console.log('Input clicked - showing dropdown');
                        // Show dropdown immediately on click with all employees
                        this.setState({ 
                          showEmployeeDropdown: true, 
                          showAllEmployees: true 
                        });
                        // Ensure employees are loaded
                        if (this.state.employees.length === 0) {
                          console.log('Loading employees on click...');
                          this.fetchAllEmployees();
                        }
                      }}
                      onFocus={() => {
                        console.log('Input focused - showing dropdown');
                        // Ensure employees are loaded and show dropdown
                        this.setState({ showEmployeeDropdown: true });
                        if (this.state.employees.length === 0) {
                          console.log('Loading employees on focus...');
                          this.fetchAllEmployees();
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding to allow clicks on dropdown items
                        setTimeout(() => {
                          this.setState({ showEmployeeDropdown: false });
                        }, 300);
                      }}
                      className={`form-control underline-input ${errors.employeeId ? 'error' : ''}`}
                      placeholder="Type employee ID or name to search..."
                    />
                    
                    {/* Employee dropdown rendered externally with modal constraints */}
                    {this.state.showEmployeeDropdown && (
                      <div 
                        className="employee-dropdown-internal"
                        style={this.getEmployeeDropdownStyle()}
                      >
                        {this.getEmployeeSearchResults().map((employee, index) => (
                          <div
                            key={employee.employeeId}
                            className="employee-dropdown-item"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => this.handleEmployeeSelect(employee)}
                          >
                            <div className="employee-search-info">
                              <div className="employee-search-code">{employee.employeeId}</div>
                              <div className="employee-search-name">{employee.name}</div>
                            </div>
                          </div>
                        ))}
                        {this.getEmployeeSearchResults().length === 0 && (
                          <div className="employee-dropdown-item no-results">
                            No employees found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.employeeId && <span className="error-text">{errors.employeeId}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Name of Employee: <span className="required">*</span></label>
                  <input
                    type="text"
                    value={employeeDetails.name || ''}
                    onChange={(e) => this.handleEmployeeDetailChange('name', e.target.value)}
                    className={`form-control underline-input ${errors.employeeName ? 'error' : ''} readonly`}
                    placeholder="Employee name"
                    readOnly={true}
                  />
                  {errors.employeeName && <span className="error-text">{errors.employeeName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email: <span className="required">*</span></label>
                  <input
                    type="email"
                    value={employeeDetails.email || ''}
                    onChange={(e) => this.handleEmployeeDetailChange('email', e.target.value)}
                    className={`form-control underline-input ${errors.email ? 'error' : ''} readonly`}
                    placeholder="Employee email"
                    readOnly={true}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mobile No: <span className="required">*</span></label>
                  <input
                    type="tel"
                    value={employeeDetails.mobileNo || ''}
                    onChange={(e) => this.handleEmployeeDetailChange('mobileNo', e.target.value)}
                    className={`form-control underline-input ${errors.mobileNo ? 'error' : ''} readonly`}
                    placeholder="Employee mobile number"
                    readOnly={true}
                  />
                  {errors.mobileNo && <span className="error-text">{errors.mobileNo}</span>}
                </div>
              </div>
            </>
          ) : (
            // For new tab: Traditional order - Name first, then Employee ID, then Department
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Name of Employee: <span className="required">*</span></label>
                  <input
                    type="text"
                    value={employeeDetails.name || ''}
                    onChange={(e) => this.handleEmployeeDetailChange('name', e.target.value)}
                    className={`form-control underline-input ${errors.employeeName ? 'error' : ''}`}
                    placeholder="Enter full name"
                  />
                  {errors.employeeName && <span className="error-text">{errors.employeeName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Employee ID: <span className="required">*</span></label>
                  <input
                    type="text"
                    value={employeeDetails.employeeId || ''}
                    onChange={(e) => this.handleEmployeeDetailChange('employeeId', e.target.value)}
                    className={`form-control underline-input ${errors.employeeId ? 'error' : ''}`}
                    placeholder="Enter employee ID"
                  />
                  {errors.employeeId && <span className="error-text">{errors.employeeId}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department: <span className="required">*</span></label>
                  <input
                    type="text"
                    value={employeeDetails.department || ''}
                    onChange={(e) => this.handleEmployeeDetailChange('department', e.target.value)}
                    className={`form-control underline-input ${errors.department ? 'error' : ''}`}
                    placeholder="Enter department"
                  />
                  {errors.department && <span className="error-text">{errors.department}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email: <span className="required">*</span></label>
                  <input
                    type="email"
                    value={employeeDetails.email || ''}
                    onChange={(e) => this.handleEmployeeDetailChange('email', e.target.value)}
                    className={`form-control underline-input ${errors.email ? 'error' : ''}`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mobile No: <span className="required">*</span></label>
                  <input
                    type="tel"
                    value={employeeDetails.mobileNo || ''}
                    onChange={(e) => this.handleEmployeeDetailChange('mobileNo', e.target.value)}
                    className={`form-control underline-input ${errors.mobileNo ? 'error' : ''}`}
                    placeholder="Enter mobile number"
                  />
                  {errors.mobileNo && <span className="error-text">{errors.mobileNo}</span>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Only show formal letter section for "New" tab */}
        {activeTab === 'new' && (
          <div className="formal-letter-section">
            <div className="letter-header">
              <strong>To: Ms Carol Chan</strong><br/>
              <strong>En Community Services Society</strong>
            </div>
            
            <div className="letter-body">
              <p>I wish to inform ECSS that I am signing out the above equipment and will return in good and working condition upon ECSS request.</p>
              <p>Thank you.</p>
              <p>Yours sincerely,</p>
            </div>

            <div className="signature-section">
              <div className="form-row">
                <div className="form-group signature-group">
                  <label>Signature:</label>
                  <input
                    type="text"
                    value={employeeDetails.signature || ''}
                    onChange={(e) => this.handleEmployeeDetailChange('signature', e.target.value)}
                    className="form-control underline-input signature-input"
                    placeholder="Type your name as digital signature"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  renderPage2 = () => {
    const { tableRows } = this.state;
    
    return (
      <div className="form-page">
        <h3 className="page-title">Equipment Details Table</h3>
        
        <div className="table-container">
          <table className="checkin-checkout-table">
            {this.renderTableHeader()}
            <tbody>
              {tableRows.map((row, index) => this.renderTableRow(row, index))}
            </tbody>
          </table>
        </div>

        <div className="table-actions">
          <button
            type="button"
            onClick={this.addRow}
            className="btn btn-secondary add-row-btn"
          >
            + Add Row
          </button>
        </div>
      </div>
    );
  }

  renderTableHeader = () => {
    // Check if any row has action === 'checkin' to show location column
    const showLocationColumn = this.state.tableRows.some(row => row.action === 'checkin');
    
    return (
      <thead>
        <tr>
          <th rowSpan="2" className="header-cell">ECSS Inventory No</th>
          <th colSpan="3" className="header-cell">Item Description</th>
          <th rowSpan="2" className="header-cell">Condition</th>
          <th rowSpan="2" className="header-cell">Notes</th>
          {showLocationColumn && <th rowSpan="2" className="header-cell">Location</th>}
          <th rowSpan="2" className="header-cell">Actions</th>
        </tr>
        <tr>
          <th className="sub-header">Brand</th>
          <th className="sub-header">Model</th>
          <th className="sub-header">Serial Number</th>
        </tr>
      </thead>
    );
  }

  renderTableRow = (row, index) => {
    const { errors } = this.state;
    const rowErrors = errors[`row_${index}`] || {};
    const hasDropdown = this.state.searchDropdowns[index] && 
                       this.state.searchSuggestions[index] && 
                       this.state.searchSuggestions[index].length > 0; // Show dropdown for any results
    
    // Check if any row has action === 'checkin' to show location column
    const showLocationColumn = this.state.tableRows.some(row => row.action === 'checkin');
    
    return (
      <tr key={row.id} className="table-row">
        <td>
          <div className="search-dropdown-container">
            <div className="input-with-clear">
              <input
                ref={(ref) => this.inventoryInputRefs[index] = ref}
                type="text"
                value={row.ecssInventoryNo || ''}
                onChange={(e) => this.handleInventoryNoChange(index, e.target.value)}
                onFocus={() => this.handleInventoryNoFocus(index)} // Show dropdown on focus
                onClick={() => this.handleInventoryNoClick(index)} // Show all items on click
                onBlur={() => setTimeout(() => this.hideSearchDropdown(index), 200)} // Increased delay to allow click on suggestion
                onKeyDown={(e) => this.handleInventoryInputKeyDown(index, e)} // Handle escape key and other shortcuts
                className={`table-input ${rowErrors.ecssInventoryNo ? 'error' : ''}`}
                placeholder="Type inventory number..."
              />
              {row.ecssInventoryNo && (
                <button
                  type="button"
                  className="clear-input-btn"
                  onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                  onClick={() => this.clearRowData(index)}
                  title="Clear field (or press Escape)"
                >
                  ×
                </button>
              )}
            </div>
            {rowErrors.ecssInventoryNo && <span className="cell-error">{rowErrors.ecssInventoryNo}</span>}
          </div>
        </td>
        
        <td>
          <input
            type="text"
            value={row.itemDescription.brand || ''}
            onChange={(e) => this.handleItemDescriptionChange(index, 'brand', e.target.value)}
            className="table-input"
            placeholder="Brand"
          />
        </td>
        
        <td>
          <input
            type="text"
            value={row.itemDescription.model || ''}
            onChange={(e) => this.handleItemDescriptionChange(index, 'model', e.target.value)}
            className="table-input"
            placeholder="Model"
          />
        </td>
        
        <td>
          <input
            type="text"
            value={row.itemDescription.serialNumber || ''}
            onChange={(e) => this.handleItemDescriptionChange(index, 'serialNumber', e.target.value)}
            className="table-input"
            placeholder="Serial #"
          />
        </td>
        
        <td>
          <input
            type="text"
            value={row.condition || ''}
            onChange={(e) => this.handleCellChange(index, 'condition', e.target.value)}
            className="table-input"
            placeholder="Condition"
          />
        </td>
        
        <td>
          <input
            type="text"
            value={row.notes || ''}
            onChange={(e) => this.handleCellChange(index, 'notes', e.target.value)}
            className="table-input"
            placeholder="Notes"
          />
        </td>
        
        {showLocationColumn && (
          <td>
            <input
              type="text"
              value={row.location || ''}
              onChange={(e) => this.handleCellChange(index, 'location', e.target.value)}
              className={`table-input ${row.isPrePopulated && row.action === 'checkin' ? 'location-enabled' : 'location-disabled'}`}
              placeholder={row.isPrePopulated && row.action === 'checkin' ? 'Return location...' : 'Location'}
              disabled={!(row.isPrePopulated && row.action === 'checkin')}
              title={row.isPrePopulated && row.action === 'checkin' ? 'Enter return location' : 'Location field (only enabled for returns)'}
            />
          </td>
        )}
        
        <td>
          {this.state.activeTab === 'existing' ? (
            // Only show Return button if the row was pre-populated from database AND has data AND not already set to return
            (row.isPrePopulated && 
             row.action !== 'checkin' &&
             (row.ecssInventoryNo.trim() || 
              (row.itemDescription && Object.values(row.itemDescription).some(value => value.trim())) ||
              row.condition.trim() || 
              row.notes.trim())) ? (
              <button
                type="button"
                className="return-btn"
                title="Return equipment (check-in)"
                onClick={() => this.handleReturnAction(index)}
              >
                Return
              </button>
            ) : null
          ) : (
            <button
              type="button"
              onClick={() => this.removeRow(index)}
              className="delete-row-btn"
              disabled={this.state.tableRows.length <= 1}
              title="Remove row"
            >
              ×
            </button>
          )}
        </td>
      </tr>
    );
  }

  render() {
    const { isVisible, currentPage, totalPages, errors, successMessage, isSubmitting, activeTab, activeSubTab } = this.state;

    // Use the prop isVisible if provided, otherwise use internal state
    const shouldShow = this.props.isVisible !== undefined ? this.props.isVisible : isVisible;
    
    if (!shouldShow) return null;

    const getFormTitle = () => {
      if (activeTab === 'new') {
        return 'Equipment Checkout Form';
      } else {
        return activeSubTab === 'return' ? 'Equipment Update Form' : 'Equipment Delete Form';
      }
    };

    const renderCurrentPage = () => {
      switch(currentPage) {
        case 1: return this.renderPage1();
        case 2: return this.renderPage2();
        default: return this.renderPage1();
      }
    };

    return (  
      <div className="modal-overlay">
        <div className="modal-content checkin-checkout-table-modal">
          <div className="modal-header">
            <h2>{getFormTitle()}</h2>
            <button className="close-button" onClick={this.handleClose}>×</button>
          </div>

          <div className="modal-body">
            {successMessage && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                {successMessage}
              </div>
            )}

            {errors.general && (
              <div className="error-message">
                <span className="error-icon">❌</span>
                {errors.general}
              </div>
            )}

            {this.renderTabNavigation()}
            {this.renderProgressBar()}

            <form onSubmit={this.handleSubmit}>
              {renderCurrentPage()}

              <div className="form-actions">
                <div className="navigation-buttons">
                  {currentPage > 1 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={this.prevPage}
                      disabled={isSubmitting}
                    >
                      ← Previous
                    </button>
                  )}
                </div>

                <div className="action-buttons">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={this.handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting 
                      ? 'Processing...' 
                      : currentPage === totalPages 
                        ? activeTab === 'new' 
                          ? 'Check Out Equipment' 
                          : activeSubTab === 'return'
                            ? 'Update Equipment'
                            : 'Delete Equipment'
                        : 'Next →'
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        {/* External inventory dropdowns rendered outside modal for maximum visibility */}
        {Object.keys(this.state.searchDropdowns).map(rowIndex => {
          const shouldShow = this.state.searchDropdowns[rowIndex] && 
                           this.state.searchSuggestions[rowIndex] && 
                           this.state.searchSuggestions[rowIndex].length > 0;
          
          if (!shouldShow) return null;
          
          return (
            <div
              key={`inventory-dropdown-${rowIndex}`}
              className="inventory-suggestions-dropdown-internal"
              style={this.getInventoryDropdownStyle(parseInt(rowIndex))}
              onMouseDown={(e) => e.preventDefault()}
            >
              {this.state.searchSuggestions[rowIndex].map((suggestion, suggestionIndex) => (
                <div
                  key={suggestionIndex}
                  className="inventory-suggestion-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    this.handleSuggestionSelect(parseInt(rowIndex), suggestion);
                  }}
                  onClick={() => this.handleSuggestionSelect(parseInt(rowIndex), suggestion)}
                >
                  <div className="suggestion-value">{suggestion.value}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // Sort suggestions by asset tag number (CE/ECSS/no/year format)
  sortSuggestionsByAssetNumber = (suggestions) => {
    const sorted = suggestions.sort((a, b) => {
      const getAssetNumber = (assetTag) => {
        // Extract number from formats like "CE/001/2024" or "ECSS/001/2024"
        const match = assetTag.match(/^(CE|ECSS)\/(\d+)\/(\d{4})$/);
        if (match) {
          const [, prefix, number, year] = match;
          return {
            prefix,
            number: parseInt(number, 10),
            year: parseInt(year, 10),
            fullTag: assetTag
          };
        }
        // Fallback for other formats - treat as string
        return {
          prefix: '',
          number: 999999, // Put non-standard formats at the end
          year: 9999,
          fullTag: assetTag
        };
      };

      const aData = getAssetNumber(a.value);
      const bData = getAssetNumber(b.value);

      // First sort by prefix (CE vs ECSS)
      if (aData.prefix !== bData.prefix) {
        return aData.prefix.localeCompare(bData.prefix);
      }

      // Then sort by year
      if (aData.year !== bData.year) {
        return aData.year - bData.year;
      }

      // Finally sort by number (ascending)
      return aData.number - bData.number;
    });

    return sorted;
  }

  // Get all available items for dropdown (filtered to exclude items already in table)
  getAllSuggestions = () => {
    const dataToSearch = this.props.data || [];
    
    // Get list of inventory numbers already present in the current table rows
    const existingInventoryNos = this.state.tableRows
      .map(row => row.ecssInventoryNo?.trim())
      .filter(inventoryNo => inventoryNo && inventoryNo !== '');
    
    // Filter out items that are already present in the table
    const filteredData = dataToSearch.filter(item => {
      const assetTag = item._assetsIdTag || item.getAssetsIdTag?.() || '';
      return !existingInventoryNos.includes(assetTag);
    });
    
    const suggestions = filteredData.map(item => ({
      value: item._assetsIdTag || item.getAssetsIdTag?.() || '',
      label: `${item._assetsIdTag || item.getAssetsIdTag?.() || ''} - ${item._brand || item.getBrand?.() || ''} ${item._model || item.getModel?.() || ''}`,
      item: item
    }));

    // Sort suggestions by asset number in ascending order
    return this.sortSuggestionsByAssetNumber(suggestions);
  }

  getSearchSuggestions = (searchValue) => {
    // Use props data if available, otherwise return empty array
    const dataToSearch = this.props.data || [];
    
    // Get list of inventory numbers already present in the current table rows
    const existingInventoryNos = this.state.tableRows
      .map(row => row.ecssInventoryNo?.trim())
      .filter(inventoryNo => inventoryNo && inventoryNo !== '');
    
    // Filter out items that are already present in the table
    const availableData = dataToSearch.filter(item => {
      const assetTag = item._assetsIdTag || item.getAssetsIdTag?.() || '';
      return !existingInventoryNos.includes(assetTag);
    });
    
    // If no search value, return all available items sorted
    if (!searchValue.trim()) {
      const allSuggestions = availableData.map(item => ({
        value: item._assetsIdTag || item.getAssetsIdTag?.() || '',
        label: `${item._assetsIdTag || item.getAssetsIdTag?.() || ''} - ${item._brand || item.getBrand?.() || ''} ${item._model || item.getModel?.() || ''}`,
        item: item
      }));
      return this.sortSuggestionsByAssetNumber(allSuggestions);
    }
    
    const searchTerm = searchValue.toLowerCase();
    
    const filteredSuggestions = availableData
      .filter(item => {
        const assetTag = (item._assetsIdTag || item.getAssetsIdTag?.() || '').toLowerCase();
        const serialNumber = (item._serialNumber || item.getSerialNumber?.() || '').toLowerCase();
        const brand = (item._brand || item.getBrand?.() || '').toLowerCase();
        const model = (item._model || item.getModel?.() || '').toLowerCase();
        
        return assetTag.includes(searchTerm) || 
               serialNumber.includes(searchTerm) ||
               brand.includes(searchTerm) ||
               model.includes(searchTerm);
      })
      .map(item => ({
        value: item._assetsIdTag || item.getAssetsIdTag?.() || '',
        label: `${item._assetsIdTag || item.getAssetsIdTag?.() || ''} - ${item._brand || item.getBrand?.() || ''} ${item._model || item.getModel?.() || ''}`,
        item: item
      }));
    
    return this.sortSuggestionsByAssetNumber(filteredSuggestions);
  }

  // Calculate dropdown position relative to input
  getDropdownStyle = () => {
    if (!this.employeeInputRef.current) {
      return {};
    }
    
    const inputRect = this.employeeInputRef.current.getBoundingClientRect();
    
    return {
      top: inputRect.bottom + 2, // Position just below the input
      left: inputRect.left,
      width: inputRect.width, // Make dropdown exactly the same width as textbox
      minWidth: inputRect.width
    };
  }

  // Calculate employee dropdown position with modal constraints
  getEmployeeDropdownStyle = () => {
    if (!this.employeeInputRef.current) {
      return {};
    }
    
    const inputRect = this.employeeInputRef.current.getBoundingClientRect();
    const modalRect = document.querySelector('.modal-content')?.getBoundingClientRect();
    
    if (!modalRect) {
      return {
        top: inputRect.bottom + 2,
        left: inputRect.left,
        width: Math.max(inputRect.width, 300),
      };
    }
    
    // Calculate available space below input within modal
    const availableHeight = modalRect.bottom - inputRect.bottom - 20; // 20px margin from modal bottom
    const maxHeight = Math.min(300, availableHeight); // Default 300px max, but constrained by modal
    
    return {
      position: 'fixed',
      top: inputRect.bottom + 2,
      left: inputRect.left,
      width: Math.max(inputRect.width, 300),
      maxHeight: `${maxHeight}px`,
      '--dropdown-top': `${inputRect.bottom + 2}px`
    };
  }

  // Calculate inventory dropdown position with modal constraints
  getInventoryDropdownStyle = (rowIndex) => {
    const inputRef = this.inventoryInputRefs[rowIndex];
    if (!inputRef) {
      return {};
    }
    
    const inputRect = inputRef.getBoundingClientRect();
    const modalRect = document.querySelector('.modal-content')?.getBoundingClientRect();
    
    if (!modalRect) {
      return {
        top: inputRect.bottom + 2,
        left: inputRect.left,
        width: Math.max(inputRect.width, 300),
      };
    }
    
    // Calculate available space below input within modal
    const availableHeight = modalRect.bottom - inputRect.bottom - 20; // 20px margin from modal bottom
    const maxHeight = Math.min(350, availableHeight); // Default 350px max, but constrained by modal
    
    return {
      position: 'fixed',
      top: inputRect.bottom + 2,
      left: inputRect.left,
      width: Math.max(inputRect.width, 300),
      maxHeight: `${maxHeight}px`,
      '--dropdown-top': `${inputRect.bottom + 2}px`
    };
  }

  // Handle employee code input change
  handleEmployeeCodeChange = (value) => {
    console.log('Employee search changed:', value);
    
    // Always show dropdown when typing, regardless of content
    this.setState({ 
      employeeSearchTerm: value,
      showEmployeeDropdown: true, // Always show dropdown when typing
      showAllEmployees: false, // Reset show all flag when typing
      employeeDetails: {
        ...this.state.employeeDetails,
        employeeId: value
      }
    });

    // If user clears the field, also clear all other fields
    if (!value.trim()) {
      this.setState(prevState => ({
        ...prevState,
        employeeDetails: {
          ...prevState.employeeDetails,
          name: '',
          employeeId: '',
          department: '',
          email: '',
          mobileNo: ''
        }
      }));
    }

    // Ensure employees are loaded for filtering
    if (this.state.employees.length === 0) {
      this.fetchAllEmployees();
    }
  }

  // Handle employee selection from dropdown
  handleEmployeeSelect = async (employee) => {
    console.log('Employee selected:', employee);
    
    this.setState({
      employeeDetails: {
        ...this.state.employeeDetails,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        mobileNo: employee.mobileNo,
        department: employee.department || ''
      },
      showEmployeeDropdown: false,
      showAllEmployees: false, // Reset show all flag
      employeeSearchTerm: employee.employeeId
    });

    // Auto-fetch inventory for the selected employee
    setTimeout(() => {
      this.checkAndFetchEmployeeInventory();
    }, 100);
  }

  // Get filtered employees for dropdown (sorted by employee ID in ascending order)
  getEmployeeSearchResults = () => {
    const { employees, employeeSearchTerm, showAllEmployees } = this.state;
    
    console.log('Getting employee search results:', {
      employeesCount: employees.length,
      searchTerm: employeeSearchTerm,
      showDropdown: this.state.showEmployeeDropdown,
      showAllEmployees: showAllEmployees
    });
    
    let filteredEmployees;
    
    // Show all employees when clicked or when no search term
    if (showAllEmployees || !employeeSearchTerm || !employeeSearchTerm.trim()) {
      console.log('No search term or showing all - returning all employees:', employees.length);
      filteredEmployees = employees; // Show ALL employees when no search term or when clicked
    } else {
      const searchTerm = employeeSearchTerm.toLowerCase();
      console.log('Search term for employees:', searchTerm);
      filteredEmployees = employees.filter(employee => 
        employee.employeeId.toLowerCase().includes(searchTerm) ||
        employee.name.toLowerCase().includes(searchTerm)
      );
      console.log('Filtered employees:', filteredEmployees.length);
    }
    
    // Sort employees by employee ID in ascending order
    const sortedEmployees = filteredEmployees.sort((a, b) => {
      // Convert employee IDs to strings and compare
      const aId = String(a.employeeId || '');
      const bId = String(b.employeeId || '');
      return aId.localeCompare(bId, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    return sortedEmployees;
  }
}

export default CheckinCheckoutFormComponent
