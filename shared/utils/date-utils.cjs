/**
 * Shared Date Utilities
 * Ensures consistent date formatting between Netlify and Lambda functions
 */

/**
 * Format date to DD-MM-YYYY format
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string in DD-MM-YYYY format
 */
export function formatDateToDDMMYYYY(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

/**
 * Parse DD-MM-YYYY date string to Date object
 * @param {string} dateString - Date string in DD-MM-YYYY format
 * @returns {Date} Date object
 */
export function parseDDMMYYYYToDate(dateString) {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
} 