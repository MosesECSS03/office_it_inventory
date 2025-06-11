import React, { Component } from 'react'

class InventoryDetailsButtonComponent extends Component {
  render() {
    const { onClick, disabled, isLoading } = this.props;

    return (
      <button 
        className="action-button inventory-details-btn"
        onClick={onClick}
        disabled={disabled || isLoading}
      >
        <span className="button-icon">📋</span>
        IT Inventory Details Form
      </button>
    );
  }
}

export default InventoryDetailsButtonComponent
