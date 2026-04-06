import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import BottomNav from './components/Layout/BottomNav';
import Home from './pages/Home';
import CalendarPage from './pages/Calendar';
import Admin from './pages/Admin';
import ClubsPage from './pages/Clubs';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/Profile';
import EventDetail from './pages/EventDetail';
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
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public Landing Route (No Bottom Nav) */}
                    <Route path="/" element={<LandingPage />} />

                    {/* App Routes (with Bottom Nav) */}
                    <Route path="/home" element={<AppShell><Home /></AppShell>} />
                    <Route path="/calendar" element={<AppShell><CalendarPage /></AppShell>} />
                    <Route path="/clubs" element={<AppShell><ClubsPage /></AppShell>} />
                    <Route path="/profile" element={<AppShell><ProfilePage /></AppShell>} />
                    <Route path="/admin" element={<AppShell><Admin /></AppShell>} />
                    <Route path="/event/:eventId" element={<AppShell><EventDetail /></AppShell>} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
