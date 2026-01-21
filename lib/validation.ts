// Input validation utilities

// Email validation with RFC 5322 compliant regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    if (email.length > 254) return false; // Max email length
    return EMAIL_REGEX.test(email);
}

// Password validation
export interface PasswordValidation {
    valid: boolean;
    errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
        return { valid: false, errors: ['Password is required'] };
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }

    if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// Sanitize string input (remove potential XSS)
export function sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .slice(0, 1000); // Limit length
}

// Validate codename (alphanumeric with spaces)
export function isValidCodename(codename: string): boolean {
    if (!codename || typeof codename !== 'string') return false;
    if (codename.length < 2 || codename.length > 50) return false;
    return /^[a-zA-Z0-9\s]+$/.test(codename);
}

// Validate UUID/CUID
export function isValidId(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    // CUID format or UUID format
    return /^c[a-z0-9]{24}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Validate priority
export function isValidPriority(priority: string): boolean {
    return ['low', 'medium', 'high'].includes(priority);
}

// Validate role
export function isValidRole(role: string): boolean {
    return ['ADMIN', 'SENIOR_AGENT', 'AGENT', 'VIEWER'].includes(role);
}

// Validate status
export function isValidStatus(status: string): boolean {
    return ['online', 'offline', 'away'].includes(status);
}
