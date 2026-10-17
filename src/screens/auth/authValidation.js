/**
 * authValidation.js
 * Centralized, standardized validation helpers for Authentication screens (Login & Registration).
 * Enforces strict validation rules across all stakeholder roles without duplicating logic.
 */

// Phone number: Digits only, exactly 10 digits
export const PHONE_REGEX = /^\d{10}$/;

// Standard RFC-compliant email regex (rejects spaces, requires valid @ and domain format)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirement regex: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
export const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Strips all non-digit characters and caps length to 10 digits.
 * Preserves phone number as string to maintain leading zeros (e.g., '0712345678').
 */
export const sanitizePhoneNumber = (value) => {
    if (!value) return '';
    return String(value).replace(/\D/g, '').slice(0, 10);
};

/**
 * Validates a 10-digit phone number.
 * Returns { isValid: boolean, message: string }
 */
export const validatePhoneNumber = (phone) => {
    const sanitized = sanitizePhoneNumber(phone);
    if (!sanitized) {
        return {
            isValid: false,
            message: 'Phone number must contain exactly 10 digits.',
        };
    }
    if (sanitized.length !== 10 || !PHONE_REGEX.test(sanitized)) {
        return {
            isValid: false,
            message: 'Phone number must contain exactly 10 digits.',
        };
    }
    return { isValid: true, message: '' };
};

/**
 * Trims accidental leading/trailing whitespace from email.
 */
export const sanitizeEmail = (email) => {
    return (email || '').trim();
};

/**
 * Validates email format after trimming whitespace.
 * Returns { isValid: boolean, message: string, sanitized: string }
 */
export const validateEmail = (email) => {
    const trimmed = sanitizeEmail(email);
    if (!trimmed) {
        return {
            isValid: false,
            message: 'Please enter a valid email address.',
            sanitized: '',
        };
    }
    if (!EMAIL_REGEX.test(trimmed)) {
        return {
            isValid: false,
            message: 'Please enter a valid email address.',
            sanitized: trimmed,
        };
    }
    return { isValid: true, message: '', sanitized: trimmed };
};

/**
 * Validates registration password against security policy:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validateRegistrationPassword = (password) => {
    if (!password) {
        return {
            isValid: false,
            message: 'Password is required.',
        };
    }
    if (password.length < 8) {
        return {
            isValid: false,
            message: 'Password must be at least 8 characters long.',
        };
    }
    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must include at least one uppercase letter.',
        };
    }
    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must include at least one lowercase letter.',
        };
    }
    if (!/\d/.test(password)) {
        return {
            isValid: false,
            message: 'Password must include at least one number.',
        };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must include at least one special character.',
        };
    }
    return { isValid: true, message: '' };
};

/**
 * Validates that confirm password matches the password.
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
    if (!confirmPassword) {
        return {
            isValid: false,
            message: 'Please confirm your password.',
        };
    }
    if (password !== confirmPassword) {
        return {
            isValid: false,
            message: 'Passwords do not match.',
        };
    }
    return { isValid: true, message: '' };
};

/**
 * Maps Firebase Authentication error codes to friendly, human-readable messages.
 */
export const mapFirebaseAuthError = (error) => {
    if (!error) return 'An unexpected error occurred. Please try again.';

    const code = error.code || '';
    const message = error.message || '';

    if (code === 'auth/invalid-credential' || message.includes('auth/invalid-credential')) {
        return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (code === 'auth/user-not-found' || message.includes('auth/user-not-found')) {
        return 'No account found with this email address. Please register first.';
    }
    if (code === 'auth/wrong-password' || message.includes('auth/wrong-password')) {
        return 'Incorrect password. Please try again.';
    }
    if (code === 'auth/email-already-in-use' || message.includes('auth/email-already-in-use')) {
        return 'This email address is already registered. Please log in instead.';
    }
    if (code === 'auth/invalid-email' || message.includes('auth/invalid-email')) {
        return 'Please enter a valid email address.';
    }
    if (code === 'auth/weak-password' || message.includes('auth/weak-password')) {
        return 'Password is too weak. Please use at least 8 characters with a mix of letters, numbers, and symbols.';
    }
    if (code === 'auth/network-request-failed' || message.includes('auth/network-request-failed')) {
        return 'Network error. Please check your internet connection and try again.';
    }
    if (code === 'auth/too-many-requests' || message.includes('auth/too-many-requests')) {
        return 'Too many unsuccessful attempts. Please wait a moment and try again.';
    }
    if (code === 'auth/user-disabled' || message.includes('auth/user-disabled')) {
        return 'This user account has been disabled. Please contact support.';
    }

    // Clean up raw Firebase message if it has code wrapper like "Firebase: Error (auth/...)"
    const cleanMessage = message.replace(/^Firebase:\s*(?:Error\s*)?(?:\([^)]+\):?)?\s*/i, '').trim();
    return cleanMessage || 'Authentication failed. Please try again.';
};
