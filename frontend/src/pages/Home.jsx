import React, { useState, useEffect } from 'react';
import { Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EventCard from '../components/Event/EventCard';
import eventService from '../services/events';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const FILTERS = ['All', 'Technical', 'Cultural', 'Sports', 'Academic', 'Fest', 'Workshop'];

const Home = () => {
    const navigate = useNavigate();
    const { user, notifications } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const data = await eventService.getAllEvents();
                setEvents(data);
            } catch (err) {
                console.error('Error fetching events:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(ev => {
        const matchFilter =
            activeFilter === 'All' ||
            (ev.categories && ev.categories.toLowerCase().includes(activeFilter.toLowerCase()));
        const matchSearch =
            !searchQuery ||
            ev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ev.club_name && ev.club_name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchFilter && matchSearch;
    });

    return (
        <div className="home-page">
            {/* Top Header Bar */}
            <div className="page-header-bar">
                <h1>Explore Events</h1>
                <div className="page-header-actions">
                    <button className="header-icon-btn" onClick={() => setShowSearch(s => !s)} aria-label="Search">
                        <Search size={18} />
                    </button>
                    <button className="header-icon-btn" onClick={() => navigate('/alerts')} aria-label="Notifications" style={{ position: 'relative' }}>
                        <Bell size={18} />
                        {notifications?.length > 0 && <span className="header-bell-dot" />}
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
                <div className="home-search-bar">
                    <Search size={16} className="search-inline-icon" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search events, clubs..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            {/* Category Filter Chips */}
            <div className="home-chips-wrap">
                {FILTERS.map(f => (
                    <button
                        key={f}
                        className={`home-chip ${activeFilter === f ? 'active' : ''}`}
                        onClick={() => setActiveFilter(f)}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Event Feed */}
            <div className="home-feed">
                {loading ? (
                    <div className="home-loading">
                        <div className="home-spinner" />
                        <p>Loading events...</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="home-empty">
                        <p>No events found</p>
                        <button className="btn-link" onClick={() => { setActiveFilter('All'); setSearchQuery(''); }}>
                            Clear filters
                        </button>
                    </div>
                ) : (
                    filteredEvents.map(ev => (
                        <EventCard key={ev.id} event={ev} />
                    ))
                )}
            </div>
        </div>
    );
};

export default Home;
