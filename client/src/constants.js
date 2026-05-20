import { LayoutDashboard, ClipboardList, FolderOpen, BookOpen, Inbox } from 'lucide-react';

export const STATUS_BADGE = {
    ONGOING:   { cls: 'badge-active', label: 'Ongoing'   },
    ON_HOLD:   { cls: 'badge-hold',   label: 'On Hold'   },
    COMPLETED: { cls: 'badge-done',   label: 'Completed' },
    PROPOSED:  { cls: 'badge-proposed', label: 'Proposed' },
};

export const FUNDING_BADGE = {
    INTERNAL:   { cls: 'badge-funding-internal',   label: 'Internal'   },
    GOVERNMENT: { cls: 'badge-funding-government', label: 'Government' },
    DONOR:      { cls: 'badge-funding-donor',      label: 'Donor'      },
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
    { path: '/dashboard',  label: 'Dashboard',     Icon: LayoutDashboard },
    { path: '/report',     label: 'Reports',       Icon: ClipboardList   },
    { path: '/library',    label: 'Library',       Icon: BookOpen        },
    { path: '/inbox',      label: 'Inbox',         Icon: Inbox           },
    { path: '/activities', label: 'My Activities', Icon: FolderOpen      },
];
