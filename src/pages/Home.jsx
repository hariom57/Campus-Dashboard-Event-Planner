import React, { useState, useEffect } from 'react';
import { Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EventCard from '../components/Event/EventCard';
import eventService from '../services/events';
import academicCalendarService from '../services/academicCalendar';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const FILTERS = ['All', 'Technical', 'Cultural', 'Sports', 'Academic', 'Exam', 'Holiday', 'Timetable Reschedule', 'Fest', 'Workshop'];

const Home = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading, notifications } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(null);

    useEffect(() => {
        // Don't fetch until the Auth state is settled
        if (authLoading) return;

        const fetchAll = async () => {
            setLoading(true);
            try {
                await setTotalCount(eventService.getCount().catch((e) => {console.dir(e.message)}))
                // Fetch dynamic club events and official academic dates
                const [dynamicData, academicData] = await Promise.all([
                    eventService.getAllEvents(page).catch(() => []),
                    academicCalendarService.getAllEvents().catch(() => [])
                ]);

                // Normalize academic events to match the Home feed schema
                const normalizedAcademic = academicData.map(ae => ({
                    id: ae.id,
                    name: ae.title,
                    tentative_start_time: ae.startDate + 'T00:00:00',
                    tentative_end_time: ae.endDate + 'T23:59:59',
                    description: ae.description,
                    categories: ae.category,
                    location_name: ae.isHoliday ? 'Institute Holiday' : 'Campus-wide',
                    isAcademicCalendar: true,
                    isAllDay: true,
                    club_name: 'IIT Roorkee',
                }));

                // Combine and filter for only upcoming events
                const combined = [...dynamicData, ...normalizedAcademic];
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];

                const upcoming = combined.filter(ev => {
                    const eventDate = ev.tentative_end_time 
                        ? ev.tentative_end_time.split('T')[0] 
                        : ev.tentative_start_time.split('T')[0];
                    return eventDate >= todayStr;
                }).sort((a, b) => new Date(a.tentative_start_time) - new Date(b.tentative_start_time));

                setEvents(upcoming);
            } catch (err) {
                console.error("Home feed fetch error", err);
                setEvents([]); 
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [authLoading, user]);

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

    const pageIncrement = () => {
        if(totalCount / 10 < page) return;

        setPage(page + 1)
    }

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

            <div className='see-more'>
                <button className="btn-link" onClick={() => pageIncrement()}>
                    <span className='home-feed'>
                        <p>See More</p>
                    </span>
                </button>
            </div>
        </div>
    );
};

export default Home;
