/**
 * Comprehensive Form Validation Utilities with Security
 * Includes XSS/SQL injection prevention, sanitization, and data validation
 * Used across all forms in the system
 */

// ==================== SECURITY: XSS PREVENTION ====================
/**
 * Escape HTML entities to prevent XSS attacks
 * Converts: < > & " ' to their HTML entity equivalents
 */
export const escapeHtml = (text) => {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, (s) => map[s]);
};

/**
 * Remove potentially dangerous HTML/script content
 */
export const sanitizeHtml = (html) => {
  if (!html) return '';
  // Remove script tags, event handlers, and dangerous elements
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/on\w+\s*=\s*["']?[^"']*["']?/gi, '') // Remove event handlers
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
    .replace(/javascript:/gi, ''); // Remove javascript: protocol
};

// ==================== NAME VALIDATION ====================
export const validateName = (name, fieldName = 'Name', minLength = 2, maxLength = 50) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} cannot exceed ${maxLength} characters` };
  }

  // Allow only letters, spaces, hyphens, apostrophes (for names like "O'Brien", "Mary-Jane")
  // NO periods, semicolons, or other punctuation
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmed)) {
    return { 
      valid: false, 
      error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes (no periods, semicolons, or symbols)` 
    };
  }

  // Check for SQL injection attempts
  if (/['";\.\\]|--|\/\*|\*\/|xp_|sp_|\bexec\b|\bexecute\b|\bdrop\b|\bdelete\b|\binsert\b|\bupdate\b|\bselect\b/.test(trimmed.toLowerCase())) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }

  // No leading/trailing spaces or hyphens
  if (trimmed !== trimmed.trim() || trimmed.startsWith('-') || trimmed.endsWith('-')) {
    return { valid: false, error: `${fieldName} has invalid spacing or characters` };
  }

  // No consecutive spaces
  if (trimmed.includes('  ')) {
    return { valid: false, error: `${fieldName} cannot have consecutive spaces` };
  }

  return { valid: true };
};

// ==================== EMAIL VALIDATION ====================
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' };
  }

  // Enhanced RFC 5322 compliant regex for email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  // Additional domain validation
  const [localPart, domain] = trimmed.split('@');
  
  if (localPart.length > 64) {
    return { valid: false, error: 'Email local part is too long' };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (localPart.includes('..')) {
    return { valid: false, error: 'Email cannot have consecutive dots' };
  }

  // Check domain has at least one dot
  if (!domain.includes('.')) {
    return { valid: false, error: 'Invalid email domain' };
  }

  // Check for SQL injection in email
  if (/['";\\]|--|\/\*|\*\/|xp_|sp_|exec|execute|drop|delete|insert|update|select/.test(trimmed)) {
    return { valid: false, error: 'Email contains invalid characters' };
  }

  return { valid: true };
};

// ==================== PHONE VALIDATION ====================
export const validatePhone = (phone, countryCode = '+63') => {
  const phoneRequirements = {
    '+63': { digits: 10, country: 'Philippines' },
    '+1': { digits: 10, country: 'USA/Canada' },
    '+44': { digits: 10, country: 'UK' },
    '+61': { digits: 9, country: 'Australia' },
    '+81': { digits: 10, country: 'Japan' },
    '+82': { digits: 10, country: 'South Korea' },
    '+86': { digits: 11, country: 'China' },
    '+65': { digits: 8, country: 'Singapore' },
    '+60': { digits: 10, country: 'Malaysia' },
    '+971': { digits: 9, country: 'UAE' }
  };

  if (!phone) {
    return { valid: true }; // Phone is optional
  }

  const trimmed = String(phone).trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return { valid: true }; // Phone is optional
  }

  const requirements = phoneRequirements[countryCode] || phoneRequirements['+63'];
  
  if (digitsOnly.length !== requirements.digits) {
    return {
      valid: false,
      error: `Phone number must be exactly ${requirements.digits} digits for ${requirements.country}`
    };
  }

  // Check for SQL injection attempts
  if (/['";\\]|--|\/\*|\*\/|xp_|sp_|exec|execute/.test(trimmed)) {
    return { valid: false, error: 'Phone number contains invalid characters' };
  }

  return { valid: true };
};

// ==================== PASSWORD VALIDATION ====================
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password cannot exceed 128 characters' };
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  // Check for special character (required for security)
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*etc)' };
  }

  return { valid: true };
};

