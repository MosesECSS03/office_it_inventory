import React, { Component } from 'react';

class DateTimeComponent extends Component {
  formatDateTime = (date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = dayNames[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${dayOfWeek}, ${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  formatLastUpdatedDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatLastUpdatedTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  render() {
    const { 
      timeZone = 'local', 
      lastDataUpdate = null, 
      currentDateTime = new Date(), 
      lastUpdated = new Date() 
    } = this.props;
    
    return (
      <div className="datetime-component">
        <div className="datetime-display">
          <div className="last-updated-label">Last updated on:</div>
          {this.formatDateTime(currentDateTime)}
        </div>
      </div>
    );
  }
}

export default DateTimeComponent;
