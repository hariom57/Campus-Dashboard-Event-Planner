import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Calendar, ShieldCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
    const { user } = useAuth();
    const profileImageSrc = user?.display_picture
        ? (user.display_picture.startsWith('http') ? user.display_picture : `https://channeli.in${user.display_picture}`)
        : null;
    const profileInitial = (user?.full_name || user?.email || 'U').charAt(0).toUpperCase();

    return (
        <nav className="bottom-nav">
            <NavLink to="/home" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <LayoutGrid size={22} />
                <span>Feed</span>
            </NavLink>

            <NavLink to="/calendar" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <Calendar size={22} />
                <span>Calendar</span>
            </NavLink>

            <NavLink to="/todo" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <CheckCircle size={22} />
                <span>Personal</span>
            </NavLink>

            {(user?.isAdmin || (user?.managedClubIds && user.managedClubIds.length > 0)) && (
                <NavLink to="/admin" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                    <ShieldCheck size={22} />
                    <span>Admin</span>
                </NavLink>
            )}

            <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <div className="bottom-nav-icon-wrap">
                    {profileImageSrc ? (
                        <img src={profileImageSrc} alt="Profile" className="bottom-nav-avatar" />
                    ) : (
                        <div className="bottom-nav-avatar-fallback">{profileInitial}</div>
                    )}
                </div>
                <span>Profile</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
