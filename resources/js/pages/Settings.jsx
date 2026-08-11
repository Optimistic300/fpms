import { useState } from 'react';
import DivisionManager from '../components/admin/DivisionManager';
import ActivityTypeManager from '../components/admin/ActivityTypeManager';

const TABS = [
    { key: 'divisions', label: 'Divisions' },
    { key: 'activityTypes', label: 'Activity Types' },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState('divisions');

    const containerStyle = { maxWidth: '960px', margin: '0 auto', padding: '24px 16px' };

    const titleStyle = {
        fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 20px',
    };

    const tabBarStyle = {
        display: 'flex', gap: '4px', marginBottom: '24px',
        borderBottom: '2px solid #e2e8f0', paddingBottom: '0',
    };

    const tabStyle = (isActive) => ({
        padding: '10px 16px', fontSize: '13px', fontWeight: 500,
        color: isActive ? 'var(--color-primary)' : '#64748b',
        backgroundColor: 'transparent', border: 'none',
        borderBottom: `2px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
        cursor: 'pointer', fontFamily: 'inherit',
        marginBottom: '-2px',
    });

    return (
        <div style={containerStyle}>
            <h1 style={titleStyle}>Settings</h1>

            <div style={tabBarStyle}>
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        style={tabStyle(activeTab === tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'divisions' && <DivisionManager />}
            {activeTab === 'activityTypes' && <ActivityTypeManager />}
        </div>
    );
}
