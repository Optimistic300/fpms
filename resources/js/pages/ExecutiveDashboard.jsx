import { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import StatCard from '../components/dashboard/StatCard';
import DivisionBreakdownTable, { DivisionBreakdownTableSkeleton } from '../components/executive/DivisionBreakdownTable';
import FundingBreakdownPanel, { FundingBreakdownPanelSkeleton } from '../components/executive/FundingBreakdownPanel';
import ComplianceChart, { ComplianceChartSkeleton } from '../components/executive/ComplianceChart';
import PublicationsPanel, { PublicationsPanelSkeleton } from '../components/executive/PublicationsPanel';
import InstituteAlerts, { InstituteAlertsSkeleton } from '../components/executive/InstituteAlerts';

const sectionTitle = {
    fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px',
};

const cardContainer = {
    display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap',
};

export default function ExecutiveDashboard() {
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState(false);

    const [divisions, setDivisions] = useState([]);
    const [divisionsLoading, setDivisionsLoading] = useState(true);
    const [divisionsError, setDivisionsError] = useState(false);

    const [funding, setFunding] = useState(null);
    const [fundingLoading, setFundingLoading] = useState(true);
    const [fundingError, setFundingError] = useState(false);

    const [compliance, setCompliance] = useState([]);
    const [complianceLoading, setComplianceLoading] = useState(true);
    const [complianceError, setComplianceError] = useState(false);

    const [publications, setPublications] = useState([]);
    const [publicationsLoading, setPublicationsLoading] = useState(true);
    const [publicationsError, setPublicationsError] = useState(false);

    const [alerts, setAlerts] = useState([]);
    const [alertsLoading, setAlertsLoading] = useState(true);
    const [alertsError, setAlertsError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchAll() {
            const results = await Promise.allSettled([
                apiClient.get('/institute/stats', { signal: controller.signal }),
                apiClient.get('/divisions/summary', { signal: controller.signal }),
                apiClient.get('/institute/funding-breakdown', { signal: controller.signal }),
                apiClient.get('/institute/compliance', { signal: controller.signal }),
                apiClient.get('/publications', { params: { limit: 4 }, signal: controller.signal }),
                apiClient.get('/institute/alerts', { params: { limit: 5 }, signal: controller.signal }),
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
                setDivisions(results[1].value.data.data || []);
                setDivisionsLoading(false);
            } else {
                setDivisionsError(true);
                setDivisionsLoading(false);
            }

            if (results[2].status === 'fulfilled') {
                setFunding(results[2].value.data.data);
                setFundingLoading(false);
            } else {
                setFundingError(true);
                setFundingLoading(false);
            }

            if (results[3].status === 'fulfilled') {
                setCompliance(results[3].value.data.data || []);
                setComplianceLoading(false);
            } else {
                setComplianceError(true);
                setComplianceLoading(false);
            }

            if (results[4].status === 'fulfilled') {
                setPublications(results[4].value.data.data || []);
                setPublicationsLoading(false);
            } else {
                setPublicationsError(true);
                setPublicationsLoading(false);
            }

            if (results[5].status === 'fulfilled') {
                setAlerts(results[5].value.data.data || []);
                setAlertsLoading(false);
            } else {
                setAlertsError(true);
                setAlertsLoading(false);
            }
        }

        fetchAll();
        return () => controller.abort();
    }, []);

    return (
        <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 24px' }}>
                Executive Dashboard
            </h1>

            {/* Six Stat Cards */}
            <div style={cardContainer}>
                {statsLoading ? (
                    <>
                        <StatCard loading />
                        <StatCard loading />
                        <StatCard loading />
                        <StatCard loading />
                        <StatCard loading />
                        <StatCard loading />
                    </>
                ) : statsError ? (
                    <div style={{ flex: 1, padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                        Failed to load institute stats.
                    </div>
                ) : (
                    <>
                        <StatCard label="Total Projects" value={stats.totalProjects} icon="📁" />
                        <StatCard label="Ongoing" value={stats.ongoing} icon="🔄" hint="Active projects" />
                        <StatCard label="Divisions Active" value={stats.divisionsActive} icon="🏛️" />
                        <StatCard label="Reports Pending Review" value={stats.reportsPendingReview} icon="📋" hint="Awaiting approval" />
                        <StatCard label="Reports Overdue" value={stats.reportsOverdue} icon="⚠️" hint="Past deadline" />
                        <StatCard label="Library Documents" value={stats.libraryDocuments} icon="📚" hint="Total documents" />
                    </>
                )}
            </div>

            {/* Division Breakdown Table */}
            <div style={{ marginBottom: '24px' }}>
                <div style={sectionTitle}>Division Breakdown</div>
                <DivisionBreakdownTable
                    divisions={divisions}
                    loading={divisionsLoading}
                    error={divisionsError}
                />
            </div>

            {/* Three Panels */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* Funding Breakdown */}
                <div style={{ flex: '1 1 32%', minWidth: '280px' }}>
                    <div style={sectionTitle}>Funding Breakdown</div>
                    {fundingLoading ? (
                        <FundingBreakdownPanelSkeleton />
                    ) : (
                        <FundingBreakdownPanel
                            breakdown={funding}
                            loading={false}
                            error={fundingError}
                        />
                    )}
                    <div style={{ marginTop: '16px' }}>
                        {complianceLoading ? (
                            <ComplianceChartSkeleton />
                        ) : (
                            <ComplianceChart
                                data={compliance}
                                loading={false}
                                error={complianceError}
                            />
                        )}
                    </div>
                </div>

                {/* Publications */}
                <div style={{ flex: '1 1 32%', minWidth: '280px' }}>
                    <div style={sectionTitle}>Publications Output</div>
                    {publicationsLoading ? (
                        <PublicationsPanelSkeleton />
                    ) : (
                        <PublicationsPanel
                            publications={publications}
                            loading={false}
                            error={publicationsError}
                        />
                    )}
                </div>

                {/* Institute Alerts */}
                <div style={{ flex: '1 1 32%', minWidth: '280px' }}>
                    <div style={sectionTitle}>Institute Alerts</div>
                    {alertsLoading ? (
                        <InstituteAlertsSkeleton />
                    ) : (
                        <InstituteAlerts
                            alerts={alerts}
                            loading={false}
                            error={alertsError}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
