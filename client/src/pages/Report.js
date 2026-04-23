import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function Report() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState(new Date().toISOString().split('T')[0]);
    const [activities, setActivities] = useState([]);
    const [fetched, setFetched] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/projects')
            .then(res => setProjects(res.data))
            .catch(() => navigate('/'));
    }, [navigate]);

    const handleFetch = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.get('/activities/report', { params: { projectId, start, end } });
            setActivities(response.data);
            setFetched(true);
        } catch {
            setError('Failed to fetch report');
        }
    };

    const exportCSV = () => {
        const headers = 'Date,Activity,Notes,Logged By\n';
        const rows = activities.map(a =>
            `${a.activityDate},"${a.description}","${a.notes || ''}","${a.userName}"`
        ).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fpms_report_${start}_to_${end}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="app-shell">
            <Navbar />
            <main>
                <div className="page">
                    <div className="page-inner">
                        <div className="page-header">
                            <div className="t-title">Activity Reports</div>
                            <div className="t-small">Filter and export logged activities by project or date range</div>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleFetch}>
                            <div className="filter-bar">
                                <div className="form-group">
                                    <label className="form-label">Project</label>
                                    <select
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
                                    <label className="form-label">From</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={start}
                                        onChange={e => setStart(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">To</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={end}
                                        onChange={e => setEnd(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0' }}>
                                    <button type="submit" className="btn btn-primary btn-sm">
                                        Fetch Results
                                    </button>
                                </div>
                            </div>
                        </form>

                        {fetched && (
                            <>
                                <div className="found-bar">
                                    <div className="found-text">
                                        <span className="found-count">{activities.length}</span> activities found
                                    </div>
                                    {activities.length > 0 && (
                                        <button className="export-btn" onClick={exportCSV}>
                                            ⬇ Export CSV
                                        </button>
                                    )}
                                </div>

                                <div className="card">
                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Activity</th>
                                                    <th>Notes</th>
                                                    <th>Logged By</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activities.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4">
                                                            <div className="empty-state">
                                                                <div className="empty-icon">📋</div>
                                                                <div className="empty-title">No activities in this range</div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    activities.map(a => (
                                                        <tr key={a.id}>
                                                            <td className="td-mono" style={{ whiteSpace: 'nowrap' }}>
                                                                {fmtDate(a.activityDate)}
                                                            </td>
                                                            <td className="td-primary" style={{ fontWeight: 400 }}>
                                                                {a.description}
                                                            </td>
                                                            <td className="td-secondary">{a.notes || '—'}</td>
                                                            <td className="td-secondary">{a.userName}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {!fetched && (
                            <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <div className="empty-title">No results yet</div>
                                <div className="empty-sub">Select filters above and click <strong>Fetch Results</strong></div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
