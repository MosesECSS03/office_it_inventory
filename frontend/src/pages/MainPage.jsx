import React, { Component } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import ExcelJS from 'exceljs'
import TitleComponent from '../components/TitleComponent'
import DateTimeComponent from '../components/DateTimeComponent'
import StatisticsComponent from '../components/StatisticsComponent'
import InventoryTableComponent from '../components/InventoryTableComponent'
import FilterSearchComponent from '../components/FilterSearchComponent'
import CheckinCheckoutButtonComponent from '../components/CheckinCheckoutButtonComponent'
import InventoryDetailsButtonComponent from '../components/InventoryDetailsButtonComponent'
import CheckinCheckoutFormComponent from '../components/CheckinCheckoutFormComponent'
import InventoryDetailsFormComponent from '../components/InventoryDetailsFormComponent'
import FooterComponent from '../components/FooterComponent'
import '../css/CheckinCheckoutFormComponent.css'
import '../css/EquipmentInventoryForm.css'
import '../css/ModalComponents.css'
import '../css/TableComponent.css'
import '../css/StatisticsBreakdownModal.css'
import '../css/TabNavigationComponent.css'

const baseURL = `${window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:3001" 
  : "https://ecss-it-inventory-backend.azurewebsites.net"}`;

class MainPage extends Component {
    constructor(props) {
    super(props);
    this.state = {
      appTitle: 'Office IT Inventory System',
      timeZone: 'local',
      statisticsData: [],
      inventoryData: [],
      filteredInventoryData: [], // Add filtered data state
      isLoading: true,
      lastDataUpdate: null,
      lastUpdated: new Date(),
      showCheckinCheckoutForm: false,
      showInventoryDetailsForm: false,
      editInventoryItem: null, // Add state for item being edited
      activeTab: 'general', // Add active tab state
      
      // Checkin/Checkout Form State
      checkinFormState: {
        activeTab: 'new', // 'new' or 'existing'
        currentPage: 1,
        totalPages: 2,
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
        isSubmitting: false,
        errors: {},
        successMessage: '',
        employeeFormObjectId: null,
        searchDropdowns: {},
        searchSuggestions: {},
        employees: [],
        showEmployeeDropdown: false,
        employeeSearchTerm: ''
      },
      
      // Inventory Details Form State
      inventoryFormState: {
        activeTab: 'new', // 'new' or 'existing'
        sampleFormTab: 1 // For sample form tab navigation (1-6)
      },
      
      // Statistics Modal State
      statisticsModalState: {
        showBreakdownModal: false,
        activeTab: 'status', // Main tab: 'status' (only one main tab now)
        activeSubTab: 'summary', // Sub-tabs: 'summary', 'user', 'status-type'
        modalData: null,
        expandedCards: {} // Track which cards are expanded
      },
      
      // Export Modal State
      exportModalState: {
        showExportModal: false
      }
    };
    
    // Timeout for debouncing inventory fetch
    this.fetchInventoryTimeout = null;
  }

