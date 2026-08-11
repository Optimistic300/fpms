import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/axios';
import ProjectFilters from '../components/projects/ProjectFilters';
import NewProjectModal from '../components/projects/NewProjectModal';

const statusBadge = {
    PROPOSED: { bg: '#fef3c7', color: '#92400e' },
    ACTIVE: { bg: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' },
    COMPLETED: { bg: '#d1fae5', color: '#065f46' },
    ARCHIVED: { bg: '#f1f5f9', color: '#475569' },
};

const TABS = [
    { key: 'all', label: 'All projects' },
    { key: 'mine', label: 'My projects' },
    { key: 'shared', label: 'Shared with me' },
];

function SkeletonRow() {
    return (
        <div
            style={{
                display: 'flex',
                gap: '16px',
                padding: '18px 20px',
                borderBottom: '1px solid #f1f5f9',
            }}
        >
            <div style={{ flex: 2, height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
            <div style={{ flex: 1, height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
            <div style={{ flex: 1, height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
            <div style={{ width: '70px', height: '22px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
        </div>
    );
}

export default function ProjectDirectory() {
    const navigate = useNavigate();
    const location = useLocation();
    const showNewModal = location.pathname === '/projects/new';

    const [allProjects, setAllProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [division, setDivision] = useState('');
    const [status, setStatus] = useState('');
    const [fundingType, setFundingType] = useState('');

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
        async function fetchProjects() {
            setLoading(true);
            setError(false);
            try {
                const params = {};
                if (status) params.status = status;
                if (division) params.division = division;
                if (fundingType) params.fundingType = fundingType;

                const response = await apiClient.get('/projects', {
                    params,
                    signal: controller.signal,
                });
                if (!controller.signal.aborted) {
                    setAllProjects(response.data.data || []);
                    setLoading(false);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(true);
                    setLoading(false);
                }
            }
        }
        fetchProjects();
        return () => controller.abort();
    }, [status, division, fundingType]);

    const [divisions, setDivisions] = useState([]);
    useEffect(() => {
        apiClient
            .get('/divisions/summary')
            .then((res) => {
                if (res.data.data) {
                    setDivisions(res.data.data.map((d) => ({ id: d.divisionId, name: d.divisionName })));
                }
            })
            .catch(() => {});
    }, []);

    const filteredByTab = useMemo(() => {
        switch (activeTab) {
            case 'mine':
                return allProjects.filter((p) => p.isOwner);
            case 'shared':
                return allProjects.filter((p) => p.hasAccess && !p.isOwner);
            default:
                return allProjects;
        }
    }, [allProjects, activeTab]);

    const filteredProjects = useMemo(() => {
        const q = debouncedSearch.toLowerCase();
        if (!q) return filteredByTab;
        return filteredByTab.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                (p.lead && p.lead.toLowerCase().includes(q)) ||
                (p.researchArea && p.researchArea.toLowerCase().includes(q))
        );
    }, [filteredByTab, debouncedSearch]);

    function handleRowClick(project) {
        if (project.isOwner || project.hasAccess) {
            navigate(`/projects/${project.id}`);
        } else if (project.isLocked) {
            navigate(`/projects/${project.id}/preview`);
        } else {
            navigate(`/projects/${project.id}`);
        }
    }

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
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}
            >
                <h1
                    style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#1e293b',
                        margin: 0,
                    }}
                >
                    Project Directory
                </h1>
                <button
                    type="button"
                    onClick={() => navigate('/projects/new')}
                    style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'white',
                        backgroundColor: 'var(--color-primary)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    + New Project
                </button>
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '16px',
                    borderBottom: '1px solid #e2e8f0',
                }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: activeTab === tab.key ? 600 : 500,
                            color: activeTab === tab.key ? 'var(--color-primary-dark)' : '#64748b',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <ProjectFilters
                search={search}
                onSearchChange={setSearch}
                division={division}
                onDivisionChange={setDivision}
                status={status}
                onStatusChange={setStatus}
                fundingType={fundingType}
                onFundingTypeChange={setFundingType}
                divisions={divisions}
            />

            {/* Loading */}
            {loading && (
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                    }}
                >
                    <div style={tableHeaderStyle}>
                        <div style={{ flex: 2 }}>Title</div>
                        <div style={{ flex: 1 }}>Division / Lead</div>
                        <div style={{ flex: 1 }}>Funding</div>
                        <div style={{ width: '80px' }}>Status</div>
                    </div>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonRow key={i} />
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div
                    style={{
                        padding: '20px',
                        backgroundColor: '#fef2f2',
                        borderRadius: '8px',
                        color: '#991b1b',
                        fontSize: '14px',
                    }}
                >
                    Failed to load projects. Please try again.
                </div>
            )}

            {/* Empty States */}
            {!loading && !error && filteredProjects.length === 0 && (
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        padding: '60px 20px',
                        textAlign: 'center',
                        color: '#94a3b8',
                    }}
                >
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>
                        {activeTab === 'shared' ? '🔗' : activeTab === 'mine' ? '📁' : '📂'}
                    </div>
                    <p style={{ fontSize: '15px', marginBottom: '4px' }}>
                        {activeTab === 'shared'
                            ? 'No projects have been shared with you yet.'
                            : activeTab === 'mine'
                              ? 'You have not created any projects yet.'
                              : 'No projects match your filters.'}
                    </p>
                    {activeTab !== 'shared' && filteredByTab.length === 0 && (
                        <p style={{ fontSize: '13px', marginTop: '8px' }}>
                            {activeTab === 'mine'
                                ? 'Click "New Project" to get started.'
                                : 'Try adjusting your search or filters.'}
                        </p>
                    )}
                </div>
            )}

            {/* Table */}
            {!loading && !error && filteredProjects.length > 0 && (
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                    }}
                >
                    <div style={tableHeaderStyle}>
                        <div style={{ flex: 2 }}>Title</div>
                        <div style={{ flex: 1 }}>Division / Lead</div>
                        <div style={{ flex: 1 }}>Funding</div>
                        <div style={{ width: '80px' }}>Status</div>
                    </div>
                    {filteredProjects.map((p, i) => {
                        const badge = statusBadge[p.status] || { bg: '#f1f5f9', color: '#475569' };
                        return (
                            <div
                                key={p.id}
                                onClick={() => handleRowClick(p)}
                                style={{
                                    display: 'flex',
                                    gap: '16px',
                                    padding: '16px 20px',
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
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {p.isLocked && (
                                        <span
                                            title="Locked"
                                            style={{ fontSize: '14px', flexShrink: 0 }}
                                        >
                                            🔒
                                        </span>
                                    )}
                                    <span
                                        style={{
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
                                    </span>
                                    {p.isOwner && (
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: 'var(--color-primary-dark)',
                                                backgroundColor: 'var(--color-primary-bg)',
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0,
                                            }}
                                        >
                                            Mine
                                        </span>
                                    )}
                                </div>
                                <div
                                    style={{
                                        flex: 1,
                                        fontSize: '13px',
                                        color: '#64748b',
                                    }}
                                >
                                    {p.division}
                                    {p.lead && (
                                        <span style={{ color: '#94a3b8' }}>
                                            {' / '}
                                            {p.lead}
                                        </span>
                                    )}
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
                                            backgroundColor: badge.bg,
                                            color: badge.color,
                                        }}
                                    >
                                        {p.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <NewProjectModal
                isOpen={showNewModal}
                onClose={() => navigate('/projects')}
                divisions={divisions}
            />
        </div>
    );
}
