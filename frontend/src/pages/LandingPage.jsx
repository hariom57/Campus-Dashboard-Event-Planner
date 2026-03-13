import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, HelpCircle } from 'lucide-react';
import iitrLogo from '../assets/iitr_logo.png';
import tinkeringLogo from '../assets/tinkering_logo.png';
import './LandingPage.css';

const LandingPage = () => {
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();

    // If already logged in, go to home
    React.useEffect(() => {
        if (!loading && user) {
            navigate('/home');
        }
    }, [user, loading, navigate]);

    return (
        <div className="landing-page">
            <div className="landing-body">
                {/* App Logos Area */}
                <div className="landing-logo-area">
                    <img src={iitrLogo} alt="IITR Logo" className="landing-brand-logo iitr" />
                    {/* <img src={tinkeringLogo} alt="Tinkering Labs Logo" className="landing-brand-logo tinkering" /> */}
                </div>

                {/* Tagline */}
                <div className="landing-hero">
                    <h1 className="landing-headline">
                        IITR<br />Campus<br />Dashboard
                    </h1>
                    <p className="landing-subtext">
                        Access the pulse of Roorkee. Events, hackathons, fests, and workshops—all in one place.
                    </p>
                </div>

                {/* Login Buttons */}
                <div className="landing-actions">
                    <button className="landing-btn-student" onClick={login}>
                        <div className="landing-btn-icon-wrap">
                            <User size={22} />
                        </div>
                        <div className="landing-btn-text">
                            <span className="landing-btn-title">Student Login</span>
                            <span className="landing-btn-subtitle">Access via Channel-I SSO</span>
                        </div>
                        <span className="landing-btn-arrow">›</span>
                    </button>

                    <button className="landing-btn-admin" onClick={login}>
                        <div className="landing-btn-icon-wrap">
                            <ShieldCheck size={22} />
                        </div>
                        <div className="landing-btn-text">
                            <span className="landing-btn-title">Admin Login</span>
                            <span className="landing-btn-subtitle">Club &amp; Platform Management</span>
                        </div>
                        <span className="landing-btn-arrow">›</span>
                    </button>

                    <button className="landing-help-btn">
                        <HelpCircle size={16} />
                        Need help signing in?
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="landing-footer">
                <div className="landing-footer-logos">
                    <img src={tinkeringLogo} alt="Tinkering Labs" className="footer-tl-logo" />
                </div>
                <p className="landing-footer-text">
                    made with <span className="heart">❤</span> by tinkering labs
                </p>
            </div>
        </div>
    );
};

export default LandingPage;
