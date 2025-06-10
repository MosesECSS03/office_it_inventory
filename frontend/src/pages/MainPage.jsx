import React, { Component } from 'react'
import axios from 'axios'
import TitleComponent from '../components/TitleComponent'
import DateTimeComponent from '../components/DateTimeComponent'
import StatisticsComponent from '../components/StatisticsComponent'
import InventoryTableComponent from '../components/InventoryTableComponent'
import FilterSearchComponent from '../components/FilterSearchComponent'

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
      lastUpdated: new Date()
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

  render() {
    const { appTitle, timeZone, statisticsData, inventoryData, filteredInventoryData, isLoading, currentDateTime, lastUpdated } = this.state;

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

        {/* Bottom Section - Placeholder */}
        <div className="bottom-section">
          <div className="placeholder-content">
            <h3>Bottom Section</h3>
            <p>This section is available for future components</p>
          </div>
        </div>
      </div>
      <footer className="app-footer">
        <div className="footer-spacer"></div>
      </footer>
    </div>
    );
  }
}

export default MainPage