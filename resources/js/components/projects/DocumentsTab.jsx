import { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import DocumentActions from '../documents/DocumentActions';

export default function DocumentsTab({ projectId, selected }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!selected || loaded) return;
        setLoading(true);
        apiClient
            .get('/documents', { params: { projectId } })
            .then((res) => {
                setDocuments(res.data.data || []);
                setLoaded(true);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [selected, loaded, projectId]);

    if (!selected) return null;

    if (loading) {
        return (
            <div style={{ padding: '20px 0', color: '#94a3b8', fontSize: '14px' }}>
                Loading documents...
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div
                style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '14px',
                }}
            >
                No documents uploaded yet.
            </div>
        );
    }

    return (
        <div>
            {documents.map((doc) => (
                <div
                    key={doc.id}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 16px',
                        borderBottom: '1px solid #f1f5f9',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flex: 1,
                        }}
                    >
                        <span
                            style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--color-primary-dark)',
                                backgroundColor: 'var(--color-primary-bg)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {doc.type || 'DOC'}
                        </span>
                        <span
                            style={{
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#1e293b',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {doc.filename}
                        </span>
                    </div>
                    <DocumentActions document={doc} />
                </div>
            ))}
        </div>
    );
}
