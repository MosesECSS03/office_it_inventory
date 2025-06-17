import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import TabNavigationComponent from './TabNavigationComponent';
import '../css/InventoryTableComponent.css';

ModuleRegistry.registerModules([ AllCommunityModule ]);

class InventoryTableComponent extends Component {
  constructor(props) {
    super(props);
    this.gridApi = null;
    // Add state for active tab, user history, and expanded item histories
    this.state = {
      activeTab: props.activeTab || 'general',
      showUserHistory: false,
      userHistory: [],
      selectedRowIndex: null,
      expandedItemHistories: new Set() // Track which item histories are expanded
    };
  }

  componentDidUpdate(prevProps) {
    // Check if data has changed and update the grid
    if (prevProps.data !== this.props.data && this.gridApi) {
      console.log('InventoryTableComponent: Data updated, refreshing grid');
      //this.gridApi.setRowData(this.props.data || []);
    }
    
    // Update tab state if prop changes
    if (prevProps.activeTab !== this.props.activeTab) {
      this.setState({ activeTab: this.props.activeTab });
    }
  }

  // Helper function to calculate warranty status based on warranty start and end dates
  calculateWarrantyStatus = (warrantyStartDate, warrantyEndDate) => {
    if (!warrantyEndDate) return 'Unknown';
    
    try {
      let startDate = null;
      let endDate = null;
      
      // Parse warranty start date if provided
      if (warrantyStartDate) {
        if (warrantyStartDate instanceof Date) {
          startDate = warrantyStartDate;
        } else if (typeof warrantyStartDate === 'string') {
          let dateStr = warrantyStartDate.trim();
          
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              let [day, month, year] = parts;
              day = parseInt(day);
              month = parseInt(month);
              year = parseInt(year);
              
              // Handle 2-digit year
              if (year < 100) {
                year = year <= 30 ? 2000 + year : 1900 + year;
              }
              
              startDate = new Date(year, month - 1, day);
            } else {
              startDate = new Date(dateStr);
            }
          } else {
            startDate = new Date(dateStr);
          }
          
          // If start date is invalid, set to null
          if (isNaN(startDate.getTime())) {
            startDate = null;
          }
        }
      }
      
