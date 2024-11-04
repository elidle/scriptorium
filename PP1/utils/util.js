export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

/**
 * Validate phone number format.
 * @param {string} phoneNumber - The phone number to validate.
 * @returns {boolean} - Returns true if the phone number is valid, otherwise false.
 */
export function isValidPhoneNumber(phoneNumber) {
  // Regular expression for validating phone numbers
  const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/; // Adjust regex as needed for your requirements

  return phoneRegex.test(phoneNumber);
}
