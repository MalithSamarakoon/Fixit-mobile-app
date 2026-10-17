export const ORDER_STATUS_STYLES = {
    Pending: { statusColor: '#F59E0B', statusBg: '#FFF7ED' },
    'In Progress': { statusColor: '#5C8AF0', statusBg: '#EDF2FE' },
    Completed: { statusColor: '#10B981', statusBg: '#ECFDF5' },
    Confirmed: { statusColor: '#10B981', statusBg: '#ECFDF5' },
    Rejected: { statusColor: '#EF4444', statusBg: '#FEF2F2' },
    Delivered: { statusColor: '#10B981', statusBg: '#ECFDF5' },
};

export const getOrderStatusStyle = (status) =>
    ORDER_STATUS_STYLES[status] || { statusColor: '#6B7280', statusBg: '#F3F4F6' };

export const formatRevenue = (amount) =>
    `Rs ${Math.round(Number(amount) || 0).toLocaleString('en-LK')}`;

export const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `Rs ${num.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** Standard Hardware Product Categories */
export const PRODUCT_CATEGORIES = [
    'Plumbing',
    'Electrical',
    'Power Tools',
    'Hand Tools',
    'Building Materials',
    'Paint & Supplies',
    'Fasteners & Hardware',
    'Gardening & Outdoor',
    'Safety Equipment',
    'Other',
];

/** Standard Product Units */
export const PRODUCT_UNITS = ['pcs', 'box', 'kg', 'meter', 'liter', 'pack', 'set'];

/** Stock Status Badge helper */
export const getStockBadge = (stock) => {
    const num = Number(stock);
    if (isNaN(num) || num <= 0) {
        return { label: 'Out of Stock', color: '#EF4444', bg: '#FEF2F2', isLow: true, isOut: true };
    }
    if (num <= 5) {
        return { label: `Low Stock (${num})`, color: '#F59E0B', bg: '#FFF7ED', isLow: true, isOut: false };
    }
    return { label: `In Stock (${num})`, color: '#10B981', bg: '#ECFDF5', isLow: false, isOut: false };
};

/**
 * Phone Number Validation Constants & Helpers
 * Rule: Accept numbers only, exactly 10 digits, preserve leading zeros.
 */
export const PHONE_VALIDATION_ERROR = 'Phone number must contain exactly 10 digits.';

export const validatePhone = (phone) => {
    if (typeof phone !== 'string') return false;
    // Exactly 10 numeric digits, no spaces, letters, or symbols
    return /^\d{10}$/.test(phone);
};

export const sanitizePhoneNumber = (val) => {
    if (!val) return '';
    // Strip non-digits and prevent exceeding 10 digits
    return String(val).replace(/\D/g, '').slice(0, 10);
};

/** Email Validation */
export const validateEmail = (email) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
};

/** Positive Number Validation */
export const validatePositiveNumber = (val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
};

/** Non-negative Integer Validation */
export const validateNonNegativeInteger = (val) => {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
};

/** Date Validation Helpers */
export const parseDateAtMidnight = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
        return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
    }
    if (typeof dateInput === 'string') {
        const parts = dateInput.split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
        const parsed = new Date(dateInput);
        if (!isNaN(parsed.getTime())) {
            return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        }
    }
    return null;
};

export const isDateBefore = (dateA, dateB) => {
    const da = parseDateAtMidnight(dateA);
    const db = parseDateAtMidnight(dateB);
    if (!da || !db) return false;
    return da.getTime() < db.getTime();
};

export const isDatePast = (dateVal) => {
    const target = parseDateAtMidnight(dateVal);
    if (!target) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return target.getTime() < today.getTime();
};

/** Products/ads owned by this shop or legacy docs without shopOwnerId */
export const belongsToShop = (docData, shopOwnerId) => {
    if (!shopOwnerId) return true;
    if (!docData.shopOwnerId) return true;
    return docData.shopOwnerId === shopOwnerId;
};

export const DEFAULT_HARDWARE_ORDERS = [
    {
        orderNumber: '#8492',
        task: 'Plumbing Emergency',
        time: 'Today, 2:30 PM',
        status: 'Pending',
        icon: 'construct-outline',
        customerName: 'Didula Akash',
        customerPhone: '0717299789',
        customerEmail: 'DidulaA@example.com',
        items: [
            { name: 'Heavy Duty Pipe Wrench', qty: 1, price: 8000 },
            { name: 'Copper Coupler 1/2"', qty: 4, price: 750 },
        ],
        deliveryLocation: 'No 227 /E Kaduwela road, kothalawala',
        total: 11000,
    },
    {
        orderNumber: '#8488',
        task: 'Electrical Setup',
        time: 'Yesterday, 10:15 AM',
        status: 'In Progress',
        icon: 'flash-outline',
        customerName: 'Nimal Perera',
        customerPhone: '0771234567',
        customerEmail: 'nimal@example.com',
        items: [{ name: 'Electrical Tape Roll', qty: 2, price: 450 }],
        deliveryLocation: 'Colombo 05',
        total: 900,
    },
    {
        orderNumber: '#8472',
        task: 'AC Annual Tune-up',
        time: 'Oct 24, 2025',
        status: 'Completed',
        icon: 'snow-outline',
        customerName: 'Sanduni Silva',
        customerPhone: '0719876543',
        customerEmail: 'sanduni@example.com',
        items: [{ name: 'AC Filter Pack', qty: 1, price: 3500 }],
        deliveryLocation: 'Kandy',
        total: 3500,
    },
];
