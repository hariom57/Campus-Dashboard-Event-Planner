import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    MapPin, Calendar, BookOpen, Menu, X, Bell, User,
    Bookmark, Search, Home
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { name: 'Home', path: '/', icon: <Home size={18} /> },
        { name: 'Map', path: '/map', icon: <MapPin size={18} /> },
        { name: 'Calendar', path: '/calendar', icon: <Calendar size={18} /> },
        { name: 'Resources', path: '/resources', icon: <BookOpen size={18} /> },
    ];

    return (
        <nav className="navbar glass">
            <div className="container">
                <div className="navbar-inner">
                    {/* Logo */}
                    <Link to="/" className="navbar-logo">
                        <div className="logo-icon">
                            <span>I</span>
                        </div>
                        <div className="logo-text">
                            <span className="logo-title">IITR Connect</span>
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
                        <button className="btn-icon nav-action-btn" title="Bookmarks">
                            <Bookmark size={20} />
                        </button>
                        <button className="btn-icon nav-action-btn notification-btn" title="Notifications">
                            <Bell size={20} />
                            <span className="notification-dot"></span>
                        </button>
                        <Link to="/admin" className="btn btn-yellow nav-admin-btn">
                            Club Login
                        </Link>
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
                    <Link to="/admin" onClick={() => setIsOpen(false)} className="btn btn-yellow" style={{ width: '100%' }}>
                        Club Login
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
