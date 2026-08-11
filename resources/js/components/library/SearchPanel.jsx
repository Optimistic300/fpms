import { useState, useRef } from 'react';
import DOMPurify from 'dompurify';
import apiClient from '../../api/axios';

export default function SearchPanel({ onPreview, onDownload, onForward, onOpenAiPanel }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [meta, setMeta] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const inputRef = useRef(null);

    const handleSearch = async (e) => {
        e?.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        setSearching(true);
        setSearched(true);
        try {
            const res = await apiClient.get('/library/search', { params: { q: trimmed } });
            const data = res.data;
            setResults(data.data || []);
            setMeta(data.meta || null);
        } catch {
            setResults([]);
            setMeta(null);
        }
        setSearching(false);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setMeta(null);
        setSearched(false);
        inputRef.current?.focus();
    };

    return (
        <div>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search the library..."
                    style={{
                        flex: 1, padding: '10px 14px', fontSize: '14px',
                        border: '1px solid #e2e8f0', borderRadius: '8px',
                        outline: 'none',
                    }}
                />
                <button
                    type="submit"
                    disabled={!query.trim() || searching}
                    style={{
                        padding: '10px 20px', fontSize: '14px', fontWeight: 600,
                        color: 'white', backgroundColor: !query.trim() ? '#a0aec0' : 'var(--color-primary)',
                        border: 'none', borderRadius: '8px',
                        cursor: !query.trim() ? 'not-allowed' : 'pointer',
                    }}
                >
                    {searching ? 'Searching...' : 'Search'}
                </button>
                {searched && (
                    <button
                        type="button"
                        onClick={handleClear}
                        style={{
                            padding: '10px 16px', fontSize: '14px', color: '#64748b',
                            background: 'white', border: '1px solid #e2e8f0',
                            borderRadius: '8px', cursor: 'pointer',
                        }}
                    >
                        Clear
                    </button>
                )}
            </form>

            {searched && results.length > 0 && (
                <div style={{
                    padding: '10px 14px', backgroundColor: '#fffff0',
                    border: '1px solid #f6e05e', borderRadius: '8px',
                    fontSize: '13px', color: '#744210', marginBottom: '16px',
                }}>
                    This is full-text search, not AI. For a synthesised answer use the Ask FPMS button.
                </div>
            )}

            {searching && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    Searching...
                </div>
            )}

            {!searching && searched && results.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    <p style={{ margin: '0 0 8px' }}>
                        No documents found matching '<strong>{query}</strong>'. Try different keywords or use Ask FPMS for a synthesised answer.
                    </p>
                    {onOpenAiPanel && (
                        <button
                            onClick={onOpenAiPanel}
                            style={{
                                padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                                color: 'var(--color-primary)', backgroundColor: '#ebf4ff',
                                border: '1px solid #bee3f8', borderRadius: '6px',
                                cursor: 'pointer', marginTop: '8px',
                            }}
                        >
                            Ask FPMS
                        </button>
                    )}
                </div>
            )}

            {!searching && results.length > 0 && (
                <div>
                    {meta && (
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                            {meta.total} result{meta.total !== 1 ? 's' : ''} found
                        </div>
                    )}
                    {results.map(doc => (
                        <div key={doc.id} style={{
                            padding: '16px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            backgroundColor: 'white',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{
                                    fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)',
                                    backgroundColor: '#ebf4ff', padding: '2px 6px', borderRadius: '4px',
                                    textTransform: 'uppercase',
                                }}>
                                    {doc.type}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a202c' }}>
                                    {doc.title}
                                </span>
                            </div>

                            {doc.snippet && (
                                <div
                                    style={{
                                        fontSize: '13px', color: '#4a5568', lineHeight: 1.5,
                                        marginBottom: '10px',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.snippet) }}
                                />
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', fontSize: '12px', color: '#718096' }}>
                                <span style={{
                                    fontSize: '11px', fontWeight: 500, color: '#2f855a',
                                    backgroundColor: '#f0fff4', padding: '2px 6px', borderRadius: '4px',
                                }}>
                                    {doc.division}
                                </span>
                                <span>{doc.author}</span>
                                <span>·</span>
                                <span>{doc.date ? new Date(doc.date).toLocaleDateString('en-GB') : ''}</span>
                                <span>·</span>
                                <span style={{
                                    fontSize: '11px', fontWeight: 500, color: '#d69e2e',
                                    backgroundColor: '#fffff0', padding: '2px 6px', borderRadius: '4px',
                                }}>
                                    {doc.documentType}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => onPreview(doc)}
                                    style={actionBtnStyle}
                                >
                                    Preview
                                </button>
                                <button
                                    onClick={() => onDownload(doc.id)}
                                    style={actionBtnStyle}
                                >
                                    Download
                                </button>
                                <button
                                    onClick={() => onForward(doc.id)}
                                    style={actionBtnStyle}
                                >
                                    Forward
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const actionBtnStyle = {
    padding: '6px 12px', fontSize: '12px', fontWeight: 500,
    color: 'var(--color-primary)', backgroundColor: 'white',
    border: '1px solid #e2e8f0', borderRadius: '6px',
    cursor: 'pointer',
};
