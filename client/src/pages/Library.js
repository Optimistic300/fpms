import { useState, useEffect } from 'react';
import { BookOpen, Download, Search, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ForwardModal from '../components/ForwardModal';
import { fmtDate } from '../utils/format';
import {
    useLibrary, useLibrarySearch, useLibraryStats,
    useDivisions,
} from '../hooks/queries';

async function downloadFile(docId, fileName) {
    try {
        const response = await api.get(`/documents/download/${docId}`, { responseType: 'blob' });
        const url = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    } catch {
        toast.error('Failed to download file');
    }
}

function fileLabel(fileType) {
    if (!fileType) return 'FILE';
    const t = fileType.split('/')[1] || fileType;
    const map = {
        'pdf': 'PDF',
        'vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
        'msword': 'DOC',
        'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
        'csv': 'CSV',
        'png': 'PNG',
        'jpeg': 'JPG',
    };
    return map[t] || t.toUpperCase().slice(0, 4);
}

function fileChipClass(fileType) {
    if (!fileType) return '';
    const t = fileType.split('/')[1] || fileType;
    if (t === 'pdf') return 'ftc-pdf';
    if (t === 'vnd.openxmlformats-officedocument.wordprocessingml.document' || t === 'msword') return 'ftc-docx';
    if (t === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' || t === 'csv') return 'ftc-xlsx';
    if (fileType.startsWith('image/')) return 'ftc-img';
    return '';
}

export default function Library() {
    const [search, setSearch]             = useState('');
    const [divisionId, setDivisionId]     = useState('');
    const [researchArea, setResearchArea] = useState('');
    const [filterParams, setFilterParams] = useState({});
    const [aiQuery, setAiQuery]           = useState('');

    const { data: docs = [], isPending }  = useLibrary(filterParams);
    const { data: stats }                 = useLibraryStats();
    const { data: divisions = [] }        = useDivisions();
    const { mutate: aiSearch, data: aiResults, isPending: aiLoading, reset: resetAiSearch } = useLibrarySearch();

    /* Debounced live filter — 300 ms after last keystroke */
    useEffect(() => {
        const t = setTimeout(() => {
            setFilterParams({
                search:       search       || undefined,
                divisionId:   divisionId   || undefined,
                researchArea: researchArea || undefined,
            });
        }, 300);
        return () => clearTimeout(t);
    }, [search, divisionId, researchArea]);

    const handleAiSearch = (e) => {
        e.preventDefault();
        if (!aiQuery.trim()) return;
        aiSearch(aiQuery);
    };

    const clearAi = () => { resetAiSearch(); setAiQuery(''); };

    return (
        <div className="app-shell">
            <Navbar />
            <main id="main-content">
                <div className="page">
                    <div className="page-inner">
                        <div className="page-header">
                            <div className="t-title">Document Library</div>
                            <div className="t-small">Published research documents and reports</div>
                        </div>

                        {/* Stats — Total + top 3 divisions */}
                        {stats && (
                            <div className="stat-grid">
                                <div className="stat-card">
                                    <div className="stat-num">{stats.total}</div>
                                    <div className="stat-label">
                                        <span className="stat-dot" aria-hidden="true" />
                                        Total Documents
                                    </div>
                                    <div className="stat-bar" aria-hidden="true">
                                        <div className="stat-fill" style={{ '--fill': '100%' }} />
                                    </div>
                                </div>
                                {stats.byDivision?.slice(0, 3).map(item => (
                                    <div key={item.name} className="stat-card info">
                                        <div className="stat-num">{item.count}</div>
                                        <div className="stat-label">
                                            <span className="stat-dot" aria-hidden="true" />
                                            {item.name.split(' ').slice(0, 2).join(' ')}
                                        </div>
                                        <div className="stat-bar" aria-hidden="true">
                                            <div
                                                className="stat-fill"
                                                style={{ '--fill': `${Math.round(item.count / (stats.total || 1) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* AI Search */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Content Search</span>
                                <span className="t-small">Search inside document content</span>
                            </div>
                            <div style={{ padding: 'var(--space-4) var(--space-6)' }}>
                                <form onSubmit={handleAiSearch} className="ai-search-row">
                                    <input
                                        className="search-input"
                                        style={{ flex: 1 }}
                                        value={aiQuery}
                                        onChange={e => setAiQuery(e.target.value)}
                                        placeholder="Ask a question about FORIG research — e.g. 'biodiversity findings in 2024'"
                                        aria-label="AI search query"
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-sm"
                                        disabled={aiLoading || !aiQuery.trim()}
                                    >
                                        <Search size={13} aria-hidden="true" />
                                        {aiLoading ? 'Searching…' : 'Search'}
                                    </button>
                                    {aiResults && (
                                        <button type="button" className="btn btn-outline btn-sm" onClick={clearAi}>
                                            Clear
                                        </button>
                                    )}
                                </form>

                                {aiResults && (
                                    <div className="ai-results">
                                        {aiResults.length === 0 ? (
                                            <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
                                                <Search size={28} className="empty-icon" aria-hidden="true" />
                                                <div className="empty-title">No matching documents found</div>
                                                <div className="empty-sub">Try different search terms</div>
                                            </div>
                                        ) : (
                                            aiResults.map(r => (
                                                <div key={r.id} className="ai-result-card">
                                                    <div className="ai-result-top">
                                                        <span className={`file-type-chip ${fileChipClass(r.fileType)}`}>
                                                            {fileLabel(r.fileType)}
                                                        </span>
                                                        <span className="td-primary u-fw-600">{r.fileName}</span>
                                                    </div>
                                                    <div
                                                        className="ai-snippet"
                                                        dangerouslySetInnerHTML={{ __html: r.snippet }}
                                                    />
                                                    <div className="ai-result-meta">
                                                        {r.projectTitle && (
                                                            <span className="chip">
                                                                {r.projectTitle.split(' ').slice(0, 3).join(' ')}
                                                            </span>
                                                        )}
                                                        {r.divisionName && (
                                                            <span className="td-secondary u-fs-11">{r.divisionName}</span>
                                                        )}
                                                        {r.uploaderName && (
                                                            <span className="td-secondary u-fs-11">by {r.uploaderName}</span>
                                                        )}
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => downloadFile(r.id, r.fileName)}
                                                        >
                                                            <Download size={12} aria-hidden="true" /> Download
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Browse */}
                        <div className="card">
                            <div className="card-header card-header-filters">
                                <span className="card-title">
                                    Browse Library
                                    {docs.length > 0 && (
                                        <span className="card-count"> ({docs.length})</span>
                                    )}
                                </span>
                                <div className="filter-row">
                                    <input
                                        className="search-input"
                                        placeholder="Search by file name…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        aria-label="Search documents"
                                    />
                                    <select
                                        className="form-select filter-select"
                                        value={divisionId}
                                        onChange={e => setDivisionId(e.target.value)}
                                        aria-label="Filter by division"
                                    >
                                        <option value="">All Divisions</option>
                                        {divisions.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        className="search-input filter-select"
                                        placeholder="Research area…"
                                        value={researchArea}
                                        onChange={e => setResearchArea(e.target.value)}
                                        aria-label="Filter by research area"
                                    />
                                </div>
                            </div>

                            {isPending ? (
                                <div className="empty-state">
                                    <div className="empty-title">Loading…</div>
                                </div>
                            ) : docs.length === 0 ? (
                                <div className="empty-state">
                                    <BookOpen size={32} className="empty-icon" aria-hidden="true" />
                                    <div className="empty-title">No documents in library</div>
                                    <div className="empty-sub">
                                        {search || divisionId || researchArea
                                            ? 'No documents match your filters'
                                            : 'Publish documents from My Activities to build the library'}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop table */}
                                    <div className="desktop-table">
                                        <div className="table-wrap">
                                            <table>
                                                <caption className="sr-only">Library documents</caption>
                                                <thead>
                                                    <tr>
                                                        <th scope="col">Document</th>
                                                        <th scope="col">Project</th>
                                                        <th scope="col">Division</th>
                                                        <th scope="col">Research Area</th>
                                                        <th scope="col">Uploaded by</th>
                                                        <th scope="col">Date</th>
                                                        <th scope="col" />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {docs.map(doc => (
                                                        <DocRow key={doc.id} doc={doc} />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Mobile cards */}
                                    <div className="mobile-rows">
                                        {docs.map(doc => (
                                            <DocCard key={doc.id} doc={doc} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function DocRow({ doc }) {
    const [showForward, setShowForward] = useState(false);
    return (
        <>
            <tr>
                <td>
                    <div className="doc-name-cell">
                        <span className={`file-type-chip ${fileChipClass(doc.fileType)}`}>
                            {fileLabel(doc.fileType)}
                        </span>
                        <span className="td-primary">{doc.fileName}</span>
                    </div>
                </td>
                <td className="td-secondary">{doc.projectTitle || '—'}</td>
                <td className="td-secondary u-fs-11">{doc.divisionName || '—'}</td>
                <td className="td-secondary u-fs-11">{doc.researchArea || '—'}</td>
                <td className="td-secondary">{doc.uploaderName}</td>
                <td className="td-mono u-nowrap">{fmtDate(doc.createdAt)}</td>
                <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setShowForward(true)}
                            title="Forward document"
                            aria-label="Forward document"
                        >
                            <Send size={12} aria-hidden="true" />
                        </button>
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => downloadFile(doc.id, doc.fileName)}
                        >
                            <Download size={12} aria-hidden="true" /> Download
                        </button>
                    </div>
                </td>
            </tr>
            {showForward && <ForwardModal doc={doc} onClose={() => setShowForward(false)} />}
        </>
    );
}

function DocCard({ doc }) {
    const [showForward, setShowForward] = useState(false);
    return (
        <div className="mobile-row">
            <div className="mobile-row-top">
                <div className="u-flex-1 u-min-w-0">
                    <div className="mobile-row-name">
                        <span className={`file-type-chip ${fileChipClass(doc.fileType)}`}>
                            {fileLabel(doc.fileType)}
                        </span>
                        {' '}{doc.fileName}
                    </div>
                    <div className="mobile-row-sub">{doc.uploaderName} · {fmtDate(doc.createdAt)}</div>
                </div>
            </div>
            <div className="mobile-row-meta">
                {doc.projectTitle && (
                    <span className="chip">{doc.projectTitle.split(' ').slice(0, 3).join(' ')}</span>
                )}
                {doc.divisionName && (
                    <span className="td-secondary u-fs-11">{doc.divisionName}</span>
                )}
                {doc.researchArea && (
                    <span className="td-secondary u-fs-11">{doc.researchArea}</span>
                )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowForward(true)}>
                    <Send size={12} aria-hidden="true" /> Forward
                </button>
                <button
                    className="btn btn-outline btn-sm"
                    onClick={() => downloadFile(doc.id, doc.fileName)}
                >
                    <Download size={12} aria-hidden="true" /> Download
                </button>
            </div>
            {showForward && <ForwardModal doc={doc} onClose={() => setShowForward(false)} />}
        </div>
    );
}
