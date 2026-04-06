import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EventCard from '../components/Event/EventCard';
import eventService from '../services/events';
import academicCalendarService from '../services/academicCalendar';
import eventReminderService from '../services/eventReminders';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const PREF_MODES = {
    ALL: 'all',
    PREFERRED: 'preferred',
    NOT_PREFERRED: 'not-preferred',
};

const extractCategoryNames = (event) => {
    if (Array.isArray(event?.categories)) {
        return event.categories
            .map((cat) => (typeof cat === 'string' ? cat : cat?.name))
            .filter(Boolean);
    }

    if (typeof event?.categories === 'string') {
        return event.categories
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean);
    }

    return [];
};

const Home = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading, notifications } = useAuth();
    const [dynamicEvents, setDynamicEvents] = useState([]);
    const [academicEvents, setAcademicEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [prefMode, setPrefMode] = useState(PREF_MODES.ALL);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [reminderEventIds, setReminderEventIds] = useState(() => new Set(eventReminderService.getReminderIds()));
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const sentinelRef = useRef(null);
    const PAGE_SIZE = 10;

    const fetchDynamicPage = useCallback(async (targetPage) => {
        if (targetPage === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const result = await eventService.getAllEventsPage(targetPage, PAGE_SIZE);
            const fetched = result?.events || [];

            setDynamicEvents((prev) => {
                const incoming = targetPage === 1 ? fetched : [...prev, ...fetched];
                const seen = new Set();
                return incoming.filter((ev) => {
                    const key = String(ev.id);
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
            });

            if (typeof result?.totalPages === 'number' && result.totalPages > 0) {
                setHasMore(targetPage < result.totalPages);
            } else {
                setHasMore(fetched.length === PAGE_SIZE);
            }

            setInitialLoaded(true);
        } catch (err) {
            console.error('Home feed fetch error', err);
            if (targetPage === 1) {
                setDynamicEvents([]);
            }
            setHasMore(false);
            setInitialLoaded(true);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading || !user) return;

        const fetchAcademicEvents = async () => {
            try {
                const academicData = await academicCalendarService.getAllEvents().catch(() => []);
                const normalizedAcademic = academicData.map((ae) => ({
                    id: `academic-${ae.id}`,
                    name: ae.title,
                    tentative_start_time: `${ae.startDate}T00:00:00`,
                    tentative_end_time: `${ae.endDate}T23:59:59`,
                    description: ae.description,
                    categories: ae.category,
                    location_name: ae.isHoliday ? 'Institute Holiday' : 'Campus-wide',
                    isAcademicCalendar: true,
                    isAllDay: true,
                    club_name: 'IIT Roorkee',
                }));
                setAcademicEvents(normalizedAcademic);
            } catch (err) {
                console.error('Academic feed fetch error', err);
                setAcademicEvents([]);
            }
        };

        setPage(1);
        setHasMore(true);
        setInitialLoaded(false);
        fetchAcademicEvents();
        fetchDynamicPage(1);
    }, [authLoading, user, fetchDynamicPage]);

    useEffect(() => {
        if (!initialLoaded || page === 1 || !hasMore || loadingMore) return;
        fetchDynamicPage(page);
    }, [page, hasMore, loadingMore, initialLoaded, fetchDynamicPage]);

    useEffect(() => {
        eventReminderService.scheduleStoredReminders();
        setReminderEventIds(new Set(eventReminderService.getReminderIds()));
    }, []);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !initialLoaded) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading) {
                    setPage((prev) => prev + 1);
                }
            },
            { root: null, rootMargin: '300px 0px', threshold: 0 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, initialLoaded]);

    const events = useMemo(() => {
        const combined = [...dynamicEvents, ...academicEvents];
        const todayStr = new Date().toISOString().split('T')[0];

        return combined
            .filter((ev) => {
                const eventDate = ev.tentative_end_time
                    ? ev.tentative_end_time.split('T')[0]
                    : ev.tentative_start_time.split('T')[0];
                return eventDate >= todayStr;
            })
            .sort((a, b) => new Date(a.tentative_start_time) - new Date(b.tentative_start_time));
    }, [dynamicEvents, academicEvents]);

    const availableCategories = useMemo(() => {
        const set = new Set();
        events.forEach((ev) => {
            extractCategoryNames(ev).forEach((cat) => set.add(cat));
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [events]);

    const preferredClubIds = useMemo(
        () => new Set((user?.preferredClubs || []).map((id) => Number(id))),
        [user?.preferredClubs]
    );
    const notPreferredClubIds = useMemo(
        () => new Set((user?.notPreferredClubs || []).map((id) => Number(id))),
        [user?.notPreferredClubs]
    );
    const preferredCategoryIds = useMemo(
        () => new Set((user?.preferredCategories || []).map((id) => Number(id))),
        [user?.preferredCategories]
    );
    const notPreferredCategoryIds = useMemo(
        () => new Set((user?.notPreferredCategories || []).map((id) => Number(id))),
        [user?.notPreferredCategories]
    );

    const toggleCategory = (categoryName) => {
        setSelectedCategories((prev) => (
            prev.includes(categoryName)
                ? prev.filter((item) => item !== categoryName)
                : [...prev, categoryName]
        ));
    };

    const filteredEvents = events.filter((ev) => {
        const eventCategoryNames = extractCategoryNames(ev);
        const eventCategoryIds = Array.isArray(ev.category_ids)
            ? ev.category_ids.map((id) => Number(id)).filter((id) => Number.isInteger(id))
            : [];
        const eventClubId = Number(ev.club_id);

        const matchesCategorySelection =
            selectedCategories.length === 0
            || selectedCategories.some((selected) => eventCategoryNames.includes(selected));

        const isPreferredMatch =
            preferredClubIds.has(eventClubId)
            || eventCategoryIds.some((id) => preferredCategoryIds.has(id));

        const isNotPreferredMatch =
            notPreferredClubIds.has(eventClubId)
            || eventCategoryIds.some((id) => notPreferredCategoryIds.has(id));

        const matchesPreferenceMode =
            prefMode === PREF_MODES.ALL
            || (prefMode === PREF_MODES.PREFERRED && isPreferredMatch)
            || (prefMode === PREF_MODES.NOT_PREFERRED && isNotPreferredMatch);

        const matchesSearch =
            !searchQuery
            || ev.name.toLowerCase().includes(searchQuery.toLowerCase())
            || (ev.club_name && ev.club_name.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesCategorySelection && matchesPreferenceMode && matchesSearch;
    });

    useEffect(() => {
        filteredEvents.forEach((event) => {
            eventReminderService.updateReminderSnapshot(event);
        });
    }, [filteredEvents]);

    const handleToggleReminder = async (event) => {
        const result = await eventReminderService.toggleReminder(event);
        setReminderEventIds(new Set(eventReminderService.getReminderIds()));

        if (result.error === 'unsupported') {
            window.alert('Notifications are not supported on this browser.');
        }

        if (result.error === 'permission-denied') {
            window.alert('Please allow notifications in browser settings to get reminders.');
        }

        if (result.error === 'event-started') {
            window.alert('This event has already started, so reminders cannot be scheduled.');
        }
    };

    return (
        <div className="home-page">
            {/* Top Header Bar */}
            <div className="page-header-bar">
                <h1>Explore Events</h1>
                <div className="page-header-actions">
                    <button className="header-icon-btn" onClick={() => setShowSearch(s => !s)} aria-label="Search">
                        <Search size={18} />
                    </button>
                    <button className="header-icon-btn" onClick={() => navigate('/profile')} aria-label="Notifications" style={{ position: 'relative' }}>
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

            {/* Preference Modes */}
            <div className="home-mode-wrap">
                <button
                    className={`home-mode-btn ${prefMode === PREF_MODES.ALL ? 'active' : ''}`}
                    onClick={() => setPrefMode(PREF_MODES.ALL)}
                >
                    All Events
                </button>
                <button
                    className={`home-mode-btn ${prefMode === PREF_MODES.PREFERRED ? 'active' : ''}`}
                    onClick={() => setPrefMode(PREF_MODES.PREFERRED)}
                >
                    Preferred Only
                </button>
                <button
                    className={`home-mode-btn ${prefMode === PREF_MODES.NOT_PREFERRED ? 'active' : ''}`}
                    onClick={() => setPrefMode(PREF_MODES.NOT_PREFERRED)}
                >
                    Not Preferred
                </button>
            </div>

            {/* Category Filter Chips (Multi-select) */}
            <div className="home-chips-wrap">
                {availableCategories.map((category) => (
                    <button
                        key={category}
                        className={`home-chip ${selectedCategories.includes(category) ? 'active' : ''}`}
                        onClick={() => toggleCategory(category)}
                    >
                        {category}
                    </button>
                ))}

                {availableCategories.length === 0 && (
                    <span className="home-chip-placeholder">No categories available right now.</span>
                )}
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
                        <button
                            className="btn-link"
                            onClick={() => {
                                setSelectedCategories([]);
                                setPrefMode(PREF_MODES.ALL);
                                setSearchQuery('');
                            }}
                        >
                            Clear filters
                        </button>
                    </div>
                ) : (
                    filteredEvents.map(ev => (
                        <EventCard
                            key={ev.id}
                            event={ev}
                            isReminderEnabled={reminderEventIds.has(String(ev.id))}
                            onToggleReminder={handleToggleReminder}
                        />
                    ))
                )}

                {loadingMore && (
                    <div className="home-loading-more">
                        <div className="home-spinner" />
                        <p>Loading more events...</p>
                    </div>
                )}

                {!loading && initialLoaded && !hasMore && filteredEvents.length > 0 && (
                    <div className="home-end-message">
                        <p>You're all caught up.</p>
                    </div>
                )}

                <div ref={sentinelRef} className="home-scroll-sentinel" aria-hidden="true" />
            </div>
        </div>
    );
};

export default Home;
