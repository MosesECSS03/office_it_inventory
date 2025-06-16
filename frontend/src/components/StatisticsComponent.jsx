import React, { Component } from 'react';
import './StatisticsBreakdownModal.css';

class StatisticsComponent extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      showBreakdownModal: false,
      activeTab: 'status', // 'status' or 'warranty'
      activeSubTab: 'user', // 'user' or 'location'
      modalData: null,
      expandedCards: {} // Track which cards are expanded
    };
  }
  
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

  // Method to open breakdown modal
  openBreakdownModal = (tab = 'status') => {
    const { data = [] } = this.props;
    const modalData = this.generateBreakdownData(data);
    this.setState({
      showBreakdownModal: true,
      activeTab: tab,
      modalData
    });
  };

  // Method to close breakdown modal
  closeBreakdownModal = () => {
    this.setState({
      showBreakdownModal: false,
      modalData: null
    });
  };

  // Method to switch tabs in modal
  switchTab = (tab) => {
    this.setState({ activeTab: tab });
  };

  // Method to switch sub-tabs in modal
  switchSubTab = (subTab) => {
    this.setState({ activeSubTab: subTab });
  };

  // Generate detailed breakdown data
  generateBreakdownData = (inventoryData) => {
    if (!inventoryData || inventoryData.length === 0) {
      return {
        status: { categories: {}, details: [] },
        warranty: { categories: {}, details: [] }
      };
    }

    // Status breakdown
    const statusBreakdown = {
      categories: {},
      details: []
    };

    // Warranty breakdown
    const warrantyBreakdown = {
      categories: {},
      details: []
    };

    // Group by categories for detailed breakdown
    const userCategories = {};
    const statusCategories = {}; // New: breakdown by status types

    inventoryData.forEach(item => {
      const status = item._status?.trim() || 'Unknown';
      const user = item._user?.trim() || item._assignedUser?.trim() || 'Unassigned';
      const location = item._location?.trim() || user; // Use user if location is unknown
      const warrantyStatus = this.calculateWarrantyStatus(item._warrantyStartDate, item._warrantyEndDate);

      // Status categories (summary)
      statusBreakdown.categories[status] = (statusBreakdown.categories[status] || 0) + 1;

      // User categories for status
      if (!userCategories[user]) userCategories[user] = { items: [], statusCounts: {} };
      userCategories[user].statusCounts[status] = (userCategories[user].statusCounts[status] || 0) + 1;
      userCategories[user].items.push(item);

      // Status categories breakdown (by status type)
      if (!statusCategories[status]) statusCategories[status] = [];
      statusCategories[status].push({
        user: user,
        location: location,
        item: item
      });

      // Warranty categories (only for valid warranty items)
      if (warrantyStatus !== 'Unknown') {
        warrantyBreakdown.categories[warrantyStatus] = (warrantyBreakdown.categories[warrantyStatus] || 0) + 1;
      }
    });

    // Create detailed breakdown arrays for STATUS
    statusBreakdown.details = [
      {
        title: 'By User/Assignee',
        icon: '👤',
        data: userCategories
      },
      {
        title: 'By Status Type',
        icon: '📊',
        data: this.processStatusTypeBreakdown(statusCategories)
      }
    ];

    // Create detailed breakdown arrays for WARRANTY (no sub-tabs)
    warrantyBreakdown.details = [];

    return {
      status: statusBreakdown,
      warranty: warrantyBreakdown
    };
  };

  // Process status type breakdown for better display
  processStatusTypeBreakdown = (statusCategories) => {
    const processed = {};
    
    Object.entries(statusCategories).forEach(([status, items]) => {
      // Group by location within each status
      const locationCounts = {};
      items.forEach(item => {
        const location = item.location;
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      });
      
      processed[status] = locationCounts;
    });
    
    return processed;
  };

  // Render breakdown modal
  renderBreakdownModal = () => {
    const { showBreakdownModal, activeTab, activeSubTab, modalData } = this.state;
    
    if (!showBreakdownModal || !modalData) return null;

    const currentData = modalData[activeTab];

    return (
      <div className="stats-modal-overlay" onClick={this.closeBreakdownModal}>
        <div className="stats-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="stats-modal-header">
            <h2 className="stats-modal-title">
              <span className="stats-modal-icon">📊</span>
              Detailed Breakdown
            </h2>
            <button 
              className="stats-modal-close"
              onClick={this.closeBreakdownModal}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <div className="stats-modal-body">
            {/* Main Tab Navigation */}
            <div className="stats-tab-navigation">
              <button
                className={`stats-tab-button ${activeTab === 'status' ? 'active' : ''}`}
                onClick={() => this.switchTab('status')}
              >
                <span className="stats-tab-icon">⚡</span>
                Item Status
              </button>
              <button
                className={`stats-tab-button ${activeTab === 'warranty' ? 'active' : ''}`}
                onClick={() => this.switchTab('warranty')}
              >
                <span className="stats-tab-icon">🛡️</span>
                Warranty Status
              </button>
            </div>

            {/* Sub Tab Navigation */}
            {activeTab === 'status' && (
              <div className="stats-sub-tab-navigation">
                <button
                  className={`stats-sub-tab-button ${activeSubTab === 'user' ? 'active' : ''}`}
                  onClick={() => this.switchSubTab('user')}
                >
                  <span className="stats-sub-tab-icon">👤</span>
                  By User/Assignee
                </button>
                <button
                  className={`stats-sub-tab-button ${activeSubTab === 'status' ? 'active' : ''}`}
                  onClick={() => this.switchSubTab('status')}
                >
                  <span className="stats-sub-tab-icon">📊</span>
                  By Status Type
                </button>
              </div>
            )}

            {/* Breakdown Content */}
            <div className="stats-breakdown-content">
              {/* Summary Cards */}
              <div className="breakdown-section">
                <h3 className="breakdown-section-title">
                  <span className="breakdown-section-icon">📈</span>
                  Summary Overview
                </h3>
                <div className="breakdown-grid">
                  {Object.entries(currentData.categories).map(([category, count]) => (
                    <div key={category} className="breakdown-card">
                      <div className="breakdown-card-header">
                        <h4 className="breakdown-card-title">
                          <span className="breakdown-card-icon">
                            {this.getCategoryIcon(category, activeTab)}
                          </span>
                          {category}
                        </h4>
                      </div>
                      <div className="breakdown-card-value">
                        {count.toLocaleString()}
                      </div>
                      <div className="breakdown-card-details">
                        <div className="breakdown-detail-item">
                          <span className="breakdown-detail-label">Percentage</span>
                          <span className="breakdown-detail-value">
                            {this.calculatePercentage(count, currentData.categories)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Sub-Tab Content */}
              {activeTab === 'status' ? (
                this.renderCurrentSubTabContent(currentData, activeSubTab)
              ) : (
                // For warranty tab, show only summary cards (no sub-tab content)
                <div className="breakdown-section">
                  <div className="breakdown-empty-state">
                    <div className="breakdown-empty-icon">🛡️</div>
                    <div className="breakdown-empty-message">Warranty Summary</div>
                    <div className="breakdown-empty-description">
                      Detailed breakdown by individual items coming soon
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render current sub-tab content
  renderCurrentSubTabContent = (currentData, activeSubTab) => {
    const { activeTab } = this.state;
    
    // For status tab, show different content based on sub-tab
    const detailIndex = activeSubTab === 'user' ? 0 : 1;
    const detail = currentData.details[detailIndex];
    
    if (!detail || Object.keys(detail.data).length === 0) {
      return (
        <div className="breakdown-section">
          <h3 className="breakdown-section-title">
            <span className="breakdown-section-icon">{detail?.icon || '📦'}</span>
            {detail?.title || (activeSubTab === 'user' ? 'By User/Assignee' : 'By Status Type')}
          </h3>
          <div className="breakdown-empty-state">
            <div className="breakdown-empty-icon">📦</div>
            <div className="breakdown-empty-message">No data available</div>
            <div className="breakdown-empty-description">
              No items found for this category
            </div>
          </div>
        </div>
      );
    }

    return this.renderDetailSection(detail, activeTab, activeSubTab);
  };

  // Helper method to render detail section
  renderDetailSection = (detail, activeTab, activeSubTab) => {
    const { expandedCards } = this.state;
    
    return (
      <div className="breakdown-section">
        <h3 className="breakdown-section-title">
          <span className="breakdown-section-icon">{detail.icon}</span>
          {detail.title}
        </h3>
        <div className="breakdown-grid">
          {Object.entries(detail.data).map(([category, data]) => {
            const cardId = `${activeTab}-${activeSubTab}-${category}`;
            const isExpanded = expandedCards[cardId];
            
            // Handle different data structures
            let totalCount, statusCounts, items;
            
            if (activeSubTab === 'user' && data.items) {
              // User tab with items array
              totalCount = data.items.length;
              statusCounts = data.statusCounts;
              items = data.items;
            } else {
              // Status type tab with location counts
              totalCount = Object.values(data).reduce((sum, count) => sum + count, 0);
              statusCounts = data;
              items = [];
            }
            
            return (
              <div key={category} className="breakdown-card detailed-breakdown-card">
                <div className="breakdown-card-header">
                  <h4 className="breakdown-card-title">
                    <span className="breakdown-card-icon">
                      {detail.icon}
                    </span>
                    {category}
                  </h4>
                  {activeSubTab === 'user' && items.length > 0 && (
                    <button
                      className="expand-button"
                      onClick={() => this.toggleCardExpansion(cardId)}
                      title={isExpanded ? 'Collapse details' : 'Expand details'}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  )}
                </div>
                <div className="breakdown-card-value">
                  {totalCount.toLocaleString()}
                </div>
                <div className="breakdown-card-details">
                  <div className="breakdown-detail-item">
                    <span className="breakdown-detail-label">Total Items</span>
                    <span className="breakdown-detail-value">
                      {totalCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="breakdown-status-tags">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <span 
                        key={status} 
                        className="breakdown-status-tag"
                        style={{ 
                          backgroundColor: this.getStatusColor(status, activeTab)
                        }}
                      >
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                  
                  {/* Expandable content for user cards */}
                  {isExpanded && activeSubTab === 'user' && items.length > 0 && (
                    <div className="expanded-content">
                      <div className="expanded-header">
                        <span className="expanded-title">Asset Details</span>
                      </div>
                      <div className="asset-list">
                        {items.map((item, index) => (
                          <div key={index} className="asset-item">
                            <div className="asset-main-info">
                              <span className="asset-id">#{item._id || 'N/A'}</span>
                              <span className="asset-brand">{item._brand || 'Unknown Brand'}</span>
                              <span className="asset-model">{item._model || 'Unknown Model'}</span>
                            </div>
                            <div className="asset-secondary-info">
                              <span className="asset-category">{item._category || 'Unknown Category'}</span>
                              <span 
                                className="asset-status"
                                style={{ 
                                  backgroundColor: this.getStatusColor(item._status, activeTab),
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {item._status || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Toggle card expansion
  toggleCardExpansion = (cardId) => {
    this.setState(prevState => ({
      expandedCards: {
        ...prevState.expandedCards,
        [cardId]: !prevState.expandedCards[cardId]
      }
    }));
  };

  // Helper methods
  getCategoryIcon = (category, tab) => {
    if (tab === 'status') {
      switch (category) {
        case 'Working': return '✅';
        case 'Not Working': return '❌';
        case 'Pending': return '⏳';
        case 'Spolit': return '🔧';
        default: return '❓';
      }
    } else {
      switch (category) {
        case 'Active': return '🛡️';
        case 'Expired': return '⚠️';
        case 'Expiring Soon': return '⏰';
        case 'Not Started': return '🕐';
        default: return '❓';
      }
    }
  };

  getStatusColor = (status, tab) => {
    if (tab === 'status') {
      switch (status) {
        case 'Working': return '#27ae60';
        case 'Not Working': return '#e74c3c';
        case 'Pending': return '#f39c12';
        case 'Spolit': return '#8e44ad';
        default: return '#7f8c8d';
      }
    } else {
      switch (status) {
        case 'Active': return '#27ae60';
        case 'Expired': return '#e74c3c';
        case 'Expiring Soon': return '#f39c12';
        case 'Not Started': return '#3498db';
        default: return '#7f8c8d';
      }
    }
  };

  calculatePercentage = (value, categories) => {
    const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
    return total > 0 ? ((value / total) * 100).toFixed(1) : 0;
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
              <button 
                className="breakdown-button"
                onClick={() => this.openBreakdownModal('status')}
                title="View detailed breakdown"
              >
                📊 Details
              </button>
            </div>
            <div className="stats-grid">
              {stats.status?.map((stat, index) => (
                <div 
                  key={index} 
                  className="stat-card clickable-stat-card"
                  onClick={() => this.openBreakdownModal('status')}
                  title="Click for detailed breakdown"
                >
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
              <button 
                className="breakdown-button"
                onClick={() => this.openBreakdownModal('warranty')}
                title="View detailed breakdown"
              >
                📊 Details
              </button>
            </div>
            <div className="stats-grid">
              {stats.warranty?.map((stat, index) => (
                <div 
                  key={index} 
                  className="stat-card clickable-stat-card"
                  onClick={() => this.openBreakdownModal('warranty')}
                  title="Click for detailed breakdown"
                >
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

        {/* Render Breakdown Modal */}
        {this.renderBreakdownModal()}
      </>
    );
  }
}

export default StatisticsComponent;
