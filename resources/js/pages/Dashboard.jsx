import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/axios';
import StatCard from '../components/dashboard/StatCard';

const statusOptions = ['', 'PROPOSED', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];
const fundingOptions = ['', 'DONOR', 'GOVERNMENT', 'INTERNAL'];

function statusBadgeColor(status) {
    const map = {
        PROPOSED: { bg: '#fef3c7', color: '#92400e' },
        ACTIVE: { bg: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' },
        COMPLETED: { bg: '#d1fae5', color: '#065f46' },
        ARCHIVED: { bg: '#f1f5f9', color: '#475569' },
    };
    return map[status] || { bg: '#f1f5f9', color: '#475569' };
}

function reportBadgeColor(status) {
    const map = {
        PENDING: { bg: '#fef3c7', color: '#92400e' },
        APPROVED: { bg: '#d1fae5', color: '#065f46' },
        RETURNED: { bg: '#fee2e2', color: '#991b1b' },
        DRAFT: { bg: '#f1f5f9', color: '#475569' },
        ESCALATED: { bg: '#fce7f3', color: '#9d174d' },
    };
    return map[status] || { bg: '#f1f5f9', color: '#475569' };
}

function SkeletonCard() {
    return (
        <div
            style={{
                flex: 1,
                minWidth: '180px',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
            }}
        >
            <div
                style={{
                    height: '16px',
                    width: '60%',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                    marginBottom: '12px',
                }}
            />
            <div
                style={{
                    height: '32px',
                    width: '40%',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                }}
            />
            <div
                style={{
                    height: '12px',
                    width: '80%',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                    marginTop: '12px',
                }}
            />
        </div>
    );
}

function SkeletonTable({ rows = 3 }) {
    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '14px 20px',
                        borderBottom: i < rows - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                >
                    <div
                        style={{
                            flex: 2,
                            height: '14px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                        }}
                    />
                    <div
                        style={{
                            flex: 1,
                            height: '14px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                        }}
                    />
                    <div
                        style={{
                            flex: 1,
                            height: '14px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                        }}
                    />
                    <div
                        style={{
                            width: '70px',
                            height: '22px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

function SkeletonPanel() {
    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px 0',
                        borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none',
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                height: '14px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '4px',
                                marginBottom: '8px',
                                width: '90%',
                            }}
                        />
                        <div
                            style={{
                                height: '12px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '4px',
                                width: '60%',
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

function getMonthDay(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState(false);

    const [projects, setProjects] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [projectsError, setProjectsError] = useState(false);

    const [activities, setActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [activitiesError, setActivitiesError] = useState(false);

    const [reports, setReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(true);
    const [reportsError, setReportsError] = useState(false);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [divisionFilter, setDivisionFilter] = useState('');
    const [fundingFilter, setFundingFilter] = useState('');
    const [researchAreaFilter, setResearchAreaFilter] = useState('');

    const [activeStat, setActiveStat] = useState(null);

    const debounceRef = useRef(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search]);

    useEffect(() => {
        const controller = new AbortController();
        async function fetchAll() {
            setStatsLoading(true);
            setProjectsLoading(true);
            setActivitiesLoading(true);
            setReportsLoading(true);

            const results = await Promise.allSettled([
                apiClient.get('/dashboard/stats', { signal: controller.signal }),
                apiClient.get('/projects', {
                    params: { owner: 'me', limit: 20 },
                    signal: controller.signal,
                }),
                apiClient.get('/activities', {
                    params: { owner: 'me', limit: 3 },
                    signal: controller.signal,
                }),
                apiClient.get('/reports', {
                    params: { owner: 'me', limit: 3 },
                    signal: controller.signal,
                }),
            ]);

            if (controller.signal.aborted) return;

            if (results[0].status === 'fulfilled') {
                setStats(results[0].value.data.data);
                setStatsLoading(false);
            } else {
                setStatsError(true);
                setStatsLoading(false);
            }

            if (results[1].status === 'fulfilled') {
                setProjects(results[1].value.data.data || []);
                setProjectsLoading(false);
            } else {
                setProjectsError(true);
                setProjectsLoading(false);
            }

            if (results[2].status === 'fulfilled') {
                setActivities(results[2].value.data.data || []);
                setActivitiesLoading(false);
            } else {
                setActivitiesError(true);
                setActivitiesLoading(false);
            }

            if (results[3].status === 'fulfilled') {
                setReports(results[3].value.data.data || []);
                setReportsLoading(false);
            } else {
                setReportsError(true);
                setReportsLoading(false);
            }
        }

        fetchAll();
        return () => controller.abort();
    }, []);

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    function handleStatClick(statName) {
        if (activeStat === statName) {
            setActiveStat(null);
            setStatusFilter('');
            setSearch('');
            setDebouncedSearch('');
            setDivisionFilter('');
            setFundingFilter('');
            setResearchAreaFilter('');
        } else {
            setActiveStat(statName);
            if (statName === 'reportsPending') {
                navigate('/reports?status=PENDING');
            } else if (statName === 'activitiesThisMonth') {
                navigate('/activities?period=this-month');
            } else if (statName === 'totalProjects') {
                setStatusFilter('');
            } else if (statName === 'ongoing') {
                setStatusFilter('ACTIVE');
            }
        }
    }

    const filteredProjects = projects.filter((p) => {
        const q = debouncedSearch.toLowerCase();
        if (q && !p.title.toLowerCase().includes(q)) return false;
        if (statusFilter && p.status !== statusFilter) return false;
        if (divisionFilter && p.division !== divisionFilter) return false;
        if (fundingFilter && p.fundingType !== fundingFilter) return false;
        if (researchAreaFilter && p.researchArea && !p.researchArea.toLowerCase().includes(researchAreaFilter.toLowerCase())) return false;
        return true;
    });

    const cardContainer = {
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
    };

    const sectionTitle = {
        fontSize: '16px',
        fontWeight: 700,
        color: '#1e293b',
        marginBottom: '16px',
    };

    const tableHeaderStyle = {
        display: 'flex',
        gap: '16px',
        padding: '12px 20px',
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
        fontSize: '12px',
        fontWeight: 600,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                    Welcome, {user?.fullName?.split(' ')[0] || 'User'}
                </h1>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {today} — {user?.division || 'No division'}
                </div>
            </div>

            {/* Stat Cards */}
            <div style={cardContainer}>
                {statsLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : statsError ? (
                    <div
                        style={{
                            flex: 1,
                            padding: '20px',
                            backgroundColor: '#fef2f2',
                            borderRadius: '8px',
                            color: '#991b1b',
                            fontSize: '14px',
                        }}
                    >
                        Failed to load stats.
                    </div>
                ) : (
                    <>
                        <StatCard
                            label="My Projects"
                            value={stats.totalProjects}
                            icon="📁"
                            isActive={activeStat === 'totalProjects'}
                            onClick={() => handleStatClick('totalProjects')}
                        />
                        <StatCard
                            label="Ongoing"
                            value={stats.ongoing}
                            icon="🔄"
                            isActive={activeStat === 'ongoing'}
                            onClick={() => handleStatClick('ongoing')}
                        />
                        <StatCard
                            label="Reports Pending"
                            value={stats.reportsPending}
                            icon="📋"
                            onClick={() => handleStatClick('reportsPending')}
                        />
                        <StatCard
                            label="Activities This Month"
                            value={stats.activitiesThisMonth}
                            icon="📝"
                            onClick={() => handleStatClick('activitiesThisMonth')}
                        />
                    </>
                )}
            </div>

            {/* Project Table Section */}
            <div style={{ marginBottom: '24px' }}>
                <div style={sectionTitle}>My Projects</div>

                {projectsLoading ? (
                    <SkeletonTable rows={4} />
                ) : projectsError ? (
                    <div
                        style={{
                            padding: '20px',
                            backgroundColor: '#fef2f2',
                            borderRadius: '8px',
                            color: '#991b1b',
                            fontSize: '14px',
                        }}
                    >
                        Failed to load projects.
                    </div>
                ) : (
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        {/* Filters */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="Search by title..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{
                                        padding: '8px 12px',
                                        fontSize: '14px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        flex: '1 1 200px',
                                        minWidth: '160px',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                    }}
                                />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{
                                        padding: '8px 12px',
                                        fontSize: '13px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        backgroundColor: statusFilter ? 'var(--color-primary-bg)' : '#f1f5f9',
                                        color: statusFilter ? 'var(--color-primary-dark)' : '#475569',
                                        fontWeight: 500,
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {statusOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s === '' ? 'Status' : s.charAt(0) + s.slice(1).toLowerCase()}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    style={{
                                        padding: '8px 14px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: showAdvanced ? 'var(--color-primary-dark)' : '#475569',
                                        backgroundColor: showAdvanced ? 'var(--color-primary-bg)' : '#f1f5f9',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {showAdvanced ? 'Hide filters' : 'Advanced filters'}
                                </button>
                            </div>

                            {showAdvanced && (
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '12px',
                                        marginTop: '12px',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <select
                                        value={divisionFilter}
                                        onChange={(e) => setDivisionFilter(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            fontSize: '13px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        <option value="">Division</option>
                                        {[...new Set(projects.map((p) => p.division))].map((d) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={fundingFilter}
                                        onChange={(e) => setFundingFilter(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            fontSize: '13px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {fundingOptions.map((f) => (
                                            <option key={f} value={f}>
                                                {f === '' ? 'Funding' : f.charAt(0) + f.slice(1).toLowerCase()}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Research area..."
                                        value={researchAreaFilter}
                                        onChange={(e) => setResearchAreaFilter(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            fontSize: '13px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            flex: '1 1 160px',
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Empty state */}
                        {filteredProjects.length === 0 && !projectsLoading && (
                            <div
                                style={{
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    color: '#94a3b8',
                                }}
                            >
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📂</div>
                                <p style={{ fontSize: '15px', marginBottom: '16px' }}>
                                    {projects.length === 0
                                        ? "You don't have any projects yet."
                                        : 'No projects match your filters.'}
                                </p>
                                {projects.length === 0 && (
                                    <Link
                                        to="/projects/new"
                                        style={{
                                            display: 'inline-block',
                                            padding: '10px 24px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: 'white',
                                            backgroundColor: 'var(--color-primary)',
                                            borderRadius: '6px',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        Create your first project
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Table Header */}
                        {filteredProjects.length > 0 && (
                            <div style={tableHeaderStyle}>
                                <div style={{ flex: 2 }}>Title</div>
                                <div style={{ flex: 1 }}>Division</div>
                                <div style={{ flex: 1 }}>Funding</div>
                                <div style={{ width: '80px' }}>Status</div>
                                <div style={{ width: '120px' }}>Progress</div>
                            </div>
                        )}

                        {/* Table Rows */}
                        {filteredProjects.map((p, i) => (
                            <div
                                key={p.id}
                                onClick={() => navigate(`/projects/${p.id}`)}
                                style={{
                                    display: 'flex',
                                    gap: '16px',
                                    padding: '14px 20px',
                                    borderBottom:
                                        i < filteredProjects.length - 1
                                            ? '1px solid #f1f5f9'
                                            : 'none',
                                    cursor: 'pointer',
                                    alignItems: 'center',
                                    transition: 'background-color 0.1s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '';
                                }}
                            >
                                <div
                                    style={{
                                        flex: 2,
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                    title={p.title}
                                >
                                    {p.title}
                                </div>
                                <div style={{ flex: 1, fontSize: '13px', color: '#64748b' }}>
                                    {p.division}
                                </div>
                                <div style={{ flex: 1, fontSize: '13px', color: '#64748b' }}>
                                    {p.fundingType?.charAt(0) + p.fundingType?.slice(1).toLowerCase()}
                                </div>
                                <div style={{ width: '80px' }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            borderRadius: '4px',
                                            backgroundColor: statusBadgeColor(p.status).bg,
                                            color: statusBadgeColor(p.status).color,
                                        }}
                                    >
                                        {p.status}
                                    </span>
                                </div>
                                <div style={{ width: '120px' }}>
                                    <div
                                        style={{
                                            height: '6px',
                                            backgroundColor: '#e2e8f0',
                                            borderRadius: '3px',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${p.progress || 0}%`,
                                                backgroundColor:
                                                    (p.progress || 0) >= 80
                                                        ? '#22c55e'
                                                        : (p.progress || 0) >= 40
                                                          ? 'var(--color-primary-mid)'
                                                          : '#f59e0b',
                                                borderRadius: '3px',
                                                transition: 'width 0.3s',
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            color: '#94a3b8',
                                            marginTop: '2px',
                                            textAlign: 'right',
                                        }}
                                    >
                                        {p.progress || 0}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Panels */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* Recent Activity */}
                <div style={{ flex: '1 1 45%', minWidth: '280px' }}>
                    <div style={sectionTitle}>Recent Activity</div>
                    {activitiesLoading ? (
                        <SkeletonPanel />
                    ) : activitiesError ? (
                        <div
                            style={{
                                padding: '20px',
                                backgroundColor: '#fef2f2',
                                borderRadius: '8px',
                                color: '#991b1b',
                                fontSize: '14px',
                            }}
                        >
                            Failed to load activities.
                        </div>
                    ) : activities.length === 0 ? (
                        <div
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                padding: '32px 20px',
                                textAlign: 'center',
                                color: '#94a3b8',
                                fontSize: '14px',
                            }}
                        >
                            No recent activities.
                        </div>
                    ) : (
                        <div
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                            }}
                        >
                            {activities.map((a, i) => (
                                <div
                                    key={a.id}
                                    style={{
                                        padding: '14px 20px',
                                        borderBottom:
                                            i < activities.length - 1
                                                ? '1px solid #f1f5f9'
                                                : 'none',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '14px',
                                            color: '#1e293b',
                                            marginBottom: '4px',
                                            lineHeight: '1.4',
                                        }}
                                    >
                                        {a.description}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            color: '#94a3b8',
                                            display: 'flex',
                                            gap: '8px',
                                        }}
                                    >
                                        <span>{a.projectTitle || ''}</span>
                                        {a.date && <span>· {getMonthDay(a.date)}</span>}
                                    </div>
                                </div>
                            ))}
                            <Link
                                to="/activities"
                                style={{
                                    display: 'block',
                                    padding: '10px 20px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--color-primary)',
                                    textDecoration: 'none',
                                    textAlign: 'center',
                                    borderTop: '1px solid #f1f5f9',
                                }}
                            >
                                View all
                            </Link>
                        </div>
                    )}
                </div>

                {/* Report Status */}
                <div style={{ flex: '1 1 45%', minWidth: '280px' }}>
                    <div style={sectionTitle}>Report Status</div>
                    {reportsLoading ? (
                        <SkeletonPanel />
                    ) : reportsError ? (
                        <div
                            style={{
                                padding: '20px',
                                backgroundColor: '#fef2f2',
                                borderRadius: '8px',
                                color: '#991b1b',
                                fontSize: '14px',
                            }}
                        >
                            Failed to load reports.
                        </div>
                    ) : reports.length === 0 ? (
                        <div
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                padding: '32px 20px',
                                textAlign: 'center',
                                color: '#94a3b8',
                                fontSize: '14px',
                            }}
                        >
                            No reports yet.
                        </div>
                    ) : (
                        <div
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                            }}
                        >
                            {reports.map((r, i) => {
                                const badge = reportBadgeColor(r.status);
                                return (
                                    <div
                                        key={r.id}
                                        style={{
                                            padding: '14px 20px',
                                            borderBottom:
                                                i < reports.length - 1
                                                    ? '1px solid #f1f5f9'
                                                    : 'none',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '14px',
                                                color: r.status === 'RETURNED' ? '#991b1b' : '#1e293b',
                                                marginBottom: '6px',
                                                lineHeight: '1.4',
                                            }}
                                        >
                                            {r.reportName || `Report #${r.id}`}
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                {r.projectTitle || ''}
                                            </span>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '2px 8px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    borderRadius: '4px',
                                                    backgroundColor: badge.bg,
                                                    color: badge.color,
                                                }}
                                            >
                                                {r.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <Link
                                to="/reports"
                                style={{
                                    display: 'block',
                                    padding: '10px 20px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--color-primary)',
                                    textDecoration: 'none',
                                    textAlign: 'center',
                                    borderTop: '1px solid #f1f5f9',
                                }}
                            >
                                View all
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
