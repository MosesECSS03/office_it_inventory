import React, { Component } from 'react'
import '../css/ActionButtonsComponent.css'

class InventoryDetailsButtonComponent extends Component {
  handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!this.props.disabled && !this.props.isLoading && this.props.onClick) {
      this.props.onClick();
    }
  };

  render() {
    const { disabled, isLoading } = this.props;

    return (
      <button 
        className="action-button inventory-details-btn"
        onClick={this.handleClick}
        disabled={disabled || isLoading}
        style={{
          pointerEvents: (disabled || isLoading) ? 'none' : 'auto',
          userSelect: 'none'
        }}
      >
        <span className="button-icon">📋</span>
        IT Inventory Details Form
      </button>
    );
  }
}

export default InventoryDetailsButtonComponent
