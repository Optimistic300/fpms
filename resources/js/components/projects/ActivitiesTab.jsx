import { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import DocumentActions from '../documents/DocumentActions';

export default function ActivitiesTab({ projectId, selected }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        if (!selected || loaded) return;
        setLoading(true);
        apiClient
            .get('/activities', { params: { projectId } })
            .then((res) => {
                setActivities(res.data.data || []);
                setLoaded(true);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [selected, loaded, projectId]);

    function toggleExpand(id) {
        setExpandedId((prev) => (prev === id ? null : id));
    }

    if (!selected) return null;

    if (loading) {
        return (
            <div style={{ padding: '20px 0', color: '#94a3b8', fontSize: '14px' }}>
                Loading activities...
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div
                style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '14px',
                }}
            >
                No activities recorded yet.
            </div>
        );
    }

    return (
        <div>
            {activities.map((act) => (
                <div key={act.id}>
                    <div
                        onClick={() => toggleExpand(act.id)}
                        style={{
                            display: 'flex',
                            gap: '12px',
                            padding: '14px 16px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            alignItems: 'center',
                            backgroundColor: expandedId === act.id ? '#f8fafc' : 'transparent',
                            transition: 'background-color 0.1s',
                        }}
                        onMouseEnter={(e) => {
                            if (expandedId !== act.id) e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                            if (expandedId !== act.id) e.currentTarget.style.backgroundColor = '';
                        }}
                    >
                        <div style={{ flex: 2, fontSize: '14px', color: '#1e293b' }}>
                            {act.description}
                        </div>
                        <div style={{ flex: 1, fontSize: '13px', color: '#64748b' }}>
                            {act.date}
                        </div>
                        <div style={{ flex: 1, fontSize: '13px', color: '#64748b' }}>
                            {act.researcher}
                        </div>
                        <div style={{ width: '60px', fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>
                            {act.docCount || act.documents?.length || 0} docs
                        </div>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {expandedId === act.id ? '▲' : '▼'}
                        </span>
                    </div>
                    {expandedId === act.id && (
                        <div
                            style={{
                                padding: '16px 16px 16px 28px',
                                backgroundColor: '#f8fafc',
                                borderBottom: '1px solid #e2e8f0',
                            }}
                        >
                            {act.notes && (
                                <p
                                    style={{
                                        margin: '0 0 12px 0',
                                        fontSize: '14px',
                                        color: '#475569',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {act.notes}
                                </p>
                            )}
                            {act.documents && act.documents.length > 0 && (
                                <div>
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: '#64748b',
                                            marginBottom: '8px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.3px',
                                        }}
                                    >
                                        Attached Documents
                                    </div>
                                    {act.documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '8px 12px',
                                                backgroundColor: 'white',
                                                borderRadius: '6px',
                                                marginBottom: '6px',
                                                border: '1px solid #f1f5f9',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: '#1e40af',
                                                        backgroundColor: '#dbeafe',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {doc.type || 'DOC'}
                                                </span>
                                                <span style={{ fontSize: '13px', color: '#1e293b' }}>
                                                    {doc.filename}
                                                </span>
                                            </div>
                                            <DocumentActions document={doc} />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(!act.notes || !act.documents || act.documents.length === 0) && (
                                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                                    {!act.notes && !act.documents?.length
                                        ? 'No additional details.'
                                        : ''}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
