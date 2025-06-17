import React, { Component } from 'react';
import '../css/DateTimeComponent.css';

class DateTimeComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: new Date()
    };
  }

  componentDidMount() {
    // Update the time every second
    this.timer = setInterval(() => {
      this.setState({
        currentTime: new Date()
      });
    }, 1000);
  }

  componentWillUnmount() {
    // Clean up the timer when component unmounts
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

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
    const { lastUpdated } = this.props;
    const { currentTime } = this.state;
    
    return (
      <div className="datetime-component">
        <div className="datetime-display">
          {lastUpdated && (
            <div className="last-updated">
              <strong>Current Time:</strong> {this.formatDateTime(currentTime)}
            </div>
          )}
        </div>
      </div>
    );
  }
}


export default DateTimeComponent;
