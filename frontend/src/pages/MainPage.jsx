import React, { Component } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import TitleComponent from '../components/TitleComponent'
import DateTimeComponent from '../components/DateTimeComponent'
import StatisticsComponent from '../components/StatisticsComponent'
import InventoryTableComponent from '../components/InventoryTableComponent'
import FilterSearchComponent from '../components/FilterSearchComponent'
import CheckinCheckoutFormComponent from '../components/CheckinCheckoutFormComponent'
import InventoryDetailsFormComponent from '../components/InventoryDetailsFormComponent'
import CheckinCheckoutButtonComponent from '../components/CheckinCheckoutButtonComponent'
import InventoryDetailsButtonComponent from '../components/InventoryDetailsButtonComponent'
import FooterComponent from '../components/FooterComponent'

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
      activeTab: 'general' // Add active tab state
    };
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
    const wasModalOpen = prevState.showCheckinCheckoutForm || prevState.showInventoryDetailsForm;
    const isModalOpen = this.state.showCheckinCheckoutForm || this.state.showInventoryDetailsForm;
    
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
    // Only prevent if the target is not within a modal
    if (!e.target.closest('.modal-overlay') && !e.target.closest('.modal-content')) {
      e.preventDefault();
      e.stopPropagation();
    }
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
    this.setState({ showCheckinCheckoutForm: true });
  }

  // Handle IT Inventory Details Form button click (for new items)
  handleInventoryDetailsForm = () => {
    console.log('IT Inventory Details Form clicked');
    this.setState({ 
      showInventoryDetailsForm: true,
      editInventoryItem: null // Clear any existing edit item
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

  render() {
    const { appTitle, timeZone, statisticsData, inventoryData, filteredInventoryData, isLoading, lastUpdated, showCheckinCheckoutForm, showInventoryDetailsForm, editInventoryItem, activeTab } = this.state;

    // Check if any modal is open
    const isModalOpen = showCheckinCheckoutForm || showInventoryDetailsForm;

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
            />
            <InventoryTableComponent 
              data={filteredInventoryData} // Use filtered data for table
              isLoading={isLoading}
              onEditItem={this.handleEditInventoryItem} // Pass edit handler
              activeTab={activeTab}
              onTabChange={this.handleTabChange}
            />
          </div>
        </div>

        {/* Bottom Section - Action Buttons */}
        <div className="bottom-section">
          <div className="action-buttons-container">
            <div className="button-group">
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

      {/* Modal Forms */}
      <CheckinCheckoutFormComponent
        data={inventoryData}
        isVisible={showCheckinCheckoutForm}
        onClose={this.handleCloseCheckinCheckoutForm}
        onSuccess={this.handleFormSuccess}
      />
      
      <InventoryDetailsFormComponent
        isVisible={showInventoryDetailsForm}
        data={inventoryData}
        editInventoryItem={editInventoryItem}
        onClose={this.handleCloseInventoryDetailsForm}
        onSuccess={this.handleFormSuccess}
      />
    </div>
    );
  }
}

export default MainPage