import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import MapPage from './pages/Map';
import CalendarPage from './pages/Calendar';
import Admin from './pages/Admin';
import LandingPage from './pages/LandingPage';

// A layout wrapper that includes the Navbar. 
// Used for pages where we DO want the Navbar visible.
const MainLayout = ({ children }) => {
    return (
        <div className="app-container">
            <Navbar />
            <main>
                {children}
            </main>
        </div>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public/Landing Route (No Navbar) */}
                    <Route path="/" element={<LandingPage />} />
                    
                    {/* Routes with Navbar Wrapper */}
                    <Route path="/home" element={<MainLayout><Home /></MainLayout>} />
                    <Route path="/map" element={<MainLayout><MapPage /></MainLayout>} />
                    <Route path="/calendar" element={<MainLayout><CalendarPage /></MainLayout>} />
                    
                    {/* Admin Route (Assuming it doesn't need main navbar, or adjust as needed) */}
                    <Route path="/admin" element={<Admin />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
