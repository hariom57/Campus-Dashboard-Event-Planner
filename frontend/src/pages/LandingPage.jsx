import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

// Import assets from src/assets folder
import iitrLogo from '../assets/iitr_logo.png';
import tinkeringLogo from '../assets/tinkering_logo.png';

const LandingPage = () => {
    const { user, login } = useAuth();

    // If already logged in, fast-forward to the main app dashboard
    if (user) {
        return <Navigate to="/home" replace />;
    }

    return (
        <div className="landing-container">
            {/* Top Section / Main Content */}
            <div className="landing-content">
                <h1 className="landing-title">WELCOME TO IITR CAMPUS DASHBOARD</h1>
                
                <div className="landing-logo-wrapper">
                    <img 
                        src={iitrLogo} 
                        alt="IIT Roorkee Logo" 
                        className="landing-iitr-logo" 
                    />
                </div>
                
                <div className="landing-buttons">
                    <button onClick={login} className="btn landing-btn-student">
                        Student Login
                    </button>
                    <Link to="/admin" className="btn landing-btn-admin">
                        Admin Login
                    </Link>
                </div>
            </div>

            {/* Footer Section */}
            <div className="landing-footer">
                <span className="footer-text">made with</span>
                <img 
                    src={tinkeringLogo} 
                    alt="Tinkering Lab Logo" 
                    className="landing-tinkering-logo" 
                />
            </div>
        </div>
    );
};

export default LandingPage;
