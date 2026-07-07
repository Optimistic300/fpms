import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import ErrorBoundary from './components/layout/ErrorBoundary';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectDirectory = lazy(() => import('./pages/ProjectDirectory'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ProjectPreview = lazy(() => import('./pages/ProjectPreview'));
const LogActivity = lazy(() => import('./pages/LogActivity'));
const MyActivities = lazy(() => import('./pages/MyActivities'));
const SubmitReport = lazy(() => import('./pages/SubmitReport'));
const MyReports = lazy(() => import('./pages/MyReports'));
const ReportQueue = lazy(() => import('./pages/ReportQueue'));
const ReportReview = lazy(() => import('./pages/ReportReview'));
const DivisionDashboard = lazy(() => import('./pages/DivisionDashboard'));
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'));
const Library = lazy(() => import('./pages/Library'));
const Publications = lazy(() => import('./pages/Publications'));
const Inbox = lazy(() => import('./pages/Inbox'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Settings = lazy(() => import('./pages/Settings'));
const NewProject = lazy(() => import('./pages/NewProject'));
const SubmissionHistory = lazy(() => import('./pages/SubmissionHistory'));

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ErrorBoundary>
                    <Routes>
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Login />
                                </PublicRoute>
                            }
                        />
                        <Route
                            element={
                                <ProtectedRoute>
                                    <AppShell />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/projects" element={<ProjectDirectory />} />
                            <Route path="/projects/new" element={<NewProject />} />
                            <Route path="/projects/:id" element={<ProjectDetail />} />
                            <Route path="/projects/:id/preview" element={<ProjectPreview />} />
                            <Route path="/log-activity" element={<LogActivity />} />
                            <Route path="/activities" element={<MyActivities />} />
                            <Route path="/reports/new" element={<SubmitReport />} />
                            <Route path="/reports" element={<MyReports />} />
                            <Route path="/queue/:reportId" element={<ReportReview />} />
                            <Route path="/queue" element={<ReportQueue />} />
                            <Route path="/division" element={<DivisionDashboard />} />
                            <Route path="/executive" element={<ExecutiveDashboard />} />
                            <Route path="/library" element={<Library />} />
                            <Route path="/publications" element={<Publications />} />
                            <Route path="/inbox" element={<Inbox />} />
                            <Route path="/users" element={<UserManagement />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/submissions" element={<SubmissionHistory />} />
                            <Route path="/" element={<Dashboard />} />
                        </Route>
                    </Routes>
                </ErrorBoundary>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
