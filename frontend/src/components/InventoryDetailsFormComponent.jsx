import React, { Component } from 'react'
import axios from 'axios'
import '../css/EquipmentInventoryForm.css'
import '../css/ModalComponents.css'

 const baseURL = `${window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:3001" 
  : "https://ecss-it-inventory-backend.azurewebsites.net"}`;

// Import date utilities
import { formatDateForInput, formatDateForDisplay } from '../utils/dateUtils';

console.log('Current environment:', {
  hostname: window.location.hostname,
  protocol: window.location.protocol,
  baseURL: baseURL
});

class InventoryDetailsFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: props.isVisible || false,
      activeTab: 'new', // 'new' or 'existing'
      sampleFormTab: 1, // For sample form tab navigation (1-6)
      editMode: false, // Whether we're editing an existing item
      selectedItemId: null, // ID of item being edited
      // Warranty calculation state
      warrantyInfo: '',
      warrantyStartDate: '',
      calculatedWarrantyEndDate: '',
      formData: {
        // Tab 1: Basic Information
        itemType: '', // Category
        brand: '',
        model: '',
        serialNumber: '',
        // Tab 2: Purchase Information
        purchaseDate: '',
        purchasePrice: '', // Original Price
        date: '',
        time: '',
        // Tab 3: Warranty Information (handled separately)
        // Tab 4: Location & Assignment
        assetsIdTag: '',
        assignedUser: '',
        location: '',
        checkInDate: '',
        checkOutDate: '',
        // Tab 5: System Information
        status: '',
        osType: '',
        osVersion: '',
        ipAddressIPv4: '',
        ipAddressIPv6: '',
        macAddress: '',
        // Tab 6: Additional Information
        notes: ''
      },
      existingItems: [], // Will be populated from props.data
      filteredItems: [],
      selectedSerialNumber: '',
      filteredSerialNumbers: [],
      showDropdown: false,
      showAllOptions: false, // Flag to show all options on click
      activeInputRef: null, // Track which input is active for dropdown positioning
      selectedExistingItem: null,
      isSubmitting: false,
      isLoadingItems: false,
      errors: {},
      successMessage: ''
    };
    
    // Ref for dropdown positioning
    this.serialNumberInputRef = React.createRef();
  }

  componentDidMount() {
    // Handle initial visibility state
    if (this.props.isVisible) {
      this.setState({ isVisible: true });
      this.resetForm();
      this.loadExistingItems();
    }
    
    // Add click listener to hide dropdown when clicking outside
    document.addEventListener('click', this.handleDocumentClick);
  }

  componentWillUnmount() {
    // Remove click listener
    document.removeEventListener('click', this.handleDocumentClick);
  }

  handleDocumentClick = (event) => {
    // Check if click is outside dropdown and input
    if (!event.target.closest('.combo-box-wrapper') && 
        !event.target.closest('.serial-number-dropdown-external')) {
      this.setState({ showDropdown: false });
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.isVisible !== prevProps.isVisible) {
      this.setState({ isVisible: this.props.isVisible });
      if (this.props.isVisible) {
        // Reset form for new item and load existing items
        this.resetForm();
        this.loadExistingItems();
      }
    }
    
    // Reload data when props.data changes
    if (this.props.data !== prevProps.data) {
      console.log('Props data changed, reloading existing items');
      this.loadExistingItems();
    }
  }

  resetForm = () => {
    this.setState({
      activeTab: 'new',
      sampleFormTab: 1, // Reset sample form tab to first tab
      editMode: false, // Reset edit mode
      selectedItemId: null, // Clear selected item ID
      // Reset warranty calculation state
      warrantyInfo: '',
      warrantyStartDate: '',
      calculatedWarrantyEndDate: '',
      formData: {
        // Tab 1: Basic Information
        itemType: '', // Category
        brand: '',
        model: '',
        serialNumber: '',
        // Tab 2: Purchase Information
        purchaseDate: '',
        purchasePrice: '', // Original Price
        date: '',
        time: '',
        // Tab 4: Location & Assignment
        assetsIdTag: '',
        // Tab 5: System Information
        status: '',
        osType: '',
        osVersion: '',
        ipAddressIPv4: '',
        ipAddressIPv6: '',
        macAddress: '',
        // Tab 6: Additional Information
        notes: ''
      },
      selectedExistingItem: null,
      selectedSerialNumber: '',
      filteredSerialNumbers: [],
      showDropdown: false,
      showAllOptions: false, // Reset show all options flag
      errors: {},
      successMessage: '',
      isSubmitting: false
    });
  }

  // Load existing items for the existing tab
  loadExistingItems = () => {
    console.log('Loading existing items...');
    // Use actual data from props instead of sample data
    const actualData = this.props.data || [];
    console.log('Loading inventory data from props:', actualData.length, 'items');
    
    this.setState({ 
      existingItems: actualData, // Update existing items with actual data
      filteredItems: [],
      isLoadingItems: false
    });
  }

  // Handle tab switching
  handleTabChange = (tab) => {
    console.log('Switching to tab:', tab);
    this.setState({ 
      activeTab: tab,
      errors: {},
      selectedExistingItem: null,
      selectedSerialNumber: ''
    });
    
    // Load items when switching to existing tab
    if (tab === 'existing') {
      this.loadExistingItems();
    }
  }

  // Handle combo box input change
  handleComboInput = (e) => {
    const inputValue = e.target.value;
    this.setState({
      selectedSerialNumber: inputValue,
      selectedExistingItem: null,
      showAllOptions: false // Reset show all flag when typing
    });
  
    // Filter items based on input
    const { existingItems } = this.state;
    const allItems = existingItems.map((item, index) => ({
      serialNumber: item['Serial Number'] || item._serialNumber || item.serialNumber || `No-Serial-${index}`,
      assetsIdTag: item['Assets ID Tag'] || item._assetsIdTag || item.assetsIdTag || 'No Tag',
      fullItem: item
    })); // Include ALL items, not just those with serial numbers
  
    if (inputValue === '') {
      this.setState({
        filteredSerialNumbers: allItems,
        showDropdown: true,
        filteredItems: []
      });
    } else {
      const filtered = allItems.filter(item =>
        item.serialNumber.toLowerCase().includes(inputValue.toLowerCase()) ||
        item.assetsIdTag.toLowerCase().includes(inputValue.toLowerCase()) ||
        // Also search by brand and model for better filtering
        (item.fullItem.Brand || item.fullItem._brand || '').toLowerCase().includes(inputValue.toLowerCase()) ||
        (item.fullItem.Model || item.fullItem._model || '').toLowerCase().includes(inputValue.toLowerCase())
      );
      this.setState({
        filteredSerialNumbers: filtered,
        showDropdown: true,
        filteredItems: []
      });
    }
  }

  // Enhanced helper method to convert any date format to YYYY-MM-DD
  convertDateToInputFormat = (dateString) => {
    console.log('=== DATE CONVERSION START ===');
    console.log('Input dateString:', dateString, 'Type:', typeof dateString);
    
    if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
      console.log('Empty/null date, returning empty string');
      return '';
    }
    
    try {
      // Convert to string and trim
      const dateStr = String(dateString).trim();
      console.log('Trimmed date string:', `"${dateStr}"`);
      
      if (dateStr === '') {
        console.log('Empty string after trim, returning empty');
        return '';
      }
      
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        console.log('Already in YYYY-MM-DD format:', dateStr);
        return dateStr;
      }
      
      // Handle DD/MM/YYYY format (like "16/05/2025" or "13/06/2025")
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        // Always assume DD/MM/YYYY format as per your requirement
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        const result = `${year}-${month}-${day}`;
        console.log('DD/MM/YYYY format converted to:', result);
        return result;
      }
      
      // Handle DD-MM-YYYY format (with dashes)
      if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        const result = `${year}-${month}-${day}`;
        console.log('DD-MM-YYYY format converted to:', result);
        return result;
      }
      
      // Handle YYYY/MM/DD format
      if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        const result = `${year}-${month}-${day}`;
        console.log('YYYY/MM/DD format converted to:', result);
        return result;
      }
      
      // Enhanced month names mapping - includes full month names
      const monthNames = {
        // Short month names
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
        // Full month names
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'June': '06', 'July': '07', 'August': '08', 'September': '09',
        'October': '10', 'November': '11', 'December': '12',
        // Case insensitive variations
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12',
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09',
        'oct': '10', 'nov': '11', 'dec': '12'
      };
      
      // Handle DD-MMM-YY format (like "15-May-25")
      if (/^\d{1,2}-[A-Za-z]{3}-\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        const day = parts[0].padStart(2, '0');
        const monthName = parts[1];
        let year = parts[2];
        
        // Convert 2-digit year to 4-digit
        const currentYear = new Date().getFullYear();
        const currentCentury = Math.floor(currentYear / 100) * 100;
        year = currentCentury + parseInt(year);
        
        // If the resulting year is more than 50 years in the future, assume previous century
        if (year > currentYear + 50) {
          year -= 100;
        }
        
        const month = monthNames[monthName] || monthNames[monthName.toLowerCase()] || '01';
        const result = `${year}-${month}-${day}`;
        console.log('DD-MMM-YY format converted to:', result);
        return result;
      }
      
      // Handle DD-MMM-YYYY format (like "15-May-2025")
      if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        const day = parts[0].padStart(2, '0');
        const monthName = parts[1];
        const year = parts[2];
        
        const month = monthNames[monthName] || monthNames[monthName.toLowerCase()] || '01';
        const result = `${year}-${month}-${day}`;
        console.log('DD-MMM-YYYY format converted to:', result);
        return result;
      }
      
      // Handle DD-Full Month-YYYY format (like "15-January-2025" or "15-May-2025")
      if (/^\d{1,2}-[A-Za-z]{3,9}-\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        const day = parts[0].padStart(2, '0');
        const monthName = parts[1];
        const year = parts[2];
        
        const month = monthNames[monthName] || monthNames[monthName.toLowerCase()] || '01';
        const result = `${year}-${month}-${day}`;
        console.log('DD-Full Month-YYYY format converted to:', result);
        return result;
      }
      
      // Handle MMM DD, YYYY format (like "May 15, 2025")
      if (/^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}$/.test(dateStr)) {
        const parts = dateStr.replace(',', '').split(/\s+/);
        const monthName = parts[0];
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        
        const month = monthNames[monthName] || monthNames[monthName.toLowerCase()] || '01';
        const result = `${year}-${month}-${day}`;
        console.log('MMM DD, YYYY format converted to:', result);
        return result;
      }
      
      // Handle DD.MM.YYYY format (European format with dots)
      if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('.');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        const result = `${year}-${month}-${day}`;
        console.log('DD.MM.YYYY format converted to:', result);
        return result;
      }
      
      // Handle YYYYMMDD format (compact format)
      if (/^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const result = `${year}-${month}-${day}`;
        console.log('YYYYMMDD format converted to:', result);
        return result;
      }
      
      // Handle ISO 8601 format with time (like "2025-05-16T14:30:00.000Z")
      if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
        const result = dateStr.split('T')[0];
        console.log('ISO 8601 format converted to:', result);
        return result;
      }
      
      // Try to parse as a generic date using JavaScript Date constructor
      console.log('Attempting generic date parsing...');
      const date = new Date(dateStr);
      
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        // Ensure the date is reasonable (between 1900 and 2100)
        const year = date.getFullYear();
        if (year >= 1900 && year <= 2100) {
          const result = date.toISOString().split('T')[0];
          console.log('Generic date parsed and converted to:', result);
          return result;
        } else {
          console.warn('Date year out of reasonable range:', year);
        }
      }
      
      console.warn('Could not parse date format, returning empty string');
      return '';
      
    } catch (error) {
      console.error('Error converting date:', dateStr, error);
      return '';
    }
  }

  // Handle dropdown item selection - Enhanced with better debugging and string handling
  selectSerialNumber = (item) => {
    console.log('=== SELECT SERIAL NUMBER CALLED ===');
    console.log('Input item:', item);
    console.log('Type of item:', typeof item);
    
    const serialNumber = typeof item === 'string' ? item : item.serialNumber;
    console.log('Extracted serial number:', serialNumber);
    
    const selectedItem = typeof item === 'string' 
      ? this.state.existingItems.find(invItem => 
          (invItem['Serial Number'] || invItem._serialNumber || invItem.serialNumber) === serialNumber)
      : item.fullItem;
    
    console.log('Found selected item:', selectedItem);
    console.log('Existing items in state:', this.state.existingItems.length);
  
    if (selectedItem) {
      console.log('=== PROCESSING SELECTED ITEM ===');
      console.log('Full selected item data:', selectedItem);
      
      // Clean and format the purchase price - keep as string
      const rawPrice = selectedItem['Original Price'] || selectedItem._originalPrice || '';
      let cleanPrice = '';
      
      console.log('Raw price from item:', rawPrice);
      
      if (rawPrice !== '' && rawPrice !== null && rawPrice !== undefined) {
        // Convert to string and remove commas, currency symbols, and spaces
        cleanPrice = String(rawPrice)
          .replace(/[$£€¥,\s]/g, '') // Remove currency symbols, commas, and spaces
          .replace(/[^\d.-]/g, ''); // Keep only digits, decimal point, and minus sign
        
        // Validate that it's a valid number format, but keep as string
        const testNumber = parseFloat(cleanPrice);
        if (isNaN(testNumber) || testNumber < 0) {
          console.warn('Invalid price detected, clearing:', cleanPrice);
          cleanPrice = ''; // Clear if invalid
        }
        
        console.log('Raw price:', rawPrice);
        console.log('Cleaned price string:', cleanPrice);
      }
      
      // Convert dates to proper input format using utility function
      const rawPurchaseDate = selectedItem['Purchase Date'] || selectedItem._purchaseDate || '';
      const rawDate = selectedItem.Date || selectedItem._date || '';
      
      console.log('Raw purchase date:', rawPurchaseDate);
      console.log('Raw date:', rawDate);
      
      // Use utility function for consistent date conversion
      let purchaseDate = '';
      let date = '';
      
      if (rawPurchaseDate && rawPurchaseDate !== '') {
        purchaseDate = formatDateForInput(rawPurchaseDate);
        console.log('Converted purchase date:', purchaseDate);
      }
      
      if (rawDate && rawDate !== '') {
        date = formatDateForInput(rawDate);
        console.log('Converted date:', date);
      }
      
      // Check all date fields for debugging
      const rawCheckInDate = selectedItem['Check-in Date'] || selectedItem._checkInDate || '';
      const rawCheckOutDate = selectedItem['Check-out Date'] || selectedItem._checkOutDate || '';
      
      let checkInDate = '';
      let checkOutDate = '';
      
      if (rawCheckInDate && rawCheckInDate !== '') {
        checkInDate = formatDateForInput(rawCheckInDate);
      }
      
      if (rawCheckOutDate && rawCheckOutDate !== '') {
        checkOutDate = formatDateForInput(rawCheckOutDate);
      }
      
      console.log('Check-in date - Raw:', rawCheckInDate, 'Converted:', checkInDate);
      console.log('Check-out date - Raw:', rawCheckOutDate, 'Converted:', checkOutDate);
      
      // Populate form data with selected item's data - ALL AS STRINGS
      const formData = {
        itemType: String(selectedItem.Category || selectedItem._category || ''),
        brand: String(selectedItem.Brand || selectedItem._brand || ''),
        model: String(selectedItem.Model || selectedItem._model || ''),
        serialNumber: String(selectedItem['Serial Number'] || selectedItem._serialNumber || ''),
        purchaseDate: purchaseDate, // Already converted to string
        purchasePrice: cleanPrice, // Already a cleaned string
        date: date, // Already converted to string
        time: String(selectedItem.Time || selectedItem._time || ''),
        assetsIdTag: String(selectedItem['Assets ID Tag'] || selectedItem._assetsIdTag || ''),
        assignedUser: String(selectedItem['Assigned User'] || selectedItem._assignedUser || ''),
        location: String(selectedItem.Location || selectedItem._location || ''),
        checkInDate: checkInDate, // Already converted to string
        checkOutDate: checkOutDate, // Already converted to string
        status: String(selectedItem.Status || selectedItem._status || ''),
        osType: String(selectedItem['OS Type'] || selectedItem._osType || ''),
        osVersion: String(selectedItem['OS Version'] || selectedItem._osVersion || ''),
        ipAddressIPv4: String(selectedItem['IP address (IPv4)'] || selectedItem._ipAddressIPv4 || ''),
        ipAddressIPv6: String(selectedItem['IP address (IPv6)'] || selectedItem._ipAddressIPv6 || ''),
        macAddress: String(selectedItem['MAC address'] || selectedItem._macAddress || ''),
        notes: String(selectedItem.Notes || selectedItem._notes || '')
      };
  
      console.log('=== FINAL FORM DATA ===');
      console.log('Complete formData object:', formData);
      console.log('Purchase Date type and value:', typeof formData.purchaseDate, formData.purchaseDate);
      console.log('Date type and value:', typeof formData.date, formData.date);
  
      // Convert warranty dates using utility function
      const warrantyInfo = String(selectedItem['Warranty Information'] || selectedItem._warrantyInformation || '');
      const rawWarrantyStartDate = selectedItem['Warranty Start Date'] || selectedItem._warrantyStartDate || '';
      let warrantyStartDate = '';
      
      if (rawWarrantyStartDate && rawWarrantyStartDate !== '') {
        warrantyStartDate = formatDateForInput(rawWarrantyStartDate);
      }

      console.log('Raw warranty start date:', rawWarrantyStartDate);

      const warrantyEndDate = formatDateForInput(selectedItem['Warranty End Date'] || selectedItem._warrantyEndDate || '');

      console.log('Warranty info:', warrantyInfo);
      console.log('Warranty start date - Raw:', rawWarrantyStartDate, 'Converted:', warrantyStartDate);
      console.log('Warranty end date:', warrantyEndDate);
  
      console.log('=== UPDATING STATE ===');    this.setState({
      selectedSerialNumber: serialNumber,
      showDropdown: false,
      showAllOptions: false, // Reset show all flag
      filteredItems: [selectedItem],
      selectedExistingItem: null,
      formData: formData,
      warrantyInfo: warrantyInfo,
      warrantyStartDate: warrantyStartDate,
      calculatedWarrantyEndDate: warrantyEndDate,
      editMode: true,
      selectedItemId: selectedItem._id || selectedItem.id
      }, () => {
        console.log('State updated successfully');
        console.log('New state formData:', this.state.formData);
        console.log('Purchase Date in state:', this.state.formData.purchaseDate);
        console.log('Date in state:', this.state.formData.date);
        console.log('Edit mode:', this.state.editMode);
      });
    } else {
      console.log('=== NO ITEM FOUND - CLEARING STATE ===');
      this.setState({
        selectedSerialNumber: serialNumber,
        showDropdown: false,
        showAllOptions: false, // Reset show all flag
        filteredItems: [],
        selectedExistingItem: null,
        editMode: false,
        selectedItemId: null
      });
    }
    
    console.log('=== SELECT SERIAL NUMBER COMPLETED ===');
  }

    // Helper method to convert DD/MM/YYYY to YYYY-MM-DD - Enhanced to always return string
  convertDateToInputFormat = (dateString) => {
    console.log('Converting date:', dateString, 'Type:', typeof dateString);
    
    if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
      console.log('Empty date, returning empty string');
      return '';
    }
    
    try {
      // Convert to string first
      const dateStr = String(dateString).trim();
      console.log('Date as string:', dateStr);
      
      // Handle DD/MM/YYYY format
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          const result = `${year}-${month}-${day}`;
          console.log('DD/MM/YYYY format converted to:', result);
          return result;
        }
      }
      
      // Handle DD-MMM-YY format (like "15-May-25")
      if (dateStr.includes('-') && dateStr.length <= 10) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const monthName = parts[1];
          let year = parts[2];
          
          // Convert 2-digit year to 4-digit
          if (year.length === 2) {
            year = '20' + year;
          }
          
          // Convert month name to number
          const monthNames = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          
          const month = monthNames[monthName] || '01';
          const result = `${year}-${month}-${day}`;
          console.log('DD-MMM-YY format converted to:', result);
          return result;
        }
      }
      
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        console.log('Already in YYYY-MM-DD format:', dateStr);
        return dateStr;
      }
      
      // Try to parse as a generic date and convert
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const result = date.toISOString().split('T')[0];
        console.log('Generic date parsed and converted to:', result);
        return result;
      }
      
      console.warn('Could not parse date, returning empty string');
      return '';
    } catch (error) {
      console.warn('Error converting date:', dateStr, error);
      return '';
    }
  }

  renderExistingItems = () => {
    const { filteredItems, selectedExistingItem, selectedSerialNumber, existingItems, isLoadingItems, filteredSerialNumbers, showDropdown, showAllOptions } = this.state;
    
    // Determine which items to show in dropdown
    const dropdownItems = showAllOptions ? 
      existingItems.map(item => ({
        serialNumber: item['Serial Number'] || item._serialNumber || item.serialNumber || '',
        assetsIdTag: item['Assets ID Tag'] || item._assetsIdTag || item.assetsIdTag || 'No Tag',
        fullItem: item
      })).filter(item => item.serialNumber !== '') : 
      filteredSerialNumbers;
    
    return (
      <div className="existing-items-container">
        <h3 className="page-title">Existing Items</h3>
        
        <div className="search-container">
          <div className="form-group">
            <label htmlFor="serialNumberCombo">Select by Serial Number or Assets Tag</label>
            <div className="combo-box-wrapper" style={{ position: 'relative' }}>
              <input
                ref={this.serialNumberInputRef}
                type="text"
                id="serialNumberCombo"
                value={selectedSerialNumber}
                onChange={this.handleComboInput}
                onFocus={this.showDropdown}
                onClick={this.showDropdown}
                onBlur={this.hideDropdown}
                className="form-control"
                placeholder="Type serial number or assets tag..."
                autoComplete="off"
              />
            </div>
            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              💡 You can search by either serial number or assets tag
            </small>
          </div>
        </div>
        
        <div className="existing-items-list">
          {isLoadingItems ? (
            <div className="loading-message">
              <p>🔄 Loading existing items...</p>
            </div>
          ) : (
            <div>              
              <div className="sample-form-layout">
                {this.renderSampleFormWithTabs()}
              </div>
            </div>
          )}
        </div>
        
        {selectedExistingItem && (
          <div className="selected-item-actions">
            <p>✅ Selected: <strong>{selectedExistingItem._itemName || selectedExistingItem.itemName || 'Item'}</strong></p>
            <div className="action-buttons">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => this.handleEditItem(selectedExistingItem)}
              >
                Edit Item
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => this.handleUpdateItem(selectedExistingItem)}
              >
                Update Item
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => this.setState({ selectedExistingItem: null })}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }


  // Show dropdown
  showDropdown = () => {
    console.log('showDropdown called!');
    // Ensure we have items to show in dropdown
    const { existingItems, filteredSerialNumbers } = this.state;
    console.log('Existing items count:', existingItems.length);
    console.log('Filtered serial numbers count:', filteredSerialNumbers.length);
    
    // Get all available items for dropdown - INCLUDE ALL ITEMS, even without serial numbers
    const allItems = existingItems.map((item, index) => ({
      serialNumber: item['Serial Number'] || item._serialNumber || item.serialNumber || `No-Serial-${index}`,
      assetsIdTag: item['Assets ID Tag'] || item._assetsIdTag || item.assetsIdTag || 'No Tag',
      fullItem: item
    })); // Remove the filter that was excluding items without serial numbers
    
    console.log('All items mapped count (including items without serial numbers):', allItems.length);
    console.log('Sample of all items:', allItems.slice(0, 5));
    console.log('Items with actual serial numbers:', allItems.filter(item => !item.serialNumber.startsWith('No-Serial-')).length);
    console.log('Items without serial numbers:', allItems.filter(item => item.serialNumber.startsWith('No-Serial-')).length);
    
    this.setState({ 
      showDropdown: true,
      showAllOptions: true, // Set flag to show all options
      filteredSerialNumbers: allItems
    }, () => {
      console.log('Dropdown state updated - showDropdown:', this.state.showDropdown);
      console.log('Updated filteredSerialNumbers count:', this.state.filteredSerialNumbers.length);
      console.log('showAllOptions:', this.state.showAllOptions);
    });
  }

  // Handle clicks on auto-populated fields
  handleAutoPopulatedFieldClick = (event) => {
    console.log('Auto-populated field clicked!');
    console.log('Existing items count:', this.state.existingItems.length);
    console.log('Filtered serial numbers count:', this.state.filteredSerialNumbers.length);
    
    // Set the active input reference for dropdown positioning
    this.setState({ activeInputRef: event.target });
    
    // If we don't have existing items loaded, load them first
    if (this.state.existingItems.length === 0) {
      console.log('No existing items, loading them first...');
      this.loadExistingItems().then(() => {
        this.showDropdown();
      });
    } else {
      this.showDropdown();
    }
  }

  // Handle focus on auto-populated fields
  handleAutoPopulatedFieldFocus = (event) => {
    console.log('Auto-populated field focused!');
    console.log('Existing items count:', this.state.existingItems.length);
    console.log('Filtered serial numbers count:', this.state.filteredSerialNumbers.length);
    
    // Set the active input reference for dropdown positioning
    this.setState({ activeInputRef: event.target });
    
    // If we don't have existing items loaded, load them first
    if (this.state.existingItems.length === 0) {
      console.log('No existing items, loading them first...');
      this.loadExistingItems().then(() => {
        this.showDropdown();
      });
    } else {
      this.showDropdown();
    }
  }

  // Hide dropdown
  hideDropdown = () => {
    setTimeout(() => {
      this.setState({ 
        showDropdown: false,
        showAllOptions: false // Reset show all flag
      });
    }, 200); // Delay to allow click events on dropdown items
  }

  // Calculate dropdown position for external rendering
  getDropdownStyle = () => {
    // Use either the search input ref or the active input ref
    const activeElement = this.state.activeInputRef || this.serialNumberInputRef.current;
    
    if (!activeElement) {
      return {
        display: 'none'
      };
    }
    
    const inputRect = activeElement.getBoundingClientRect();
    const modalRect = document.querySelector('.inventory-details-modal')?.getBoundingClientRect();
    
    if (!modalRect) {
      return {
        position: 'fixed',
        top: inputRect.bottom + 2,
        left: inputRect.left,
        width: Math.max(inputRect.width, 300),
        zIndex: 10000
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
      zIndex: 10000
    };
  }

  // Handle existing item selection
  handleExistingItemSelect = (item) => {
    this.setState({ selectedExistingItem: item });
  }

  // Handle editing an existing item
  handleEditItem = (item) => {
    // Populate form with existing item data
    const formData = {
      // Tab 1: Basic Information
      itemType: item.Category || item._category || '',
      brand: item.Brand || item._brand || '',
      model: item.Model || item._model || '',
      serialNumber: item['Serial Number'] || item._serialNumber || '',
      // Tab 2: Purchase Information
      purchaseDate: item['Purchase Date'] || item._purchaseDate || '',
      purchasePrice: item['Original Price'] || item._originalPrice || '',
      date: item.Date || item._date || '',
      time: item.Time || item._time || '',
      // Tab 4: Location & Assignment
      assetsIdTag: item['Assets ID Tag'] || item._assetsIdTag || '',
      assignedUser: item['Assigned User'] || item._assignedUser || '',
      location: item.Location || item._location || '',
      checkInDate: item['Check-in Date'] || item._checkInDate || '',
      checkOutDate: item['Check-out Date'] || item._checkOutDate || '',
      // Tab 5: System Information
      status: item.Status || item._status || '',
      osType: item['OS Type'] || item._osType || '',
      osVersion: item['OS Version'] || item._osVersion || '',
      ipAddressIPv4: item['IP address (IPv4)'] || item._ipv4 || '',
      ipAddressIPv6: item['IP address (IPv6)'] || item._ipv6 || '',
      macAddress: item['MAC address'] || item._macAddress || '',
      // Tab 6: Additional Information
      notes: item.Notes || item._notes || ''
    };

    // Populate warranty information
    const warrantyInfo = item['Warranty Information'] || item._warrantyInfo || '';
    const warrantyStartDate = item['Warranty Start Date'] || item._warrantyStartDate || '';
    const warrantyEndDate = item['Warranty End Date'] || item._warrantyEndDate || '';

    this.setState({
      activeTab: 'new', // Switch to form tab
      editMode: true,
      selectedItemId: item._id || item.id, // Get the item ID for update operations
      formData,
      warrantyInfo,
      warrantyStartDate,
      calculatedWarrantyEndDate: warrantyEndDate,
      selectedExistingItem: item
    });
  }

  // Handle updating an existing item using axios
  handleUpdateItem = async (item) => {
    try {
      this.setState({ isSubmitting: true });

      // Prepare inventory data from the item
      const inventoryData = {
        'Category': item.Category || item._category || '',
        'Brand': item.Brand || item._brand || '',
        'Model': item.Model || item._model || '',
        'Serial Number': item['Serial Number'] || item._serialNumber || '',
        'Purchase Date': item['Purchase Date'] || item._purchaseDate || '',
        'Original Price': item['Original Price'] || item._originalPrice || '',
        'Date': item.Date || item._date || '',
        'Time': item.Time || item._time || '',
        'Warranty Information': item['Warranty Information'] || item._warrantyInfo || '',
        'Warranty Start Date': item['Warranty Start Date'] || item._warrantyStartDate || '',
        'Warranty End Date': item['Warranty End Date'] || item._warrantyEndDate || '',
        'Assets ID Tag': item['Assets ID Tag'] || item._assetsIdTag || '',
        'Assigned User': item['Assigned User'] || item._assignedUser || '',
        'Location': item.Location || item._location || '',
        'Check-in Date': item['Check-in Date'] || item._checkInDate || '',
        'Check-out Date': item['Check-out Date'] || item._checkOutDate || '',
        'Status': item.Status || item._status || '',
        'OS Type': item['OS Type'] || item._osType || '',
        'OS Version': item['OS Version'] || item._osVersion || '',
        'IP address (IPv4)': item['IP address (IPv4)'] || item._ipv4 || '',
        'IP address (IPv6)': item['IP address (IPv6)'] || item._ipv6 || '',
        'MAC address': item['MAC address'] || item._macAddress || '',
        'Notes': item.Notes || item._notes || ''
      };

      const result = await this.updateInventoryItem(inventoryData);

      if (result.success) {
        this.setState({
          successMessage: `Item "${item._itemName || item.itemName || 'Item'}" updated successfully!`,
          selectedExistingItem: null,
          isSubmitting: false
        });

        // Trigger data refresh in parent component if callback provided
        if (this.props.onInventoryUpdate) {
          this.props.onInventoryUpdate();
        }
      } else {
        this.setState({
          errors: { submit: result.error || 'Failed to update item' },
          isSubmitting: false
        });
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        this.setState({ successMessage: '' });
      }, 3000);

    } catch (error) {
      console.error('Error updating item:', error);
      this.setState({
        errors: { submit: 'Network error. Please try again.' },
        isSubmitting: false
      });

      // Clear error message after 3 seconds
      setTimeout(() => {
        this.setState({ errors: {} });
      }, 3000);
    }
  }

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      },
      errors: {
        ...prevState.errors,
        [name]: '' // Clear error when user starts typing
      }
    }));
  }

  validateForm = () => {
    const { formData } = this.state;
    const errors = {};

    // Basic validation for essential fields
    if (!formData.itemType.trim()) {
      errors.itemType = 'Category is required';
    }
    if (!formData.brand.trim()) {
      errors.brand = 'Brand is required';
    }
    if (!formData.model.trim()) {
      errors.model = 'Model is required';
    }
    if (!formData.serialNumber.trim()) {
      errors.serialNumber = 'Serial number is required';
    }
    if (!formData.purchaseDate.trim()) {
      errors.purchaseDate = 'Purchase date is required';
    }
    if (!formData.purchasePrice.trim()) {
      errors.purchasePrice = 'Original price is required';
    } else if (isNaN(formData.purchasePrice)) {
      errors.purchasePrice = 'Original price must be a valid number';
    }

    // Additional validation for updates
    if (this.state.editMode && !formData.serialNumber.trim()) {
      errors.serialNumber = 'Serial number is required for updating items';
    }

    return errors;
  }

  // Axios method for creating new inventory item
  createInventoryItem = async (inventoryData) => {
    try {
      const response = await axios.post(`${baseURL}/inventory`, {
        purpose: 'create',
        data: inventoryData
      });

      return response.data;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  // Axios method for updating existing inventory item using Serial Number
  updateInventoryItem = async (inventoryData) => {
    try {
      const response = await axios.post(`${baseURL}/inventory`, {
        purpose: 'update',
        data: inventoryData
      });

      return response.data;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Current state:', this.state);
    
    // Clear any existing errors and success messages
    this.setState({ 
      errors: {}, 
      successMessage: '' 
    });

    // Validation
    const errors = this.validateForm();
    console.log('Validation errors:', errors);
    
    if (Object.keys(errors).length > 0) {
      console.log('Validation failed, stopping submission');
      this.setState({ errors });
      return;
    }

    console.log('Validation passed, proceeding with submission');
    this.setState({ isSubmitting: true });

    try {
      const { formData, editMode, selectedItemId, warrantyInfo, warrantyStartDate, calculatedWarrantyEndDate } = this.state;
      
      console.log('Form data before mapping:', formData);
      console.log('Edit mode:', editMode);
      console.log('Selected item ID:', selectedItemId);
      
      // Prepare inventory data for submission
      const inventoryData = {
        // Map formData to backend expected format
        'Category': formData.itemType || '',
        'Brand': formData.brand || '',
        'Model': formData.model || '',
        'Serial Number': formData.serialNumber || '',
        'Purchase Date': formData.purchaseDate || '',
        'Original Price': formData.purchasePrice || '',
        'Date': formData.date || '',
        'Time': formData.time || '',
        'Warranty Information': warrantyInfo || '',
        'Warranty Start Date': warrantyStartDate || '',
        'Warranty End Date': calculatedWarrantyEndDate || '',
        'Assets ID Tag': formData.assetsIdTag || '',
        'Assigned User': formData.assignedUser || '',
        'Location': formData.location || '',
        'Check-in Date': formData.checkInDate || '',
        'Check-out Date': formData.checkOutDate || '',
        'Status': formData.status || '',
        'OS Type': formData.osType || '',
        'OS Version': formData.osVersion || '',
        'IP address (IPv4)': formData.ipAddressIPv4 || '',
        'IP address (IPv6)': formData.ipAddressIPv6 || '',
        'MAC address': formData.macAddress || '',
        'Notes': formData.notes || ''
      };

      console.log('Mapped inventory data for API:', inventoryData);

      let result;
      
      if (editMode && formData.serialNumber) {
        console.log('Updating existing item with serial number:', formData.serialNumber);
        result = await this.updateInventoryItem(inventoryData);
      } else {
        console.log('Creating new item');
        result = await this.createInventoryItem(inventoryData);
      }

      console.log('API Response:', result);

      if (result && result.success) {
        console.log('Operation successful');
        this.setState({
          successMessage: editMode ? 'Item updated successfully!' : 'Item created successfully!',
          isSubmitting: false
        });

        // Auto-close after 2 seconds
        setTimeout(() => {
          this.handleClose();
        }, 2000);

        // Trigger data refresh in parent component if callback provided
        if (this.props.onInventoryUpdate) {
          console.log('Triggering parent data refresh');
          this.props.onInventoryUpdate();
        }
      } else {
        console.error('Operation failed:', result);
        this.setState({
          errors: { submit: (result && result.error) || 'Failed to save item. Please check your data and try again.' },
          isSubmitting: false
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      console.error('Error details:', error.message, error.stack);
      
      let errorMessage = 'Network error. Please try again.';
      
      // Provide more specific error messages
      if (error.response) {
        console.error('API Error Response:', error.response.data);
        errorMessage = `Server error: ${error.response.data.message || error.response.status}`;
      } else if (error.request) {
        console.error('Network Error - No Response:', error.request);
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      this.setState({
        errors: { submit: errorMessage },
        isSubmitting: false
      });
    }

    console.log('=== FORM SUBMISSION COMPLETED ===');
  }

  handleClose = () => {
    this.setState({ isVisible: false });
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  renderTabs = () => {
    const { activeTab } = this.state;
    
    return (
      <div className="tab-container">
        <div className="tab-buttons">
          <button
            type="button"
            className={`tab-button ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => this.handleTabChange('new')}
          >
            New Item
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'existing' ? 'active' : ''}`}
            onClick={() => this.handleTabChange('existing')}
          >
            Existing Items
          </button>
        </div>
      </div>
    );
  }

  renderNewItemForm = () => {
    const { formData, errors, editMode } = this.state;
    return (
      <div className="form-page">
        <h3 className="page-title">{editMode ? 'Edit Inventory Item' : 'New Inventory Item'}</h3>
        
        <div className="form-group">
          <label htmlFor="itemType">Category *</label>
          <input
            type="text"
            id="itemType"
            name="itemType"
            value={formData.itemType}
            onChange={this.handleInputChange}
            className={`form-control ${errors.itemType ? 'error' : ''}`}
            placeholder="Enter category"
          />
          {errors.itemType && <span className="error-text">{errors.itemType}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="brand">Brand *</label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={formData.brand}
            onChange={this.handleInputChange}
            className={`form-control ${errors.brand ? 'error' : ''}`}
            placeholder="Enter brand name"
          />
          {errors.brand && <span className="error-text">{errors.brand}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="model">Model *</label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model}
            onChange={this.handleInputChange}
            className={`form-control ${errors.model ? 'error' : ''}`}
            placeholder="Enter model"
          />
          {errors.model && <span className="error-text">{errors.model}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="serialNumber">Serial Number *</label>
          <input
            type="text"
            id="serialNumber"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={this.handleInputChange}
            className={`form-control ${errors.serialNumber ? 'error' : ''}`}
            placeholder="Enter serial number"
          />
          {errors.serialNumber && <span className="error-text">{errors.serialNumber}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="purchaseDate">Purchase Date *</label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={this.handleInputChange}
            className={`form-control ${errors.purchaseDate ? 'error' : ''}`}
          />
          {errors.purchaseDate && <span className="error-text">{errors.purchaseDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="purchasePrice">Original Price *</label>
          <input
            type="number"
            id="purchasePrice"
            name="purchasePrice"
            value={formData.purchasePrice}
            onChange={this.handleInputChange}
            className={`form-control ${errors.purchasePrice ? 'error' : ''}`}
            placeholder="0.00"
            step="0.01"
          />
          {errors.purchasePrice && <span className="error-text">{errors.purchasePrice}</span>}
        </div>
      </div>
    );
  }

  // Helper method to format date
  formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  }

  // Helper method to format price
  formatPrice = (priceValue) => {
    if (!priceValue || priceValue === '') return 'N/A';
    const price = parseFloat(priceValue);
    if (isNaN(price)) return 'N/A';
    return `$${price.toFixed(2)}`;
  }

  // Handle sample form tab navigation
  handleSampleTabChange = (tabNumber) => {
    this.setState({ sampleFormTab: tabNumber });
  }
  
  // Axios method for deleting inventory item using Serial Number or Assets ID Tag
  deleteInventoryItem = async (identifier, identifierType = 'serialNumber') => {
    try {
      const requestData = {
        purpose: 'delete'
      };
  
      // Add the appropriate identifier based on type
      if (identifierType === 'assetsIdTag') {
        requestData.assetsIdTag = identifier;
      } else {
        requestData.serialNumber = identifier;
      }
  
      const response = await axios.post(`${baseURL}/inventory`, requestData);
  
      return response.data;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }
  
  handleDeleteItem = async () => {
    const { formData, editMode, selectedSerialNumber } = this.state;
    
    // Determine which identifier to use for deletion
    let identifierToDelete = '';
    let identifierType = 'serialNumber';
    let displayName = '';
  
    if (editMode) {
      // In edit mode, prefer serial number, fallback to assets ID tag
      if (formData.serialNumber && formData.serialNumber.trim() !== '') {
        identifierToDelete = formData.serialNumber;
        identifierType = 'serialNumber';
        displayName = `serial number "${identifierToDelete}"`;
      } else if (formData.assetsIdTag && formData.assetsIdTag.trim() !== '') {
        identifierToDelete = formData.assetsIdTag;
        identifierType = 'assetsIdTag';
        displayName = `assets ID tag "${identifierToDelete}"`;
      }
    } else {
      // In existing items tab, use selected serial number
      if (selectedSerialNumber && selectedSerialNumber.trim() !== '') {
        identifierToDelete = selectedSerialNumber;
        identifierType = 'serialNumber';
        displayName = `serial number "${identifierToDelete}"`;
        
        // Check if the selected item has an assets ID tag we can also display
        const selectedItem = this.state.existingItems.find(item => 
          (item['Serial Number'] || item._serialNumber || item.serialNumber) === selectedSerialNumber
        );
        if (selectedItem) {
          const assetsTag = selectedItem['Assets ID Tag'] || selectedItem._assetsIdTag || selectedItem.assetsIdTag;
          if (assetsTag && assetsTag !== 'No Tag') {
            displayName = `serial number "${identifierToDelete}" (Assets ID: ${assetsTag})`;
          }
        }
      }
    }
    
    if (!identifierToDelete || identifierToDelete.trim() === '') {
      this.setState({
        errors: { submit: 'No item selected for deletion. Please select an item by serial number or assets ID tag first.' }
      });
      return;
    }
  
    // Confirm deletion with user
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the item with ${displayName}?\n\nThis action cannot be undone.`
    );
  
    if (!confirmDelete) {
      return;
    }
  
    try {
      this.setState({ isSubmitting: true, errors: {} });
  
      const result = await this.deleteInventoryItem(identifierToDelete, identifierType);
  
      if (result.success) {
        this.setState({
          successMessage: `Item with ${displayName} has been deleted successfully!`,
          isSubmitting: false
        });
  
        // Reset form and clear selected item
        this.resetForm();
  
        // Auto-close modal after 2 seconds
        setTimeout(() => {
          this.handleClose();
        }, 2000);
  
        // Trigger data refresh in parent component if callback provided
        if (this.props.onInventoryUpdate) {
          this.props.onInventoryUpdate();
        }
      } else {
        this.setState({
          errors: { submit: result.error || 'Failed to delete item. Please try again.' },
          isSubmitting: false
        });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      this.setState({
        errors: { submit: 'Network error occurred while deleting item. Please check your connection and try again.' },
        isSubmitting: false
      });
    }
  }
  
  // Update the calculateWarrantyEndDate function to return YYYY-MM-DD format for date input
  calculateWarrantyEndDate = (warrantyInfo, startDate) => {
    // Update state with new values if provided
    const currentWarrantyInfo = warrantyInfo !== null ? warrantyInfo : this.state.warrantyInfo;
    const currentStartDate = startDate !== null ? startDate : this.state.warrantyStartDate;
    console.log("Warranty Info:", currentWarrantyInfo, "Start Date:", currentStartDate);
    
    // Update state
    const newState = {};
    if (warrantyInfo !== null) newState.warrantyInfo = warrantyInfo;
    if (startDate !== null) newState.warrantyStartDate = startDate;
    
    // Calculate end date if we have both pieces of info
    if (currentWarrantyInfo && currentStartDate) {
      try {
        const startDateObj = new Date(currentStartDate);
        let endDateObj = new Date(startDateObj);
        
        // Parse warranty information
        const warrantyText = currentWarrantyInfo.toLowerCase().trim();
        
        if (warrantyText.includes('year')) {
          const years = parseInt(warrantyText.match(/\d+/)?.[0] || '1');
          endDateObj.setFullYear(endDateObj.getFullYear() + years);
        } else if (warrantyText.includes('month')) {
          const months = parseInt(warrantyText.match(/\d+/)?.[0] || '12');
          endDateObj.setMonth(endDateObj.getMonth() + months);
        } else if (warrantyText.includes('day')) {
          const days = parseInt(warrantyText.match(/\d+/)?.[0] || '365');
          endDateObj.setDate(endDateObj.getDate() + days);
        } else {
          // Default to 1 year if format not recognized
          endDateObj.setFullYear(endDateObj.getFullYear() + 1);
        }
        
        // Format the end date as YYYY-MM-DD for date input field
        const year = endDateObj.getFullYear();
        const month = (endDateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = endDateObj.getDate().toString().padStart(2, '0');
        newState.calculatedWarrantyEndDate = `${year}-${month}-${day}`;
      } catch (error) {
        newState.calculatedWarrantyEndDate = '';
      }
    } else {
      newState.calculatedWarrantyEndDate = '';
    }
    
    this.setState(newState);
  }
  
  // Update the renderSampleFormWithTabs function - Tab 3 and Tab 4 sections
  renderSampleFormWithTabs = () => {
    const { sampleFormTab } = this.state;
    
    const sampleTabs = [
      { number: 1, title: 'Basic Info', icon: '📝' },
      { number: 2, title: 'Purchase', icon: '💰' },
      { number: 3, title: 'Warranty', icon: '🛡️' },
      { number: 4, title: 'Location', icon: '📍' },
      { number: 5, title: 'System', icon: '💻' },
      { number: 6, title: 'Additional', icon: '📋' }
    ];
  
    return (
      <div className="existing-item-card sample-card">
        
        {/* Sample Form Tab Navigation */}
        <div className="sample-form-tabs">
          <div className="sample-tab-buttons">
            {sampleTabs.map(tab => (
              <button
                key={tab.number}
                type="button"
                className={`sample-tab-button ${sampleFormTab === tab.number ? 'active' : ''}`}
                onClick={() => this.handleSampleTabChange(tab.number)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-text">Tab {tab.number}</span>
                <div className="tab-subtitle">{tab.title}</div>
              </button>
            ))}
          </div>
        </div>
  
        <div className="item-details">
          {/* Tab 1: Basic Information - Auto-populated */}
          {sampleFormTab === 1 && (
            <div className="detail-section">
              <h5 className="section-title">📝 Basic Information</h5>
              <div className="vertical-form-fields">
                <div className="form-field">
                  <label><strong>Category:</strong></label>
                  <input 
                    type="text" 
                    name="itemType"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.itemType}
                    onChange={this.handleInputChange}
                    placeholder='e.g., Laptop, Monitor, Printer'
                  />
                </div>
                <div className="form-field">
                  <label><strong>Brand:</strong></label>
                  <input 
                    type="text" 
                    name="brand"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.brand}
                    onChange={this.handleInputChange}
                    placeholder='e.g., Dell, HP, Apple'
                  />
                </div>
                <div className="form-field">
                  <label><strong>Model:</strong></label>
                  <input 
                    type="text" 
                    name="model"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.model}
                    onChange={this.handleInputChange}
                    placeholder='e.g., XPS 13, EliteBook 840, MacBook Pro'
                  />
                </div>
                <div className="form-field">
                  <label><strong>Serial Number:</strong></label>
                  <input 
                    type="text" 
                    name="serialNumber"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.serialNumber}
                    onChange={this.handleInputChange}
                    placeholder='e.g., ABC123456789'
                  />
                </div>
              </div>
            </div>
          )}
  
          {/* Tab 2: Purchase Information - Auto-populated */}
          {sampleFormTab === 2 && (
            <div className="detail-section">
              <h5 className="section-title">💰 Purchase Information</h5>
              <div className="vertical-form-fields">
                <div className="form-field">
                  <label><strong>Purchase Date:</strong></label>
                  <input 
                    type="date" 
                    name="purchaseDate"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.purchaseDate}
                    onChange={this.handleInputChange}
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                <div className="form-field">
                  <label><strong>Original Price:</strong></label>
                  <input 
                    type="number" 
                    name="purchasePrice"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.purchasePrice}
                    onChange={this.handleInputChange}
                    step="0.01"
                    placeholder='e.g., 0.00'
                  />
                </div>
                <div className="form-field">
                  <label><strong>Date:</strong></label>
                  <input 
                    type="date" 
                    name="date"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.date}
                    onChange={this.handleInputChange}
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                <div className="form-field">
                  <label><strong>Time:</strong></label>
                  <input 
                    type="text" 
                    name="time"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.time}
                    onChange={this.handleInputChange}
                    placeholder="e.g., 1430 hrs"
                  />
                </div>
              </div>
            </div>
          )}
  
          {/* Tab 3: Warranty Information - Updated with DD/MM/YYYY format */}
          {sampleFormTab === 3 && (
            <div className="detail-section">
              <h5 className="section-title">🛡️ Warranty Information</h5>
              <div className="vertical-form-fields">
                <div className="form-field">
                  <label><strong>Warranty Information:</strong></label>
                  <input 
                    type="text" 
                    className="vertical-input" 
                    value={this.state.warrantyInfo}
                    placeholder="e.g., 1 year, 2 years, 18 months"
                    onChange={(e) => this.calculateWarrantyEndDate(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label><strong>Warranty Start Date:</strong></label>
                  <input 
                    type="date" 
                    className="vertical-input"
                    value={this.state.warrantyStartDate}
                    onChange={(e) => this.calculateWarrantyEndDate(null, e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label><strong>Warranty End Date:</strong></label>
                  <input 
                    type="date" 
                    className="vertical-input" 
                    value={this.state.calculatedWarrantyEndDate || ''}
                    onChange={(e) => this.setState({ calculatedWarrantyEndDate: e.target.value })}
                    placeholder="dd/mm/yyyy - Will auto-calculate when you enter warranty info and start date"
                  />
                </div>
              </div>
            </div>
          )}
  
          {/* Tab 4: Location & Assignment - Updated with all required fields */}
          {sampleFormTab === 4 && (
            <div className="detail-section">
              <h5 className="section-title">📍 Location & Assignment</h5>
              <div className="vertical-form-fields">
                <div className="form-field">
                  <label><strong>Check-in Date:</strong></label>
                  <input 
                    type="date" 
                    name="checkInDate"
                    className="vertical-input" 
                    value={this.state.formData.checkInDate}
                    onChange={this.handleInputChange}
                  />
                </div>
                <div className="form-field">
                  <label><strong>Check-out Date:</strong></label>
                  <input 
                    type="date" 
                    name="checkOutDate"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.checkOutDate}
                    onChange={this.handleInputChange}
                    style={{backgroundColor: '#f0f8ff', border: '2px solid #4CAF50'}}
                  />
                </div>
                <div className="form-field">
                  <label><strong>Assigned User:</strong></label>
                  <input 
                    type="text" 
                    name="assignedUser"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.assignedUser}
                    onChange={this.handleInputChange}
                    style={{backgroundColor: '#f0f8ff', border: '2px solid #4CAF50'}}
                    placeholder="e.g., Moses Lee" 
                  />
                </div>
                <div className="form-field">
                  <label><strong>Location:</strong></label>
                  <input 
                    type="text" 
                    name="location"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.location}
                    onChange={this.handleInputChange}
                    style={{backgroundColor: '#f0f8ff', border: '2px solid #4CAF50'}}
                    placeholder="e.g., Office Building A, Room 201" 
                  />
                </div>
                <div className="form-field">
                  <label><strong>Assets ID Tag:</strong></label>
                  <input 
                    type="text" 
                    name="assetsIdTag"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.assetsIdTag}
                    onChange={this.handleInputChange}
                    style={{backgroundColor: '#f0f8ff', border: '2px solid #4CAF50'}}
                    placeholder="e.g., CE/ECSS/078/2025" 
                  />
                </div>
              </div>
            </div>
          )}
  
          {/* Tab 5: System Information - All text boxes */}
          {sampleFormTab === 5 && (
            <div className="detail-section">
              <h5 className="section-title">💻 System Information</h5>
              <div className="vertical-form-fields">
                <div className="form-field">
                  <label><strong>Status:</strong></label>
                  <input 
                    type="text" 
                    name="status"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.status}
                    onChange={this.handleInputChange}
                    style={{backgroundColor: '#f0f8ff', border: '2px solid #4CAF50'}}
                    placeholder="e.g., Working" 
                  />
                </div>
                <div className="form-field">
                  <label><strong>OS Type:</strong></label>
                  <input 
                    type="text" 
                    name="osType"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.osType}
                    onChange={this.handleInputChange}
                    style={{backgroundColor: '#f0f8ff', border: '2px solid #4CAF50'}}
                    placeholder="e.g., Windows" 
                  />
                </div>
                <div className="form-field">
                  <label><strong>OS Version:</strong></label>
                  <input 
                    type="text" 
                    name="osVersion"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.osVersion}
                    onChange={this.handleInputChange}
                    style={{backgroundColor: '#f0f8ff', border: '2px solid #4CAF50'}}
                    placeholder="e.g., macOS Sequoia 15.5" 
                  />
                </div>
                <div className="form-field">
                  <label><strong>IP address (IPv4):</strong></label>
                  <input 
                    type="text" 
                    name="ipAddressIPv4"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.ipAddressIPv4}
                    onChange={this.handleInputChange}
                    style={{backgroundColor: '#f0f8ff', border: '2px solid #4CAF50'}}
                    placeholder="e.g., 192.168.1.180" 
                  />
                </div>
                <div className="form-field">
                  <label><strong>IP address (IPv6):</strong></label>
                  <input 
                    type="text" 
                    name="ipAddressIPv6"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.ipAddressIPv6}
                    onChange={this.handleInputChange}
                    style={{backgroundColor: '#f0f8ff', border: '2px solid #4CAF50'}}
                    placeholder="e.g., fe80::8ef:387d:c1c2:9054" 
                  />
                </div>
                <div className="form-field">
                  <label><strong>MAC address:</strong></label>
                  <input 
                    type="text" 
                    name="macAddress"
                    className="vertical-input auto-populated" 
                    value={this.state.formData.macAddress}
                    onChange={this.handleInputChange}
                    style={{backgroundColor: '#f0f8ff', border: '2px solid #4CAF50'}}
                    placeholder="e.g., ac:07:75:25:b9:74" 
                  />
                </div>
              </div>
            </div>
          )}
  
          {/* Tab 6: Additional Information */}
          {sampleFormTab === 6 && (
            <div className="detail-section">
              <h5 className="section-title">📋 Additional Information</h5>
              <div className="vertical-form-fields">
                <div className="form-field">
                  <label><strong>Notes:</strong></label>
                  <textarea 
                    name="notes"
                    className="vertical-textarea auto-populated" 
                    value={this.state.formData.notes}
                    onChange={this.handleInputChange}
                    style={{backgroundColor: '#f0f8ff', border: '2px solid #4CAF50'}}
                    placeholder="e.g., Laptop + Charger" 
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>
          )}
  
          {/* Navigation arrows */}
          <div className="sample-form-navigation">
            <button
              type="button"
              className="nav-button prev-button"
              onClick={() => this.handleSampleTabChange(Math.max(1, sampleFormTab - 1))}
              disabled={sampleFormTab === 1}
            >
              ← Previous
            </button>
            <span className="tab-indicator">
              {sampleFormTab} of {sampleTabs.length}
            </span>
            <button
              type="button"
              className="nav-button next-button"
              onClick={() => this.handleSampleTabChange(Math.min(sampleTabs.length, sampleFormTab + 1))}
              disabled={sampleFormTab === sampleTabs.length}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { isVisible, activeTab, errors, successMessage, isSubmitting } = this.state;

    if (!isVisible) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content inventory-details-modal">
          <div className="modal-header">
            <h2>Inventory Management</h2>
            <button className="close-button" onClick={this.handleClose}>×</button>
          </div>

          <div className="modal-body">
            {successMessage && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                {successMessage}
              </div>
            )}

            {this.renderTabs()}

            {activeTab === 'new' ? (
              <>
                <form onSubmit={this.handleSubmit}>
                  {this.renderNewItemForm()}

                  {errors.submit && (
                    <div className="error-message">
                      <span className="error-icon">❌</span>
                      {errors.submit}
                    </div>
                  )}

                  <div className="form-actions">
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
                        {isSubmitting ? 
                          (this.state.editMode ? 'Updating...' : 'Saving...') : 
                          (this.state.editMode ? 'Update Inventory Item' : 'Save Inventory Item')
                        }
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <>
                <form onSubmit={this.handleSubmit}>
                  {this.renderExistingItems()}
                  
                  {errors.submit && (
                    <div className="error-message">
                      <span className="error-icon">❌</span>
                      {errors.submit}
                    </div>
                  )}

                  <div className="form-actions">
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={this.handleClose}
                        disabled={isSubmitting}
                      >
                        Close
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={this.handleDeleteItem}
                        disabled={isSubmitting}
                      >
                        Delete
                      </button>
                      
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 
                          (this.state.editMode ? 'Updating...' : 'Saving...') : 
                          (this.state.editMode ? 'Update Inventory Item' : 'Save Inventory Item')
                        }
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
        
        {/* External dropdown rendered outside modal for maximum visibility */}
        {this.state.showDropdown && (
          <div 
            className="serial-number-dropdown-external"
            style={{
              ...this.getDropdownStyle(),
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              maxHeight: '400px', // Increased max height to show more items
              overflowY: 'auto',
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              zIndex: 10001 // Ensure it's above other elements
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {(() => {
              // Determine which items to show - INCLUDE ALL ITEMS
              let itemsToShow = this.state.showAllOptions ? 
                this.state.existingItems.map((item, index) => ({
                  serialNumber: item['Serial Number'] || item._serialNumber || item.serialNumber || `No-Serial-${index + 1}`,
                  assetsIdTag: item['Assets ID Tag'] || item._assetsIdTag || item.assetsIdTag || 'No Tag',
                  fullItem: item
                })) : // Don't filter out items without serial numbers when showing all
                this.state.filteredSerialNumbers;

              // Sort items by running number and year (e.g., CE/001/2024, CE/002/2024, etc.)
              itemsToShow = itemsToShow.sort((a, b) => {
                const getAssetInfo = (assetTag) => {
                  // Extract running number and year from formats like "CE/001/2024" or "ECSS/001/2024"
                  const match = assetTag.match(/^(CE|ECSS)\/(\d+)\/(\d{4})$/);
                  if (match) {
                    const [, prefix, number, year] = match;
                    return {
                      prefix,
                      number: parseInt(number, 10),
                      year: parseInt(year, 10),
                      isValid: true,
                      fullTag: assetTag
                    };
                  }
                  // For non-standard formats, put them at the end
                  return {
                    prefix: 'ZZZ', // Put at end alphabetically
                    number: 999999,
                    year: 9999,
                    isValid: false,
                    fullTag: assetTag
                  };
                };

                const aInfo = getAssetInfo(a.assetsIdTag);
                const bInfo = getAssetInfo(b.assetsIdTag);

                // First sort by prefix (CE vs ECSS)
                if (aInfo.prefix !== bInfo.prefix) {
                  return aInfo.prefix.localeCompare(bInfo.prefix);
                }

                // Then sort by year (ascending - older years first)
                if (aInfo.year !== bInfo.year) {
                  return aInfo.year - bInfo.year;
                }

                // Finally sort by running number (ascending - lower numbers first)
                return aInfo.number - bInfo.number;
              });
                
              console.log('Items to show in dropdown:', itemsToShow.length);
              console.log('showAllOptions flag:', this.state.showAllOptions);
              console.log('First 3 sorted items:', itemsToShow.slice(0, 3).map(item => item.assetsIdTag));
              console.log('Last 3 sorted items:', itemsToShow.slice(-3).map(item => item.assetsIdTag));
              
              return itemsToShow.map((item, index) => (
                <div
                  key={`${item.serialNumber}-${index}`}
                  className="dropdown-item-external"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    this.selectSerialNumber(item);
                  }}
                  onClick={() => this.selectSerialNumber(item)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  <div style={{
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    📟 {item.serialNumber.startsWith('No-Serial-') ? "": item.serialNumber}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    fontStyle: item.assetsIdTag === 'No Tag' ? 'italic' : 'normal'
                  }}>
                    🏷️ {item.assetsIdTag}
                  </div>
                  {/* Show brand and model for better identification */}
                  <div style={{
                    fontSize: '11px',
                    color: '#888'
                  }}>
                    📦 {(item.fullItem.Brand || item.fullItem._brand || 'Unknown Brand')} - {(item.fullItem.Model || item.fullItem._model || 'Unknown Model')}
                  </div>
                </div>
              ));
            })()}
            {/* Debug info at bottom of dropdown */}
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              fontSize: '12px',
              color: '#666',
              borderTop: '1px solid #ddd'
            }}>
              📊 Showing {this.state.showAllOptions ? 
                this.state.existingItems.length : 
                this.state.filteredSerialNumbers.length
              } of {this.state.existingItems.length} total items
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default InventoryDetailsFormComponent
