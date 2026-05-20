import { useState, useEffect } from 'react';
import { Download, ClipboardList, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { fmtDate } from '../utils/format';
import { exportCSV } from '../utils/csv';
import { useProjects, useReport } from '../hooks/queries';

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

export default function Report() {
    const [projectId, setProjectId]     = useState('');
    const [start, setStart]             = useState('');
    const [end, setEnd]                 = useState(new Date().toISOString().split('T')[0]);
    const [reportParams, setReportParams] = useState(null);

    const { data: projects = [] } = useProjects();
    const { data: activities = [], isFetching: reportLoading, isError } = useReport(reportParams);

    const fetched = reportParams !== null;

    useEffect(() => {
        if (isError) toast.error('Failed to fetch report');
    }, [isError]);

    const handleFetch = (e) => {
        e.preventDefault();
        setReportParams({ projectId, start, end });
    };

    return (
        <div className="app-shell">
            <Navbar />
            <main id="main-content">
                <div className="page">
                    <div className="page-inner">
                        <div className="page-header">
                            <div className="t-title">Activity Reports</div>
                            <div className="t-small">Filter and export logged activities by project or date range</div>
                        </div>

                        <form onSubmit={handleFetch}>
                            <div className="filter-bar">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="rep-project">Project</label>
                                    <select
                                        id="rep-project"
                                        className="form-select"
                                        value={projectId}
                                        onChange={e => setProjectId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select project…</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="rep-start">From</label>
                                    <input
                                        id="rep-start"
                                        type="date"
                                        className="form-input"
                                        value={start}
                                        onChange={e => setStart(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="rep-end">To</label>
                                    <input
                                        id="rep-end"
                                        type="date"
                                        className="form-input"
                                        value={end}
                                        onChange={e => setEnd(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="filter-btn-wrap">
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={reportLoading}>
                                        {reportLoading ? 'Loading…' : 'Fetch Results'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {fetched && !reportLoading && (
                            <>
                                <div className="found-bar">
                                    <div className="found-text">
                                        <span className="found-count">{activities.length}</span> activities found
                                    </div>
                                    {activities.length > 0 && (
                                        <button
                                            className="export-btn"
                                            onClick={() => exportCSV(activities, start, end)}
                                        >
                                            <Download size={13} aria-hidden="true" /> Export CSV
                                        </button>
                                    )}
                                </div>

                                <div className="card">
                                    {/* Desktop table */}
                                    <div className="desktop-table">
                                        <div className="table-wrap">
                                            <table>
                                                <caption className="sr-only">Report results</caption>
                                                <thead>
                                                    <tr>
                                                        <th scope="col">Date</th>
                                                        <th scope="col">Activity</th>
                                                        <th scope="col">Notes</th>
                                                        <th scope="col">Logged By</th>
                                                        <th scope="col">Documents</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activities.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="5">
                                                                <div className="empty-state">
                                                                    <ClipboardList size={32} className="empty-icon" aria-hidden="true" />
                                                                    <div className="empty-title">No activities in this range</div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        activities.map(a => (
                                                            <tr key={a.id}>
                                                                <td className="td-mono u-nowrap">
                                                                    {fmtDate(a.activityDate)}
                                                                </td>
                                                                <td className="td-primary u-fw-400">
                                                                    {a.description}
                                                                </td>
                                                                <td className="td-secondary">{a.notes || '—'}</td>
                                                                <td className="td-secondary">{a.userName}</td>
                                                                <td>
                                                                    <ReportDocLinks docs={a.documents} />
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Mobile card rows */}
                                    <div className="mobile-rows">
                                        {activities.length === 0 ? (
                                            <div className="empty-state">
                                                <ClipboardList size={32} className="empty-icon" aria-hidden="true" />
                                                <div className="empty-title">No activities in this range</div>
                                            </div>
                                        ) : (
                                            activities.map(a => (
                                                <div className="mobile-row" key={a.id}>
                                                    <div className="mobile-row-top">
                                                        <div className="u-flex-1 u-min-w-0">
                                                            <div className="mobile-row-name u-fs-14 u-fw-400">
                                                                {a.description}
                                                            </div>
                                                        </div>
                                                        <span className="td-mono u-fs-11 u-shrink-0">
                                                            {fmtDate(a.activityDate)}
                                                        </span>
                                                    </div>
                                                    <div className="mobile-row-meta">
                                                        <span className="td-secondary u-fs-11">
                                                            {a.notes || '—'}
                                                        </span>
                                                        <span className="td-secondary u-fs-11 u-ml-auto">
                                                            {a.userName}
                                                        </span>
                                                    </div>
                                                    {a.documents?.length > 0 && (
                                                        <div className="doc-links">
                                                            <ReportDocLinks docs={a.documents} />
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {!fetched && (
                            <div className="empty-state">
                                <ClipboardList size={32} className="empty-icon" aria-hidden="true" />
                                <div className="empty-title">No results yet</div>
                                <div className="empty-sub">Select filters above and click <strong>Fetch Results</strong></div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function ReportDocLinks({ docs }) {
    if (!docs || docs.length === 0) return <span className="td-secondary">—</span>;
    return (
        <div className="doc-links">
            {docs.map(doc => (
                <button
                    key={doc.id}
                    className="doc-link"
                    onClick={() => downloadFile(doc.id, doc.fileName)}
                    title={doc.fileName}
                >
                    <Paperclip size={11} aria-hidden="true" />
                    <span className="doc-link-name">{doc.fileName}</span>
                </button>
            ))}
        </div>
    );
}
