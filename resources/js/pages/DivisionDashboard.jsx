import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/axios';
import StatCard from '../components/dashboard/StatCard';
import DivisionProjectsTable from '../components/division/DivisionProjectsTable';
import ResearcherActivityTable from '../components/division/ResearcherActivityTable';
import ActivityFeedList from '../components/division/ActivityFeedList';
import ReportStatusPanel from '../components/division/ReportStatusPanel';

function SkeletonCard() {
    return (
        <div style={{ flex: 1, minWidth: '180px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ height: '16px', width: '60%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ height: '32px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
            <div style={{ height: '12px', width: '80%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginTop: '12px' }} />
        </div>
    );
}

export default function DivisionDashboard() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    const divisionId = searchParams.get('divisionId') || user?.divisionId || 'me';

    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState(false);

    const [projects, setProjects] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [projectsError, setProjectsError] = useState(false);

    const [researchers, setResearchers] = useState([]);
    const [researchersLoading, setResearchersLoading] = useState(true);
    const [researchersError, setResearchersError] = useState(false);

    const [reports, setReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(true);
    const [reportsError, setReportsError] = useState(false);

    const [activities, setActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [activitiesError, setActivitiesError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchAll() {
            setStatsLoading(true);
            setProjectsLoading(true);
            setResearchersLoading(true);
            setReportsLoading(true);
            setActivitiesLoading(true);

            const results = await Promise.allSettled([
                apiClient.get(`/divisions/${divisionId}/stats`, { signal: controller.signal }),
                apiClient.get('/projects', {
                    params: { division: divisionId, limit: 20 },
                    signal: controller.signal,
                }),
                apiClient.get(`/divisions/${divisionId}/researcher-activity`, { signal: controller.signal }),
                apiClient.get('/reports', {
                    params: { division: divisionId, limit: 5 },
                    signal: controller.signal,
                }),
                apiClient.get(`/divisions/${divisionId}/activity-feed`, {
                    params: { limit: 10 },
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
                setResearchers(results[2].value.data.data || []);
                setResearchersLoading(false);
            } else {
                setResearchersError(true);
                setResearchersLoading(false);
            }

            if (results[3].status === 'fulfilled') {
                setReports(results[3].value.data.data || []);
                setReportsLoading(false);
            } else {
                setReportsError(true);
                setReportsLoading(false);
            }

            if (results[4].status === 'fulfilled') {
                setActivities(results[4].value.data.data || []);
                setActivitiesLoading(false);
            } else {
                setActivitiesError(true);
                setActivitiesLoading(false);
            }
        }

        fetchAll();
        return () => controller.abort();
    }, [divisionId]);

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                    Division Overview
                </h1>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {today} — {user?.division || 'Division'}
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
                        <SkeletonCard />
                    </>
                ) : statsError ? (
                    <div style={{ flex: 1, padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                        Failed to load division stats.
                    </div>
                ) : (
                    <>
                        <StatCard
                            label="Total Projects"
                            value={stats.totalProjects}
                            icon="📁"
                            hint="All division projects"
                        />
                        <StatCard
                            label="Ongoing"
                            value={stats.ongoing}
                            icon="🔄"
                            hint="Active projects"
                        />
                        <StatCard
                            label="Reports Pending"
                            value={stats.reportsPending}
                            icon="📋"
                            hint={stats.reportsPending > 0 ? 'Awaiting review' : 'All clear'}
                        />
                        <div
                            style={{
                                flex: 1,
                                minWidth: '180px',
                                padding: '20px',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                borderLeft: stats.reportsOverdue > 0 ? '4px solid #dc2626' : '4px solid #e2e8f0',
                            }}
                        >
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: stats.reportsOverdue > 0 ? '#dc2626' : '#1e293b' }}>
                                {stats.reportsOverdue ?? '—'}
                            </div>
                            <div style={{ fontSize: '14px', color: stats.reportsOverdue > 0 ? '#dc2626' : '#64748b', marginTop: '4px' }}>
                                Reports Overdue
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                                {stats.reportsOverdue > 0 ? 'Overdue!' : 'No overdue'}
                            </div>
                        </div>
                        <StatCard
                            label="Active Researchers"
                            value={stats.activeResearchers}
                            icon="👥"
                            hint="In your division"
                        />
                    </>
                )}
            </div>

            {/* Two-Column Layout */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* Left Column */}
                <div style={{ flex: '1 1 45%', minWidth: '320px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <DivisionProjectsTable
                            projects={projects}
                            loading={projectsLoading}
                            error={projectsError}
                            divisionId={divisionId}
                        />
                    </div>
                    <div>
                        <ReportStatusPanel
                            reports={reports}
                            loading={reportsLoading}
                            error={reportsError}
                            divisionId={divisionId}
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ flex: '1 1 45%', minWidth: '320px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <ResearcherActivityTable
                            researchers={researchers}
                            loading={researchersLoading}
                            error={researchersError}
                        />
                    </div>
                    <div>
                        <ActivityFeedList
                            activities={activities}
                            loading={activitiesLoading}
                            error={activitiesError}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
