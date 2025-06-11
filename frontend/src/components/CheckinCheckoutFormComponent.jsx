import React, { Component } from 'react'
import axios from 'axios'

class CheckinCheckoutFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: false,
      activeTab: 'new', // 'new' or 'existing'
      activeSubTab: 'return', // 'return' or 'update' (only for existing tab)
      currentPage: 1,
      totalPages: 2,
      
      // Employee Details (Page 1)
      employeeDetails: {
        name: '',
        department: '',
        email: '',
        mobileNo: '',
        date: new Date().toISOString().split('T')[0],
        signature: ''
      },
      
      // Equipment Types (Page 1)
      equipmentTypes: {
        laptop: { checked: false, inventoryNo: '' },
        acPowerCord: { checked: false, inventoryNo: '' },
        mouse: { checked: false, inventoryNo: '' },
        carryingCase: { checked: false, inventoryNo: '' },
        keyboard: { checked: false, inventoryNo: '' },
        thumbDrive: { checked: false, inventoryNo: '' },
        screenMonitor: { checked: false, inventoryNo: '' },
        portableHardDisk: { checked: false, inventoryNo: '' },
        mobilePhone: { checked: false, inventoryNo: '' },
        others: { checked: false, inventoryNo: '', description: '' }
      },
      
      // Table Data (Page 2)
      tableRows: this.createDefaultRows(4),
      isSubmitting: false,
      errors: {},
      successMessage: '',
      
      // Search dropdown state
      searchDropdowns: {}, // Object to track dropdown state for each row
      searchSuggestions: {} // Object to store suggestions for each row
    };
    
    // Timeout for debouncing inventory fetch
    this.fetchInventoryTimeout = null;
  }

  componentDidMount() {
    // Add click listener to hide dropdowns when clicking outside
    document.addEventListener('click', this.handleDocumentClick);
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
        notes: ''
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
        department: '',
        email: '',
        mobileNo: '',
        date: new Date().toISOString().split('T')[0],
        signature: ''
      },
      equipmentTypes: {
        laptop: { checked: false, inventoryNo: '' },
        acPowerCord: { checked: false, inventoryNo: '' },
        mouse: { checked: false, inventoryNo: '' },
        carryingCase: { checked: false, inventoryNo: '' },
        keyboard: { checked: false, inventoryNo: '' },
        thumbDrive: { checked: false, inventoryNo: '' },
        screenMonitor: { checked: false, inventoryNo: '' },
        portableHardDisk: { checked: false, inventoryNo: '' },
        mobilePhone: { checked: false, inventoryNo: '' },
        others: { checked: false, inventoryNo: '', description: '' }
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
      successMessage: ''
    });
  }

  handleSubTabChange = (subTab) => {
    this.setState({ activeSubTab: subTab, currentPage: 1 }, () => {
      // Update action for existing rows when switching between return/update
      if (this.state.activeTab === 'existing') {
        const updatedRows = this.state.tableRows.map(row => ({
          ...row,
          action: subTab === 'return' ? 'checkin' : 'update'
        }));
        this.setState({ tableRows: updatedRows });
      }
    });
  }

  handleEmployeeDetailChange = (field, value) => {
    this.setState(prevState => ({
      employeeDetails: {
        ...prevState.employeeDetails,
        [field]: value
      }
    }), () => {
      // For existing tab, auto-fetch inventory when all required fields are filled
      if (this.state.activeTab === 'existing') {
        this.checkAndFetchEmployeeInventory();
      }
    });
  }

  checkAndFetchEmployeeInventory = () => {
    const { employeeDetails } = this.state;
    
    // Check if all required fields for existing tab are filled
    if (employeeDetails.name.trim() && 
        employeeDetails.email.trim() && 
        employeeDetails.mobileNo.trim()) {
      
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
      const baseURL = 'http://localhost:3001';
      
      const employeeInfo = {
        name: employeeDetails.name.trim(),
        email: employeeDetails.email.trim(),
        mobileNo: employeeDetails.mobileNo.trim()
      };

      const response = await axios.post(`${baseURL}/form`, {employeeInfo, purpose: "existing"});

      if (response.data && response.data.status === 'success') {
        const currentInventory = response.data.data || [];
        
        if (currentInventory.length > 0) {
          // Populate table with current inventory
          const populatedRows = currentInventory.map((item, index) => ({
            id: index + 1,
            ecssInventoryNo: item.ecssInventoryNo || '',
            itemDescription: {
              brand: item.itemDescription?.brand || '',
              model: item.itemDescription?.model || '',
              serialNumber: item.itemDescription?.serialNumber || ''
            },
            condition: item.condition || '',
            notes: item.notes || '',
            action: this.state.activeSubTab === 'return' ? 'checkin' : 'update'
          }));

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
              notes: ''
            });
          }

          this.setState({ 
            tableRows: populatedRows,
            successMessage: `✅ Found ${currentInventory.length} item${currentInventory.length !== 1 ? 's' : ''} currently checked out to this employee.`,
            errors: {} // Clear any previous errors
          });

          // Clear success message after 3 seconds
          setTimeout(() => {
            this.setState({ successMessage: '' });
          }, 3000);
        } else {
          // No inventory found
          this.setState({ 
            tableRows: this.createDefaultRows(4),
            successMessage: '⚠️ No equipment currently checked out to this employee.',
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
        tableRows: this.createDefaultRows(4)
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
      const baseURL = 'http://localhost:3001';
      
      // Prepare employee info for the backend
      const employeeInfo = {
        name: employeeDetails.name,
        email: employeeDetails.email,
        mobileNo: employeeDetails.mobileNo
      };
      
      console.log('Fetching existing inventory for employee:', employeeInfo);
      
      const response = await axios.post(`${baseURL}/forms`, {
        purpose: "existing",
        employeeInfo: employeeInfo
      });
      
      console.log('Employee inventory response:', response.data);
      
      if (response.data && response.data.status === 'success' && response.data.data) {
        const inventoryItems = response.data.data;
        
        if (inventoryItems.length > 0) {
          // Create table rows from the existing inventory
          const newTableRows = inventoryItems.map((item, index) => ({
            id: index + 1,
            ecssInventoryNo: item.ecssInventoryNo || '',
            itemDescription: {
              brand: item.itemDescription?.brand || '',
              model: item.itemDescription?.model || '',
              serialNumber: item.itemDescription?.serialNumber || ''
            },
            condition: item.condition || 'Good',
            notes: item.notes || '',
            action: this.state.activeSubTab === 'return' ? 'checkin' : 'update'
          }));
          
          // Add extra empty rows if needed (minimum 4 rows)
          while (newTableRows.length < 4) {
            const newRowId = newTableRows.length + 1;
            newTableRows.push({
              id: newRowId,
              ecssInventoryNo: '',
              itemDescription: {
                brand: '',
                model: '',
                serialNumber: ''
              },
              condition: '',
              notes: '',
              action: this.state.activeSubTab === 'return' ? 'checkin' : 'update'
            });
          }
          
          this.setState({ 
            tableRows: newTableRows,
            successMessage: `Found ${inventoryItems.length} item(s) for ${employeeDetails.name}`
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

  handleEquipmentTypeChange = (type, field, value) => {
    this.setState(prevState => ({
      equipmentTypes: {
        ...prevState.equipmentTypes,
        [type]: {
          ...prevState.equipmentTypes[type],
          [field]: value
        }
      }
    }));
  }

  handleCellChange = (rowIndex, field, value) => {
    const updatedRows = [...this.state.tableRows];
    updatedRows[rowIndex][field] = value;
    
    // Auto-set action based on tab and subtab
    if (field !== 'action') {
      if (this.state.activeTab === 'new') {
        updatedRows[rowIndex]['action'] = 'checkout';
      } else {
        updatedRows[rowIndex]['action'] = this.state.activeSubTab === 'return' ? 'checkin' : 'update';
      }
    }
    
    this.setState({ tableRows: updatedRows });
  }

  handleItemDescriptionChange = (rowIndex, field, value) => {
    const updatedRows = [...this.state.tableRows];
    updatedRows[rowIndex].itemDescription[field] = value;
    
    // Auto-set action based on tab and subtab
    if (this.state.activeTab === 'new') {
      updatedRows[rowIndex]['action'] = 'checkout';
    } else {
      updatedRows[rowIndex]['action'] = this.state.activeSubTab === 'return' ? 'checkin' : 'update';
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
    if (currentRow && currentRow.itemDescription.brand) {
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
      notes: ''
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

  getSampleData = () => {
    return [
      {
        _assetsIdTag: 'ECSS001',
        _brand: 'Dell',
        _model: 'Latitude 5520',
        _serialNumber: 'DL12345678',
        _notes: 'Good condition laptop'
      },
      {
        _assetsIdTag: 'ECSS002', 
        _brand: 'HP',
        _model: 'EliteBook 840',
        _serialNumber: 'HP87654321',
        _notes: 'Business laptop with Windows 11'
      },
      {
        _assetsIdTag: 'ECSS003',
        _brand: 'Logitech',
        _model: 'MX Master 3',
        _serialNumber: 'LG11223344',
        _notes: 'Wireless mouse'
      },
      {
        _assetsIdTag: 'ECSS004',
        _brand: 'Apple',
        _model: 'MacBook Air M2',
        _serialNumber: 'AP55667788',
        _notes: 'Silver MacBook Air'
      },
      {
        _assetsIdTag: 'ECSS005',
        _brand: 'Microsoft',
        _model: 'Surface Pro 8',
        _serialNumber: 'MS99887766',
        _notes: 'Tablet with keyboard'
      }
    ];
  }

  // Get all available items for dropdown
  getAllSuggestions = () => {
    const dataToSearch = (this.props.data && this.props.data.length > 0) ? this.props.data : this.getSampleData();
    
    return dataToSearch.map(item => ({
      value: item._assetsIdTag || item.getAssetsIdTag?.() || '',
      label: `${item._assetsIdTag || item.getAssetsIdTag?.() || ''} - ${item._brand || item.getBrand?.() || ''} ${item._model || item.getModel?.() || ''}`,
      item: item
    })).slice(0, 10); // Limit to 10 suggestions
  }

  getSearchSuggestions = (searchValue) => {
    // Use props data if available, otherwise use sample data for testing
    const dataToSearch = (this.props.data && this.props.data.length > 0) ? this.props.data : this.getSampleData();
    
    // If no search value, return all items
    if (!searchValue.trim()) {
      return dataToSearch.map(item => ({
        value: item._assetsIdTag || item.getAssetsIdTag?.() || '',
        label: `${item._assetsIdTag || item.getAssetsIdTag?.() || ''} - ${item._brand || item.getBrand?.() || ''} ${item._model || item.getModel?.() || ''}`,
        item: item
      })).slice(0, 10); // Limit to 10 suggestions
    }
    
    const searchTerm = searchValue.toLowerCase();
    
    return dataToSearch
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
      }))
      .slice(0, 10); // Limit to 10 suggestions
  }

  findInventoryItem = (searchValue) => {
    // Use props data if available, otherwise use sample data for testing
    const dataToSearch = (this.props.data && this.props.data.length > 0) ? this.props.data : this.getSampleData();
    
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
      condition: 'Good', // Default since condition might not be in current data structure
      notes: inventoryItem._notes || inventoryItem.getNotes?.() || ''
    };
    
    // Auto-set action based on tab and subtab
    if (this.state.activeTab === 'new') {
      updatedRows[rowIndex]['action'] = 'checkout';
    } else {
      updatedRows[rowIndex]['action'] = this.state.activeSubTab === 'return' ? 'checkin' : 'update';
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
      notes: ''
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
      // Only require department for "New" tab
      if (activeTab === 'new' && !employeeDetails.department.trim()) errors.department = 'Department is required';
      if (!employeeDetails.email.trim()) errors.email = 'Email is required';
      if (!employeeDetails.mobileNo.trim()) errors.mobileNo = 'Mobile number is required';
    }
    
    this.setState({ errors });
    return Object.keys(errors).length === 0;
  }

  validateRows = () => {
    const { tableRows } = this.state;
    const errors = {};
    
    tableRows.forEach((row, index) => {
      const rowErrors = {};
      
      // Check if any field in the row has data
      const hasData = row.ecssInventoryNo.trim() || 
                     Object.values(row.itemDescription).some(value => value.trim()) ||
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
      Object.values(row.itemDescription).some(value => value.trim()) ||
      row.notes.trim()
    );

    if (validRows.length === 0) {
      this.setState({ 
        errors: { general: 'Please fill in equipment details in the table.' }
      });
      return;
    }

    this.setState({ isSubmitting: true, errors: {} });

    try {
      const baseURL = 'http://localhost:3001';
      
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
        action: row.action || (this.state.activeTab === 'new' ? 'checkout' : 
               this.state.activeSubTab === 'return' ? 'checkin' : 'update')
      }));
      
      // Submit data in the required format
      const submissionData = {
        name: employeeDetails.name,
        department: employeeDetails.department || '', // Handle empty department for existing tab
        email: employeeDetails.email,
        mobileNo: employeeDetails.mobileNo,
        inventories: inventories,
        date: currentDate,
        time: currentTime
      };

      const response = await axios.post(`${baseURL}/forms`, {submissionData, purpose: "new"});

      // Check if response indicates success
      if (response.data && response.data.status === 'success') {
        const totalItems = validRows.length;
        const actionWord = this.state.activeTab === 'new' ? 'checked out' : 
                          this.state.activeSubTab === 'return' ? 'returned' : 'updated';
        
        this.setState({
          successMessage: `✅ Success! ${totalItems} equipment item${totalItems !== 1 ? 's' : ''} ${actionWord} successfully.`,
          isSubmitting: false,
          errors: {} // Clear any previous errors
        });

        // Refresh parent data if callback provided
        if (this.props.onSuccess) {
          this.props.onSuccess();
        }

        // Auto-close after 4 seconds to give user time to read the message
        setTimeout(() => {
          this.handleClose();
        }, 4000);
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
        
        {activeTab === 'existing' && (
          <div className="sub-tabs">
            <button
              type="button"
              className={`sub-tab-button ${activeSubTab === 'return' ? 'active' : ''}`}
              onClick={() => this.handleSubTabChange('return')}
            >
              Return
            </button>
            <button
              type="button"
              className={`sub-tab-button ${activeSubTab === 'update' ? 'active' : ''}`}
              onClick={() => this.handleSubTabChange('update')}
            >
              Update
            </button>
          </div>
        )}
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
    const { employeeDetails, equipmentTypes, errors, activeTab } = this.state;
    const isCheckout = activeTab === 'new';
    
    return (
      <div className="form-page pdf-style-page">
        <div className="pdf-header">
          <h3 className="form-title">Equipment {isCheckout ? 'Checkout' : 'Return'} Form</h3>
          <div className="form-subtitle">En Community Services Society</div>
        </div>

        <div className="employee-details-section">
          <h4>Employee Details</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label>Name of Employee: <span className="required">*</span></label>
              <input
                type="text"
                value={employeeDetails.name}
                onChange={(e) => this.handleEmployeeDetailChange('name', e.target.value)}
                className={`form-control underline-input ${errors.employeeName ? 'error' : ''}`}
                placeholder="Enter full name"
              />
              {errors.employeeName && <span className="error-text">{errors.employeeName}</span>}
            </div>
          </div>

          {/* Only show department field for "New" tab */}
          {activeTab === 'new' && (
            <div className="form-row">
              <div className="form-group">
                <label>Department: <span className="required">*</span></label>
                <input
                  type="text"
                  value={employeeDetails.department}
                  onChange={(e) => this.handleEmployeeDetailChange('department', e.target.value)}
                  className={`form-control underline-input ${errors.department ? 'error' : ''}`}
                  placeholder="Enter department"
                />
                {errors.department && <span className="error-text">{errors.department}</span>}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Email: <span className="required">*</span></label>
              <input
                type="email"
                value={employeeDetails.email}
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
                value={employeeDetails.mobileNo}
                onChange={(e) => this.handleEmployeeDetailChange('mobileNo', e.target.value)}
                className={`form-control underline-input ${errors.mobileNo ? 'error' : ''}`}
                placeholder="Enter mobile number"
              />
              {errors.mobileNo && <span className="error-text">{errors.mobileNo}</span>}
            </div>
          </div>
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
                    value={employeeDetails.signature}
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
    return (
      <thead>
        <tr>
          <th rowSpan="2" className="header-cell">ECSS Inventory No</th>
          <th colSpan="3" className="header-cell">Item Description</th>
          <th rowSpan="2" className="header-cell">Condition</th>
          <th rowSpan="2" className="header-cell">Notes</th>
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
    
    return (
      <tr key={row.id} className="table-row">
        <td>
          <div className="search-dropdown-container">
            <div className="input-with-clear">
              <input
                type="text"
                value={row.ecssInventoryNo}
                onChange={(e) => this.handleInventoryNoChange(index, e.target.value)}
                onFocus={() => this.handleInventoryNoFocus(index)} // Show dropdown on focus
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
          </div>
           
            {/* Search Dropdown - Show for any results */}
            {hasDropdown && (
              <div 
                className="search-dropdown"
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking dropdown
              >
                {this.state.searchSuggestions[index].map((suggestion, suggestionIndex) => (
                  <div
                    key={suggestionIndex}
                    className="search-dropdown-item"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur
                      this.handleSuggestionSelect(index, suggestion);
                    }}
                    onClick={() => this.handleSuggestionSelect(index, suggestion)}
                  >
                    <div className="suggestion-value">{suggestion.value}</div>
                  </div>
                ))}
              </div>
            )}
          {rowErrors.ecssInventoryNo && <span className="cell-error">{rowErrors.ecssInventoryNo}</span>}
        </td>
        
        <td>
          <input
            type="text"
            value={row.itemDescription.brand}
            onChange={(e) => this.handleItemDescriptionChange(index, 'brand', e.target.value)}
            className="table-input"
            placeholder="Brand"
          />
        </td>
        
        <td>
          <input
            type="text"
            value={row.itemDescription.model}
            onChange={(e) => this.handleItemDescriptionChange(index, 'model', e.target.value)}
            className="table-input"
            placeholder="Model"
          />
        </td>
        
        <td>
          <input
            type="text"
            value={row.itemDescription.serialNumber}
            onChange={(e) => this.handleItemDescriptionChange(index, 'serialNumber', e.target.value)}
            className="table-input"
            placeholder="Serial #"
          />
        </td>
        
        <td>
          <input
            type="text"
            value={row.condition}
            onChange={(e) => this.handleCellChange(index, 'condition', e.target.value)}
            className="table-input"
            placeholder="Condition"
          />
        </td>
        
        <td>
          <input
            type="text"
            value={row.notes}
            onChange={(e) => this.handleCellChange(index, 'notes', e.target.value)}
            className="table-input"
            placeholder="Notes"
          />
        </td>
        
        <td>
          <button
            type="button"
            onClick={() => this.removeRow(index)}
            className="remove-row-btn"
            disabled={this.state.tableRows.length <= 1}
            title="Remove row"
          >
            ×
          </button>
        </td>
      </tr>
    );
  }

  render() {
    const { isVisible, currentPage, totalPages, errors, successMessage, isSubmitting, activeTab, activeSubTab } = this.state;

    if (!isVisible) return null;

    const getFormTitle = () => {
      if (activeTab === 'new') {
        return 'Equipment Checkout Form';
      } else {
        return activeSubTab === 'return' ? 'Equipment Return Form' : 'Equipment Update Form';
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
                            ? 'Return Equipment' 
                            : 'Update Equipment'
                        : 'Next →'
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default CheckinCheckoutFormComponent
