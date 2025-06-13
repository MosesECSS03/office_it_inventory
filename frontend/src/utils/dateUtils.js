// Date utility functions for consistent date handling
// Handles conversion between different date formats

/**
 * Convert any date format to DD/MM/YYYY format for display
 * @param {string|Date} dateInput - Date in any format
 * @returns {string} Date in DD/MM/YYYY format or empty string if invalid
 */
export const formatDateForDisplay = (dateInput) => {
  if (!dateInput || dateInput === '' || dateInput === null || dateInput === undefined) {
    return '';
  }

  try {
    let date;
    
    // If it's already a Date object
    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      const dateStr = String(dateInput).trim();
      
      // Handle YYYY-MM-DD format (from database)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } 
      // Handle DD/MM/YYYY format (already correct)
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        return dateStr; // Already in correct format
      }
      // Handle other formats
      else {
        date = new Date(dateStr);
      }
    }

    // Validate the date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided:', dateInput);
      return '';
    }

    // Format as DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date for display:', dateInput, error);
    return '';
  }
};

/**
 * Convert DD/MM/YYYY format to YYYY-MM-DD format for HTML date inputs
 * @param {string} dateInput - Date in DD/MM/YYYY format
 * @returns {string} Date in YYYY-MM-DD format or empty string if invalid
 */
export const formatDateForInput = (dateInput) => {
  if (!dateInput || dateInput === '' || dateInput === null || dateInput === undefined) {
    return '';
  }

  try {
    const dateStr = String(dateInput).trim();
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Handle DD/MM/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('/');
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }

    // Handle DD-MMM-YY format (like "15-May-25")
    if (/^\d{1,2}-[A-Za-z]{3}-\d{2}$/.test(dateStr)) {
      const parts = dateStr.split('-');
      const day = parts[0].padStart(2, '0');
      const monthName = parts[1];
      let year = parts[2];
      
      // Convert 2-digit year to 4-digit
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      year = currentCentury + parseInt(year);
      
      // If the resulting year is more than 50 years in the future, assume previous century
      if (year > currentYear + 50) {
        year -= 100;
      }
      
      const monthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      
      const month = monthMap[monthName] || '01';
      return `${year}-${month}-${day}`;
    }

    // Try generic date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    console.warn('Could not parse date for input:', dateInput);
    return '';
  } catch (error) {
    console.error('Error formatting date for input:', dateInput, error);
    return '';
  }
};

/**
 * Convert date to database format (YYYY-MM-DD)
 * @param {string|Date} dateInput - Date in any format
 * @returns {string} Date in YYYY-MM-DD format or empty string if invalid
 */
export const formatDateForDatabase = (dateInput) => {
  return formatDateForInput(dateInput); // Same format
};

/**
 * Get current date in DD/MM/YYYY format
 * @returns {string} Current date in DD/MM/YYYY format
 */
export const getCurrentDateForDisplay = () => {
  return formatDateForDisplay(new Date());
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date in YYYY-MM-DD format
 */
export const getCurrentDateForInput = () => {
  return formatDateForInput(new Date());
};

/**
 * Validate if a date string is in DD/MM/YYYY format
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid DD/MM/YYYY format
 */
export const isValidDDMMYYYY = (dateStr) => {
  if (!dateStr) return false;
  
  const ddmmyyyyRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  if (!ddmmyyyyRegex.test(dateStr)) return false;
  
  const parts = dateStr.split('/');
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  
  // Basic validation
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Create date and check if it's valid
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
};

export default {
  formatDateForDisplay,
  formatDateForInput,
  formatDateForDatabase,
  getCurrentDateForDisplay,
  getCurrentDateForInput,
  isValidDDMMYYYY
};
