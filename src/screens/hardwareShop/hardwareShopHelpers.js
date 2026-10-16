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

/** Validation Helpers */
export const validatePhone = (phone) => {
    if (!phone) return false;
    const cleaned = String(phone).replace(/[\s-]/g, '');
    return /^(?:0|94|\+94)?\d{9,10}$/.test(cleaned);
};

export const validateEmail = (email) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
};

export const validatePositiveNumber = (val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
};

export const validateNonNegativeInteger = (val) => {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
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
