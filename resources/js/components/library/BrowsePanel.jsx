import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/axios';

export default function BrowsePanel({ onPreview, onDownload, onForward }) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [documents, setDocuments] = useState([]);
    const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nameFilter, setNameFilter] = useState('');
    const [divisionFilter, setDivisionFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [areaFilter, setAreaFilter] = useState('');
    const [divisions, setDivisions] = useState([]);
    const [docTypes, setDocTypes] = useState([]);
    const [researchAreas, setResearchAreas] = useState([]);
    const debounceRef = useRef(null);

    const params = { page: meta.currentPage, limit: 20 };
    if (divisionFilter) params.division = divisionFilter;
    if (typeFilter) params.documentType = typeFilter;
    if (areaFilter) params.researchArea = areaFilter;
    if (nameFilter) params.q = nameFilter;

    const fetchDocuments = useCallback(async (page = 1, append = false) => {
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        try {
            const res = await apiClient.get('/library/documents', {
                params: { ...params, page },
            });
            const data = res.data;
            const docs = data.data || [];
            if (append) {
                setDocuments(prev => [...prev, ...docs]);
            } else {
                setDocuments(docs);
            }
            setMeta(data.meta || { currentPage: 1, lastPage: 1, total: 0 });
        } catch {
            if (!append) setDocuments([]);
        }
        setLoading(false);
        setLoadingMore(false);
    }, [divisionFilter, typeFilter, areaFilter, nameFilter]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchDocuments(1);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [divisionFilter, typeFilter, areaFilter, nameFilter]);

    const fetchFilterOptions = useCallback(async () => {
        try {
            const res = await apiClient.get('/library/documents', { params: { page: 1, limit: 1 } });
            return res.data?.meta?.filters;
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        fetchFilterOptions().then(filters => {
            if (filters) {
                setDivisions(filters.divisions || []);
                setDocTypes(filters.documentTypes || []);
                setResearchAreas(filters.researchAreas || []);
            }
        });
    }, []);

    const handleLoadMore = () => {
        const nextPage = meta.currentPage + 1;
        if (nextPage > meta.lastPage) return;
        setMeta(prev => ({ ...prev, currentPage: nextPage }));
        fetchDocuments(nextPage, true);
    };

    const handleClearFilters = () => {
        setNameFilter('');
        setDivisionFilter('');
        setTypeFilter('');
        setAreaFilter('');
    };

    const hasActiveFilters = nameFilter || divisionFilter || typeFilter || areaFilter;
    const showEmptyState = !loading && documents.length === 0;

    return (
        <div>
            <div style={{
                display: 'flex', gap: '8px', flexWrap: 'wrap',
                marginBottom: '16px', alignItems: 'flex-end',
            }}>
                <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>
                        Name
                    </label>
                    <input
                        type="text"
                        value={nameFilter}
                        onChange={e => setNameFilter(e.target.value)}
                        placeholder="Filter by name..."
                        style={{
                            width: '100%', padding: '8px 10px', fontSize: '13px',
                            border: '1px solid #e2e8f0', borderRadius: '6px',
                            outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                </div>
                <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>
                        Division
                    </label>
                    <select
                        value={divisionFilter}
                        onChange={e => setDivisionFilter(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 10px', fontSize: '13px',
                            border: '1px solid #e2e8f0', borderRadius: '6px',
                            outline: 'none', backgroundColor: 'white', boxSizing: 'border-box',
                        }}
                    >
                        <option value="">All divisions</option>
                        {divisions.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>
                        Document type
                    </label>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 10px', fontSize: '13px',
                            border: '1px solid #e2e8f0', borderRadius: '6px',
                            outline: 'none', backgroundColor: 'white', boxSizing: 'border-box',
                        }}
                    >
                        <option value="">All types</option>
                        {docTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4a5568', marginBottom: '4px' }}>
                        Research area
                    </label>
                    <select
                        value={areaFilter}
                        onChange={e => setAreaFilter(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 10px', fontSize: '13px',
                            border: '1px solid #e2e8f0', borderRadius: '6px',
                            outline: 'none', backgroundColor: 'white', boxSizing: 'border-box',
                        }}
                    >
                        <option value="">All areas</option>
                        {researchAreas.map(a => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>
            </div>

            {showEmptyState && (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    {isAdmin && !hasActiveFilters ? (
                        <p style={{ margin: 0 }}>The library has no published documents yet.</p>
                    ) : (
                        <div>
                            <p style={{ margin: '0 0 12px' }}>No documents match your filters.</p>
                            <button
                                onClick={handleClearFilters}
                                style={{
                                    padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                                    color: '#2b6cb0', backgroundColor: '#ebf4ff',
                                    border: '1px solid #bee3f8', borderRadius: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            )}

            {loading && !loadingMore && (
                <div>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 16px', marginBottom: '8px',
                            backgroundColor: '#f8fafc', borderRadius: '8px',
                        }}>
                            <div style={{
                                width: '60px', height: '16px', backgroundColor: '#e2e8f0',
                                borderRadius: '4px',
                            }} />
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    width: '60%', height: '14px', backgroundColor: '#e2e8f0',
                                    borderRadius: '4px', marginBottom: '6px',
                                }} />
                                <div style={{
                                    width: '40%', height: '12px', backgroundColor: '#e2e8f0',
                                    borderRadius: '4px',
                                }} />
                            </div>
                            <div style={{
                                width: '80px', height: '12px', backgroundColor: '#e2e8f0',
                                borderRadius: '4px',
                            }} />
                            <div style={{
                                width: '60px', height: '12px', backgroundColor: '#e2e8f0',
                                borderRadius: '4px',
                            }} />
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <div style={{
                                    width: '28px', height: '28px', backgroundColor: '#e2e8f0',
                                    borderRadius: '4px',
                                }} />
                                <div style={{
                                    width: '28px', height: '28px', backgroundColor: '#e2e8f0',
                                    borderRadius: '4px',
                                }} />
                                <div style={{
                                    width: '28px', height: '28px', backgroundColor: '#e2e8f0',
                                    borderRadius: '4px',
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && documents.length > 0 && (
                <div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                        {meta.total} document{meta.total !== 1 ? 's' : ''}
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 200px 140px 160px 120px',
                        gap: '8px',
                        padding: '10px 16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #e2e8f0',
                        marginBottom: '4px',
                    }}>
                        <span>Document</span>
                        <span>Project / Division</span>
                        <span>Research area</span>
                        <span>Uploaded by</span>
                        <span style={{ textAlign: 'center' }}>Actions</span>
                    </div>

                    {documents.map(doc => (
                        <div key={doc.id} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 200px 140px 160px 120px',
                            gap: '8px',
                            padding: '12px 16px',
                            alignItems: 'center',
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: '13px',
                            color: '#1a202c',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <span style={{
                                    fontSize: '11px', fontWeight: 600, color: '#2b6cb0',
                                    backgroundColor: '#ebf4ff', padding: '1px 6px', borderRadius: '4px',
                                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                                }}>
                                    {doc.type}
                                </span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {doc.title}
                                </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {doc.division}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {doc.researchArea || '-'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                <div>{doc.uploadedBy}</div>
                                <div style={{ fontSize: '11px', color: '#a0aec0' }}>
                                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-GB') : ''}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => onPreview(doc)}
                                    title="Preview"
                                    style={iconBtnStyle}
                                >
                                    👁
                                </button>
                                <button
                                    onClick={() => onDownload(doc.id)}
                                    title="Download"
                                    style={iconBtnStyle}
                                >
                                    ⬇
                                </button>
                                <button
                                    onClick={() => onForward(doc.id)}
                                    title="Forward"
                                    style={iconBtnStyle}
                                >
                                    ➡
                                </button>
                            </div>
                        </div>
                    ))}

                    {meta.currentPage < meta.lastPage && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                style={{
                                    padding: '10px 24px', fontSize: '14px', fontWeight: 600,
                                    color: '#2b6cb0', backgroundColor: 'white',
                                    border: '1px solid #bee3f8', borderRadius: '8px',
                                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {loadingMore ? 'Loading...' : `Load more (showing ${documents.length} of ${meta.total})`}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {loadingMore && (
                <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                    Loading more...
                </div>
            )}
        </div>
    );
}

const iconBtnStyle = {
    width: '30px', height: '30px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '14px', background: 'none',
    border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer',
    padding: 0,
};
