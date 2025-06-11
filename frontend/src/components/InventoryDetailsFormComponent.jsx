import React, { Component } from 'react'
import axios from 'axios'

class InventoryDetailsFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: false,
      currentPage: 1,
      totalPages: 4,
      formData: {
        // Page 1 - Basic Information
        itemName: '',
        itemType: '',
        brand: '',
        model: '',
        serialNumber: '',
        
        // Page 2 - Purchase & Warranty Information
        purchaseDate: '',
        purchasePrice: '',
        warrantyExpiry: '',
        vendor: '',
        invoiceNumber: '',
        
        // Page 3 - Location & Assignment
        location: '',
        department: '',
        assignedTo: '',
        employeeId: '',
        assignmentDate: '',
        
        // Page 4 - Status & Additional Information
        status: 'available',
        condition: 'good',
        notes: '',
        accessories: '',
        maintenanceSchedule: ''
      },
      isSubmitting: false,
      errors: {},
      successMessage: ''
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.isVisible !== prevProps.isVisible) {
      this.setState({ isVisible: this.props.isVisible });
      if (this.props.isVisible) {
        // Reset form when opening
        this.resetForm();
      }
    }
  }

  resetForm = () => {
    this.setState({
      currentPage: 1,
      formData: {
        // Page 1 - Basic Information
        itemName: '',
        itemType: '',
        brand: '',
        model: '',
        serialNumber: '',
        
        // Page 2 - Purchase & Warranty Information
        purchaseDate: '',
        purchasePrice: '',
        warrantyExpiry: '',
        vendor: '',
        invoiceNumber: '',
        
        // Page 3 - Location & Assignment
        location: '',
        department: '',
        assignedTo: '',
        employeeId: '',
        assignmentDate: '',
        
        // Page 4 - Status & Additional Information
        status: 'available',
        condition: 'good',
        notes: '',
        accessories: '',
        maintenanceSchedule: ''
      },
      errors: {},
      successMessage: '',
      isSubmitting: false
    });
  }

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      },
      errors: {
        ...prevState.errors,
        [name]: '' // Clear error when user starts typing
      }
    }));
  }

  validateForm = () => {
    const { formData, currentPage } = this.state;
    const errors = {};

    // Page 1 validation
    if (currentPage === 1) {
      if (!formData.itemName.trim()) {
        errors.itemName = 'Item name is required';
      }
      if (!formData.itemType.trim()) {
        errors.itemType = 'Item type is required';
      }
      if (!formData.serialNumber.trim()) {
        errors.serialNumber = 'Serial number is required';
      }
    }
    
    // Page 2 validation
    if (currentPage === 2) {
      if (formData.purchasePrice && isNaN(formData.purchasePrice)) {
        errors.purchasePrice = 'Purchase price must be a valid number';
      }
    }
    
    // Page 3 validation
    if (currentPage === 3) {
      if (!formData.location.trim()) {
        errors.location = 'Location is required';
      }
      if (formData.assignedTo && !formData.employeeId.trim()) {
        errors.employeeId = 'Employee ID is required when item is assigned';
      }
    }

    return errors;
  }

  // Navigation methods
  nextPage = () => {
    const errors = this.validateForm();
    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }
    
    this.setState(prevState => ({
      currentPage: Math.min(prevState.currentPage + 1, prevState.totalPages),
      errors: {}
    }));
  }

  prevPage = () => {
    this.setState(prevState => ({
      currentPage: Math.max(prevState.currentPage - 1, 1),
      errors: {}
    }));
  }

  goToPage = (pageNumber) => {
    this.setState({
      currentPage: pageNumber,
      errors: {}
    });
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    
    // If not on the last page, go to next page instead of submitting
    if (this.state.currentPage < this.state.totalPages) {
      this.nextPage();
      return;
    }
    
    // Final validation for all pages
    const errors = this.validateAllPages();
    
    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }

    this.setState({ isSubmitting: true, errors: {} });

    try {
      const baseURL = 'http://localhost:3001';
      const response = await axios.post(`${baseURL}/inventory`, {
        purpose: 'create',
        data: {
          ...this.state.formData,
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString()
        }
      });

      this.setState({
        successMessage: 'Inventory item added successfully!',
        isSubmitting: false
      });

      // Refresh parent data if callback provided
      if (this.props.onSuccess) {
        this.props.onSuccess();
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        this.handleClose();
      }, 2000);

    } catch (error) {
      console.error('Error creating inventory item:', error);
      this.setState({
        errors: { submit: 'Failed to create inventory item. Please try again.' },
        isSubmitting: false
      });
    }
  }

  validateAllPages = () => {
    const { formData } = this.state;
    const errors = {};

    // Validate required fields across all pages
    if (!formData.itemName.trim()) errors.itemName = 'Item name is required';
    if (!formData.itemType.trim()) errors.itemType = 'Item type is required';
    if (!formData.serialNumber.trim()) errors.serialNumber = 'Serial number is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    
    if (formData.assignedTo && !formData.employeeId.trim()) {
      errors.employeeId = 'Employee ID is required when item is assigned';
    }

    return errors;
  }

  handleClose = () => {
    this.setState({ isVisible: false, currentPage: 1 });
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  renderPage1 = () => {
    const { formData, errors } = this.state;
    return (
      <div className="form-page">
        <h3 className="page-title">Basic Information</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="itemName">Item Name *</label>
            <input
              type="text"
              id="itemName"
              name="itemName"
              value={formData.itemName}
              onChange={this.handleInputChange}
              className={`form-control ${errors.itemName ? 'error' : ''}`}
              placeholder="Enter item name"
            />
            {errors.itemName && <span className="error-text">{errors.itemName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="itemType">Item Type *</label>
            <select
              id="itemType"
              name="itemType"
              value={formData.itemType}
              onChange={this.handleInputChange}
              className={`form-control ${errors.itemType ? 'error' : ''}`}
            >
              <option value="">Select item type</option>
              <option value="laptop">Laptop</option>
              <option value="desktop">Desktop</option>
              <option value="monitor">Monitor</option>
              <option value="printer">Printer</option>
              <option value="phone">Phone</option>
              <option value="tablet">Tablet</option>
              <option value="accessories">Accessories</option>
              <option value="other">Other</option>
            </select>
            {errors.itemType && <span className="error-text">{errors.itemType}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="brand">Brand</label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={formData.brand}
              onChange={this.handleInputChange}
              className="form-control"
              placeholder="Enter brand name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="model">Model</label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={this.handleInputChange}
              className="form-control"
              placeholder="Enter model number"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="serialNumber">Serial Number *</label>
          <input
            type="text"
            id="serialNumber"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={this.handleInputChange}
            className={`form-control ${errors.serialNumber ? 'error' : ''}`}
            placeholder="Enter serial number"
          />
          {errors.serialNumber && <span className="error-text">{errors.serialNumber}</span>}
        </div>
      </div>
    );
  }

  renderPage2 = () => {
    const { formData, errors } = this.state;
    return (
      <div className="form-page">
        <h3 className="page-title">Purchase & Warranty Information</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="purchaseDate">Purchase Date</label>
            <input
              type="date"
              id="purchaseDate"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={this.handleInputChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="purchasePrice">Purchase Price</label>
            <input
              type="number"
              id="purchasePrice"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={this.handleInputChange}
              className={`form-control ${errors.purchasePrice ? 'error' : ''}`}
              placeholder="0.00"
              step="0.01"
            />
            {errors.purchasePrice && <span className="error-text">{errors.purchasePrice}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="vendor">Vendor/Supplier</label>
            <input
              type="text"
              id="vendor"
              name="vendor"
              value={formData.vendor}
              onChange={this.handleInputChange}
              className="form-control"
              placeholder="Enter vendor name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="invoiceNumber">Invoice Number</label>
            <input
              type="text"
              id="invoiceNumber"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={this.handleInputChange}
              className="form-control"
              placeholder="Enter invoice number"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="warrantyExpiry">Warranty Expiry</label>
          <input
            type="date"
            id="warrantyExpiry"
            name="warrantyExpiry"
            value={formData.warrantyExpiry}
            onChange={this.handleInputChange}
            className="form-control"
          />
        </div>
      </div>
    );
  }

  renderPage3 = () => {
    const { formData, errors } = this.state;
    return (
      <div className="form-page">
        <h3 className="page-title">Location & Assignment</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={this.handleInputChange}
              className={`form-control ${errors.location ? 'error' : ''}`}
              placeholder="Building, Floor, Room"
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={this.handleInputChange}
              className="form-control"
              placeholder="IT, HR, Finance, etc."
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="assignedTo">Assigned To</label>
            <input
              type="text"
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={this.handleInputChange}
              className="form-control"
              placeholder="Employee name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="employeeId">Employee ID</label>
            <input
              type="text"
              id="employeeId"
              name="employeeId"
              value={formData.employeeId}
              onChange={this.handleInputChange}
              className={`form-control ${errors.employeeId ? 'error' : ''}`}
              placeholder="Employee ID"
            />
            {errors.employeeId && <span className="error-text">{errors.employeeId}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="assignmentDate">Assignment Date</label>
          <input
            type="date"
            id="assignmentDate"
            name="assignmentDate"
            value={formData.assignmentDate}
            onChange={this.handleInputChange}
            className="form-control"
          />
        </div>
      </div>
    );
  }

  renderPage4 = () => {
    const { formData } = this.state;
    return (
      <div className="form-page">
        <h3 className="page-title">Status & Additional Information</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={this.handleInputChange}
              className="form-control"
            >
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="condition">Condition</label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={this.handleInputChange}
              className="form-control"
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="accessories">Accessories</label>
          <textarea
            id="accessories"
            name="accessories"
            value={formData.accessories}
            onChange={this.handleInputChange}
            className="form-control"
            rows="3"
            placeholder="List any accessories included (charger, mouse, keyboard, etc.)"
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="maintenanceSchedule">Maintenance Schedule</label>
          <input
            type="text"
            id="maintenanceSchedule"
            name="maintenanceSchedule"
            value={formData.maintenanceSchedule}
            onChange={this.handleInputChange}
            className="form-control"
            placeholder="e.g., Quarterly, Annually"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Additional Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={this.handleInputChange}
            className="form-control"
            rows="3"
            placeholder="Any additional notes or comments"
          ></textarea>
        </div>
      </div>
    );
  }

  renderProgressBar = () => {
    const { currentPage, totalPages } = this.state;
    const progress = (currentPage / totalPages) * 100;
    
    return (
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="page-indicators">
          {[1, 2, 3, 4].map(page => (
            <button
              key={page}
              className={`page-indicator ${currentPage >= page ? 'completed' : ''} ${currentPage === page ? 'active' : ''}`}
              onClick={() => this.goToPage(page)}
              disabled={page > currentPage + 1}
            >
              {page}
            </button>
          ))}
        </div>
        <div className="page-info">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    );
  }

  render() {
    const { isVisible, currentPage, totalPages, errors, successMessage, isSubmitting } = this.state;

    if (!isVisible) return null;

    const renderCurrentPage = () => {
      switch(currentPage) {
        case 1: return this.renderPage1();
        case 2: return this.renderPage2();
        case 3: return this.renderPage3();
        case 4: return this.renderPage4();
        default: return this.renderPage1();
      }
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content inventory-details-modal">
          <div className="modal-header">
            <h2>IT Inventory Details Form</h2>
            <button className="close-button" onClick={this.handleClose}>×</button>
          </div>

          <div className="modal-body">
            {successMessage && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                {successMessage}
              </div>
            )}

            {this.renderProgressBar()}

            <form onSubmit={this.handleSubmit}>
              {renderCurrentPage()}

              {errors.submit && (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  {errors.submit}
                </div>
              )}

              <div className="form-actions">
                <div className="navigation-buttons">
                  {currentPage > 1 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={this.prevPage}
                      disabled={isSubmitting}
                    >
                      ← Previous
                    </button>
                  )}
                </div>

                <div className="action-buttons">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={this.handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting 
                      ? 'Saving...' 
                      : currentPage === totalPages 
                        ? 'Save Inventory Item' 
                        : 'Next →'
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default InventoryDetailsFormComponent
