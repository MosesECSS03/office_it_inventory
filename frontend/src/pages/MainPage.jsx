import React, { Component } from 'react'
import axios from 'axios'
import TitleComponent from '../components/TitleComponent'
import DateTimeComponent from '../components/DateTimeComponent'
import StatisticsComponent from '../components/StatisticsComponent'
import InventoryTableComponent from '../components/InventoryTableComponent'
import FilterSearchComponent from '../components/FilterSearchComponent'
import CheckinCheckoutFormComponent from '../components/CheckinCheckoutFormComponent'
import InventoryDetailsFormComponent from '../components/InventoryDetailsFormComponent'
import CheckinCheckoutButtonComponent from '../components/CheckinCheckoutButtonComponent'
import InventoryDetailsButtonComponent from '../components/InventoryDetailsButtonComponent'

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
      showInventoryDetailsForm: false
    };
  }

  componentDidMount() {
    // Initialize data when component mounts
    this.initializeData();
    
    // Update time every second
    this.timer = setInterval(() => {
      this.setState({
        currentDateTime: new Date()
      });
    }, 1000);
  }

  componentWillUnmount() {
    // Clean up the timers when component unmounts
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  initializeData = async () => {
    try {
      this.setState({ isLoading: true });

      // Base URL for the backend API
      const baseURL = 'http://localhost:3001';

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

  // Handle IT Inventory Details Form button click
  handleInventoryDetailsForm = () => {
    console.log('IT Inventory Details Form clicked');
    this.setState({ showInventoryDetailsForm: true });
  }

  // Handle closing Checkin/Checkout form
  handleCloseCheckinCheckoutForm = () => {
    this.setState({ showCheckinCheckoutForm: false });
  }

  // Handle closing Inventory Details form
  handleCloseInventoryDetailsForm = () => {
    this.setState({ showInventoryDetailsForm: false });
  }

  // Handle successful form submissions (refresh data)
  handleFormSuccess = () => {
    this.initializeData(); // Refresh the inventory data
  }

  render() {
    const { appTitle, timeZone, statisticsData, inventoryData, filteredInventoryData, isLoading, currentDateTime, lastUpdated, showCheckinCheckoutForm, showInventoryDetailsForm } = this.state;

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
      <footer className="app-footer">
        <div className="footer-spacer"></div>
      </footer>

      {/* Modal Forms */}
      <CheckinCheckoutFormComponent
        data={inventoryData}
        isVisible={showCheckinCheckoutForm}
        onClose={this.handleCloseCheckinCheckoutForm}
        onSuccess={this.handleFormSuccess}
      />
      
      <InventoryDetailsFormComponent
        isVisible={showInventoryDetailsForm}
        onClose={this.handleCloseInventoryDetailsForm}
        onSuccess={this.handleFormSuccess}
      />
    </div>
    );
  }
}

export default MainPage