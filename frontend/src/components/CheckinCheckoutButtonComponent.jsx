import React, { Component } from 'react'

class CheckinCheckoutButtonComponent extends Component {
  render() {
    const { onClick, disabled, isLoading } = this.props;

    return (
      <button 
        className="action-button checkin-checkout-btn"
        onClick={onClick}
        disabled={disabled || isLoading}
      >
        <span className="button-icon">🔄</span>
        IT Inventory Checkin/Checkout Form
      </button>
    );
  }
}

export default CheckinCheckoutButtonComponent