  // Helper method to create default table rows for checkin/checkout form
  createDefaultRows = (count) => {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      itemDescription: '',
      brand: '',
      model: '',
      serialNumber: '',
      assetTag: '',
      condition: 'Good',
      notes: ''
    }));
  }

  componentDidMount() {
    // Initialize data when component mounts
    this.initializeData();
    
    // Connect to socket
    this.socket = io(baseURL);

    this.socket.on('inventory-updated', (data) => {
      console.log("Socket event received", data);
      this.initializeData();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // Check if modal state changed
    const wasModalOpen = prevState.showCheckinCheckoutForm || prevState.showInventoryDetailsForm || prevState.statisticsModalState.showBreakdownModal || prevState.exportModalState.showExportModal;
    const isModalOpen = this.state.showCheckinCheckoutForm || this.state.showInventoryDetailsForm || this.state.statisticsModalState.showBreakdownModal || this.state.exportModalState.showExportModal;
    
    if (wasModalOpen !== isModalOpen) {
      if (isModalOpen) {
        // Add class to body to prevent scrolling
        document.body.classList.add('modal-open');
        // Prevent wheel events (scrolling with mouse wheel)
        document.addEventListener('wheel', this.preventScroll, { passive: false });
        // Prevent keyboard scrolling
        document.addEventListener('keydown', this.preventKeyboardScroll);
        // Prevent touch events on mobile
        document.addEventListener('touchmove', this.preventScroll, { passive: false });
      } else {
        // Remove class from body to restore scrolling
        document.body.classList.remove('modal-open');
        // Remove event listeners
        document.removeEventListener('wheel', this.preventScroll);
        document.removeEventListener('keydown', this.preventKeyboardScroll);
        document.removeEventListener('touchmove', this.preventScroll);
      }
    }
  }

  // Prevent scroll events
  preventScroll = (e) => {
    // Allow scrolling if the target is within a modal content area or breakdown content
    if (e.target.closest('.modal-overlay') || e.target.closest('.modal-content') || e.target.closest('.stats-breakdown-content')) {
      return; // Allow scrolling
    }
    e.preventDefault();
    e.stopPropagation();
  }

  // Prevent keyboard scrolling (arrow keys, page up/down, space, etc.)
  preventKeyboardScroll = (e) => {
    const scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40]; // space, page up/down, end, home, arrow keys
    // Only prevent if the target is not within a modal and not an input/textarea
    if (!e.target.closest('.modal-overlay') && !e.target.closest('.modal-content') && 
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      if (scrollKeys.includes(e.keyCode)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  componentWillUnmount() {
    // Clean up socket connection
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Clean up body class and event listeners
    document.body.classList.remove('modal-open');
    document.removeEventListener('wheel', this.preventScroll);
    document.removeEventListener('keydown', this.preventKeyboardScroll);
    document.removeEventListener('touchmove', this.preventScroll);
  }

  initializeData = async () => {
    try {
      this.setState({ isLoading: true });
      // Make parallel requests to get both inventory data and statistics
      const inventoryResponse = await axios.post(`${baseURL}/inventory`, {
          purpose: "retrieve",
        });

      console.log('Inventory data response:', inventoryResponse.data.data);
      console.log('Number of items fetched:', inventoryResponse.data.data?.length || 0);
      if (inventoryResponse.data.data && inventoryResponse.data.data.length > 0) {
        console.log('Sample item structure:', inventoryResponse.data.data[0]);
      }

      // Update state with the fetched data
      this.setState({
        inventoryData: inventoryResponse.data.data || [],
        filteredInventoryData: inventoryResponse.data.data || [], // Initialize filtered data
        isLoading: false,
        lastDataUpdate: new Date(),
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      this.setState({ 
        isLoading: false,
        inventoryData: [],
        filteredInventoryData: [], // Reset filtered data on error
        statisticsData: []
      });
    }
  }

  // Handle filter changes from FilterSearchComponent
  handleFilterChange = (filteredData) => {
    this.setState({
      filteredInventoryData: filteredData
    });
  }

  // Handle IT Inventory Checkin/Checkout Form button click
  handleCheckinCheckoutForm = () => {
    console.log('IT Inventory Checkin/Checkout Form clicked');
    console.log('Current state before:', this.state.showCheckinCheckoutForm);
    this.setState({ showCheckinCheckoutForm: true }, () => {
      console.log('State updated, showCheckinCheckoutForm:', this.state.showCheckinCheckoutForm);
    });
  }

  // Handle IT Inventory Details Form button click (for new items)
  handleInventoryDetailsForm = () => {
    console.log('IT Inventory Details Form clicked');
    console.log('Current state before:', this.state.showInventoryDetailsForm);
    this.setState({ 
      showInventoryDetailsForm: true,
      editInventoryItem: null // Clear any existing edit item
    }, () => {
      console.log('State updated, showInventoryDetailsForm:', this.state.showInventoryDetailsForm);
    });
  }

  // Handle editing an existing inventory item
  handleEditInventoryItem = (item) => {
    console.log('Edit inventory item clicked:', item);
    this.setState({ 
      showInventoryDetailsForm: true,
      editInventoryItem: item
    });
  }

  // Handle closing Checkin/Checkout form
  handleCloseCheckinCheckoutForm = () => {
    this.setState({ showCheckinCheckoutForm: false });
  }

  // Handle closing Inventory Details form
  handleCloseInventoryDetailsForm = () => {
    this.setState({ 
      showInventoryDetailsForm: false,
      editInventoryItem: null // Clear edit item when closing
    });
  }

  // Handle successful form submissions (auto-refresh enabled for inventory changes)
  handleFormSuccess = () => {
    console.log('Form submitted successfully - refreshing inventory data');
    this.initializeData(); // Refresh the data when inventory is updated
  }

  // Handle tab change
  handleTabChange = (tabName) => {
    this.setState({ activeTab: tabName });
    console.log(`Active tab changed to: ${tabName}`);
    // Add any additional logic for tab switching here
  }

  // Checkin/Checkout Form Methods
  handleCheckinFormTabChange = (tab) => {
    this.setState(prevState => ({
      checkinFormState: {
        ...prevState.checkinFormState,
        activeTab: tab,
        currentPage: 1 // Reset to first page when changing tabs
      }
    }));
  }

  handleCheckinFormPageChange = (page) => {
    this.setState(prevState => ({
      checkinFormState: {
        ...prevState.checkinFormState,
        currentPage: page
      }
    }));
  }

  handleCheckinEmployeeChange = (field, value) => {
    this.setState(prevState => ({
      checkinFormState: {
        ...prevState.checkinFormState,
        employeeDetails: {
          ...prevState.checkinFormState.employeeDetails,
          [field]: value
        }
      }
    }));
  }

  handleCheckinTableRowChange = (rowIndex, field, value) => {
    this.setState(prevState => {
      const updatedRows = [...prevState.checkinFormState.tableRows];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        [field]: value
      };
      return {
        checkinFormState: {
          ...prevState.checkinFormState,
          tableRows: updatedRows
        }
      };
    });
  }

  handleCheckinFormSubmit = async () => {
    this.setState(prevState => ({
      checkinFormState: {
        ...prevState.checkinFormState,
        isSubmitting: true,
        errors: {}
      }
    }));

    try {
      // Submit form logic here
      console.log('Submitting checkin/checkout form');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.setState(prevState => ({
        checkinFormState: {
          ...prevState.checkinFormState,
          isSubmitting: false,
          successMessage: 'Form submitted successfully!'
        },
        showCheckinCheckoutForm: false
      }));
      
      this.handleFormSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
      this.setState(prevState => ({
        checkinFormState: {
          ...prevState.checkinFormState,
          isSubmitting: false,
          errors: { submit: 'Failed to submit form. Please try again.' }
        }
      }));
    }
  }

  // Inventory Details Form Methods
  handleInventoryFormTabChange = (tab) => {
    this.setState(prevState => ({
      inventoryFormState: {
        ...prevState.inventoryFormState,
        activeTab: tab
      }
    }));
  }

  handleInventoryFormSampleTabChange = (tabNumber) => {
    this.setState(prevState => ({
      inventoryFormState: {
        ...prevState.inventoryFormState,
        sampleFormTab: tabNumber
      }
    }));
  }

  handleInventoryFormDataChange = (field, value) => {
    this.setState(prevState => ({
      inventoryFormState: {
        ...prevState.inventoryFormState,
        formData: {
          ...prevState.inventoryFormState.formData,
          [field]: value
        }
      }
    }));
  }

  handleInventorySpecificationChange = (field, value) => {
    this.setState(prevState => ({
      inventoryFormState: {
        ...prevState.inventoryFormState,
        formData: {
          ...prevState.inventoryFormState.formData,
          specifications: {
            ...prevState.inventoryFormState.formData.specifications,
            [field]: value
          }
        }
      }
    }));
  }

  handleInventoryFormSubmit = async () => {
    this.setState(prevState => ({
      inventoryFormState: {
        ...prevState.inventoryFormState,
        isSubmitting: true,
        errors: {}
      }
    }));

    try {
      // Submit form logic here
      console.log('Submitting inventory details form');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.setState(prevState => ({
        inventoryFormState: {
          ...prevState.inventoryFormState,
          isSubmitting: false,
          successMessage: 'Form submitted successfully!'
        },
        showInventoryDetailsForm: false
      }));
      
      this.handleFormSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
      this.setState(prevState => ({
        inventoryFormState: {
          ...prevState.inventoryFormState,
          isSubmitting: false,
          errors: { submit: 'Failed to submit form. Please try again.' }
        }
      }));
    }
  }

  // Statistics Modal Methods
  handleOpenStatisticsModal = (tab = 'status', subTab = 'summary') => {
    const modalData = this.generateBreakdownData(this.state.filteredInventoryData);
    this.setState(prevState => ({
      statisticsModalState: {
        ...prevState.statisticsModalState,
        showBreakdownModal: true,
        activeTab: tab,
        activeSubTab: subTab,
        modalData
      }
    }));
  }

  handleCloseStatisticsModal = () => {
    this.setState(prevState => ({
      statisticsModalState: {
        ...prevState.statisticsModalState,
        showBreakdownModal: false,
        modalData: null
      }
    }));
  }

  handleStatisticsTabChange = (tab) => {
    this.setState(prevState => ({
      statisticsModalState: {
        ...prevState.statisticsModalState,
        activeTab: tab
      }
    }));
  }

  handleStatisticsSubTabChange = (subTab) => {
    this.setState(prevState => ({
      statisticsModalState: {
        ...prevState.statisticsModalState,
        activeSubTab: subTab
      }
    }));
  }

  toggleStatisticsCardExpansion = (cardId) => {
    this.setState(prevState => ({
      statisticsModalState: {
        ...prevState.statisticsModalState,
        expandedCards: {
          ...prevState.statisticsModalState.expandedCards,
          [cardId]: !prevState.statisticsModalState.expandedCards[cardId]
        }
      }
    }));
  }

  // Export Modal Methods
  handleOpenExportModal = () => {
    this.setState(prevState => ({
      exportModalState: {
        ...prevState.exportModalState,
        showExportModal: true
      }
    }));
  }

  handleCloseExportModal = () => {
    this.setState(prevState => ({
      exportModalState: {
        ...prevState.exportModalState,
        showExportModal: false
      }
    }));
  }

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
      // Get data for each tab using the same method as InventoryTableComponent
      const data = this.getExportDataForTab(tab.id);
      
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
    this.setState(prevState => ({
      exportModalState: {
        ...prevState.exportModalState,
        showExportModal: false
      }
    }));
  }

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

    // Get data for current tab
    const data = this.getExportDataForTab(activeTab);
    
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
    this.setState(prevState => ({
      exportModalState: {
        ...prevState.exportModalState,
        showExportModal: false
      }
    }));
  }

  // Export helper methods
  getExportDataForTab = (tabId) => {
    const { filteredInventoryData } = this.state;
    
    if (!filteredInventoryData || filteredInventoryData.length === 0) {
      return [['No data available']];
    }

    // Define headers based on the data structure
    const headers = [
      'ID', 'Category', 'Brand', 'Model', 'Serial Number', 'Asset Tag',
      'User', 'Location', 'Status', 'Purchase Date', 'Warranty End Date',
      'Purchase Price', 'Notes'
    ];

    // Filter data based on tab - this logic should match what InventoryTableComponent does
    let filteredData = filteredInventoryData;
    
    // Apply tab-specific filtering if needed
    switch(tabId) {
      case 'general':
        // General tab shows all data
        break;
      case 'finance':
        // Finance tab might show only items with purchase info
        filteredData = filteredInventoryData.filter(item => 
          item._purchasePrice || item._purchaseDate
        );
        break;
      case 'admin':
        // Admin tab might show administrative fields
        break;
      case 'it':
        // IT tab might show only IT equipment
        filteredData = filteredInventoryData.filter(item => 
          item._category && ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Phone', 'Tablet'].includes(item._category)
        );
        break;
      default:
        break;
    }

    // Convert data to array format
    const rows = [headers];
    filteredData.forEach(item => {
      rows.push([
        item._id || '',
        item._category || '',
        item._brand || '',
        item._model || '',
        item._serialNumber || '',
        item._assetTag || '',
        item._user || item._assignedUser || '',
        item._location || '',
        item._status || '',
        item._purchaseDate || '',
        item._warrantyEndDate || '',
        item._purchasePrice || '',
        item._notes || ''
      ]);
    });

    return rows;
  }

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
  }

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
  }

  // Render Checkin/Checkout Form
  renderCheckinCheckoutForm = () => {
    const { checkinFormState, inventoryData } = this.state;
    
    return (
      <CheckinCheckoutFormComponent
        isVisible={true}
        data={inventoryData}
        onClose={this.handleCloseCheckinCheckoutForm}
        onSuccess={this.handleFormSuccess}
        // Pass form state as props
        initialState={checkinFormState}
      />
    );
  }

  // Render Inventory Details Form
  renderInventoryDetailsForm = () => {
    const { inventoryFormState, inventoryData, editInventoryItem } = this.state;
    
    return (
      <InventoryDetailsFormComponent
        isVisible={true}
        data={inventoryData}
        editItem={editInventoryItem}
        onClose={this.handleCloseInventoryDetailsForm}
        onSuccess={this.handleFormSuccess}
        // Pass form state as props
        initialState={inventoryFormState}
      />
    );
  }

  // Render Statistics Breakdown Modal
  renderStatisticsBreakdownModal = () => {
    const { statisticsModalState } = this.state;
    const { showBreakdownModal, activeTab, activeSubTab, modalData, expandedCards } = statisticsModalState;
    
    if (!showBreakdownModal || !modalData) return null;

    // Get current data based on active tab
    const currentData = modalData[activeTab] || modalData.status;
    
    if (!currentData) {
      return (
        <div className="stats-modal-overlay" onClick={this.handleCloseStatisticsModal}>
          <div className="stats-modal-content scrollable-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stats-modal-header">
              <h2 className="stats-modal-title">
                <span className="stats-modal-icon">📊</span>
                Detailed Breakdown
              </h2>
              <button 
                className="stats-modal-close"
                onClick={this.handleCloseStatisticsModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="stats-modal-body scrollable-content">
              <p>No data available</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="stats-modal-overlay" onClick={this.handleCloseStatisticsModal}>
        <div className="stats-modal-content scrollable-modal" onClick={(e) => e.stopPropagation()}>
          <div className="stats-modal-header">
            <h2 className="stats-modal-title">
              <span className="stats-modal-icon">📊</span>
              Detailed Breakdown
            </h2>
            <button 
              className="stats-modal-close"
              onClick={this.handleCloseStatisticsModal}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <div className="stats-modal-body">
            {/* Main Tab Navigation - Only Item Status now */}
            <div className="stats-tab-navigation">
              <button
                className={`stats-tab-button ${activeTab === 'status' ? 'active' : ''}`}
                onClick={() => this.handleStatisticsTabChange('status')}
              >
                <span className="stats-tab-icon">📊</span>
                Item Status Breakdown
              </button>
            </div>

            {/* Sub Tab Navigation - Always show for the status tab */}
            <div className="stats-sub-tab-navigation">
              <button
                className={`stats-sub-tab-button ${activeSubTab === 'summary' ? 'active' : ''}`}
                onClick={() => this.handleStatisticsSubTabChange('summary')}
              >
                <span className="stats-sub-tab-icon">📈</span>
                Summary Overview
              </button>
              <button
                className={`stats-sub-tab-button ${activeSubTab === 'user' ? 'active' : ''}`}
                onClick={() => this.handleStatisticsSubTabChange('user')}
              >
                <span className="stats-sub-tab-icon">👤</span>
                By User/Assignee
              </button>
              <button
                className={`stats-sub-tab-button ${activeSubTab === 'status-type' ? 'active' : ''}`}
                onClick={() => this.handleStatisticsSubTabChange('status-type')}
              >
                <span className="stats-sub-tab-icon">⚡</span>
                By Status Type
              </button>
            </div>

            {/* Breakdown Content */}
            <div className="stats-breakdown-content">
              {/* Summary Overview Sub-Tab */}
              {activeSubTab === 'summary' && (
                <div className="breakdown-section">
                  <h3 className="breakdown-section-title">
                    <span className="breakdown-section-icon">📈</span>
                    Summary Overview
                  </h3>
                  <div className="breakdown-grid">
                    {Object.entries(currentData.categoriesWithItems || currentData.categories).map(([category, data]) => {
                      const cardId = `${activeTab}-${activeSubTab}-${category}`;
                      const isExpanded = expandedCards[cardId];
                      
                      // Handle both old and new data structures
                      const count = data.count || data;
                      const items = data.items || [];
                      
                      return (
                        <div key={category} className="breakdown-card detailed-breakdown-card">
                          <div className="breakdown-card-header">
                            <h4 className="breakdown-card-title">
                              <span className="breakdown-card-icon">
                                {this.getCategoryIcon(category, 'status')}
                              </span>
                              {category}
                            </h4>
                            {items.length > 0 && (
                              <button
                                className="expand-button"
                                onClick={() => this.toggleStatisticsCardExpansion(cardId)}
                                title={isExpanded ? 'Collapse details' : 'Expand details'}
                              >
                                {isExpanded ? '▼' : '▶'}
                              </button>
                            )}
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
                          {isExpanded && items.length > 0 && (
                            <div className="breakdown-card-expanded">
                              <div className="expanded-items-list">
                                <h5>{category} items: ({items.length} items)</h5>
                                <div className="expanded-items">
                                  {items.map((item, index) => (
                                    <div key={index} className="expanded-item">
                                      <div className="item-details">
                                        <span className="item-name">
                                          {(item._category || 'No Category')} - {(item._brand || 'No Brand')} {(item._model || '')}
                                        </span>
                                        <span className="item-serial">
                                          S/N: {item._serialNumber || 'No Serial Number'}
                                        </span>
                                        <span className="item-location">
                                          Location: {item._location || 'No Location'}
                                        </span>
                                        <span className={`item-status status-${(item._status || 'unknown').toLowerCase().replace(' ', '-')}`}>
                                          Status: {item._status || 'Unknown'}
                                        </span>
                                        <span className="item-asset-tag">
                                          Asset Tag: {item._assetsIdTag || 'No Asset Tag'}
                                        </span>
                                        {item._assignedUser && (
                                          <span className="item-user">
                                            Assigned to: {item._assignedUser}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* User and Status-Type Sub-Tabs */}
              {(activeSubTab === 'user' || activeSubTab === 'status-type') && currentData.details && (
                <div className="breakdown-section">
                  <h3 className="breakdown-section-title">
                    <span className="breakdown-section-icon">
                      {activeSubTab === 'user' ? '👤' : '⚡'}
                    </span>
                    {activeSubTab === 'user' ? 'By User/Assignee' : 'By Status Type'}
                  </h3>
                  <div className="breakdown-grid">
                    {activeSubTab === 'status-type' 
                      ? Object.entries(currentData.categoriesWithItems || currentData.categories)
                          .map(([category, data]) => {
                            const cardId = `${activeTab}-${activeSubTab}-${category}`;
                            const isExpanded = expandedCards[cardId];
                            
                            // Handle both old and new data structures
                            const count = data.count || data;
                            const items = data.items || [];
                            
                            return (
                              <div key={category} className="breakdown-card detailed-breakdown-card">
                                <div className="breakdown-card-header">
                                  <h4 className="breakdown-card-title">
                                    <span className="breakdown-card-icon">⚡</span>
                                    {category}
                                  </h4>
                                  {items.length > 0 && (
                                    <button
                                      className="expand-button"
                                      onClick={() => this.toggleStatisticsCardExpansion(cardId)}
                                      title={isExpanded ? 'Collapse details' : 'Expand details'}
                                    >
                                      {isExpanded ? '▼' : '▶'}
                                    </button>
                                  )}
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
                                {isExpanded && items.length > 0 && (
                                  <div className="breakdown-card-expanded">
                                    <div className="expanded-items-list">
                                      <h5>Items with {category} status: ({items.length} items)</h5>
                                      <div className="expanded-items">
                                        {items.map((item, index) => (
                                          <div key={index} className="expanded-item">
                                            <div className="item-details">
                                              <span className="item-name">
                                                {(item._category || 'No Category')} - {(item._brand || 'No Brand')} {(item._model || '')}
                                              </span>
                                              <span className="item-serial">
                                                S/N: {item._serialNumber || 'No Serial Number'}
                                              </span>
                                              <span className="item-location">
                                                Location: {item._location || 'No Location'}
                                              </span>
                                              <span className={`item-status status-${(item._status || 'unknown').toLowerCase().replace(' ', '-')}`}>
                                                Status: {item._status || 'Unknown'}
                                              </span>
                                              <span className="item-asset-tag">
                                                Asset Tag: {item._assetsIdTag || 'No Asset Tag'}
                                              </span>
                                              {(item._assignedUser || item._user) && (
                                                <span className="item-user">
                                                  Assigned to: {item._assignedUser || item._user}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                      : Object.entries(currentData.details[activeSubTab === 'user' ? 'user' : 'status'].data)
                          .sort(([a], [b]) => {
                            // For user tab, put "Unassigned" first, then alphabetical
                            if (activeSubTab === 'user') {
                              if (a === 'Unassigned') return -1;
                              if (b === 'Unassigned') return 1;
                            }
                            return a.localeCompare(b);
                          })
                          .map(([category, data]) => {
                      const cardId = `${activeTab}-${activeSubTab}-${category}`;
                      const isExpanded = expandedCards[cardId];
                      
                      // Handle different data structures
                      let totalCount, items = [];
                      
                      if (activeSubTab === 'user' && data.items) {
                        // User tab with items array
                        totalCount = data.items.length;
                        items = data.items;
                      } else if (activeSubTab === 'status-type' && data.items) {
                        // Status type tab with items array
                        totalCount = data.items.length;
                        items = data.items;
                      } else {
                        // Fallback for old data structure
                        totalCount = Object.values(data).reduce((sum, count) => sum + count, 0);
                      }
                      
                      return (
                        <div key={category} className="breakdown-card detailed-breakdown-card">
                          <div className="breakdown-card-header">
                            <h4 className="breakdown-card-title">
                              <span className="breakdown-card-icon">
                                {activeSubTab === 'user' ? '👤' : '⚡'}
                              </span>
                              {category}
                            </h4>
                            {items.length > 0 && (
                              <button
                                className="expand-button"
                                onClick={() => this.toggleStatisticsCardExpansion(cardId)}
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
                              <span className="breakdown-detail-label">Percentage</span>
                              <span className="breakdown-detail-value">
                                {this.calculatePercentage(totalCount, currentData.categories)}%
                              </span>
                            </div>
                          </div>
                          {isExpanded && items.length > 0 && (
                            <div className="breakdown-card-expanded">
                              <div className="expanded-items-list">
                                <h5>
                                  {activeSubTab === 'user' 
                                    ? `Items assigned to ${category}: (${items.length} items)`
                                    : `Items with ${category} status: (${items.length} items)`
                                  }
                                </h5>
                                <div className="expanded-items">
                                  {items.map((item, index) => (
                                    <div key={index} className="expanded-item">
                                      <div className="item-details">
                                        <span className="item-name">
                                          {(item._category || 'No Category')} - {(item._brand || 'No Brand')} {(item._model || '')}
                                        </span>
                                        <span className="item-serial">
                                          S/N: {item._serialNumber || 'No Serial Number'}
                                        </span>
                                        <span className="item-location">
                                          Location: {item._location || 'No Location'}
                                        </span>
                                        <span className={`item-status status-${(item._status || 'unknown').toLowerCase().replace(' ', '-')}`}>
                                          Status: {item._status || 'Unknown'}
                                        </span>
                                        <span className="item-asset-tag">
                                          Asset Tag: {item._assetsIdTag || 'No Asset Tag'}
                                        </span>
                                        {activeSubTab === 'status-type' && (item._assignedUser || item._user) && (
                                          <span className="item-user">
                                            Assigned to: {item._assignedUser || item._user}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {isExpanded && items.length === 0 && (
                            <div className="breakdown-card-expanded">
                              <div className="expanded-items-list">
                                <h5>
                                  {activeSubTab === 'user' 
                                    ? `Items assigned to ${category}:`
                                    : `Items with ${category} status:`
                                  }
                                </h5>
                                <div className="no-items-message">
                                  <p>
                                    {activeSubTab === 'user' 
                                      ? 'No items are currently assigned to this user.'
                                      : 'No items currently have this status.'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper methods for statistics modal
  calculatePercentage = (value, categories) => {
    const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  getCategoryIcon = (category, type) => {
    // Return appropriate icons based on category and type
    const statusIcons = {
      'Working': '✅',
      'Not Working': '❌', 
      'Pending': '⏳',
      'Spoilt': '🔧',
      'Available': '📦',
      'Checked Out': '📤',
      'Maintenance': '🔧',
      'Unknown': '❓'
    };
    
    return statusIcons[category] || '📊';
  }

  generateBreakdownData = (inventoryData) => {
    if (!inventoryData || inventoryData.length === 0) {
      return {
        status: {
          categories: {},
          details: {
            user: { icon: '👤', title: 'By User/Assignee', data: {} },
            status: { icon: '⚡', title: 'By Status Type', data: {} }
          }
        }
      };
    }

    // Generate status breakdown
    const statusBreakdown = {};
    const statusBreakdownWithItems = {};
    const userBreakdown = {};
    const statusTypeBreakdown = {};

    inventoryData.forEach(item => {
      const status = (item._status || 'Unknown').toString().trim();
      const user = item._assignedUser || item._user || 'Unassigned';
      
      // Debug: Log status values to see duplicates
      if (status.toLowerCase().includes('working')) {
        console.log('Status found:', `"${status}"`, 'Item:', item);
      }
      
      // Count by status
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      
      // Status breakdown with items for expandable cards
      if (!statusBreakdownWithItems[status]) {
        statusBreakdownWithItems[status] = {
          items: [],
          count: 0
        };
      }
      statusBreakdownWithItems[status].items.push(item);
      statusBreakdownWithItems[status].count += 1;
      
      // Count by user
      if (!userBreakdown[user]) {
        userBreakdown[user] = {
          items: [],
          statusCounts: {}
        };
      }
      userBreakdown[user].items.push(item);
      userBreakdown[user].statusCounts[status] = (userBreakdown[user].statusCounts[status] || 0) + 1;
      
      // Count by location for status type breakdown
      const location = item._location || 'Unknown Location';
      if (!statusTypeBreakdown[status]) {
        statusTypeBreakdown[status] = {
          items: [],
          locationCounts: {}
        };
      }
      statusTypeBreakdown[status].items.push(item);
      statusTypeBreakdown[status].locationCounts[location] = (statusTypeBreakdown[status].locationCounts[location] || 0) + 1;
    });

    // Debug: Log final breakdown data
    console.log('Final statusBreakdown:', statusBreakdown);
    console.log('Final statusBreakdownWithItems:', statusBreakdownWithItems);

    return {
      status: {
        categories: statusBreakdown,
        categoriesWithItems: statusBreakdownWithItems,
        details: {
          user: {
            icon: '👤',
            title: 'By User/Assignee',
            data: userBreakdown
          },
          status: {
            icon: '⚡',
            title: 'By Status Type',
            data: statusTypeBreakdown
          }
        }
      }
    };
  }

  // Render Export Modal
  renderExportModal = () => {
    const { activeTab } = this.state;
    
    const tabs = [
      { id: 'general', label: 'General', icon: '📋' },
      { id: 'finance', label: 'Finance', icon: '💰' },
      { id: 'admin', label: 'Admin', icon: '⚙️' },
      { id: 'it', label: 'IT', icon: '💻' }
    ];

    return (
      <div className="export-modal-overlay" onClick={this.handleCloseExportModal}>
        <div className="export-modal scrollable-modal" onClick={(e) => e.stopPropagation()}>
          <div className="export-modal-header">
            <h3>Export Options</h3>
            <button className="export-modal-close" onClick={this.handleCloseExportModal}>
              ×
            </button>
          </div>
          <div className="export-modal-content scrollable-content">
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
    );
  }

  render() {
    const { appTitle, timeZone, statisticsData, inventoryData, filteredInventoryData, isLoading, lastUpdated, showCheckinCheckoutForm, showInventoryDetailsForm, editInventoryItem, activeTab, statisticsModalState, exportModalState } = this.state;

    // Check if any modal is open
    const isModalOpen = showCheckinCheckoutForm || showInventoryDetailsForm || statisticsModalState.showBreakdownModal || exportModalState.showExportModal;

    return (
      <div className={`app-container ${isModalOpen ? 'modal-open' : ''}`}>
      <header className="app-header">
        <TitleComponent 
            title={appTitle}
            isLoading={isLoading}
          />
        <div className="header-spacer"></div>
        <DateTimeComponent 
          lastUpdated={lastUpdated}
        />
      </header>
      
      <div className="app-main">
        {/* Modal blocking overlay */}
        {isModalOpen && <div className="modal-blocking-overlay" />}
        
        {/* Top Section - Search and Filter */}
        <div className="top-section">
          <FilterSearchComponent
            data={inventoryData}
            onFilterChange={this.handleFilterChange}
            isLoading={isLoading}
          />
        </div>
        
        {/* Middle Section - Statistics and Table */}
        <div className="middle-section">
          <div className="placeholder-content">
            <StatisticsComponent 
              data={filteredInventoryData} // Use filtered data for statistics
              isLoading={isLoading}
              onOpenBreakdownModal={this.handleOpenStatisticsModal}
            />
            <InventoryTableComponent 
              data={filteredInventoryData} // Use filtered data for table
              isLoading={isLoading}
              onEditItem={this.handleEditInventoryItem} // Pass edit handler
              activeTab={activeTab}
              onTabChange={this.handleTabChange}
              onExportData={this.getExportDataForTab}
              onOpenExportModal={this.handleOpenExportModal}
            />
          </div>
        </div>

        {/* Bottom Section - Action Buttons */}
        <div className="bottom-section">
          <div className="action-buttons-container">
            <div className="button-group">
              {/* Hidden buttons - keeping handlers for potential future use */} 
              <CheckinCheckoutButtonComponent
                onClick={this.handleCheckinCheckoutForm}
                disabled={isLoading}
                isLoading={isLoading}
              />
              <InventoryDetailsButtonComponent
                onClick={this.handleInventoryDetailsForm}
                disabled={isLoading}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
      <FooterComponent />

      {/* Inline Modal Forms */}
      {showCheckinCheckoutForm && this.renderCheckinCheckoutForm()}
      {showInventoryDetailsForm && this.renderInventoryDetailsForm()}
      {statisticsModalState.showBreakdownModal && this.renderStatisticsBreakdownModal()}
      {exportModalState.showExportModal && this.renderExportModal()}
    </div>
    );
  }
}

export default MainPage