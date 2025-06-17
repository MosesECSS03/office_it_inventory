import React, { Component } from 'react';
import '../css/TitleComponent.css';

class TitleComponent extends Component {
  render() {
    const { title = 'Office IT Inventory System', isLoading = false } = this.props;
    
    return (
      <div className="title-component">
        <h1>
          {title}
          {isLoading && <span style={{ fontSize: '0.5em', marginLeft: '10px' }}>⏳</span>}
        </h1>
      </div>
    );
  }
}

export default TitleComponent;
