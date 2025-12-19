/**
 * Format balance with USD symbol
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted string
 */
function formatWithUSD(amount) {
  // Ensure amount is a number
  const numAmount = Number(amount) || 0;
  
  // Format with 2 decimal places
  const formatted = numAmount.toFixed(2);
  
  // Add USD symbol
  return `$${formatted}`;
}

/**
 * Generate referral link
 * @param {string} botUsername - Bot username
 * @param {string} userId - User ID
 * @returns {string} - Referral link
 */
function generateReferralLink(botUsername, userId) {
  return `https://t.me/${botUsername}?start=ref_${userId}`;
}

/**
 * Truncate address for display
 * @param {string} address - Wallet address
 * @param {number} startChars - Starting characters to show
 * @param {number} endChars - Ending characters to show
 * @returns {string} - Truncated address
 */
function truncateAddress(address, startChars = 6, endChars = 4) {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Validate Twitter username
 * @param {string} username - Twitter username
 * @returns {boolean} - True if valid
 */
function isValidTwitterUsername(username) {
  const twitterRegex = /^[a-zA-Z0-9_]{1,15}$/;
  return twitterRegex.test(username);
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

module.exports = {
  formatWithUSD,
  generateReferralLink,
  truncateAddress,
  isValidTwitterUsername,
  formatDate
};