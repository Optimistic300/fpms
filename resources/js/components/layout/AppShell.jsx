import { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { AIProvider } from '../../contexts/AIContext';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';
import FloatingAIButton from './FloatingAIButton';
import AIPanel from './AIPanel';

function ShellSkeleton() {
    return (
        <div
            style={{
                display: 'flex',
                height: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: '14px',
            }}
        >
            Loading...
        </div>
    );
}

export default function AppShell() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <NotificationProvider>
            <AIProvider>
                <div style={{ display: 'flex', minHeight: '100vh' }}>
                    <TopNav onToggleSidebar={() => setSidebarOpen((v) => !v)} />
                    <Sidebar
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                    <main
                        className="app-content"
                        style={{
                            marginLeft: '240px',
                            marginTop: '56px',
                            flex: 1,
                            padding: '24px',
                            minHeight: 'calc(100vh - 56px)',
                        }}
                    >
                        <Suspense fallback={<ShellSkeleton />}>
                            <Outlet />
                        </Suspense>
                    </main>
                    <FloatingAIButton />
                    <AIPanel />
                    <BottomTabBar />
                </div>
            </AIProvider>
        </NotificationProvider>
    );
}
