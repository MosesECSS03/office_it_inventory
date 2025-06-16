import React, { Component } from 'react';
import ExcelJS from 'exceljs';
import './TabNavigationComponent.css';

class TabNavigationComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: props.activeTab || 'general',
      showExportModal: false
    };
  }

  componentDidUpdate(prevProps) {
    // Update state if prop changes
    if (prevProps.activeTab !== this.props.activeTab) {
      this.setState({ activeTab: this.props.activeTab });
    }
  }

  // Tab handling function
  handleTabChange = (tabName) => {
    this.setState({ activeTab: tabName });
    console.log(`Switched to ${tabName} tab`);
    
    // Call parent component's callback if provided
    if (this.props.onTabChange) {
      this.props.onTabChange(tabName);
    }
  };

  // Export handling functions
  handleExportClick = () => {
    this.setState({ showExportModal: true });
  };

  handleCloseModal = () => {
    this.setState({ showExportModal: false });
  };

  handleExportAll = async () => {
    const tabs = [
      { id: 'general', label: 'General', icon: '📋' },
      { id: 'finance', label: 'Finance', icon: '💰' },
      { id: 'admin', label: 'Admin', icon: '⚙️' },
      { id: 'it', label: 'IT', icon: '💻' }
    ];

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();

    tabs.forEach(tab => {
      // Get data for each tab from parent component
      const data = this.props.onExportData ? this.props.onExportData(tab.id) : [['No data available']];
      
      // Add worksheet with tab label as sheet name
      const worksheet = workbook.addWorksheet(tab.label);
      
      // Add data to worksheet
      worksheet.addRows(data);
      
      // Apply formatting
      this.formatWorksheetWithStyles(worksheet, data);
    });

    // Create filename with current date
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateString = `${day}/${month}/${year}`;

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    this.downloadFile(buffer, `${dateString} IT Inventory Table - All Sheets.xlsx`);
    this.setState({ showExportModal: false });
  };

  handleExportCurrent = async () => {
    const { activeTab } = this.state;
    const tabs = [
      { id: 'general', label: 'General', icon: '📋' },
      { id: 'finance', label: 'Finance', icon: '💰' },
      { id: 'admin', label: 'Admin', icon: '⚙️' },
      { id: 'it', label: 'IT', icon: '💻' }
    ];

    const currentTab = tabs.find(tab => tab.id === activeTab);
    
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();

    // Get data for current tab from parent component
    const data = this.props.onExportData ? this.props.onExportData(activeTab) : [['No data available']];
    
    // Add worksheet with current tab label as sheet name
    const worksheet = workbook.addWorksheet(currentTab.label);
    
    // Add data to worksheet
    worksheet.addRows(data);
    
    // Apply formatting
    this.formatWorksheetWithStyles(worksheet, data);

    // Create filename with current date
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateString = `${day}/${month}/${year}`;
    
    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    this.downloadFile(buffer, `${dateString} IT Inventory Table - ${currentTab.label}.xlsx`);
    this.setState({ showExportModal: false });
  };

  // Format worksheet with advanced styling using ExcelJS
  formatWorksheetWithStyles = (worksheet, data) => {
    if (!data || data.length === 0) return;

    // Auto-size columns based on content
    worksheet.columns.forEach((column, index) => {
      let maxLength = 10; // Minimum width
      data.forEach(row => {
        if (row[index] && row[index].toString().length > maxLength) {
          maxLength = Math.min(row[index].toString().length + 2, 50); // Cap at 50
        }
      });
      column.width = maxLength;
    });

    // Style header row (first row)
    if (data.length > 0) {
      const headerRow = worksheet.getRow(1);
      headerRow.height = 25; // Set header row height
      
      headerRow.eachCell((cell, colNumber) => {
        cell.font = {
          bold: true,
          color: { argb: 'FF000000' } // Black text
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF87CEEB' } // Sky blue background
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }

    // Style data rows
    for (let rowIndex = 2; rowIndex <= data.length; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      row.height = 20; // Set data row height
      
      row.eachCell((cell, colNumber) => {
        // Style existing cells
        cell.alignment = {
          horizontal: 'left',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // If cell is empty, set black background
        if (!cell.value || cell.value === '') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF000000' } // Black background for empty cells
          };
        }
      });
    }

    // Add borders to all cells in the data range
    const dataRange = `A1:${String.fromCharCode(64 + data[0].length)}${data.length}`;
    worksheet.getCell(dataRange);
  };

  // Helper method to download file
  downloadFile = (buffer, filename) => {
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  render() {
    const { activeTab, showExportModal } = this.state;
    
    const tabs = [
      { id: 'general', label: 'General', icon: '📋' },
      { id: 'finance', label: 'Finance', icon: '💰' },
      { id: 'admin', label: 'Admin', icon: '⚙️' },
      { id: 'it', label: 'IT', icon: '💻' }
    ];

    return (
      <>
        <div className="tab-navigation">
          <div className="tab-navigation-row">
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
            
            {/* Export Button */}
            <button
              className="export-button"
              onClick={this.handleExportClick}
              title="Export to Excel"
            >
              <div className="export-button-logo">📊</div>
              <div className="export-button-label">Export</div>
            </button>
          </div>
        </div>

        {/* Export Modal - Outside the main navigation */}
        {showExportModal && (
          <div className="export-modal-overlay" onClick={this.handleCloseModal}>
            <div className="export-modal" onClick={(e) => e.stopPropagation()}>
              <div className="export-modal-header">
                <h3>Export Options</h3>
                <button className="export-modal-close" onClick={this.handleCloseModal}>
                  ×
                </button>
              </div>
              <div className="export-modal-content">
                <p>Choose what you would like to export:</p>
                <div className="export-options">
                  <button 
                    className="export-option-button export-all"
                    onClick={this.handleExportAll}
                  >
                    <span className="export-option-icon">📋</span>
                    <div>
                      <strong>Export All Tables</strong>
                      <p>Export all 4 tables in separate sheets</p>
                    </div>
                  </button>
                  <button 
                    className="export-option-button export-current"
                    onClick={this.handleExportCurrent}
                  >
                    <span className="export-option-icon">📄</span>
                    <div>
                      <strong>Export Current Table</strong>
                      <p>Export only the {tabs.find(tab => tab.id === activeTab)?.label} table</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default TabNavigationComponent;
