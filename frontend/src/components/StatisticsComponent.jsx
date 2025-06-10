import React, { Component } from 'react';

class StatisticsComponent extends Component {
  
  // Helper function to calculate warranty status for an item
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

  // Helper function to calculate statistics from inventory data
  calculateStats = (inventoryData) => {
    if (!inventoryData || inventoryData.length === 0) {
      return {
        status: [
          { label: 'Total Items', value: '0', icon: '📦' },
          { label: 'Working Items', value: '0', icon: '✅' },
          { label: 'Not Working', value: '0', icon: '❌' },
          { label: 'Pending', value: '0', icon: '⏳' },
          { label: 'Spoilt Items', value: '0', icon: '🔧' }
        ],
        warranty: [
          { label: 'Total Items', value: '0', icon: '📦' },
          { label: 'Active Warranty', value: '0', icon: '🛡️' },
          { label: 'Expired Warranty', value: '0', icon: '⚠️' },
          { label: 'Expiring Soon', value: '0', icon: '⏰' }
        ]
      };
    }

    const totalItems = inventoryData.length;
    
    // Count items by status
    const statusCounts = inventoryData.reduce((acc, item) => {
      const status = item._status?.trim() || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Count items by warranty status (excluding Unknown)
    const warrantyCounts = inventoryData.reduce((acc, item) => {
      const warrantyStatus = this.calculateWarrantyStatus(item._warrantyStartDate, item._warrantyEndDate);
      // Only count items with valid warranty status (not Unknown)
      if (warrantyStatus !== 'Unknown') {
        acc[warrantyStatus] = (acc[warrantyStatus] || 0) + 1;
      }
      return acc;
    }, {});

    // Calculate total items with warranty information (only valid warranty items)
    const warrantyTotalItems = (warrantyCounts['Active'] || 0) + (warrantyCounts['Expired'] || 0) + (warrantyCounts['Expiring Soon'] || 0);

    return {
      status: [
        { 
          label: 'Total Items', 
          value: totalItems.toLocaleString(), 
          icon: '📦' 
        },
        { 
          label: 'Working Items', 
          value: (statusCounts['Working'] || 0).toLocaleString(), 
          icon: '✅' 
        },
        { 
          label: 'Not Working', 
          value: (statusCounts['Not Working'] || 0).toLocaleString(), 
          icon: '❌' 
        },
        { 
          label: 'Pending', 
          value: (statusCounts['Pending'] || 0).toLocaleString(), 
          icon: '⏳' 
        },
        { 
          label: 'Spoilt Items', 
          value: (statusCounts['Spolit'] || 0).toLocaleString(), 
          icon: '🔧' 
        }
      ],
      warranty: [
        { 
          label: 'Total Items', 
          value: warrantyTotalItems.toLocaleString(), 
          icon: '📦' 
        },
        { 
          label: 'Active Warranty', 
          value: (warrantyCounts['Active'] || 0).toLocaleString(), 
          icon: '🛡️' 
        },
        { 
          label: 'Expired Warranty', 
          value: (warrantyCounts['Expired'] || 0).toLocaleString(), 
          icon: '⚠️' 
        },
        { 
          label: 'Expiring Soon', 
          value: (warrantyCounts['Expiring Soon'] || 0).toLocaleString(), 
          icon: '⏰' 
        }
      ]
    };
  };

  render() {
    const { 
      data = [], 
      isLoading = false, 
      lastUpdate = null 
    } = this.props;

    const stats = this.calculateStats(data);

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
        
        {/* Horizontal Two-Section Layout */}
        <div className="stats-horizontal-layout">
          {/* Status Section */}
          <div className="stats-section">
            <div className="stats-section-header">
              <span className="section-icon">⚡</span>
              <h3>Item Status</h3>
            </div>
            <div className="stats-grid">
              {stats.status?.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-content">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warranty Section */}
          <div className="stats-section">
            <div className="stats-section-header">
              <span className="section-icon">🛡️</span>
              <h3>Warranty Status</h3>
            </div>
            <div className="stats-grid">
              {stats.warranty?.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-content">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default StatisticsComponent;
