import { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import AddMemberModal from './AddMemberModal';

export default function TeamTab({ projectId, selected }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (!selected || loaded) return;
        setLoading(true);
        apiClient
            .get(`/projects/${projectId}/members`)
            .then((res) => {
                setMembers(res.data.data || []);
                setLoaded(true);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [selected, loaded, projectId]);

    function handleMemberAdded(newMember) {
        setMembers((prev) => [...prev, newMember]);
    }

    if (!selected) return null;

    if (loading) {
        return (
            <div style={{ padding: '20px 0', color: '#94a3b8', fontSize: '14px' }}>
                Loading team members...
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <div
                style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '14px',
                }}
            >
                <p style={{ margin: '0 0 16px 0' }}>No team members yet.</p>
                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        backgroundColor: 'var(--color-primary-bg)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    + Add Member
                </button>
                <AddMemberModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    projectId={projectId}
                    onAdded={handleMemberAdded}
                />
            </div>
        );
    }

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    padding: '10px 16px',
                    borderBottom: '1px solid #e2e8f0',
                }}
            >
                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        backgroundColor: 'var(--color-primary-bg)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    + Add Member
                </button>
            </div>

            {members.map((member) => (
                <div
                    key={member.id}
                    style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '14px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#64748b',
                            flexShrink: 0,
                        }}
                    >
                        {member.name?.charAt(0) || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                            {member.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Added {member.dateAdded}
                        </div>
                    </div>
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color:
                                member.role === 'LEAD'
                                    ? 'var(--color-primary-dark)'
                                    : '#065f46',
                            backgroundColor:
                                member.role === 'LEAD' ? 'var(--color-primary-bg)' : '#d1fae5',
                            padding: '2px 8px',
                            borderRadius: '4px',
                        }}
                    >
                        {member.role === 'LEAD' ? 'Lead' : 'Collaborator'}
                    </span>
                </div>
            ))}

            <AddMemberModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                projectId={projectId}
                onAdded={handleMemberAdded}
            />
        </div>
    );
}
