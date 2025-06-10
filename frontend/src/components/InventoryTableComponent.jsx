import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([ AllCommunityModule ]);

class InventoryTableComponent extends Component {
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

  render() {
    const { 
      data = [], 
      isLoading = false, 
      lastUpdate = null 
    } = this.props;

    const columnDefs = [
      { 
        headerName: 'S/N', 
        width: 80,
        pinned: 'left',
        valueGetter: (params) => {
          return params.node.rowIndex + 1;
        },
        cellStyle: (params) => this.getCellStyle({}, params.node.rowIndex + 1)
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
        width: 160,
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
        this.setupHoverSync();
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
      </>
    );
  }
}

export default InventoryTableComponent;
