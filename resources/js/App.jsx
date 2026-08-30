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
                            <Route path="/projects/:id" element={<ProjectDetail />} />
                            <Route path="/projects/:id/preview" element={<ProjectPreview />} />
                            <Route
                                path="/log-activity"
                                element={
                                    <ProtectedRoute allowedRoles={['RESEARCHER', 'STUDENT', 'DIVISION_HEAD']}>
                                        <LogActivity />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/activities"
                                element={
                                    <ProtectedRoute allowedRoles={['RESEARCHER', 'STUDENT', 'DIVISION_HEAD']}>
                                        <MyActivities />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/reports/new"
                                element={
                                    <ProtectedRoute allowedRoles={['RESEARCHER', 'STUDENT', 'DIVISION_HEAD']}>
                                        <SubmitReport />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/reports"
                                element={
                                    <ProtectedRoute allowedRoles={['RESEARCHER', 'STUDENT', 'DIVISION_HEAD']}>
                                        <MyReports />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/queue/:reportId"
                                element={
                                    <ProtectedRoute allowedRoles={['SECRETARY']}>
                                        <ReportReview />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/queue"
                                element={
                                    <ProtectedRoute allowedRoles={['SECRETARY']}>
                                        <ReportQueue />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/division"
                                element={
                                    <ProtectedRoute allowedRoles={['DIVISION_HEAD']}>
                                        <DivisionDashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/executive"
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
                                path="/users"
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
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute allowedRoles={['RESEARCHER', 'STUDENT']}>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                        </Route>
                    </Routes>
                </ErrorBoundary>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
