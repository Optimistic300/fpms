import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const STATUS_BADGE = {
    ACTIVE:    { cls: 'badge-active', label: 'Active'    },
    ON_HOLD:   { cls: 'badge-hold',   label: 'On Hold'   },
    COMPLETED: { cls: 'badge-done',   label: 'Completed' },
};

const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

export default function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/projects')
            .then(res => setProjects(res.data))
            .catch(err => {
                if (err.response?.status === 401) {
                    localStorage.clear();
                    navigate('/');
                }
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    if (loading) return <div className="loading-screen">Loading…</div>;

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
            <main>
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
                                dotColor="var(--forest-600)"
                                fillColor="var(--forest-600)"
                            />
                            <StatCard
                                count={holdCount}
                                label="On Hold"
                                variant="warn"
                                fillPct={holdCount / total * 100}
                                dotColor="var(--amber-500)"
                                fillColor="var(--amber-500)"
                            />
                            <StatCard
                                count={completedCount}
                                label="Completed"
                                variant="info"
                                fillPct={completedCount / total * 100}
                                dotColor="var(--blue-600)"
                                fillColor="var(--blue-600)"
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
                                />
                            </div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Lead</th>
                                            <th>Status</th>
                                            <th>Activities</th>
                                            <th>Last Update</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan="5">
                                                    <div className="empty-state">
                                                        <div className="empty-icon">🌿</div>
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
                                                                <span className="badge-dot" />
                                                                {badge.label}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="acts-num">{p.activityCount ?? 0}</span>
                                                        </td>
                                                        <td className="td-mono">{fmtDate(p.lastActivityDate)}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ count, label, variant, fillPct, dotColor, fillColor }) {
    return (
        <div className={`stat-card${variant ? ' ' + variant : ''}`}>
            <div className="stat-num">{count}</div>
            <div className="stat-label">
                <span className="stat-dot" style={{ background: dotColor }} />
                {label}
            </div>
            <div className="stat-bar">
                <div className="stat-fill" style={{ width: `${fillPct}%`, background: fillColor }} />
            </div>
        </div>
    );
}
