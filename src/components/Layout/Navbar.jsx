import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    MapPin, Calendar, Menu, X, Bell,
    Bookmark, Search, Home, User, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const { user, logout, notifications, toggleNotification } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { name: 'Home', path: '/home', icon: <Home size={18} /> },
        { name: 'Map', path: '/map', icon: <MapPin size={18} /> },
        { name: 'Calendar', path: '/calendar', icon: <Calendar size={18} /> },
    ];

    return (
        <nav className="navbar glass">
            <div className="container">
                <div className="navbar-inner">
                    {/* Logo */}
                    <Link to="/home" className="navbar-logo">
                        <div className="logo-icon">
                            <span>I</span>
                        </div>
                        <div className="logo-text">
                            <span className="logo-title">IITR Campus Dashboard</span>
                            <span className="logo-sub">Campus Events</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="navbar-links">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                            >
                                {link.icon}
                                <span>{link.name}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="navbar-actions">
                        <button
                            className="btn-icon nav-action-btn"
                            onClick={() => setSearchOpen(!searchOpen)}
                            title="Search"
                        >
                            <Search size={20} />
                        </button>

                        {user ? (
                            <div className="user-profile-nav">
                                <div className="notification-container" style={{ position: 'relative' }}>
                                    <button
                                        className="btn-icon nav-action-btn notification-btn"
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        title="Notifications"
                                    >
                                        <Bell size={20} fill={notifications.length > 0 ? "var(--yellow)" : "none"} />
                                        {notifications.length > 0 && <span className="notification-dot">{notifications.length}</span>}
                                    </button>

                                    {showNotifications && (
                                        <div className="avatar-dropdown glass" style={{ right: '-50px', width: '300px', padding: '0' }}>
                                            <div className="dropdown-header" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Your Reminders</h4>
                                            </div>
                                            <div className="notifications-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                {notifications.length === 0 ? (
                                                    <p style={{ padding: '2rem 1rem', textAlign: 'center', margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                        No reminders set yet.
                                                    </p>
                                                ) : (
                                                    notifications.map(notif => (
                                                        <div key={notif.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: '500' }}>{notif.title}</p>
                                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{notif.date} at {notif.time}</p>
                                                            </div>
                                                            <button
                                                                className="btn-icon-sm"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    await toggleNotification({ id: notif.id });
                                                                }}
                                                                title="Remove Reminder"
                                                            >
                                                                <X size={14} color="var(--red)" />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="user-avatar-container">
                                    <img
                                        src={user.display_picture || "/default-avatar.png"}
                                        alt="Profile"
                                        className="navbar-avatar"
                                    />
                                    <div className="avatar-dropdown glass">
                                        <div className="dropdown-header">
                                            <p className="user-name">{user.full_name}</p>
                                            <p className="user-email">{user.email}</p>
                                        </div>
                                        <div className="dropdown-divider" />
                                        <button onClick={logout} className="dropdown-item text-red">
                                            <LogOut size={16} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="mobile-toggle"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Search Bar */}
                {searchOpen && (
                    <div className="search-bar animate-fade-in">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search events, clubs, venues..."
                            className="search-input"
                            autoFocus
                        />
                        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            Search
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="mobile-menu animate-fade-in">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsOpen(false)}
                            className={`mobile-link ${isActive(link.path) ? 'active' : ''}`}
                        >
                            {link.icon}
                            <span>{link.name}</span>
                        </Link>
                    ))}
                    <div className="mobile-divider" />
                    {user ? (
                        <button onClick={() => { logout(); setIsOpen(false); }} className="btn btn-yellow" style={{ width: '100%', marginBottom: '10px' }}>
                            Logout ({user.full_name})
                        </button>
                    ) : (
                        <></>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
