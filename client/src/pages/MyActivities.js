import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MyActivities() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/activities/mine')
            .then(res => { setActivities(res.data); setLoading(false); })
            .catch(() => navigate('/'));
    }, [navigate]);

    if (loading) return <div className="loading-screen">Loading…</div>;

    return (
        <div className="app-shell">
            <Navbar />
            <main>
                <div className="page">
                    <div className="page-inner">
                        <div className="page-header">
                            <div className="t-title">My Activities</div>
                            <div className="t-small">All activities logged by you across projects</div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Activity log</span>
                                <span className="t-small">
                                    <strong style={{ color: 'var(--slate-900)', fontFamily: 'var(--font-display)' }}>
                                        {activities.length}
                                    </strong>
                                    {' '}entries
                                </span>
                            </div>

                            {/* Desktop table */}
                            <div className="desktop-table">
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Project</th>
                                                <th>Activity</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activities.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4">
                                                        <div className="empty-state">
                                                            <div className="empty-icon">📋</div>
                                                            <div className="empty-title">No activities yet</div>
                                                            <div className="empty-sub">Start by logging your first activity</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                activities.map(a => (
                                                    <tr key={a.id}>
                                                        <td className="td-mono" style={{ whiteSpace: 'nowrap' }}>
                                                            {fmtDate(a.activityDate)}
                                                        </td>
                                                        <td>
                                                            <span className="chip">
                                                                {(a.projectTitle || '').split(' ').slice(0, 2).join(' ')}
                                                            </span>
                                                        </td>
                                                        <td className="td-primary" style={{ fontWeight: 400, maxWidth: '280px' }}>
                                                            {a.description}
                                                        </td>
                                                        <td className="td-secondary">{a.notes || '—'}</td>
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
                                        <div className="empty-icon">📋</div>
                                        <div className="empty-title">No activities yet</div>
                                        <div className="empty-sub">Start by logging your first activity</div>
                                    </div>
                                ) : (
                                    activities.map(a => (
                                        <div className="mobile-row" key={a.id}>
                                            <div className="mobile-row-top">
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="mobile-row-name" style={{ fontSize: '14px', fontWeight: 400 }}>
                                                        {a.description}
                                                    </div>
                                                </div>
                                                <span className="chip">{(a.projectTitle || '').split(' ').slice(0, 2).join(' ')}</span>
                                            </div>
                                            <div className="mobile-row-meta">
                                                <span className="td-mono" style={{ fontSize: '11px' }}>{fmtDate(a.activityDate)}</span>
                                                {a.notes && (
                                                    <span className="td-secondary" style={{ fontSize: '11px' }}>{a.notes}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
