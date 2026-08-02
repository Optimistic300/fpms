import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import AppShell from './components/layout/AppShell';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DivisionDashboard from './pages/DivisionDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import ProjectDirectory from './pages/ProjectDirectory';
import ProjectDetail from './pages/ProjectDetail';
import ProjectPreview from './pages/ProjectPreview';
import MyActivities from './pages/MyActivities';
import LogActivity from './pages/LogActivity';
import MyReports from './pages/MyReports';
import SubmitReport from './pages/SubmitReport';
import ReportQueue from './pages/ReportQueue';
import ReportReview from './pages/ReportReview';
import SubmissionHistory from './pages/SubmissionHistory';
import Library from './pages/Library';
import Publications from './pages/Publications';
import Inbox from './pages/Inbox';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';

export default function AppRoot() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route
                        path="/login"
                        element={(
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        )}
                    />

                    <Route
                        element={(
                            <ProtectedRoute>
                                <AppShell />
                            </ProtectedRoute>
                        )}
                    >
                        <Route index element={<Navigate to="/dashboard" replace />} />

                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="division" element={<DivisionDashboard />} />
                        <Route path="executive" element={<ExecutiveDashboard />} />

                        <Route path="projects" element={<ProjectDirectory />} />
                        <Route path="projects/new" element={<ProjectDirectory />} />
                        <Route path="projects/:id" element={<ProjectDetail />} />
                        <Route path="projects/:id/preview" element={<ProjectPreview />} />

                        <Route path="activities" element={<MyActivities />} />
                        <Route path="log-activity" element={<LogActivity />} />

                        <Route path="reports" element={<MyReports />} />
                        <Route path="reports/new" element={<SubmitReport />} />
                        <Route path="reports/:reportId" element={<ReportReview />} />

                        <Route path="queue" element={<ReportQueue />} />
                        <Route path="queue/:reportId" element={<ReportReview />} />
                        <Route path="submissions" element={<SubmissionHistory />} />

                        <Route path="library" element={<Library />} />
                        <Route path="publications" element={<Publications />} />
                        <Route path="inbox" element={<Inbox />} />

                        <Route path="users" element={<UserManagement />} />
                        <Route path="settings" element={<Settings />} />

                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
