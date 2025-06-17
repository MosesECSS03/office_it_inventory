import React, { Component } from 'react';
import '../css/TabNavigationComponent.css';

class TabNavigationComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: props.activeTab || 'general'
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

  // Export handling functions - now just call parent handlers
  handleExportClick = () => {
    if (this.props.onOpenExportModal) {
      this.props.onOpenExportModal();
    }
  };

  render() {
    const { activeTab } = this.state;
    
    const tabs = [
      { id: 'general', label: 'General', icon: '📋' },
      { id: 'finance', label: 'Finance', icon: '💰' },
      { id: 'admin', label: 'Admin', icon: '⚙️' },
      { id: 'it', label: 'IT', icon: '💻' }
    ];

    return (
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
    );
  }
}

export default TabNavigationComponent;
