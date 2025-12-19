/**
 * Validate USDT (BEP20) address
 * @param {string} address - The address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidBEP20Address(address) {
  try {
    if (!address || typeof address !== 'string') return false;
    
    const trimmedAddress = address.trim();
    
    // Check if starts with 0x
    if (!trimmedAddress.startsWith('0x')) return false;
    
    // Check length (0x + 40 hex characters)
    if (trimmedAddress.length !== 42) return false;
    
    // Check if valid hex string (case insensitive)
    const hexRegex = /^0x[0-9a-fA-F]{40}$/;
    if (!hexRegex.test(trimmedAddress)) return false;
    
    // Optional: Check address checksum (EIP-55)
    // This ensures proper capitalization for checksummed addresses
    if (isChecksumAddress(trimmedAddress)) {
      return true;
    }
    
    // Also accept all lowercase or all uppercase addresses
    if (trimmedAddress === trimmedAddress.toLowerCase() || 
        trimmedAddress === trimmedAddress.toUpperCase()) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Address validation error:', error);
    return false;
  }
}

/**
 * Check if address is EIP-55 checksummed
 * @param {string} address - The address to check
 * @returns {boolean}
 */
function isChecksumAddress(address) {
  // Check address is valid
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) return false;
  
  // Check it's not all lowercase or all uppercase
  const addr = address.replace(/^0x/i, '');
  const addressHash = keccak256(addr.toLowerCase());
  
  for (let i = 0; i < 40; i++) {
    // The nth letter should be uppercase if the nth bit of the hash is 1
    if ((parseInt(addressHash[i], 16) > 7 && addr[i].toUpperCase() !== addr[i]) ||
        (parseInt(addressHash[i], 16) <= 7 && addr[i].toLowerCase() !== addr[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Simple keccak256 implementation (you can replace with actual library)
 * For production, use: const { keccak256 } = require('js-sha3');
 */
function keccak256(data) {
  // This is a simplified version - in production use a proper library
  // For example: npm install js-sha3
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash;
}

module.exports = { isValidBEP20Address };