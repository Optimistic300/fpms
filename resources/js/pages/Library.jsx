import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';
import SearchPanel from '../components/library/SearchPanel';
import BrowsePanel from '../components/library/BrowsePanel';
import DocumentPreview from '../components/library/DocumentPreview';
import ForwardModal from '../components/library/ForwardModal';

export default function Library() {
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [activeView, setActiveView] = useState('browse');
    const [previewDoc, setPreviewDoc] = useState(null);
    const [forwardDocId, setForwardDocId] = useState(null);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await apiClient.get('/library/stats');
            setStats(res.data?.data || null);
        } catch {
            setStats(null);
        }
        setStatsLoading(false);
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handlePreview = (doc) => {
        setPreviewDoc(doc);
    };

    const handleDownload = (docId) => {
        window.open(`/api/documents/${docId}/download`, '_blank');
    };

    const handleForward = (docId) => {
        setForwardDocId(docId);
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-brand-dark)', margin: '0 0 4px' }}>
                    Library
                </h1>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Browse and search the institute's permanent knowledge base
                </p>
            </div>

            {statsLoading ? (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                            flex: 1, height: '80px', backgroundColor: '#f8fafc',
                            borderRadius: '10px',
                        }} />
                    ))}
                </div>
            ) : stats ? (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{
                        flex: '1 1 180px', padding: '16px', backgroundColor: 'white',
                        border: '1px solid #e2e8f0', borderRadius: '10px',
                    }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {stats.totalDocuments}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            Total documents
                        </div>
                    </div>
                    {stats.topDivisions?.map((div, i) => (
                        <div key={i} style={{
                            flex: '1 1 180px', padding: '16px', backgroundColor: 'white',
                            border: '1px solid #e2e8f0', borderRadius: '10px',
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#2f855a' }}>
                                {div.count}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                {div.division}
                            </div>
                        </div>
                    ))}
                    <div style={{
                        flex: '1 1 180px', padding: '16px', backgroundColor: 'white',
                        border: '1px solid #e2e8f0', borderRadius: '10px',
                    }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#d69e2e' }}>
                            {stats.addedThisQuarter}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            Added this quarter
                        </div>
                    </div>
                </div>
            ) : null}

            <div style={{
                display: 'flex', gap: '4px', borderBottom: '1px solid #e2e8f0',
                marginBottom: '20px',
            }}>
                <button
                    onClick={() => setActiveView('browse')}
                    style={{
                        padding: '10px 16px', fontSize: '14px',
                        fontWeight: activeView === 'browse' ? 600 : 400,
                        color: activeView === 'browse' ? 'var(--color-primary)' : '#64748b',
                        background: 'none', border: 'none',
                        borderBottom: activeView === 'browse' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        cursor: 'pointer',
                    }}
                >
                    Browse
                </button>
                <button
                    onClick={() => setActiveView('search')}
                    style={{
                        padding: '10px 16px', fontSize: '14px',
                        fontWeight: activeView === 'search' ? 600 : 400,
                        color: activeView === 'search' ? 'var(--color-primary)' : '#64748b',
                        background: 'none', border: 'none',
                        borderBottom: activeView === 'search' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        cursor: 'pointer',
                    }}
                >
                    Search
                </button>
            </div>

            {activeView === 'browse' && (
                <BrowsePanel
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onForward={handleForward}
                />
            )}

            {activeView === 'search' && (
                <SearchPanel
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onForward={handleForward}
                />
            )}

            {previewDoc && (
                <DocumentPreview
                    document={previewDoc}
                    onClose={() => setPreviewDoc(null)}
                />
            )}

            {forwardDocId && (
                <ForwardModal
                    documentId={forwardDocId}
                    onClose={() => setForwardDocId(null)}
                />
            )}
        </div>
    );
}