      // Parse warranty end date
      if (warrantyEndDate instanceof Date) {
        endDate = warrantyEndDate;
      } else if (typeof warrantyEndDate === 'string') {
        let dateStr = warrantyEndDate.trim();
        
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            let [day, month, year] = parts;
            day = parseInt(day);
            month = parseInt(month);
            year = parseInt(year);
            
            // Handle 2-digit year
            if (year < 100) {
              year = year <= 30 ? 2000 + year : 1900 + year;
            }
            
            endDate = new Date(year, month - 1, day);
          } else {
            endDate = new Date(dateStr);
          }
        } else {
          endDate = new Date(dateStr);
        }
      }
      
      // Check if end date is valid
      if (!endDate || isNaN(endDate.getTime())) {
        return 'Unknown';
      }
      
      const today = new Date();
      
      // If we have a start date, check if warranty has started
      if (startDate && today < startDate) {
        return 'Not Started';
      }
      
      // Calculate days until end date
      const timeDiff = endDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysDiff < 0) {
        return 'Expired';
      } else if (daysDiff <= 30) {
        return 'Expiring Soon';
      } else {
        // If we have both start and end dates, warranty is active
        // If we only have end date and it's more than 30 days away, assume active
        return 'Active';
      }
    } catch (error) {
      return 'Unknown';
    }
  };

  // Helper function to calculate exact months between purchase date and today
  calculateMonthsSincePurchase = (purchaseDate) => {
    if (!purchaseDate) {
      console.log('No purchase date provided');
      return '';
    }
    
    let purchaseDateTime;
    
    try {
      // Handle different date formats
      if (purchaseDate instanceof Date) {
        purchaseDateTime = purchaseDate;
      } else if (typeof purchaseDate === 'string') {
        // Try multiple date formats
        let dateStr = purchaseDate.trim();
        
        console.log('Parsing date string:', dateStr);
        
        // Handle dd/mm/yyyy, d/m/yy, dd/mm/yy formats
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            let [day, month, year] = parts;
            
            // Clean and parse each part
            day = parseInt(day.trim());
            month = parseInt(month.trim());
            year = parseInt(year.trim());
            
            // Handle 2-digit year - be more flexible with cutoff
            if (year < 100) {
              // Assume years 00-30 are 2000s, 31-99 are 1900s
              year = year <= 30 ? 2000 + year : 1900 + year;
            }
            
            console.log('Date parts after parsing:', { day, month, year });
            
            // Validate date components
            if (isNaN(day) || isNaN(month) || isNaN(year) || 
                day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2030) {
              console.log('Invalid date components:', { day, month, year, original: purchaseDate });
              return '';
            }
            
            // Create date object (month is 0-indexed in JS)
            purchaseDateTime = new Date(year, month - 1, day);
          } else {
            // Try standard date parsing
            purchaseDateTime = new Date(dateStr);
          }
        } else if (dateStr.includes('-')) {
          // Handle ISO format or other dash-separated formats
          purchaseDateTime = new Date(dateStr);
        } else {
          // Try direct parsing
          purchaseDateTime = new Date(dateStr);
        }
      } else if (typeof purchaseDate === 'number') {
        purchaseDateTime = new Date(purchaseDate);
      } else {
        console.log('Unhandled date type:', typeof purchaseDate, purchaseDate);
        return ''; // Return empty if can't parse
      }
      
      // Check if date is valid
      if (isNaN(purchaseDateTime.getTime())) {
        console.log('Invalid date after parsing:', purchaseDate, '->', purchaseDateTime);
        return ''; // Return empty if invalid date
      }
      
      const today = new Date();
      
      // Check if purchase date is in the future
      if (purchaseDateTime > today) {
        console.log('Purchase date is in the future:', purchaseDate);
        return '0'; // Return 0 months if future date
      }
      
      // Precise month calculation using date arithmetic
      let totalMonths = 0;
      
      // Method 1: Year/Month calculation with day adjustment
      let years = today.getFullYear() - purchaseDateTime.getFullYear();
      let months = today.getMonth() - purchaseDateTime.getMonth();
      
      // If today's date hasn't reached the purchase day of month, subtract 1 month
      if (today.getDate() < purchaseDateTime.getDate()) {
        months -= 1;
      }
      
      // Handle negative months
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      
      const calculatedMonths = years * 12 + months;
      
      // Method 2: Days-based calculation for verification
      const timeDifference = today.getTime() - purchaseDateTime.getTime();
      const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      
      // Method 3: More accurate month calculation by iterating
      let iterativeMonths = 0;
      let currentDate = new Date(purchaseDateTime);
      
      while (currentDate <= today) {
        // Move to next month
        if (currentDate.getMonth() === 11) {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          currentDate.setMonth(0);
        } else {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        if (currentDate <= today) {
          iterativeMonths++;
        }
        
        // Safety break to prevent infinite loop
        if (iterativeMonths > 1000) {
          console.log('Breaking iterative calculation - too many iterations');
          break;
        }
      }
      
      // Use the most conservative (smallest) calculation
      const approximateFromDays = Math.floor(daysDifference / 30.44);
      
      // Choose the minimum of the three calculations for accuracy
      totalMonths = Math.min(calculatedMonths, approximateFromDays, iterativeMonths);
      
      console.log('Comprehensive date calculation:', {
        originalDate: purchaseDate,
        parsedDate: purchaseDateTime.toDateString(),
        today: today.toDateString(),
        daysDifference: daysDifference,
        calculatedMonths: calculatedMonths,
        approximateFromDays: approximateFromDays,
        iterativeMonths: iterativeMonths,
        finalResult: totalMonths,
        purchaseDay: purchaseDateTime.getDate(),
        todayDay: today.getDate(),
        purchaseMonth: purchaseDateTime.getMonth(),
        todayMonth: today.getMonth()
      });
      
      totalMonths = Math.max(0, totalMonths); // Ensure non-negative
      
      console.log('Date calculation success:', {
        originalDate: purchaseDate,
        parsedDate: purchaseDateTime.toDateString(),
        totalMonths: totalMonths,
        today: today.toDateString()
      });
      return totalMonths.toString();
      
    } catch (error) {
      console.error('Error calculating months since purchase:', error, purchaseDate);
      return '';
    }
  };

  // Helper function to parse price values, handling commas and various formats
  parsePrice = (priceValue) => {
    if (!priceValue) return NaN;
    
    // Convert to string if not already
    let priceStr = String(priceValue).trim();
    
    // Remove currency symbols and commas
    priceStr = priceStr.replace(/[$,\s]/g, '');
    
    // Parse as float
    const parsed = parseFloat(priceStr);
    
    console.log('Price parsing:', {
      original: priceValue,
      cleaned: priceStr,
      parsed: parsed,
      isValid: !isNaN(parsed)
    });
    
    return parsed;
  };

  // Helper function to calculate current net book value based on depreciation
  calculateCurrentNetBookValue = (originalPrice, purchaseDate) => {
    if (!originalPrice || !purchaseDate) {
      console.log('Missing data for net book value:', { originalPrice, purchaseDate });
      return '';
    }
    
    // Get the duration in months
    const monthsSincePurchase = this.calculateMonthsSincePurchase(purchaseDate);
    if (monthsSincePurchase === '') {
      console.log('Could not calculate months since purchase for:', purchaseDate);
      return '';
    }
    
    const months = parseFloat(monthsSincePurchase);
    const price = this.parsePrice(originalPrice);
    
    console.log('Net book value calculation:', {
      originalPrice: originalPrice,
      parsedPrice: price,
      monthsSincePurchase: months,
      isValidMonths: !isNaN(months),
      isValidPrice: !isNaN(price)
    });
    
    if (isNaN(months) || isNaN(price)) {
      console.log('Invalid calculation inputs:', { months, price });
      return '';
    }
    
    // Formula: Original Price - (Original Price/36 * Duration since Purchase in months)
    const depreciation = (price / 36) * months;
    const currentValue = price - depreciation;
    
    // Ensure the value doesn't go below 0
    const finalValue = Math.max(0, currentValue);
    
    console.log('Calculated net book value:', {
      originalPrice: price,
      depreciation: depreciation,
      currentValue: currentValue,
      finalValue: finalValue
    });
    
    return finalValue.toFixed(2);
  };

  // Helper function to format dates consistently
  formatDate = (value) => {
    if (!value) return '';
    
    let date;
    
    // Handle different date formats
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      return value; // Return original if can't parse
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return value; // Return original if invalid date
    }
    
    // Force dd/mm/yyyy format regardless of locale
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Helper function to format date and time consistently from data structure
  formatDateTime = (params) => {
    if (!params || !params.data) return '';
    
    const data = params.data;
    const dateValue = data._date;
    const timeValue = data._time;
    
    if (!dateValue) return '';
    
    // Parse the date (format: d/m/yy)
    let formattedDate = '';
    if (dateValue) {
      const dateParts = dateValue.split('/');
      if (dateParts.length === 3) {
        let [day, month, year] = dateParts;
        
        // Handle 2-digit year (assuming 00-50 is 2000s, 51-99 is 1900s)
        if (year.length === 2) {
          year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        }
        
        // Ensure proper padding
        day = day.padStart(2, '0');
        month = month.padStart(2, '0');
        
        formattedDate = `${day}/${month}/${year}`;
      }
    }
    
    // Parse the time (format: "1436 hrs")
    let formattedTime = '';
    if (timeValue) {
      const timeMatch = timeValue.match(/(\d{3,4})\s*hrs?/i);
      if (timeMatch) {
        const timeStr = timeMatch[1].padStart(4, '0'); // Ensure 4 digits
        const hours = timeStr.substring(0, 2);
        const minutes = timeStr.substring(2, 4);
        formattedTime = `${hours}:${minutes}:00`;
      }
    }
    
    // Combine date and time
    if (formattedDate && formattedTime) {
      return `${formattedDate} ${formattedTime}`;
    } else if (formattedDate) {
      return formattedDate;
    }
    
    return '';
  };

  // Helper function to format just the date field from backend data
  formatDateField = (params) => {
    if (!params || !params.data || !params.data._date) return '';
    
    const dateValue = params.data._date;
    
    // Parse the date (format: d/m/yy)
    const dateParts = dateValue.split('/');
    if (dateParts.length === 3) {
      let [day, month, year] = dateParts;
      
      // Handle 2-digit year (assuming 00-50 is 2000s, 51-99 is 1900s)
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      
      // Ensure proper padding
      day = day.padStart(2, '0');
      month = month.padStart(2, '0');
      
      return `${day}/${month}/${year}`;
    }
    
    return dateValue;
  };

  // Helper function to format just the time field from backend data
  formatTimeField = (params) => {
    if (!params || !params.data || !params.data._time) return '';
    
    const timeValue = params.data._time;
    
    // Parse the time (format: "1436 hrs")
    const timeMatch = timeValue.match(/(\d{3,4})\s*hrs?/i);
    if (timeMatch) {
      const timeStr = timeMatch[1].padStart(4, '0'); // Ensure 4 digits
      const hours = timeStr.substring(0, 2);
      const minutes = timeStr.substring(2, 4);
      return `${hours}:${minutes}`;
    }
    
    return timeValue;
  };

  // Helper function to get cell style with empty cell styling
  getCellStyle = (baseStyle, value) => {
    const isEmpty = !value || value === '' || value === null || value === undefined;
    return {
      ...baseStyle,
      backgroundColor:  isEmpty ? "#000000": 'transparent',
      fontStyle: isEmpty ? 'italic' : 'normal',
      color: isEmpty ? '#000000' : (baseStyle.color || '#2c3e50')
    };
  };

  // Setup hover synchronization between pinned and non-pinned columns
  setupHoverSync = () => {
    // Wait for DOM to be ready
    setTimeout(() => {
      const gridContainer = document.querySelector('.ag-theme-alpine-custom');
      if (!gridContainer) return;

      // Get all row elements
      const pinnedRows = gridContainer.querySelectorAll('.ag-pinned-left-cols-container .ag-row');
      const centerRows = gridContainer.querySelectorAll('.ag-center-cols-container .ag-row');

      // Add event listeners to pinned rows
      pinnedRows.forEach((row, index) => {
        row.addEventListener('mouseenter', () => this.handleRowHover(index, true));
        row.addEventListener('mouseleave', () => this.handleRowHover(index, false));
      });

      // Add event listeners to center rows
      centerRows.forEach((row, index) => {
        row.addEventListener('mouseenter', () => this.handleRowHover(index, true));
        row.addEventListener('mouseleave', () => this.handleRowHover(index, false));
      });
    }, 100);
  };

  // Handle row hover for both pinned and non-pinned columns
  handleRowHover = (rowIndex, isHovering) => {
    const gridContainer = document.querySelector('.ag-theme-alpine-custom');
    if (!gridContainer) return;

    // Get both pinned and center row containers
    const pinnedContainer = gridContainer.querySelector('.ag-pinned-left-cols-container');
    const centerContainer = gridContainer.querySelector('.ag-center-cols-container');

    if (!pinnedContainer || !centerContainer) return;

    // Find the specific rows for this index
    const pinnedRow = pinnedContainer.querySelector(`[row-index="${rowIndex}"]`);
    const centerRow = centerContainer.querySelector(`[row-index="${rowIndex}"]`);

    // Apply or remove hover class
    const action = isHovering ? 'add' : 'remove';
    
    if (pinnedRow) {
      pinnedRow.classList[action]('ag-row-hover-custom');
      // Preserve black styling for empty cells
      if (isHovering) {
        this.preserveEmptyCellStyling(pinnedRow);
      }
    }
    
    if (centerRow) {
      centerRow.classList[action]('ag-row-hover-custom');
      // Preserve black styling for empty cells
      if (isHovering) {
        this.preserveEmptyCellStyling(centerRow);
      }
    }
  };

  // Preserve black styling for empty cells during hover
  preserveEmptyCellStyling = (row) => {
    const cells = row.querySelectorAll('.ag-cell');
    cells.forEach(cell => {
      const cellStyle = cell.getAttribute('style');
      if (cellStyle && cellStyle.includes('background-color: rgb(0, 0, 0)')) {
        // Force black background and text for empty cells during hover
        cell.style.setProperty('background-color', '#000000', 'important');
        cell.style.setProperty('color', '#000000', 'important');
      }
    });
  };

  // Tab handling function
  handleTabChange = (tabName) => {
    console.log(`Switching to ${tabName} tab`);
    this.setState({ activeTab: tabName });
    
    // Call parent component's callback if provided
    if (this.props.onTabChange) {
      this.props.onTabChange(tabName);
    }

    // Force grid to refresh columns after tab change
    if (this.gridApi) {
      setTimeout(() => {
        console.log(`Applying column definitions for ${tabName} tab`);
        const newColumnDefs = this.getColumnDefsForTab(tabName);
        console.log(`Setting ${newColumnDefs.length} columns for ${tabName} tab`);
        this.gridApi.setColumnDefs(newColumnDefs);
        this.gridApi.sizeColumnsToFit();
      }, 100);
    }
  };

  // Handle export data for the export functionality
  handleExportData = (tabId) => {
    const { data = [] } = this.props;
    
    if (data.length === 0) {
      return [['No data available']];
    }

    // Get column definitions for the specific tab
    const columnDefs = this.getColumnDefsForTab(tabId);
    
    // Create headers row (excluding S/N column)
    const headers = columnDefs
      .filter(col => col.headerName !== 'S/N')
      .map(col => col.headerName);
    
    // Create data rows
    const rows = data.map(item => {
      return columnDefs
        .filter(col => col.headerName !== 'S/N')
        .map(col => {
          let value = item[col.field] || '';
          
          // Format dates if needed
          if (col.headerName.includes('Date') && value) {
            try {
              value = this.formatDate(value);
            } catch (e) {
              // Keep original value if formatting fails
            }
          }
          
          // Handle special cases
          if (col.headerName === 'Original Price' && value) {
            const parsedPrice = this.parsePrice(value);
            value = parsedPrice ? `$${parsedPrice.toFixed(2)}` : value;
          }
          
          return value;
        });
    });
    
    // Return array of arrays with headers as first row
    return [headers, ...rows];
  };

  // Toggle user history visibility
  toggleUserHistory = (index) => {
    this.setState(prevState => {
      // Check if clicking on the same row that's already selected
      if (prevState.showUserHistory && prevState.selectedRowIndex === index) {
        // Same row clicked - hide the history (toggle off)
        console.log('Hiding user history for row', index);
        return {
          showUserHistory: false,
          userHistory: [],
          selectedRowIndex: null
        };
      } else {
        // Different row clicked or no history currently showing - show history for this row
        const userHistory = this.generateUserHistory(index);
        console.log('Showing history for row', index, ':', userHistory);
        
        return {
          showUserHistory: true,
          userHistory: userHistory,
          selectedRowIndex: index
        };
      }
    });
  };

  // Helper function to determine the latest activity date from check-in, check-out, and last amendment dates
  getLatestActivityDate = (checkInDate, checkOutDate, lastAmendmentOn) => {
    const dates = [];
    
    // Parse dates and add to array if valid
    if (checkInDate) {
      const parsedDate = this.parseDate(checkInDate);
      if (parsedDate) dates.push(parsedDate);
    }
    
    if (checkOutDate) {
      const parsedDate = this.parseDate(checkOutDate);
      if (parsedDate) dates.push(parsedDate);
    }
    
    if (lastAmendmentOn) {
      const parsedDate = this.parseDate(lastAmendmentOn);
      if (parsedDate) dates.push(parsedDate);
    }
    
    // Return the most recent date, or null if no valid dates found
    return dates.length > 0 ? new Date(Math.max(...dates)) : null;
  };

  // Helper function to parse various date formats into Date objects
  parseDate = (dateValue) => {
    if (!dateValue) return null;
    
    try {
      // If it's already a Date object
      if (dateValue instanceof Date) {
        return dateValue;
      }
      
      // If it's a string, try to parse it
      if (typeof dateValue === 'string') {
        let dateStr = dateValue.trim();
        
        // Handle dd/mm/yyyy or d/m/yy formats
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            let [day, month, year] = parts;
            day = parseInt(day);
            month = parseInt(month);
            year = parseInt(year);
            
            // Handle 2-digit year
            if (year < 100) {
              year = year <= 30 ? 2000 + year : 1900 + year;
            }
            
            // Create date object (month is 0-indexed in JS)
            return new Date(year, month - 1, day);
          }
        }
        
        // Try direct parsing for other formats
        const parsedDate = new Date(dateStr);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
      }
      
      return null;
    } catch (error) {
      console.warn('Error parsing date:', dateValue, error);
      return null;
    }
  };

  // Generate user history from the current data
  generateUserHistory = (selectedRowIndex) => {
    const { data = [] } = this.props;
  
    // If a specific row index is provided, show only that row's history
    if (selectedRowIndex !== null && selectedRowIndex >= 0 && selectedRowIndex < data.length) {
      const selectedItem = data[selectedRowIndex];

      
      // Safely access userHistory with null checks
      const userHistory = selectedItem._userHistory || null;

      console.log(`Showing history for row ${selectedRowIndex + 1}:`, userHistory);
      return userHistory;
    }
  };

  // Toggle individual item history
  toggleItemHistory = (rowIndex) => {
    this.setState(prevState => {
      const newExpandedHistories = new Set(prevState.expandedItemHistories);
      
      if (newExpandedHistories.has(rowIndex)) {
        newExpandedHistories.delete(rowIndex);
      } else {
        newExpandedHistories.add(rowIndex);
      }
      
      return {
        expandedItemHistories: newExpandedHistories
      };
    });
  };

  // Get history for a specific item
  getItemHistory = (item) => {
    if (!item) return null;

    return {
      basicInfo: {
        category: item._category,
        brand: item._brand,
        model: item._model,
        serialNumber: item._serialNumber,
        assetsIdTag: item._assetsIdTag
      },
      purchaseInfo: {
        purchaseDate: this.formatDate(item._purchaseDate),
        originalPrice: item._originalPrice,
        currentNetBookValue: this.calculateCurrentNetBookValue(item._originalPrice, item._purchaseDate),
        durationSincePurchase: this.calculateMonthsSincePurchase(item._purchaseDate)
      },
      warrantyInfo: {
        warrantyInformation: item._warrantyInformation,
        warrantyStartDate: this.formatDate(item._warrantyStartDate),
        warrantyEndDate: this.formatDate(item._warrantyEndDate),
        warrantyStatus: this.calculateWarrantyStatus(item._warrantyStartDate, item._warrantyEndDate)
      },
      assignmentInfo: {
        assignedUser: item._assignedUser,
        location: item._location,
        status: item._status,
        checkInDate: this.formatDate(item._checkInDate),
        checkOutDate: this.formatDate(item._checkOutDate)
      },
      technicalInfo: {
        osType: item._osType,
        osVersion: item._osVersion,
        ipAddressIPv4: item._ipAddressIPv4,
        ipAddressIPv6: item._ipAddressIPv6,
        macAddress: item._macAddress
      },
      additionalInfo: {
        notes: item._notes,
        lastAmendmentOn: this.formatDate(item._lastAmendmentOn),
        date: item._date,
        time: item._time
      }
    };
  };

  // Render tab navigation
  renderTabNavigation = () => {
    const { activeTab } = this.state;
    
    const tabs = [
      { id: 'general', label: 'General', icon: '📋' },
      { id: 'finance', label: 'Finance', icon: '💰' },
      { id: 'admin', label: 'Admin', icon: '⚙️' },
      { id: 'it', label: 'IT', icon: '💻' }
    ];

    return (
      <div className="tab-navigation">
        <div className="tab-buttons-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => this.handleTabChange(tab.id)}
            >
              <div className="tab-button-logo">{tab.icon}</div>
              <div className="tab-button-label">{tab.label}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Get column definitions based on active tab
  getColumnDefsForTab = (activeTab) => {
    const allColumnDefs = [
      { 
        headerName: 'S/N', 
        width: 80,
        pinned: 'left',
        valueGetter: (params) => {
          return params.node.rowIndex + 1;
        },
        cellStyle: (params) => ({
          ...this.getCellStyle({}, params.node.rowIndex + 1),
          cursor: 'pointer',
          userSelect: 'none'
        }),
        cellRenderer: (params) => {
          const rowIndex = params.node.rowIndex;
          return (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                fontWeight: 'bold'
              }}
              onClick={() => this.toggleUserHistory(rowIndex)}
              title="Click to toggle user assignment history and statistics"
            >
              <span>{rowIndex + 1}</span>
              <span style={{ fontSize: '10px', color: '#7f8c8d' }}>
                {this.state.showUserHistory ? '📊' : '📈'}
              </span>
            </div>
          );
        }
      },
      { 
        field: '_category', 
        headerName: 'Category', 
        width: 120,
        pinned: 'left',
        cellStyle: (params) => this.getCellStyle({}, params.value)
      },
      { 
        field: '_brand', 
        headerName: 'Brand', 
        width: 150,
        pinned: 'left',
        cellStyle: (params) => this.getCellStyle({ fontWeight: '600' }, params.value)
      },
      { 
        field: '_model', 
        headerName: 'Model', 
        width: 350,
        pinned: 'left',
        cellStyle: (params) => this.getCellStyle({ fontWeight: '500' }, params.value)
      },
      { 
        field: '_serialNumber', 
        headerName: 'Serial Number', 
        width: 280,
        cellStyle: (params) => this.getCellStyle({ fontFamily: 'monospace', fontSize: '0.9rem' }, params.value)
      },
      { 
        field: '_purchaseDate', 
        headerName: 'Purchase Date', 
        width: 280,
        cellStyle: (params) => this.getCellStyle({ fontSize: '0.9rem' }, params.value),
        cellRenderer: (params) => this.formatDate(params.value)
      },
      { 
        field: '_originalPrice', 
        headerName: 'Original Price', 
        width: 280,
        cellStyle: (params) => this.getCellStyle({ fontWeight: 'bold', color: '#27ae60', fontSize: '0.9rem' }, params.value),
        cellRenderer: (params) => {
          if (!params.value) return '';
          const parsedPrice = this.parsePrice(params.value);
          return !isNaN(parsedPrice) ? `$${parsedPrice.toFixed(2)}` : params.value;
        }
      },
      { 
        field: '_currentNetBookValue', 
        headerName: 'Current Net Book Value', 
        width: 280,
        cellStyle: (params) => {
          // Calculate the value to check if it's empty
          const originalPrice = params.data._originalPrice;
          const purchaseDate = params.data._purchaseDate;
          const calculatedValue = this.calculateCurrentNetBookValue(originalPrice, purchaseDate);
          return this.getCellStyle({ fontWeight: 'bold', color: '#e67e22', fontSize: '0.9rem' }, calculatedValue);
        },
        cellRenderer: (params) => {
          // Calculate current net book value based on depreciation
          const originalPrice = params.data._originalPrice;
          const purchaseDate = params.data._purchaseDate;
          const calculatedValue = this.calculateCurrentNetBookValue(originalPrice, purchaseDate);
          return calculatedValue ? `$${calculatedValue}` : '';
        }
      },
      { 
        field: '_durationSincePurchase', 
        headerName: 'Duration since Purchase (mth)', 
        width: 380,
        cellStyle: (params) => {
          // Calculate the value to check if it's empty - requires both purchase date AND original price
          const purchaseDate = params.data._purchaseDate;
          const originalPrice = params.data._originalPrice;
          
          // Only calculate if both purchase date and original price exist
          const calculatedValue = (purchaseDate && originalPrice) 
            ? this.calculateMonthsSincePurchase(purchaseDate) 
            : '';
            
          return this.getCellStyle({ fontSize: '0.9rem', textAlign: 'center' }, calculatedValue);
        },
        cellRenderer: (params) => {
          // Calculate months from purchase date to today, but only if original price exists
          const purchaseDate = params.data._purchaseDate;
          const originalPrice = params.data._originalPrice;
          
          // Enhanced debugging with more data context
          if (!purchaseDate) {
            console.log('No purchase date for row:', {
              rowIndex: params.node.rowIndex,
              brand: params.data._brand,
              model: params.data._model,
              serialNumber: params.data._serialNumber,
              allDataKeys: Object.keys(params.data),
              purchaseDateValue: purchaseDate
            });
            return '';
          }
          
          if (!originalPrice) {
            console.log('No original price for row - skipping duration calculation:', {
              rowIndex: params.node.rowIndex,
              brand: params.data._brand,
              model: params.data._model,
              purchaseDate: purchaseDate,
              originalPriceValue: originalPrice,
              allDataKeys: Object.keys(params.data)
            });
            return '';
          }
          
          const calculatedValue = this.calculateMonthsSincePurchase(purchaseDate);
          
          // Debug logging for failed calculations
          if (!calculatedValue && purchaseDate) {
            console.log('Duration calculation failed for row:', {
              rowIndex: params.node.rowIndex,
              brand: params.data._brand,
              model: params.data._model,
              purchaseDate: purchaseDate,
              originalPrice: originalPrice,
              purchaseDateType: typeof purchaseDate,
              purchaseDateString: String(purchaseDate),
              allDataSample: {
                category: params.data._category,
                brand: params.data._brand,
                model: params.data._model,
                serialNumber: params.data._serialNumber,
                purchaseDate: params.data._purchaseDate,
                originalPrice: params.data._originalPrice
              }
            });
          }
          
          // Return calculated value or empty string
          return calculatedValue || '';
        }
      },
      { 
        field: '_warrantyInformation', 
        headerName: 'Warranty Information', 
        width: 300,
        cellStyle: (params) => this.getCellStyle({ fontSize: '0.9rem' }, params.value)
      },
      { 
        field: '_warrantyStartDate', 
        headerName: 'Warranty Start Date', 
        width: 300,
        cellStyle: (params) => this.getCellStyle({ fontSize: '0.9rem' }, params.value),
        cellRenderer: (params) => this.formatDate(params.value)
      },
      { 
        field: '_warrantyEndDate', 
        headerName: 'Warranty End Date', 
        width: 300,
        cellStyle: (params) => this.getCellStyle({ fontSize: '0.9rem' }, params.value),
        cellRenderer: (params) => this.formatDate(params.value)
      },
      { 
        field: '_warrantyStatus', 
        headerName: 'Warranty Status', 
        width: 300,
        cellStyle: (params) => {
          const calculatedStatus = this.calculateWarrantyStatus(params.data._warrantyStartDate, params.data._warrantyEndDate);
          // Treat "Unknown" warranty status as empty for styling purposes
          const displayValue = calculatedStatus === 'Unknown' ? '' : calculatedStatus;
          return this.getCellStyle({}, displayValue);
        },
        cellRenderer: (params) => {
          // Calculate warranty status based on warranty start and end dates
          const calculatedStatus = this.calculateWarrantyStatus(params.data._warrantyStartDate, params.data._warrantyEndDate);
          
          // Don't display "Unknown" warranty status
          if (calculatedStatus === 'Unknown') {
            return '';
          }
          
          const statusColors = {
            'Active': '#27ae60',
            'Expired': '#e74c3c',
            'Expiring Soon': '#f39c12',
            'Not Started': '#3498db'
          };
          const color = statusColors[calculatedStatus] || '#34495e';
          return <span style={{ color, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem' }}>{calculatedStatus}</span>;
        }
      },
      { 
        field: '_assignedUser', 
        headerName: 'Assigned User', 
        width: 300,
        cellStyle: (params) => this.getCellStyle({ fontWeight: '500' }, params.value)
      },
      { 
        field: '_location', 
        headerName: 'Location', 
        width: 300,
        cellStyle: (params) => this.getCellStyle({ fontFamily: 'monospace', fontSize: '0.9rem' }, params.value)
      },
      { 
        field: '_assetsIdTag', 
        headerName: 'Assets ID Tag', 
        width: 300,
        cellStyle: (params) => this.getCellStyle({ fontWeight: 'bold', color: '#7f8c8d', fontFamily: 'monospace' }, params.value)
      },
      { 
        field: '_status', 
        headerName: 'Status', 
        width: 200,
        cellStyle: (params) => this.getCellStyle({}, params.value),
        cellRenderer: (params) => {
          const statusColors = {
            'Working': '#27ae60',
            'Not Working': '#e74c3c',
            'Pending': '#f39c12',
            'Spolit': '#e74c3c'
          };
          const color = statusColors[params.value?.trim()];
          return <span style={{ color, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>{params.value}</span>;
        }
      },
      { 
        field: '_checkInDate', 
        headerName: 'Check-in Date', 
        width: 200,
        cellStyle: (params) => this.getCellStyle({ fontSize: '0.9rem' }, params.value),
        cellRenderer: (params) => this.formatDate(params.value)
      },
      { 
        field: '_checkOutDate', 
        headerName: 'Check-out Date', 
        width: 200,
        cellStyle: (params) => this.getCellStyle({ fontSize: '0.9rem' }, params.value),
        cellRenderer: (params) => this.formatDate(params.value)
      },
      { 
        field: '_osType', 
        headerName: 'OS Type', 
        width: 120,
        cellStyle: (params) => this.getCellStyle({ fontSize: '0.9rem' }, params.value)
      },
      { 
        field: '_osVersion', 
        headerName: 'OS Version', 
        width: 200,
        cellStyle: (params) => this.getCellStyle({ fontSize: '0.85rem' }, params.value)
      },
      { 
        field: '_date', 
        headerName: 'Date', 
        width: 200,
        cellStyle: (params) => this.getCellStyle({ fontSize: '0.85rem' }, params.data?._date),
        cellRenderer: (params) => this.formatDateField(params)
      },
    { 
        field: '_time', 
        headerName: 'Time', 
        width: 200,
        cellStyle: (params) => this.getCellStyle({ fontSize: '0.85rem' }, params.data?._time),
        cellRenderer: (params) => this.formatTimeField(params)
      },
      { 
        field: '_ipAddressIPv4', 
        headerName: 'IP address (IPv4)', 
        width: 300,
        cellStyle: (params) => this.getCellStyle({ fontFamily: 'monospace', fontSize: '0.85rem' }, params.value)
      },
      { 
        field: '_ipAddressIPv6', 
        headerName: 'IP address (IPv6)', 
        width: 300,
        cellStyle: (params) => this.getCellStyle({ fontFamily: 'monospace', fontSize: '0.85rem' }, params.value)
      },
      { 
        field: '_macAddress', 
        headerName: 'MAC address', 
        width: 300,
        cellStyle: (params) => this.getCellStyle({ fontFamily: 'monospace', fontSize: '0.85rem' }, params.value)
      },
      { 
        field: '_notes', 
        headerName: 'Notes', 
        width: 350,
        cellStyle: (params) => this.getCellStyle({ fontSize: '0.85rem' }, params.value)
      },
      { 
        field: '_lastAmendmentOn', 
        headerName: 'Last Amendment On', 
        width: 200,
        cellStyle: (params) => this.getCellStyle({ fontSize: '0.85rem', color: '#7f8c8d' }, params.value),
        cellRenderer: (params) => this.formatDate(params.value)
      }
    ];

    // Define which columns to show for each tab
    const tabColumnMapping = {
      general: [
        'S/N', 'Category', 'Brand', 'Model', 'Serial Number', 'Purchase Date', 
        'Original Price', 'Current Net Book Value', 'Duration since Purchase (mth)', 
        'Warranty Information', 'Warranty Start Date', 'Warranty End Date', 
        'Warranty Status', 'Assigned User', 'Location', 'Status', 'Assets ID Tag', 
        'Check-in Date', 'Check-out Date', 'OS Type', 'OS Version', 'Date', 'Time',
        'IP address (IPv4)', 'IP address (IPv6)', 'MAC address', 'Notes', 
        'Last Amendment On'
      ],
      finance: [
        'S/N', 'Category', 'Brand', 'Model', 'Serial Number', 'Purchase Date',
        'Original Price', 'Current Net Book Value', 'Duration since Purchase (mth)',
        'Assigned User', 'Location', 'Status', 'Assets ID Tag', 'Check-in Date',
        'Check-out Date', 'Notes', 'Last Amendment On'
      ],
      admin: [
        "S/N", "Category", "Brand", "Model", "Serial Number", "Warranty Information", 
        "Warranty Start Date", "Warranty Status", "Assigned User", "Location", "Assets ID Tag",
        "Status", "Check-in Date", "Check-out Date", "Notes", "Last Amendment On"
      ],
      it: [
        "S/N", "Category", "Brand", "Model", "Serial Number", "Assigned User", 
        "Location", "Assets ID Tag", "Status", "Check-in Date", "Check-out Date", 
        "OS Type", "OS Version", "Date", "Time", "IP address (IPv4)", "IP address (IPv6)", 
        "MAC address", "Notes", "Last Amendment On"
      ]
    };

    // Filter columns based on active tab
    const allowedColumns = tabColumnMapping[activeTab] || tabColumnMapping.general;
    const filteredColumns = allColumnDefs.filter(col => allowedColumns.includes(col.headerName));
    
    // For non-general tabs, adjust pinned columns to ensure proper display
    if (activeTab !== 'general') {
      filteredColumns.forEach((col, index) => {
        // Only pin the first 4 columns for non-general tabs
        if (index < 4) {
          col.pinned = 'left';
        } else {
          delete col.pinned;
        }
      });
    }
    
    console.log('Tab filtering:', {
      activeTab,
      allowedColumnsCount: allowedColumns.length,
      filteredColumnsCount: filteredColumns.length,
      allowedColumns: allowedColumns.slice(0, 5), // First 5 for debugging
      filteredHeaders: filteredColumns.map(col => col.headerName).slice(0, 5) // First 5 for debugging
    });
    
    return filteredColumns;
  };

  render() {
    const { 
      data = [], 
      isLoading = false, 
      lastUpdate = null 
    } = this.props;

    const { activeTab } = this.state;
    const columnDefs = this.getColumnDefsForTab(activeTab);

    const rowData = data.length > 0 ? data : [];
    
    // Enhanced debugging - log the actual data structure
    if (rowData.length > 0) {
      console.log('=== TABLE DATA ANALYSIS ===');
      console.log('Total rows:', rowData.length);
      console.log('First row sample:', rowData[0]);
      console.log('First row keys:', Object.keys(rowData[0]));
      
      // Check for price and date fields specifically
      const sampleRow = rowData[0];
      console.log('Sample data for key fields:', {
        _purchaseDate: sampleRow._purchaseDate,
        _originalPrice: sampleRow._originalPrice,
        _currentNetBookValue: sampleRow._currentNetBookValue,
        _brand: sampleRow._brand,
        _model: sampleRow._model
      });
      
      // Count rows with valid purchase dates and prices
      let rowsWithPurchaseDate = 0;
      let rowsWithOriginalPrice = 0;
      let rowsWithBoth = 0;
      
      rowData.forEach((row, index) => {
        if (row._purchaseDate) rowsWithPurchaseDate++;
        if (row._originalPrice) rowsWithOriginalPrice++;
        if (row._purchaseDate && row._originalPrice) rowsWithBoth++;
        
        // Log a few sample rows for detailed analysis
        if (index < 3) {
          console.log(`Row ${index} analysis:`, {
            brand: row._brand,
            model: row._model,
            purchaseDate: row._purchaseDate,
            originalPrice: row._originalPrice,
            purchaseDateType: typeof row._purchaseDate,
            originalPriceType: typeof row._originalPrice
          });
        }
      });
      
      console.log('Data summary:', {
        totalRows: rowData.length,
        rowsWithPurchaseDate: rowsWithPurchaseDate,
        rowsWithOriginalPrice: rowsWithOriginalPrice,
        rowsWithBoth: rowsWithBoth
      });
      console.log('=== END TABLE DATA ANALYSIS ===');
    }
    
    console.log('Row Data:', rowData);

    // Grid options to handle row hover events for synchronized pinned/non-pinned hover
    const gridOptions = {
      onGridReady: (params) => {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        console.log('Grid ready, setting up with activeTab:', activeTab);
        this.setupHoverSync();
        // Initial column sizing and ensure correct tab columns are shown
        setTimeout(() => {
          const initialColumnDefs = this.getColumnDefsForTab(activeTab);
          console.log(`Initial load: Setting ${initialColumnDefs.length} columns for ${activeTab} tab`);
          params.api.setColumnDefs(initialColumnDefs);
          params.api.sizeColumnsToFit();
        }, 100);
      },
      onRowMouseEnter: (event) => {
        this.handleRowHover(event.rowIndex, true);
      },
      onRowMouseLeave: (event) => {
        this.handleRowHover(event.rowIndex, false);
      }
    };

    return (
      <>
        <h2>
          {isLoading && <span style={{ fontSize: '0.7em', marginLeft: '10px' }}>🔄</span>}
          {lastUpdate && (
            <span style={{ fontSize: '0.6em', marginLeft: '10px', color: '#7f8c8d' }}>
              (Updated: {lastUpdate.toLocaleTimeString()})
            </span>
          )}
        </h2>
        <TabNavigationComponent 
          activeTab={activeTab}
          onTabChange={this.handleTabChange}
          onExportData={this.handleExportData}
          onOpenExportModal={this.props.onOpenExportModal}
        />
        <div className="ag-theme-alpine-custom table-wrapper">
          <AgGridReact
            columnDefs={columnDefs}
            rowData={rowData}
            gridOptions={gridOptions}
            defaultColDef={{
              sortable: true,
            }}
            headerHeight={50}
            rowHeight={45}
            animateRows={true}
            pagination={true}
            paginationPageSize={rowData.length}
            suppressMovableColumns={false}
            enableRangeSelection={true}
            loading={isLoading}
          />
        </div>
        
        {/* User History Section - Toggled by clicking S/N column */}
        {this.state.showUserHistory && (
          <div className="user-history-section">
            <div className="user-history-content">
              <div className="user-history-summary">
                <h3>User Assignment History</h3>
                {Array.isArray(this.state.userHistory) && this.state.userHistory.length > 0 ? (
                  <div className="user-history-list">
                    {this.state.userHistory.map((historyItem, index) => (
                      <div key={index} className="user-history-item">
                        <div className="user-info">
                          <strong>User:</strong> {historyItem.User || 'Unknown User'}
                        </div>
                        <div className="date-period">
                          <strong>Date Period:</strong>
                          <div className="date-range">
                            <span>Start Date: {historyItem['Date Period']?.['Start Date'] || 'N/A'}</span>
                            <span>End Date: {historyItem['Date Period']?.['End Date'] || 'Ongoing'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-history">
                    <p>No user assignment history available for this item.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
              
      </>
    );
  }
}

export default InventoryTableComponent;
