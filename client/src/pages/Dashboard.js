import { useState } from 'react';
import { Leaf } from 'lucide-react';
import Navbar from '../components/Navbar';
import { STATUS_BADGE } from '../constants';
import { fmtDateShort } from '../utils/format';
import { useProjects } from '../hooks/queries';

export default function Dashboard() {
    const [search, setSearch] = useState('');
    const { data: projects = [], isPending } = useProjects();

    if (isPending) return <div className="loading-screen">Loading…</div>;

    const activeCount    = projects.filter(p => p.status === 'ACTIVE').length;
    const holdCount      = projects.filter(p => p.status === 'ON_HOLD').length;
    const completedCount = projects.filter(p => p.status === 'COMPLETED').length;
    const total          = projects.length || 1;

    const filtered = projects.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.leadName || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="app-shell">
            <Navbar />
            <main id="main-content">
                <div className="page">
                    <div className="page-inner">
                        <div className="page-header">
                            <div className="t-title">Overview</div>
                            <div className="t-small">FORIG research project tracker</div>
                        </div>

                        <div className="stat-grid">
                            <StatCard
                                count={activeCount}
                                label="Active Projects"
                                fillPct={activeCount / total * 100}
                            />
                            <StatCard
                                count={holdCount}
                                label="On Hold"
                                variant="warn"
                                fillPct={holdCount / total * 100}
                            />
                            <StatCard
                                count={completedCount}
                                label="Completed"
                                variant="info"
                                fillPct={completedCount / total * 100}
                            />
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">All Projects</span>
                                <input
                                    className="search-input"
                                    placeholder="Search projects…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    aria-label="Search projects"
                                />
                            </div>

                            {/* Desktop table */}
                            <div className="desktop-table">
                                <div className="table-wrap">
                                    <table>
                                        <caption className="sr-only">All projects</caption>
                                        <thead>
                                            <tr>
                                                <th scope="col">Project</th>
                                                <th scope="col">Lead</th>
                                                <th scope="col">Status</th>
                                                <th scope="col">Activities</th>
                                                <th scope="col">Last Update</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5">
                                                        <div className="empty-state">
                                                            <Leaf size={32} className="empty-icon" aria-hidden="true" />
                                                            <div className="empty-title">
                                                                {search ? 'No projects match your search' : 'No projects yet'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filtered.map(p => {
                                                    const badge = STATUS_BADGE[p.status] || STATUS_BADGE.ACTIVE;
                                                    const [name, sub] = p.title.includes(' — ')
                                                        ? p.title.split(' — ')
                                                        : [p.title, null];
                                                    return (
                                                        <tr key={p.id}>
                                                            <td>
                                                                <div className="td-primary">{name}</div>
                                                                {sub && <div className="td-secondary">{sub}</div>}
                                                            </td>
                                                            <td className="td-secondary">{p.leadName}</td>
                                                            <td>
                                                                <span className={`badge ${badge.cls}`}>
                                                                    <span className="badge-dot" aria-hidden="true" />
                                                                    {badge.label}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="acts-num">{p.activityCount ?? 0}</span>
                                                            </td>
                                                            <td className="td-mono">{fmtDateShort(p.lastActivityDate)}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile card rows */}
                            <div className="mobile-rows">
                                {filtered.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon" aria-hidden="true">🌿</div>
                                        <div className="empty-title">
                                            {search ? 'No projects match your search' : 'No projects yet'}
                                        </div>
                                    </div>
                                ) : (
                                    filtered.map(p => {
                                        const badge = STATUS_BADGE[p.status] || STATUS_BADGE.ACTIVE;
                                        const [name, sub] = p.title.includes(' — ')
                                            ? p.title.split(' — ')
                                            : [p.title, null];
                                        return (
                                            <div className="mobile-row" key={p.id}>
                                                <div className="mobile-row-top">
                                                    <div className="u-flex-1 u-min-w-0">
                                                        <div className="mobile-row-name">{name}</div>
                                                        <div className="mobile-row-sub">
                                                            {sub ? `${sub} · ` : ''}{p.leadName}
                                                        </div>
                                                    </div>
                                                    <span className={`badge ${badge.cls} u-shrink-0`}>
                                                        <span className="badge-dot" aria-hidden="true" />
                                                        {badge.label}
                                                    </span>
                                                </div>
                                                <div className="mobile-row-meta">
                                                    <span className="acts-num">{p.activityCount ?? 0} activities</span>
                                                    <span className="td-mono u-fs-11">
                                                        {fmtDateShort(p.lastActivityDate)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ count, label, variant, fillPct }) {
    return (
        <div className={`stat-card${variant ? ' ' + variant : ''}`}>
            <div className="stat-num">{count}</div>
            <div className="stat-label">
                <span className="stat-dot" aria-hidden="true" />
                {label}
            </div>
            <div className="stat-bar" aria-hidden="true">
                <div className="stat-fill" style={{ '--fill': `${fillPct}%` }} />
            </div>
        </div>
    );
}
