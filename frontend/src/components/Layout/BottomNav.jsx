import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Calendar, ShieldCheck, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
    const { user, notifications } = useAuth();
    const hasAlerts = notifications && notifications.length > 0;

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

            {user?.isAdmin && (
                <NavLink to="/admin" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                    <ShieldCheck size={22} />
                    <span>Admin</span>
                </NavLink>
            )}

            <NavLink to="/alerts" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <div className="bottom-nav-icon-wrap">
                    <Bell size={22} />
                    {hasAlerts && <span className="bottom-nav-badge">{notifications.length}</span>}
                </div>
                <span>Alerts</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
