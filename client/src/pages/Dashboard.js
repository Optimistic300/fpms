import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Leaf, Plus, X, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { STATUS_BADGE, FUNDING_BADGE } from '../constants';
import { fmtDateShort } from '../utils/format';
import { useProjects, useDivisions, useUsers, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/queries';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const [search, setSearch]                       = useState('');
    const [divisionFilter, setDivisionFilter]       = useState('');
    const [fundingFilter, setFundingFilter]         = useState('');
    const [statusFilter, setStatusFilter]           = useState('');
    const [researchAreaFilter, setResearchAreaFilter] = useState('');
    const [expandedId, setExpandedId]               = useState(null);
    const [showModal, setShowModal]                 = useState(false);
    const [editingProject, setEditingProject]       = useState(null);
    const [searchParams] = useSearchParams();

    const { user }                           = useAuth();
    const { data: projects = [], isPending } = useProjects();
    const { data: divisions = [] }           = useDivisions();
    const { data: users = [] }               = useUsers();
    const { mutate: deleteProject }          = useDeleteProject();

    useEffect(() => {
        if (searchParams.get('new') === '1') setShowModal(true);
    }, [searchParams]);

    if (isPending) return <div className="loading-screen">Loading…</div>;

    const totalCount     = projects.length;
    const activeCount    = projects.filter(p => p.status === 'ONGOING').length;
    const holdCount      = projects.filter(p => p.status === 'ON_HOLD').length;
    const completedCount = projects.filter(p => p.status === 'COMPLETED').length;
    const denominator    = totalCount || 1;

    const filtered = projects.filter(p => {
        const matchSearch  = p.title.toLowerCase().includes(search.toLowerCase()) ||
            (p.leadName || '').toLowerCase().includes(search.toLowerCase());
        const matchDiv     = !divisionFilter || String(p.divisionId) === divisionFilter;
        const matchFunding = !fundingFilter  || p.fundingType === fundingFilter;
        const matchStatus  = !statusFilter   || p.status === statusFilter;
        const matchArea    = !researchAreaFilter ||
            (p.researchArea || '').toLowerCase().includes(researchAreaFilter.toLowerCase());
        return matchSearch && matchDiv && matchFunding && matchStatus && matchArea;
    });

    const handleStatCard = (status) => {
        setStatusFilter(prev => prev === status ? '' : status);
    };

    const handleDelete = (p) => {
        if (!window.confirm(`Delete "${p.title}"? This will permanently remove all activities and documents.`)) return;
        deleteProject(p.id, {
            onSuccess: () => { toast.success('Project deleted'); setExpandedId(null); },
            onError:   () => toast.error('Failed to delete project'),
        });
    };

    const anyFilter = search || divisionFilter || fundingFilter || statusFilter || researchAreaFilter;

    const cardTitle = statusFilter
        ? `${STATUS_BADGE[statusFilter]?.label ?? statusFilter} Projects`
        : 'All Projects';

    return (
        <div className="app-shell">
            <Navbar />
            <main id="main-content">
                <div className="page">
                    <div className="page-inner">
                        <div className="page-header page-header-row">
                            <div>
                                <div className="t-title">Overview</div>
                                <div className="t-small">FORIG research project tracker</div>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                                <Plus size={14} aria-hidden="true" /> New Project
                            </button>
                        </div>

                        <div className="stat-grid">
                            <StatCard
                                count={totalCount}
                                label="Total Projects"
                                fillPct={100}
                                selected={!statusFilter}
                                onClick={() => setStatusFilter('')}
                            />
                            <StatCard
                                count={activeCount}
                                label="Ongoing"
                                fillPct={activeCount / denominator * 100}
                                selected={statusFilter === 'ONGOING'}
                                onClick={() => handleStatCard('ONGOING')}
                            />
                            <StatCard
                                count={completedCount}
                                label="Completed"
                                variant="info"
                                fillPct={completedCount / denominator * 100}
                                selected={statusFilter === 'COMPLETED'}
                                onClick={() => handleStatCard('COMPLETED')}
                            />
                            <StatCard
                                count={holdCount}
                                label="On Hold"
                                variant="warn"
                                fillPct={holdCount / denominator * 100}
                                selected={statusFilter === 'ON_HOLD'}
                                onClick={() => handleStatCard('ON_HOLD')}
                            />
                        </div>

                        <div className="card">
                            <div className="card-header card-header-filters">
                                <span className="card-title">
                                    {cardTitle}
                                    {filtered.length !== projects.length &&
                                        <span className="card-count"> ({filtered.length})</span>}
                                </span>
                                <div className="filter-row">
                                    <input
                                        className="search-input"
                                        placeholder="Search projects…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        aria-label="Search projects"
                                    />
                                    <select
                                        className="form-select filter-select"
                                        value={divisionFilter}
                                        onChange={e => setDivisionFilter(e.target.value)}
                                        aria-label="Filter by division"
                                    >
                                        <option value="">All Divisions</option>
                                        {divisions.map(d => (
                                            <option key={d.id} value={String(d.id)}>{d.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="form-select filter-select"
                                        value={fundingFilter}
                                        onChange={e => setFundingFilter(e.target.value)}
                                        aria-label="Filter by funding type"
                                    >
                                        <option value="">All Funding</option>
                                        <option value="INTERNAL">Internal</option>
                                        <option value="GOVERNMENT">Government</option>
                                        <option value="DONOR">Donor</option>
                                    </select>
                                    <select
                                        className="form-select filter-select"
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value)}
                                        aria-label="Filter by status"
                                    >
                                        <option value="">All Status</option>
                                        <option value="ONGOING">Ongoing</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="ON_HOLD">On Hold</option>
                                        <option value="PROPOSED">Proposed</option>
                                    </select>
                                    <input
                                        className="search-input filter-select"
                                        placeholder="Research area…"
                                        value={researchAreaFilter}
                                        onChange={e => setResearchAreaFilter(e.target.value)}
                                        aria-label="Filter by research area"
                                    />
                                </div>
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
                                                <th scope="col">Funding</th>
                                                <th scope="col">Activities</th>
                                                <th scope="col">Last Update</th>
                                                <th scope="col" className="td-chevron" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7">
                                                        <div className="empty-state">
                                                            <Leaf size={32} className="empty-icon" aria-hidden="true" />
                                                            <div className="empty-title">
                                                                {anyFilter ? 'No projects match your filters' : 'No projects yet'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filtered.flatMap(p => {
                                                    const badge      = STATUS_BADGE[p.status]       || STATUS_BADGE.ONGOING;
                                                    const funding    = FUNDING_BADGE[p.fundingType] || FUNDING_BADGE.INTERNAL;
                                                    const isExpanded = expandedId === p.id;
                                                    const [name, sub] = p.title.includes(' — ')
                                                        ? p.title.split(' — ')
                                                        : [p.title, null];
                                                    const rows = [
                                                        <tr
                                                            key={p.id}
                                                            className={`project-row${isExpanded ? ' expanded' : ''}`}
                                                            onClick={() => setExpandedId(v => v === p.id ? null : p.id)}
                                                        >
                                                            <td>
                                                                <div className="td-primary">{name}</div>
                                                                {sub && <div className="td-secondary">{sub}</div>}
                                                                {p.divisionName && (
                                                                    <div className="td-secondary u-fs-11">{p.divisionName}</div>
                                                                )}
                                                            </td>
                                                            <td className="td-secondary">{p.leadName}</td>
                                                            <td>
                                                                <span className={`badge ${badge.cls}`}>
                                                                    <span className="badge-dot" aria-hidden="true" />
                                                                    {badge.label}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${funding.cls}`}>
                                                                    {funding.label}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="acts-num">{p.activityCount ?? 0}</span>
                                                            </td>
                                                            <td className="td-mono">{fmtDateShort(p.lastActivityDate)}</td>
                                                            <td className="td-chevron">
                                                                {isExpanded
                                                                    ? <ChevronUp size={14} aria-hidden="true" />
                                                                    : <ChevronDown size={14} aria-hidden="true" />}
                                                            </td>
                                                        </tr>
                                                    ];
                                                    if (isExpanded) {
                                                        rows.push(
                                                            <tr key={`${p.id}-x`} className="expand-row">
                                                                <td colSpan="7">
                                                                    <ExpandPanel
                                                                        project={p}
                                                                        canEdit={user?.id === p.leadId || user?.role === 'MANAGEMENT'}
                                                                        onEdit={() => setEditingProject(p)}
                                                                        onDelete={() => handleDelete(p)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                    return rows;
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
                                        <Leaf size={32} className="empty-icon" aria-hidden="true" />
                                        <div className="empty-title">
                                            {anyFilter ? 'No projects match your filters' : 'No projects yet'}
                                        </div>
                                    </div>
                                ) : (
                                    filtered.map(p => {
                                        const badge      = STATUS_BADGE[p.status]       || STATUS_BADGE.ONGOING;
                                        const funding    = FUNDING_BADGE[p.fundingType] || FUNDING_BADGE.INTERNAL;
                                        const isExpanded = expandedId === p.id;
                                        const [name, sub] = p.title.includes(' — ')
                                            ? p.title.split(' — ')
                                            : [p.title, null];
                                        return (
                                            <div key={p.id}>
                                                <div
                                                    className={`mobile-row${isExpanded ? ' expanded' : ''}`}
                                                    onClick={() => setExpandedId(v => v === p.id ? null : p.id)}
                                                    style={{ cursor: 'pointer' }}
                                                >
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
                                                        <span className={`badge ${funding.cls}`}>{funding.label}</span>
                                                        <span className="acts-num">{p.activityCount ?? 0} activities</span>
                                                        <span className="td-mono u-fs-11">
                                                            {fmtDateShort(p.lastActivityDate)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isExpanded && (
                                                    <ExpandPanel
                                                        project={p}
                                                        mobile
                                                        canEdit={user?.id === p.leadId || user?.role === 'MANAGEMENT'}
                                                        onEdit={() => setEditingProject(p)}
                                                        onDelete={() => handleDelete(p)}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {showModal && (
                <ProjectModal
                    divisions={divisions}
                    users={users}
                    onClose={() => setShowModal(false)}
                />
            )}
            {editingProject && (
                <ProjectModal
                    project={editingProject}
                    divisions={divisions}
                    users={users}
                    onClose={() => setEditingProject(null)}
                />
            )}
        </div>
    );
}

function StatCard({ count, label, variant, fillPct, selected, onClick }) {
    return (
        <button
            className={`stat-card${variant ? ' ' + variant : ''}${selected ? ' selected' : ''}`}
            onClick={onClick}
            aria-pressed={selected}
        >
            <div className="stat-num">{count}</div>
            <div className="stat-label">
                <span className="stat-dot" aria-hidden="true" />
                {label}
            </div>
            <div className="stat-bar" aria-hidden="true">
                <div className="stat-fill" style={{ '--fill': `${fillPct}%` }} />
            </div>
        </button>
    );
}

function ExpandPanel({ project: p, mobile, canEdit, onEdit, onDelete }) {
    return (
        <div className={mobile ? 'expand-panel-mobile' : 'expand-panel'}>
            {(p.researchArea || p.startDate || p.endDate || p.fundingSource) && (
                <div className="expand-grid">
                    {p.researchArea && (
                        <div>
                            <div className="expand-label">Research Area</div>
                            <div className="expand-value">{p.researchArea}</div>
                        </div>
                    )}
                    {(p.startDate || p.endDate) && (
                        <div>
                            <div className="expand-label">Timeline</div>
                            <div className="expand-value">
                                {fmtDateShort(p.startDate)} – {p.endDate ? fmtDateShort(p.endDate) : 'ongoing'}
                            </div>
                        </div>
                    )}
                    {p.fundingSource && (
                        <div>
                            <div className="expand-label">Funding Source</div>
                            <div className="expand-value">{p.fundingSource}</div>
                        </div>
                    )}
                </div>
            )}
            {p.objectives && (
                <div className="expand-section">
                    <div className="expand-label">Objectives</div>
                    <div className="expand-text">{p.objectives}</div>
                </div>
            )}
            {p.keyFindings && (
                <div className="expand-section">
                    <div className="expand-label">Key Findings</div>
                    <div className="expand-text">{p.keyFindings}</div>
                </div>
            )}
            {p.team && p.team.length > 0 && (
                <div className="expand-section">
                    <div className="expand-label">Team Members</div>
                    <div className="expand-team">
                        {p.team.map(m => (
                            <span key={m.id} className="team-chip">
                                {m.fullName}
                                {m.designation && <span className="team-chip-sub"> · {m.designation}</span>}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {canEdit && (
                <div className="expand-actions">
                    <button className="btn btn-outline btn-sm" onClick={onEdit}>
                        <Pencil size={12} aria-hidden="true" /> Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={onDelete}>
                        <Trash2 size={12} aria-hidden="true" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

function ProjectModal({ project, divisions, users, onClose }) {
    const isEdit = !!project;

    const [title, setTitle]               = useState(project?.title         ?? '');
    const [description, setDescription]   = useState(project?.description   ?? '');
    const [researchArea, setResearchArea]  = useState(project?.researchArea  ?? '');
    const [fundingType, setFundingType]   = useState(project?.fundingType   ?? 'INTERNAL');
    const [fundingSource, setFundingSource] = useState(project?.fundingSource ?? '');
    const [objectives, setObjectives]     = useState(project?.objectives    ?? '');
    const [keyFindings, setKeyFindings]   = useState(project?.keyFindings   ?? '');
    const [status, setStatus]             = useState(project?.status        ?? 'ONGOING');
    const [divisionId, setDivisionId]     = useState(project?.divisionId ? String(project.divisionId) : '');
    const [startDate, setStartDate]       = useState(project?.startDate     ?? '');
    const [endDate, setEndDate]           = useState(project?.endDate       ?? '');
    const [teamMemberIds, setTeamMemberIds] = useState([]);

    const { mutate: createProject, isPending: isCreating } = useCreateProject();
    const { mutate: updateProject, isPending: isUpdating } = useUpdateProject();
    const isPending = isCreating || isUpdating;

    const toggleMember = (id) => {
        setTeamMemberIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            title,
            description:   description   || null,
            researchArea:  researchArea  || null,
            fundingType,
            fundingSource: fundingSource || null,
            objectives:    objectives    || null,
            keyFindings:   keyFindings   || null,
            divisionId:    divisionId ? Number(divisionId) : null,
            startDate:     startDate  || null,
            endDate:       endDate    || null,
        };

        if (isEdit) {
            updateProject(
                { id: project.id, ...payload, status },
                {
                    onSuccess: () => { toast.success('Project updated'); onClose(); },
                    onError:   (err) => toast.error(err?.response?.data?.message || 'Failed to update project'),
                }
            );
        } else {
            createProject(
                { ...payload, teamMemberIds: teamMemberIds.length ? teamMemberIds : null },
                {
                    onSuccess: () => { toast.success('Project created!'); onClose(); },
                    onError:   (err) => toast.error(err?.response?.data?.message || 'Failed to create project'),
                }
            );
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true"
                 aria-label={isEdit ? 'Edit project' : 'Create new project'}>
                <div className="modal-header">
                    <span className="modal-title">{isEdit ? 'Edit Project' : 'New Project'}</span>
                    <button className="modal-close" onClick={onClose} aria-label="Close">
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label" htmlFor="cp-title">Project title</label>
                            <input
                                id="cp-title"
                                type="text"
                                className="form-input"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Biodiversity Assessment 2026"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="cp-desc">
                                Description <span className="form-label-opt">(optional)</span>
                            </label>
                            <textarea
                                id="cp-desc"
                                className="form-textarea form-textarea-sm"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Brief overview of the project…"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="cp-objectives">
                                Objectives <span className="form-label-opt">(optional)</span>
                            </label>
                            <textarea
                                id="cp-objectives"
                                className="form-textarea form-textarea-sm"
                                value={objectives}
                                onChange={e => setObjectives(e.target.value)}
                                placeholder="Key objectives of this research project…"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="cp-findings">
                                Key Findings <span className="form-label-opt">(optional)</span>
                            </label>
                            <textarea
                                id="cp-findings"
                                className="form-textarea form-textarea-sm"
                                value={keyFindings}
                                onChange={e => setKeyFindings(e.target.value)}
                                placeholder="Notable findings or outcomes…"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="cp-research-area">
                                    Research area <span className="form-label-opt">(optional)</span>
                                </label>
                                <input
                                    id="cp-research-area"
                                    type="text"
                                    className="form-input"
                                    value={researchArea}
                                    onChange={e => setResearchArea(e.target.value)}
                                    placeholder="e.g. Forest ecology"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="cp-division">Division</label>
                                <select
                                    id="cp-division"
                                    className="form-select"
                                    value={divisionId}
                                    onChange={e => setDivisionId(e.target.value)}
                                >
                                    <option value="">None</option>
                                    {divisions.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="cp-funding">Funding type</label>
                                <select
                                    id="cp-funding"
                                    className="form-select"
                                    value={fundingType}
                                    onChange={e => setFundingType(e.target.value)}
                                >
                                    <option value="INTERNAL">Internal</option>
                                    <option value="GOVERNMENT">Government</option>
                                    <option value="DONOR">Donor</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="cp-funding-source">
                                    Funding source <span className="form-label-opt">(optional)</span>
                                </label>
                                <input
                                    id="cp-funding-source"
                                    type="text"
                                    className="form-input"
                                    value={fundingSource}
                                    onChange={e => setFundingSource(e.target.value)}
                                    placeholder="e.g. World Bank, CSIR Core"
                                />
                            </div>
                        </div>

                        {isEdit && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="cp-status">Status</label>
                                <select
                                    id="cp-status"
                                    className="form-select"
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                >
                                    <option value="ONGOING">Ongoing</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="PROPOSED">Proposed</option>
                                </select>
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="cp-start">
                                    Start date <span className="form-label-opt">(optional)</span>
                                </label>
                                <input
                                    id="cp-start"
                                    type="date"
                                    className="form-input"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="cp-end">
                                    End date <span className="form-label-opt">(optional)</span>
                                </label>
                                <input
                                    id="cp-end"
                                    type="date"
                                    className="form-input"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {!isEdit && users.length > 0 && (
                            <div className="form-group">
                                <label className="form-label">
                                    Team members <span className="form-label-opt">(optional)</span>
                                </label>
                                <div className="expand-team" style={{ maxHeight: 120, overflowY: 'auto' }}>
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            className={`team-chip${teamMemberIds.includes(u.id) ? ' selected' : ''}`}
                                            style={teamMemberIds.includes(u.id)
                                                ? { background: 'var(--forest-700)', color: '#fff', cursor: 'pointer' }
                                                : { cursor: 'pointer' }}
                                            onClick={() => toggleMember(u.id)}
                                        >
                                            {u.fullName}
                                            {u.designation && <span className="team-chip-sub"> · {u.designation}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isPending}>
                            {isPending ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Project')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
