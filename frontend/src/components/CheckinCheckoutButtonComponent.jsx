import React, { Component } from 'react'
import '../css/ActionButtonsComponent.css'

class CheckinCheckoutButtonComponent extends Component {
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
        className="action-button checkin-checkout-btn"
        onClick={this.handleClick}
        disabled={disabled || isLoading}
        style={{
          pointerEvents: (disabled || isLoading) ? 'none' : 'auto',
          userSelect: 'none'
        }}
      >
        <span className="button-icon">🔄</span>
        IT Inventory Checkin/Checkout Form
      </button>
    );
  }
}

export default CheckinCheckoutButtonComponent
