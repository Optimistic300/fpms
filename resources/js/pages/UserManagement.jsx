import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/axios';
import UserFormModal from '../components/admin/UserFormModal';

const ROLE_COLORS = {
    ADMIN: { bg: '#fee2e2', color: '#991b1b' },
    DIVISION_HEAD: { bg: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' },
    SECRETARY: { bg: '#fef3c7', color: '#92400e' },
    MANAGEMENT: { bg: '#e0e7ff', color: '#3730a3' },
    RESEARCHER: { bg: '#d1fae5', color: '#065f46' },
    STUDENT: { bg: '#f1f5f9', color: '#475569' },
};

function roleBadge(role) {
    const c = ROLE_COLORS[role] || { bg: '#f1f5f9', color: '#475569' };
    return (
        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, backgroundColor: c.bg, color: c.color }}>
            {role}
        </span>
    );
}

export default function UserManagement() {
    const { user: authUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [resetConfirm, setResetConfirm] = useState(null);
    const [resetPassword, setResetPassword] = useState('');
    const [resetError, setResetError] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (search) params.q = search;
            if (roleFilter) params.role = roleFilter;
            const res = await apiClient.get('/admin/users', { params });
            setUsers(res.data?.data || []);
        } catch {
            setError('Failed to load users.');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    async function handleToggleActive(targetUser) {
        try {
            const res = await apiClient.put(`/admin/users/${targetUser.userId}`, {
                isActive: !targetUser.isActive,
            });
            setUsers((prev) =>
                prev.map((u) => u.userId === targetUser.userId ? { ...u, ...res.data?.data } : u)
            );
        } catch {
            setError('Failed to update user.');
        }
    }

    function handleSaved(userData) {
        if (editUser) {
            setUsers((prev) =>
                prev.map((u) => u.userId === userData.userId ? { ...u, ...userData } : u)
            );
        } else {
            setUsers((prev) => [userData, ...prev]);
        }
    }

    async function handleResetPassword() {
        if (!resetPassword || resetPassword.length < 8) {
            setResetError('Password must be at least 8 characters.');
            return;
        }
        try {
            await apiClient.post(`/admin/users/${resetConfirm}/reset-password`, {
                password: resetPassword,
            });
            setResetConfirm(null);
            setResetPassword('');
            setResetError('');
        } catch (err) {
            setResetError(err.response?.data?.message || 'Failed to reset password.');
        }
    }

    const containerStyle = { maxWidth: '960px', margin: '0 auto', padding: '24px 16px' };

    const headerStyle = {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
    };

    const titleStyle = {
        fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0,
    };

    const addBtnStyle = {
        padding: '9px 20px', fontSize: '14px', fontWeight: 600,
        color: 'white', backgroundColor: 'var(--color-primary)', border: 'none',
        borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
    };

    const filterRowStyle = {
        display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap',
    };

    const searchInputStyle = {
        padding: '9px 12px', fontSize: '14px', border: '1px solid #e2e8f0',
        borderRadius: '6px', fontFamily: 'inherit', flex: 1, minWidth: '200px',
    };

    const selectStyle = {
        padding: '9px 12px', fontSize: '14px', border: '1px solid #e2e8f0',
        borderRadius: '6px', fontFamily: 'inherit',
    };

    const tableStyle = {
        width: '100%', borderCollapse: 'collapse', fontSize: '14px',
    };

    const thStyle = {
        textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e2e8f0',
        color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
    };

    const tdStyle = {
        padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#1e293b',
    };

    const actionBtnStyle = {
        padding: '4px 10px', fontSize: '12px', fontWeight: 500, borderRadius: '4px',
        border: '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit',
        backgroundColor: 'white', color: '#475569', marginRight: '6px',
    };

    const toggleBtnStyle = (isActive) => ({
        padding: '4px 10px', fontSize: '12px', fontWeight: 600, borderRadius: '4px',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        backgroundColor: isActive ? '#fee2e2' : '#d1fae5',
        color: isActive ? '#dc2626' : '#16a34a',
        marginRight: '6px',
    });

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>User Management</h1>
                <button type="button" onClick={() => setCreateModalOpen(true)} style={addBtnStyle}>
                    + Create User
                </button>
            </div>

            <div style={filterRowStyle}>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={searchInputStyle}
                />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={selectStyle}>
                    <option value="">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="DIVISION_HEAD">Division Head</option>
                    <option value="SECRETARY">Secretary</option>
                    <option value="MANAGEMENT">Management</option>
                    <option value="RESEARCHER">Researcher</option>
                    <option value="STUDENT">Student</option>
                </select>
            </div>

            {error && (
                <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{error}</div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading users...</div>
            ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <p style={{ fontSize: '16px' }}>No users found.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Role</th>
                                <th style={thStyle}>Division</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.userId}>
                                    <td style={tdStyle}>{u.fullName}</td>
                                    <td style={tdStyle}>{u.email}</td>
                                    <td style={tdStyle}>{roleBadge(u.role)}</td>
                                    <td style={tdStyle}>{u.division || '—'}</td>
                                    <td style={tdStyle}>
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, backgroundColor: u.isActive ? '#d1fae5' : '#fee2e2', color: u.isActive ? '#065f46' : '#991b1b' }}>
                                            {u.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <button type="button" onClick={() => handleToggleActive(u)} style={toggleBtnStyle(u.isActive)}>
                                            {u.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button type="button" onClick={() => setEditUser(u)} style={actionBtnStyle}>Edit</button>
                                        <button type="button" onClick={() => setResetConfirm(u.userId)} style={actionBtnStyle}>Reset PW</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <UserFormModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSaved={handleSaved}
            />

            <UserFormModal
                isOpen={editUser !== null}
                user={editUser}
                onClose={() => setEditUser(null)}
                onSaved={handleSaved}
            />

            {resetConfirm && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }} onClick={() => { setResetConfirm(null); setResetPassword(''); setResetError(''); }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Reset Password</h3>
                        {resetError && (
                            <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '4px', fontSize: '13px', marginBottom: '10px' }}>{resetError}</div>
                        )}
                        <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="New password (min. 8 characters)" style={{ width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '16px' }} />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => { setResetConfirm(null); setResetPassword(''); setResetError(''); }} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#475569', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button type="button" onClick={handleResetPassword} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: 'white', backgroundColor: 'var(--color-primary)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Set Password</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
