export const STATUS_BADGE = {
    ACTIVE:    { cls: 'badge-active', label: 'Active'    },
    ON_HOLD:   { cls: 'badge-hold',   label: 'On Hold'   },
    COMPLETED: { cls: 'badge-done',   label: 'Completed' },
};

export const ACTIVITY_TYPES = [
    'Field sampling',
    'Lab analysis',
    'Data collection',
    'Community engagement',
    'Reporting',
    'Training',
    'Other',
];

export const NAV_ITEMS = [
    { path: '/dashboard',  label: 'Dashboard',    icon: '📊' },
    { path: '/report',     label: 'Reports',       icon: '📋' },
    { path: '/activities', label: 'My Activities', icon: '🗂'  },
];
