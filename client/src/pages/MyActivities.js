import { ClipboardList } from 'lucide-react';
import Navbar from '../components/Navbar';
import { fmtDate } from '../utils/format';
import { useMyActivities } from '../hooks/queries';

export default function MyActivities() {
    const { data: activities = [], isPending } = useMyActivities();

    if (isPending) return <div className="loading-screen">Loading…</div>;

    return (
        <div className="app-shell">
            <Navbar />
            <main id="main-content">
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
                                    <strong className="u-c-slate900 u-ff-display">
                                        {activities.length}
                                    </strong>
                                    {' '}entries
                                </span>
                            </div>

                            {/* Desktop table */}
                            <div className="desktop-table">
                                <div className="table-wrap">
                                    <table>
                                        <caption className="sr-only">Activity log</caption>
                                        <thead>
                                            <tr>
                                                <th scope="col">Date</th>
                                                <th scope="col">Project</th>
                                                <th scope="col">Activity</th>
                                                <th scope="col">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activities.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4">
                                                        <div className="empty-state">
                                                            <ClipboardList size={32} className="empty-icon" aria-hidden="true" />
                                                            <div className="empty-title">No activities yet</div>
                                                            <div className="empty-sub">Start by logging your first activity</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                activities.map(a => (
                                                    <tr key={a.id}>
                                                        <td className="td-mono u-nowrap">
                                                            {fmtDate(a.activityDate)}
                                                        </td>
                                                        <td>
                                                            <span className="chip">
                                                                {(a.projectTitle || '').split(' ').slice(0, 2).join(' ')}
                                                            </span>
                                                        </td>
                                                        <td className="td-primary u-fw-400 u-max-w-280">
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
                                        <ClipboardList size={32} className="empty-icon" aria-hidden="true" />
                                        <div className="empty-title">No activities yet</div>
                                        <div className="empty-sub">Start by logging your first activity</div>
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
                                                <span className="chip">
                                                    {(a.projectTitle || '').split(' ').slice(0, 2).join(' ')}
                                                </span>
                                            </div>
                                            <div className="mobile-row-meta">
                                                <span className="td-mono u-fs-11">{fmtDate(a.activityDate)}</span>
                                                {a.notes && (
                                                    <span className="td-secondary u-fs-11">{a.notes}</span>
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