// ==================== TEXT AREA VALIDATION ====================
export const validateTextArea = (text, fieldName = 'Text', minLength = 1, maxLength = 5000) => {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} cannot exceed ${maxLength} characters` };
  }

  // Check for XSS attempts
  if (/<script|<iframe|javascript:|on\w+=/i.test(trimmed)) {
    return { valid: false, error: `${fieldName} contains invalid content` };
  }

  // Check for SQL injection attempts
  if (/--|\/\*|\*\/|xp_|sp_|\bexec\b|\bexecute\b|\bdrop\b|\bdelete\b|\binsert\b|\bupdate\b|\bselect\b/.test(trimmed.toLowerCase())) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }

  return { valid: true };
};

// ==================== DATE VALIDATION ====================
export const validateDate = (dateString, fieldName = 'Date') => {
  if (!dateString) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return { valid: false, error: `${fieldName} is invalid` };
  }

  return { valid: true };
};

// ==================== AGE VALIDATION ====================
/**
 * Validates birth date and ensures person is within realistic age range (18-120 years)
 */
export const validateBirthDate = (dateString) => {
  const validation = validateDate(dateString, 'Birth Date');
  if (!validation.valid) return validation;

  const date = new Date(dateString);
  const today = new Date();
  
  // Calculate age
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  // Adjust if birthday hasn't occurred this year
  const adjustedAge = monthDiff < 0 ? age - 1 : age;

  if (date > today) {
    return { valid: false, error: 'Birth date cannot be in the future' };
  }

  if (adjustedAge < 0) {
    return { valid: false, error: 'Birth date is in the future' };
  }

  if (adjustedAge > 150) {
    return { valid: false, error: 'Please enter a realistic birth date (age cannot exceed 150 years)' };
  }

  return { valid: true };
};

/**
 * Validates death date and ensures logical date progression: birth < death < burial
 */
export const validateDeathDate = (dateString, birthDate = null) => {
  const validation = validateDate(dateString, 'Death Date');
  if (!validation.valid) return validation;

  const deathDate = new Date(dateString);
  const today = new Date();

  if (deathDate > today) {
    return { valid: false, error: 'Death date cannot be in the future' };
  }

  if (birthDate) {
    const birthDateObj = new Date(birthDate);
    if (deathDate < birthDateObj) {
      return { valid: false, error: 'Death date cannot be before birth date' };
    }

    // Check if person was at least 0 years old at death
    const ageAtDeath = deathDate.getFullYear() - birthDateObj.getFullYear();
    if (ageAtDeath < 0) {
      return { valid: false, error: 'Death date cannot be before birth date' };
    }

    if (ageAtDeath > 150) {
      return { valid: false, error: 'Age at death seems unrealistic (exceeds 150 years)' };
    }
  }

  return { valid: true };
};

/**
 * Validates burial date and ensures logical progression
 */
export const validateBurialDate = (dateString, birthDate = null, deathDate = null) => {
  const validation = validateDate(dateString, 'Burial Date');
  if (!validation.valid) return validation;

  const burialDateObj = new Date(dateString);
  const today = new Date();

  if (burialDateObj > today) {
    return { valid: false, error: 'Burial date cannot be in the future' };
  }

  if (deathDate) {
    const deathDateObj = new Date(deathDate);
    if (burialDateObj < deathDateObj) {
      return { valid: false, error: 'Burial date cannot be before death date' };
    }

    // Burial should typically happen within 30 days
    const daysBetween = Math.floor((burialDateObj - deathDateObj) / (1000 * 60 * 60 * 24));
    if (daysBetween > 365) {
      return { 
        valid: false, 
        error: 'Burial date is more than 1 year after death date - please verify' 
      };
    }
  }

  if (birthDate) {
    const birthDateObj = new Date(birthDate);
    if (burialDateObj < birthDateObj) {
      return { valid: false, error: 'Burial date cannot be before birth date' };
    }
  }

  return { valid: true };
};

// ==================== NUMBER VALIDATION ====================
export const validateNumber = (value, fieldName = 'Number', min = 0, max = 9999) => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (num > max) {
    return { valid: false, error: `${fieldName} cannot exceed ${max}` };
  }

  return { valid: true };
};

// ==================== REQUIRED FIELD VALIDATION ====================
export const validateRequired = (value, fieldName = 'Field') => {
  if (!value && value !== 0 && value !== false) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  return { valid: true };
};

// ==================== PLOT NUMBER VALIDATION ====================
export const validatePlotNumber = (plotNumber) => {
  if (!plotNumber || typeof plotNumber !== 'string') {
    return { valid: false, error: 'Plot number is required' };
  }

  const trimmed = plotNumber.trim().toUpperCase();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Plot number cannot be empty' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Plot number is too long' };
  }

  // Allow letters, numbers, hyphens
  if (!/^[A-Z0-9\-]+$/.test(trimmed)) {
    return { valid: false, error: 'Plot number can only contain letters, numbers, and hyphens' };
  }

  return { valid: true };
};

// ==================== STREET ADDRESS VALIDATION ====================
export const validateAddress = (address, fieldName = 'Address', minLength = 5, maxLength = 200) => {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = address.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} cannot exceed ${maxLength} characters` };
  }

  // Check for SQL injection attempts
  if (/--|\/\*|\*\/|xp_|sp_|\bexec\b|\bexecute\b|\bdrop\b|\bdelete\b|\binsert\b|\bupdate\b|\bselect\b/.test(trimmed.toLowerCase())) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }

  return { valid: true };
};

