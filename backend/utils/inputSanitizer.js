/**
 * Input sanitization and validation utilities
 * Protects against regex injection, invalid types, and malformed queries
 */

/**
 * Escapes special regex characters in user input
 * Prevents regex injection attacks
 * @param {string} input - Raw user input
 * @returns {string} - Escaped input safe for use in RegExp
 */
const escapeRegex = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/[.+*?^${}()|[\]\\-]/g, '\\$&');
};

/**
 * Validates and sanitizes search query
 * @param {string} search - Search query from user
 * @param {number} maxLength - Maximum allowed length (default 100)
 * @returns {object} - { valid: boolean, value: string, error: string }
 */
const validateSearch = (search, maxLength = 100) => {
  if (!search) {
    return { valid: true, value: null, error: null };
  }

  const trimmed = String(search).trim();

  if (trimmed.length === 0) {
    return { valid: true, value: null, error: null };
  }

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      value: null,
      error: `Search query exceeds maximum length of ${maxLength} characters`,
    };
  }

  // Check for excessive regex-like patterns that might indicate injection attempts
  const suspiciousPatterns = /[\[\]{}()^$|\\?*+.]{5,}/;
  if (suspiciousPatterns.test(trimmed)) {
    return {
      valid: false,
      value: null,
      error: 'Search query contains invalid character patterns',
    };
  }

  return { valid: true, value: trimmed, error: null };
};

/**
 * Validates pagination parameters
 * @param {number|string} page - Page number
 * @param {number|string} limit - Items per page
 * @returns {object} - { valid: boolean, page: number, limit: number, error: string }
 */
const validatePagination = (page = 1, limit = 20, maxLimit = 100) => {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 20, 1);

  if (pageNum > 10000) {
    return {
      valid: false,
      page: null,
      limit: null,
      error: 'Page number is too large',
    };
  }

  if (limitNum > maxLimit) {
    return {
      valid: false,
      page: null,
      limit: null,
      error: `Limit cannot exceed ${maxLimit}`,
    };
  }

  return { valid: true, page: pageNum, limit: limitNum, error: null };
};

/**
 * Validates content type against allowed values
 * @param {string} type - Content type from user
 * @param {array} allowedTypes - Allowed type values
 * @returns {object} - { valid: boolean, value: string, error: string }
 */
const validateType = (type, allowedTypes = ['movie', 'book', 'music', 'game', 'all']) => {
  if (!type) {
    return { valid: true, value: null, error: null };
  }

  const typeStr = String(type).toLowerCase().trim();

  if (!allowedTypes.includes(typeStr)) {
    return {
      valid: false,
      value: null,
      error: `Invalid type. Allowed values: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true, value: typeStr, error: null };
};

/**
 * Validates role against allowed values
 * @param {string} role - Role from user
 * @param {array} allowedRoles - Allowed role values
 * @returns {object} - { valid: boolean, value: string, error: string }
 */
const validateRole = (role, allowedRoles = ['user', 'admin']) => {
  if (!role) {
    return { valid: true, value: null, error: null };
  }

  const roleStr = String(role).toLowerCase().trim();

  if (!allowedRoles.includes(roleStr)) {
    return {
      valid: false,
      value: null,
      error: `Invalid role. Allowed values: ${allowedRoles.join(', ')}`,
    };
  }

  return { valid: true, value: roleStr, error: null };
};

/**
 * Validates numeric range parameter (e.g., rating, year)
 * @param {number|string} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {object} - { valid: boolean, value: number, error: string }
 */
const validateNumericRange = (value, min = 0, max = 100) => {
  if (value === null || value === undefined || value === '') {
    return { valid: true, value: null, error: null };
  }

  const num = Number(value);

  if (Number.isNaN(num)) {
    return {
      valid: false,
      value: null,
      error: `Value must be a number between ${min} and ${max}`,
    };
  }

  if (num < min || num > max) {
    return {
      valid: false,
      value: null,
      error: `Value must be between ${min} and ${max}`,
    };
  }

  return { valid: true, value: num, error: null };
};

/**
 * Sanitizes an object of query parameters
 * Validates and escapes common search/filter parameters
 * @param {object} params - Query parameters object
 * @returns {object} - Sanitized parameters with validation results
 */
const sanitizeQueryParams = (params = {}) => {
  return {
    search: validateSearch(params.search, 100),
    type: validateType(params.type),
    genre: validateSearch(params.genre, 50),
    author: validateSearch(params.author, 50),
    artist: validateSearch(params.artist, 50),
    platform: validateSearch(params.platform, 50),
    pagination: validatePagination(params.page, params.limit),
    minRating: validateNumericRange(params.minRating, 0, 10),
    year: validateNumericRange(params.year, 1900, new Date().getFullYear() + 1),
    role: validateRole(params.role),
  };
};

module.exports = {
  escapeRegex,
  validateSearch,
  validatePagination,
  validateType,
  validateRole,
  validateNumericRange,
  sanitizeQueryParams,
};
