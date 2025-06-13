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
      currentDateTime: new Date(),
      lastUpdated: new Date(),
      showCheckinCheckoutForm: false,
      showInventoryDetailsForm: false,
      editInventoryItem: null // Add state for item being edited
    };
  }

  componentDidMount() {
    // Initialize data when component mounts
    this.initializeData();
      const baseURL = `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-it-inventory-backend.azurewebsites.net"}`;
    
    // Connect to socket
    this.socket = io(baseURL);

    this.socket.on('inventory-updated', (data) => {
      console.log("Socket event received", data);
      this.initializeData();
    });
  }

  componentWillUnmount() {
    // Clean up the timers when component unmounts
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    // Clean up socket connection
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  initializeData = async () => {
    try {
      this.setState({ isLoading: true });

      // Base URL for the backend API
      const baseURL = `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-it-inventory-backend.azurewebsites.net"}`;

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

  render() {
    const { appTitle, timeZone, statisticsData, inventoryData, filteredInventoryData, isLoading, currentDateTime, lastUpdated, showCheckinCheckoutForm, showInventoryDetailsForm, editInventoryItem } = this.state;

    return (
      <div className="app-container">
      <header className="app-header">
        <div className="header-spacer"></div>
        <TitleComponent 
          title={appTitle}
          isLoading={isLoading}
        />
        <DateTimeComponent 
          timeZone={timeZone}
          currentDateTime={currentDateTime}
          lastUpdated={lastUpdated}
        />
      </header>
      
      <div className="app-main">
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