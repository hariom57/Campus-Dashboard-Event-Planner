import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { AuthProvider } from './context/AuthContext';
import BottomNav from './components/Layout/BottomNav';
import eventReminderService from './services/eventReminders';
import Home from './pages/Home';
import CalendarPage from './pages/Calendar';
import Admin from './pages/Admin';
import Todo from './pages/Todo';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/Profile';
import NotificationsPage from './pages/Notifications';
import EventDetail from './pages/EventDetail';
import InstallPrompt from './components/Widgets/InstallPrompt';
import ToastViewport from './components/Common/ToastViewport';
import './App.css';

// Shell layout that wraps pages needing the bottom navigation
const AppShell = ({ children }) => {
    return (
        <div className="app-shell">
            <main className="app-main">
                {children}
            </main>
            <BottomNav />
        </div>
    );
};

function App() {
    useEffect(() => {
        eventReminderService.scheduleStoredReminders();
    }, []);

    return (
        <Router>
            <SWRConfig 
                value={{
                    refreshInterval: 30000, 
                    revalidateOnFocus: true,
                    revalidateOnReconnect: true
                }}
            >
                <AuthProvider>
                    <Routes>
                        {/* Public Landing Route (No Bottom Nav) */}
                        <Route path="/" element={<LandingPage />} />

                        {/* App Routes (with Bottom Nav) */}
                        <Route path="/home" element={<AppShell><Home /></AppShell>} />
                        <Route path="/calendar" element={<AppShell><CalendarPage /></AppShell>} />
                        <Route path="/todo" element={<AppShell><Todo /></AppShell>} />
                        <Route path="/profile" element={<AppShell><ProfilePage /></AppShell>} />
                        <Route path="/notifications" element={<AppShell><NotificationsPage /></AppShell>} />
                        <Route path="/admin" element={<AppShell><Admin /></AppShell>} />
                        <Route path="/event/:eventId" element={<AppShell><EventDetail /></AppShell>} />
                    </Routes>
                    <InstallPrompt />
                    <ToastViewport />
                </AuthProvider>
            </SWRConfig>
        </Router>
    );
}

export default App;
