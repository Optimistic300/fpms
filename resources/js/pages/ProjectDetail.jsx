import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import ActivitiesTab from '../components/projects/ActivitiesTab';
import DocumentsTab from '../components/projects/DocumentsTab';
import ReportsTab from '../components/projects/ReportsTab';
import TeamTab from '../components/projects/TeamTab';
import EditProjectModal from '../components/projects/EditProjectModal';
import AddMemberModal from '../components/projects/AddMemberModal';

const statusBadge = {
    PROPOSED: { bg: '#fef3c7', color: '#92400e' },
    ACTIVE: { bg: '#dbeafe', color: '#1e40af' },
    COMPLETED: { bg: '#d1fae5', color: '#065f46' },
    ARCHIVED: { bg: '#f1f5f9', color: '#475569' },
};

const TABS = [
    { key: 'activities', label: 'Activities' },
    { key: 'documents', label: 'Documents' },
    { key: 'reports', label: 'Reports' },
    { key: 'team', label: 'Team' },
];

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('activities');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(null);
        apiClient
            .get(`/projects/${id}`)
            .then((res) => {
                setProject(res.data.data);
                setLoading(false);
            })
            .catch((err) => {
                if (err.response?.status === 403) {
                    navigate(`/projects/${id}/preview`, { replace: true });
                    return;
                }
                setError('Failed to load project.');
                setLoading(false);
            });
    }, [id, navigate]);

    function handleProjectUpdated(updated) {
        setProject(updated);
    }

    if (loading) {
        return (
            <div style={{ padding: '20px', color: '#94a3b8', fontSize: '14px' }}>
                Loading project...
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    padding: '20px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '14px',
                }}
            >
                {error}
            </div>
        );
    }

    if (!project) return null;

    const badge = statusBadge[project.status] || { bg: '#f1f5f9', color: '#475569' };
    const progress = project.progress || 0;

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '20px',
                }}
            >
                <Link
                    to="/projects"
                    style={{ color: '#2563eb', textDecoration: 'none' }}
                >
                    Projects
                </Link>
                <span>›</span>
                <span style={{ color: '#1e293b', fontWeight: 500 }}>{project.title}</span>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '24px',
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            padding: '24px',
                            marginBottom: '20px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '16px',
                                flexWrap: 'wrap',
                                gap: '12px',
                            }}
                        >
                            <div>
                                <h1
                                    style={{
                                        fontSize: '22px',
                                        fontWeight: 700,
                                        color: '#1e293b',
                                        margin: '0 0 8px 0',
                                    }}
                                >
                                    {project.title}
                                </h1>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        padding: '3px 10px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        borderRadius: '5px',
                                        backgroundColor: badge.bg,
                                        color: badge.color,
                                    }}
                                >
                                    {project.status}
                                </span>
                            </div>
                            {project.isOwner && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(true)}
                                        style={{
                                            padding: '8px 16px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#475569',
                                            backgroundColor: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(`/log-activity?projectId=${id}`)
                                        }
                                        style={{
                                            padding: '8px 16px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: 'white',
                                            backgroundColor: '#2563eb',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        Log Activity
                                    </button>
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: '24px',
                                flexWrap: 'wrap',
                                marginBottom: '16px',
                                fontSize: '13px',
                                color: '#64748b',
                            }}
                        >
                            <div>
                                <span style={{ color: '#94a3b8' }}>Lead: </span>
                                <span style={{ fontWeight: 500, color: '#1e293b' }}>
                                    {project.lead}
                                </span>
                                <span style={{ color: '#94a3b8' }}> — {project.division}</span>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8' }}>Funding: </span>
                                <span style={{ fontWeight: 500, color: '#1e293b' }}>
                                    {project.fundingType
                                        ? project.fundingType.charAt(0) +
                                          project.fundingType.slice(1).toLowerCase()
                                        : 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8' }}>Dates: </span>
                                <span style={{ fontWeight: 500, color: '#1e293b' }}>
                                    {project.startDate} — {project.endDate || 'Ongoing'}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '12px',
                                    color: '#94a3b8',
                                    marginBottom: '4px',
                                }}
                            >
                                <span>Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <div
                                style={{
                                    height: '8px',
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${Math.min(progress, 100)}%`,
                                        backgroundColor:
                                            progress === 100 ? '#10b981' : '#2563eb',
                                        borderRadius: '4px',
                                        transition: 'width 0.3s',
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                gap: '4px',
                                borderBottom: '1px solid #e2e8f0',
                                padding: '0 4px',
                            }}
                        >
                            {TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    style={{
                                        padding: '12px 20px',
                                        fontSize: '14px',
                                        fontWeight: activeTab === tab.key ? 600 : 500,
                                        color: activeTab === tab.key ? '#1e40af' : '#64748b',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        borderBottom:
                                            activeTab === tab.key
                                                ? '2px solid #2563eb'
                                                : '2px solid transparent',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.15s',
                                        marginBottom: '-1px',
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div style={{ padding: '4px 0' }}>
                            {activeTab === 'activities' && (
                                <ActivitiesTab
                                    projectId={id}
                                    selected={activeTab === 'activities'}
                                />
                            )}
                            {activeTab === 'documents' && (
                                <DocumentsTab
                                    projectId={id}
                                    selected={activeTab === 'documents'}
                                />
                            )}
                            {activeTab === 'reports' && (
                                <ReportsTab
                                    projectId={id}
                                    selected={activeTab === 'reports'}
                                />
                            )}
                            {activeTab === 'team' && (
                                <TeamTab
                                    projectId={id}
                                    selected={activeTab === 'team'}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        width: '280px',
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            padding: '20px',
                        }}
                    >
                        <h3
                            style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#1e293b',
                                margin: '0 0 16px 0',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                            }}
                        >
                            Project Details
                        </h3>
                        <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.8 }}>
                            <div>
                                <span style={{ color: '#94a3b8' }}>Research Area: </span>
                                <span style={{ color: '#1e293b' }}>
                                    {project.researchArea || 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8' }}>Location: </span>
                                <span style={{ color: '#1e293b' }}>
                                    {project.location || 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8' }}>Start Date: </span>
                                <span style={{ color: '#1e293b' }}>{project.startDate}</span>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8' }}>End Date: </span>
                                <span style={{ color: '#1e293b' }}>
                                    {project.endDate || 'Ongoing'}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8' }}>Funding: </span>
                                <span style={{ color: '#1e293b' }}>
                                    {project.fundingType
                                        ? project.fundingType.charAt(0) +
                                          project.fundingType.slice(1).toLowerCase()
                                        : 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8' }}>Activities: </span>
                                <span style={{ color: '#1e293b' }}>
                                    {project.activityCount || 0}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8' }}>Documents: </span>
                                <span style={{ color: '#1e293b' }}>
                                    {project.documentCount || 0}
                                </span>
                            </div>
                        </div>

                        {project.recentDocuments && project.recentDocuments.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <h4
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: '#64748b',
                                        margin: '0 0 10px 0',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.3px',
                                    }}
                                >
                                    Recent Documents
                                </h4>
                                {project.recentDocuments.slice(0, 5).map((doc) => (
                                    <div
                                        key={doc.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 0',
                                            fontSize: '13px',
                                        }}
                                    >
                                        <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                                            📄
                                        </span>
                                        <span
                                            style={{
                                                flex: 1,
                                                color: '#1e293b',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {doc.filename}
                                        </span>
                                        {doc.downloadUrl && (
                                            <button
                                                type="button"
                                                onClick={() => window.open(doc.downloadUrl, '_blank')}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    padding: '2px',
                                                    color: '#2563eb',
                                                }}
                                                title="Download"
                                                aria-label="Download"
                                            >
                                                ⬇
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(`/reports/new?projectId=${id}`)
                                }
                                style={{
                                    padding: '9px 16px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: 'white',
                                    backgroundColor: '#2563eb',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Submit Report
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowShareModal(true)}
                                style={{
                                    padding: '9px 16px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#475569',
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Share Access
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('documents')}
                                style={{
                                    padding: '9px 16px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#475569',
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Publish to Library
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <EditProjectModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                project={project}
                onUpdated={handleProjectUpdated}
            />

            <AddMemberModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                projectId={id}
                onAdded={() => {}}
            />
        </div>
    );
}