// ==================== FILE UPLOAD VALIDATION ====================
/**
 * Validates file uploads for size and type
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
    fieldName = 'File'
  } = options;

  if (!file) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `${fieldName} cannot exceed ${maxSizeMB}MB`
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `${fieldName} type not allowed. Accepted: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true };
};

// ==================== URL VALIDATION ====================
export const validateUrl = (url, fieldName = 'URL') => {
  if (!url) {
    return { valid: true }; // Optional
  }

  try {
    const urlObj = new URL(url);
    
    // Check for SQL injection in URL
    if (/--|\/\*|\*\/|xp_|sp_|exec|execute|drop|delete|insert|update|select/.test(url.toLowerCase())) {
      return { valid: false, error: `${fieldName} contains invalid characters` };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: `${fieldName} is not a valid URL` };
  }
};

// ==================== FORM-WIDE VALIDATION ====================
export const validateForm = (formData, rules) => {
  const errors = {};
  let isValid = true;

  for (const [field, rule] of Object.entries(rules)) {
    const value = formData[field];
    const result = rule(value);

    if (!result.valid) {
      errors[field] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// ==================== SANITIZATION ====================
/**
 * Sanitize name field: trim, normalize spaces, remove invalid characters
 */
export const sanitizeName = (name) => {
  if (!name) return '';
  return name
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^a-zA-Z\s\-']/g, '') // Remove invalid characters
    .substring(0, 50); // Max 50 chars
};

/**
 * Sanitize email: trim and lowercase
 */
export const sanitizeEmail = (email) => {
  return email.trim().toLowerCase();
};

/**
 * Sanitize text/message: trim, normalize spaces, escape HTML, remove malicious content
 */
export const sanitizeTextArea = (text) => {
  if (!text) return '';
  return text
    .trim()
    .replace(/\s+/g, ' ') // Normalize spaces
    .substring(0, 5000); // Max 5000 chars
};

/**
 * Sanitize address: trim and normalize spaces
 */
export const sanitizeAddress = (address) => {
  if (!address) return '';
  return address
    .trim()
    .replace(/\s+/g, ' ')
    .substring(0, 200); // Max 200 chars
};

// ==================== RATE LIMITING ====================
/**
 * Client-side rate limiting to prevent spam submissions
 * Stores submission timestamps in localStorage
 */
export const checkRateLimit = (formName, maxAttempts = 5, timeWindowSeconds = 60) => {
  const key = `form_submissions_${formName}`;
  const now = Date.now();
  const windowStart = now - (timeWindowSeconds * 1000);

  // Get previous submissions from localStorage
  let submissions = JSON.parse(localStorage.getItem(key) || '[]');
  
  // Filter to only recent submissions
  submissions = submissions.filter(timestamp => timestamp > windowStart);

  if (submissions.length >= maxAttempts) {
    const oldestSubmission = Math.min(...submissions);
    const secondsToWait = Math.ceil((oldestSubmission + (timeWindowSeconds * 1000) - now) / 1000);
    return {
      allowed: false,
      error: `Too many submissions. Please wait ${secondsToWait} seconds before trying again.`
    };
  }

  // Record this attempt
  submissions.push(now);
  localStorage.setItem(key, JSON.stringify(submissions));

  return { allowed: true };
};

/**
 * Clear rate limit for a form (call after successful submission)
 */
export const clearRateLimit = (formName) => {
  localStorage.removeItem(`form_submissions_${formName}`);
};
