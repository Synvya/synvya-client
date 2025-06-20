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
 * Calculate valid-through date based on plan type
 * @param {string} planType - 'monthly' or 'annual'
 * @returns {string} Valid-through date in DD-MM-YYYY format
 */
export function calculateValidThroughDate(planType) {
    const currentDate = new Date();
    let validThroughDate;

    if (planType === 'monthly') {
        // Add one month
        validThroughDate = new Date(currentDate);
        validThroughDate.setMonth(validThroughDate.getMonth() + 1);
    } else {
        // Add one year (for annual or default)
        validThroughDate = new Date(currentDate);
        validThroughDate.setFullYear(validThroughDate.getFullYear() + 1);
    }

    return formatDateToDDMMYYYY(validThroughDate);
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

/**
 * Check if a date string in DD-MM-YYYY format is still valid (future date)
 * @param {string} dateString - Date string in DD-MM-YYYY format
 * @returns {boolean} True if date is in the future
 */
export function isDateValid(dateString) {
    const targetDate = parseDDMMYYYYToDate(dateString);
    const currentDate = new Date();

    // Set time to end of day for target date to be inclusive
    targetDate.setHours(23, 59, 59, 999);

    return currentDate <= targetDate;
}

/**
 * Calculate days remaining until a date
 * @param {string} dateString - Date string in DD-MM-YYYY format
 * @returns {number} Days remaining (0 if expired)
 */
export function calculateDaysRemaining(dateString) {
    const targetDate = parseDDMMYYYYToDate(dateString);
    const currentDate = new Date();

    // Set time to end of day for target date to be inclusive
    targetDate.setHours(23, 59, 59, 999);

    if (currentDate > targetDate) {
        return 0;
    }

    return Math.ceil((targetDate - currentDate) / (1000 * 60 * 60 * 24));
} 