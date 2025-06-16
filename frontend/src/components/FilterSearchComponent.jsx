import React, { Component } from 'react';

class FilterSearchComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchTerm: '',
      // Input values (what user types)
      warrantyStatusInput: '',
      selectedStatusInput: '',
      // Filter values (what gets applied for filtering)
      warrantyStatus: '',
      selectedStatus: '',
      showWarrantyDropdown: false,
      showStatusDropdown: false
    };
  }

  componentDidMount() {
    // Initialize filters
    this.applyFilters();
  }

  componentDidUpdate(prevProps, prevState) {
    // Only apply filters when actual filter values change (not input values)
    if (
      prevState.searchTerm !== this.state.searchTerm ||
      prevState.warrantyStatus !== this.state.warrantyStatus ||
      prevState.selectedStatus !== this.state.selectedStatus
    ) {
      this.applyFilters();
    }
  }

  // Extract unique values for filter dropdowns
  getUniqueValues = (data, field) => {
    if (!data || data.length === 0) return [];
    const values = data
      .filter(item => item != null) // Filter out null/undefined items first
      .map(item => item[field])
      .filter(value => value && value.toString().trim() !== '')
      .map(value => value.toString().trim());
    return [...new Set(values)].sort();
  };

  // Helper function to calculate warranty status
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
        
        // If end date is invalid, return Unknown
        if (isNaN(endDate.getTime())) {
          return 'Unknown';
        }
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
      
      if (endDate) {
        endDate.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
        
        if (endDate < today) {
          return 'Expired';
        } else {
          // Calculate days until expiry
          const timeDiff = endDate.getTime() - today.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          if (daysDiff <= 30) {
            return 'Expiring Soon';
          } else {
            return 'Active';
          }
        }
      } else {
        // If we only have end date and it's more than 30 days away, assume active
        return 'Active';
      }
    } catch (error) {
      return 'Unknown';
    }
  };

  // Apply all filters and search
  applyFilters = () => {
    const { data = [], onFilterChange } = this.props;
    const { searchTerm, warrantyStatus, selectedStatus } = this.state;

    let filteredData = [...data];

    // Apply search filter (searches across multiple fields)
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      filteredData = filteredData.filter(item => {
        const searchFields = [
          item._brand,
          item._model,
          item._serialNumber,
          item._assignedUser,
          item._location,
          item._category,
          item._assetsIdTag,
          item._notes
        ];
        
        return searchFields.some(field => 
          field && field.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply warranty status filter
    if (warrantyStatus.trim() !== '') {
      const warrantyStatusLower = warrantyStatus.toLowerCase().trim();
      filteredData = filteredData.filter(item => {
        const calculatedWarrantyStatus = this.calculateWarrantyStatus(item._warrantyStartDate, item._warrantyEndDate);
        return calculatedWarrantyStatus.toLowerCase().includes(warrantyStatusLower);
      });
    }

    // Apply status filter
    if (selectedStatus.trim() !== '') {
      const statusLower = selectedStatus.toLowerCase().trim();
      filteredData = filteredData.filter(item => 
        item._status && item._status.toString().toLowerCase().includes(statusLower)
      );
    }

    // Pass filtered data back to parent component
    if (onFilterChange) {
      onFilterChange(filteredData);
    }
  };

  // Handle search input change
  handleSearchChange = (event) => {
    this.setState({ searchTerm: event.target.value });
  };

  // Handle warranty status input change (typing only, no filtering)
  handleWarrantyStatusChange = (event) => {
    this.setState({ 
      warrantyStatusInput: event.target.value,
      showWarrantyDropdown: true // Always show dropdown when typing
    });
  };

  // Handle status input change (combobox - typing only, no filtering)
  handleStatusChange = (event) => {
    this.setState({ 
      selectedStatusInput: event.target.value,
      showStatusDropdown: true // Always show dropdown when typing
    });
  };

  // Handle filter dropdown changes
  handleFilterChange = (filterType, value) => {
    this.setState({ [filterType]: value });
  };

  // Optimized combobox selection with immediate response (applies filter)
  handleComboboxSelect = (filterType, value) => {
    const stateUpdate = {};
    
    // Update both input and filter values when selecting from dropdown
    if (filterType === 'warrantyStatus') {
      stateUpdate.warrantyStatusInput = value;
      stateUpdate.warrantyStatus = value;
      stateUpdate.showWarrantyDropdown = false;
    } else if (filterType === 'selectedStatus') {
      stateUpdate.selectedStatusInput = value;
      stateUpdate.selectedStatus = value;
      stateUpdate.showStatusDropdown = false;
    }
    
    this.setState(stateUpdate);
  };

  // Handle focus events to show dropdowns
  handleInputFocus = (dropdownType) => {
    this.setState({ [dropdownType]: true });
  };

  // Handle blur events to hide dropdowns (optimized for responsiveness)
  handleInputBlur = (dropdownType) => {
    setTimeout(() => {
      this.setState({ [dropdownType]: false });
    }, 100);
  };

  // Optimized suggestion filtering for better performance
  getFilteredSuggestions = (suggestions, currentValue) => {
    if (!currentValue || currentValue.trim() === '') return suggestions; // Show all suggestions when empty
    const searchTerm = currentValue.toLowerCase().trim();
    const filtered = suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(searchTerm)
    );
    return filtered.slice(0, 10); // Limit to 10 suggestions for performance when filtering
  };

  // Clear all filters
  clearAllFilters = () => {
    this.setState({
      searchTerm: '',
      warrantyStatusInput: '',
      selectedStatusInput: '',
      warrantyStatus: '',
      selectedStatus: '',
      showWarrantyDropdown: false,
      showStatusDropdown: false
    });
  };

  render() {
    const { data = [], isLoading = false } = this.props;
    const { 
      searchTerm, 
      warrantyStatusInput,
      selectedStatusInput,
      warrantyStatus, 
      selectedStatus,
      showWarrantyDropdown,
      showStatusDropdown
    } = this.state;

    // Get unique values for dropdowns
    const statuses = this.getUniqueValues(data, '_status');
    
    // Warranty status suggestions (removed "Unknown")
    const warrantyStatusSuggestions = ['Active', 'Expired', 'Expiring Soon'];
    
    // Get filtered suggestions for each combobox
    const filteredWarrantySuggestions = this.getFilteredSuggestions(warrantyStatusSuggestions, warrantyStatusInput);
    const filteredStatusSuggestions = this.getFilteredSuggestions(statuses, selectedStatusInput);

    // Count active filters
    const activeFilterCount = [warrantyStatus, selectedStatus].filter(filter => filter !== '').length;
    const hasSearchTerm = searchTerm.trim() !== '';

    return (
      <div className="filter-search-component">
        {/* Single Row Layout - Search and Filters */}
        <div className="single-row-container">

          {/* Warranty Status Filter */}
          <div className="filter-group-inline combobox-container">
            <div className="combobox-input-wrapper">
              <input
                type="text"
                placeholder="Warranty Status..."
                value={warrantyStatusInput}
                onChange={this.handleWarrantyStatusChange}
                onFocus={() => this.handleInputFocus('showWarrantyDropdown')}
                onBlur={() => this.handleInputBlur('showWarrantyDropdown')}
                className="filter-select-inline combobox-input"
                disabled={isLoading}
              />
              <span className="dropdown-arrow">▼</span>
            </div>
            {showWarrantyDropdown && filteredWarrantySuggestions.length > 0 && (
              <div className="combobox-dropdown">
                {filteredWarrantySuggestions.map(suggestion => (
                  <div
                    key={suggestion}
                    className="combobox-option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => this.handleComboboxSelect('warrantyStatus', suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="filter-group-inline combobox-container">
            <div className="combobox-input-wrapper">
              <input
                type="text"
                placeholder="Device Status..."
                value={selectedStatusInput}
                onChange={this.handleStatusChange}
                onFocus={() => this.handleInputFocus('showStatusDropdown')}
                onBlur={() => this.handleInputBlur('showStatusDropdown')}
                className="filter-select-inline combobox-input"
                disabled={isLoading}
              />
              <span className="dropdown-arrow">▼</span>
            </div>
            {showStatusDropdown && filteredStatusSuggestions.length > 0 && (
              <div className="combobox-dropdown">
                {filteredStatusSuggestions.map(suggestion => (
                  <div
                    key={suggestion}
                    className="combobox-option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => this.handleComboboxSelect('selectedStatus', suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="search-section-inline">
            <div className="search-input-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by brand, model, serial number, user, location, etc..."
                value={searchTerm}
                onChange={this.handleSearchChange}
                className="search-input"
                disabled={isLoading}
              />
              {searchTerm && (
                <button 
                  className="clear-search-button"
                  onClick={() => this.setState({ searchTerm: '' })}
                  disabled={isLoading}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Clear Filters Button */}
          {(activeFilterCount > 0 || hasSearchTerm) && (
            <div className="clear-filters-section-inline">
              <button 
                className="clear-filters-button-inline"
                onClick={this.clearAllFilters}
                disabled={isLoading}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default FilterSearchComponent;