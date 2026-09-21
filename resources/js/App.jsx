import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import ErrorBoundary from './components/layout/ErrorBoundary';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectDirectory = lazy(() => import('./pages/ProjectDirectory'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ProjectPreview = lazy(() => import('./pages/ProjectPreview'));
const NewProjectPage = lazy(() => import('./pages/NewProjectPage'));
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
const ReportDetail = lazy(() => import('./pages/ReportDetail'));

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ErrorBoundary>
                    <Routes>
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Login />
                                </PublicRoute>
                            }
                        />
                        {/* Parent layout route opens here */}
                        <Route
                            element={
                                <ProtectedRoute>
                                    <AppShell />
                                </ProtectedRoute>
                            }
                        >
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute allowedRoles={['RESEARCHER', 'STUDENT']}>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/projects"
                                element={
                                    <ProtectedRoute allowedRoles={['RESEARCHER', 'STUDENT', 'SECRETARY', 'DIVISION_HEAD', 'MANAGEMENT']}>
                                        <ProjectDirectory />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/projects/new" element={<NewProjectPage />} />
                            <Route
                                path="/projects/:id"
                                element={
                                    <ProtectedRoute allowedRoles={['RESEARCHER', 'STUDENT', 'SECRETARY', 'DIVISION_HEAD', 'MANAGEMENT']}>
                                        <ProjectDetail />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/projects/:id/preview"
                                element={
                                    <ProtectedRoute allowedRoles={['RESEARCHER', 'STUDENT', 'SECRETARY', 'DIVISION_HEAD', 'MANAGEMENT']}>
                                        <ProjectPreview />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/projects/:id/log-activity"
                                element={
                                    <ProtectedRoute allowedRoles={['RESEARCHER', 'STUDENT', 'SECRETARY', 'DIVISION_HEAD', 'MANAGEMENT']}>
                                        <LogActivity />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/my-activities" element={<MyActivities />} />
                            <Route
                                path="/submit-report"
                                element={
                                    <ProtectedRoute allowedRoles={['RESEARCHER', 'STUDENT']}>
                                        <SubmitReport />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/my-reports" element={<MyReports />} />
                            <Route
                                path="/report-queue"
                                element={
                                    <ProtectedRoute allowedRoles={['SECRETARY', 'DIVISION_HEAD', 'MANAGEMENT']}>
                                        <ReportQueue />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/report-review/:id"
                                element={
                                    <ProtectedRoute allowedRoles={['SECRETARY', 'DIVISION_HEAD', 'MANAGEMENT']}>
                                        <ReportReview />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/reports/:id"
                                element={
                                    <ProtectedRoute allowedRoles={['RESEARCHER', 'STUDENT', 'SECRETARY', 'DIVISION_HEAD', 'MANAGEMENT']}>
                                        <ReportDetail />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/division-dashboard"
                                element={
                                    <ProtectedRoute allowedRoles={['DIVISION_HEAD', 'MANAGEMENT']}>
                                        <DivisionDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/executive-dashboard"
                                element={
                                    <ProtectedRoute allowedRoles={['MANAGEMENT']}>
                                        <ExecutiveDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/library" element={<Library />} />
                            <Route path="/publications" element={<Publications />} />
                            <Route path="/inbox" element={<Inbox />} />
                            <Route
                                path="/user-management"
                                element={
                                    <ProtectedRoute allowedRoles={['ADMIN']}>
                                        <UserManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <ProtectedRoute allowedRoles={['ADMIN']}>
                                        <Settings />
                                    </ProtectedRoute>
                                }
                            />
                        </Route>{/* <-- Closing tag added here */}
                    </Routes>
                </ErrorBoundary>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;