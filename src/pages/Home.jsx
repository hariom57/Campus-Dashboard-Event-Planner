import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Bell, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import EventCard from '../components/Event/EventCard';
import eventService from '../services/events';
import academicCalendarService from '../services/academicCalendar';

import eventReminderService from '../services/eventReminders';
import todoService from '../services/todo';

import { useAuth } from '../context/AuthContext';
import './Home.css';


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
    const { user, loading: authLoading, backendSlow } = useAuth();
    
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [reminderEventIds, setReminderEventIds] = useState(() => new Set(eventReminderService.getReminderIds()));
    const sentinelRef = useRef(null);
    const PAGE_SIZE = 10;

    const { data: pageData, size, setSize, isLoading: dynLoading, isValidating: dynValidating } = useSWRInfinite(
        (pageIndex, previousPageData) => {
            if (!user || authLoading) return null;
            if (previousPageData && previousPageData.events && previousPageData.events.length < PAGE_SIZE) return null;
            return `dynamic_events_page_${pageIndex + 1}`;
        },
        async (key) => {
            const split = key.split('_');
            const targetPage = parseInt(split[split.length - 1]);
            return await eventService.getAllEventsPage(targetPage, PAGE_SIZE);
        }
    );

    const dynamicEvents = useMemo(() => {
        if (!pageData) return [];
        const combined = [];
        const seen = new Set();
        pageData.forEach((pageObj) => {
            if (pageObj && pageObj.events) {
                pageObj.events.forEach((ev) => {
                    const key = String(ev.id);
                    if (!seen.has(key)) {
                        seen.add(key);
                        combined.push(ev);
                    }
                });
            }
        });
        return combined;
    }, [pageData]);

    const loading = dynLoading;
    const loadingMore = dynLoading || (size > 0 && pageData && typeof pageData[size - 1] === "undefined");
    const hasMore = pageData ? (pageData[pageData.length - 1]?.events?.length >= PAGE_SIZE) : true;
    const initialLoaded = !!pageData;

    const { data: rawAcademicEvents = [] } = useSWR(
        (user && !authLoading) ? 'cal_academic' : null,
        () => academicCalendarService.getAllEvents()
    );

    const { data: rawTodos = [] } = useSWR(
        (user && !authLoading && localStorage.getItem('iitr_show_feed_todos') === 'true') ? 'cal_todos' : null,
        () => todoService.getAll()
    );

    const academicEvents = useMemo(() => {
        return rawAcademicEvents.map((ae) => ({
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
    }, [rawAcademicEvents]);

    const todoEvents = useMemo(() => {
        const activeTodos = rawTodos.filter(t => !t.completed);
        return activeTodos.map(todo => {
            const todayStr = new Date().toISOString().split('T')[0];
            const dateStr = todo.due_date || todayStr;
            const timeStr = todo.due_time || '00:00';
            const tentative_start_time = `${dateStr}T${timeStr}:00`;
            
            return {
                id: `todo-${todo.id}`,
                name: todo.text,
                tentative_start_time,
                description: todo.notes,
                categories: 'Personal/Todo',
                location_name: todo.linked_event_name || 'Personal Task',
                isTodoEvent: true,
                isAllDay: !todo.due_time,
                club_name: user?.full_name || 'Personal',
                club_logo_url: user?.display_picture ? `https://channeli.in${user.display_picture}` : undefined,
            };
        });
    }, [rawTodos, user]);

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
                    setSize(size + 1);
                }
            },
            { root: null, rootMargin: '300px 0px', threshold: 0 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, initialLoaded]);

    const events = useMemo(() => {
        const combined = [...dynamicEvents, ...academicEvents, ...todoEvents];
        const todayStr = new Date().toISOString().split('T')[0];

        return combined
            .filter((ev) => {
                let endTime;
                if (ev.isAcademicCalendar && ev.tentative_end_time) {
                    endTime = ev.tentative_end_time;
                } else {
                    const startDate = new Date(ev.tentative_start_time);
                    const endDateObj = new Date(startDate.getTime() + (ev.duration_minutes || 0) * 60000);
                    endTime = endDateObj.toISOString();
                }

                const eventEndDateStr = endTime.split('T')[0];
                return eventEndDateStr >= todayStr;
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
    
    const eventClubId = Number(ev.club_id);
    const isHiddenClub = notPreferredClubIds.has(eventClubId);

    const matchesCategorySelection =
        selectedCategories.length === 0
        || selectedCategories.some((selected) => eventCategoryNames.includes(selected));

    const matchesSearch =
        !searchQuery
        || ev.name.toLowerCase().includes(searchQuery.toLowerCase())
        || (ev.club_name && ev.club_name.toLowerCase().includes(searchQuery.toLowerCase()))
        || (ev.location_name && ev.location_name.toLowerCase().includes(searchQuery.toLowerCase())); 

    // Always show todo events if their category matches, they aren't bound to club preferences
    if (ev.isTodoEvent) {
        return matchesCategorySelection && matchesSearch;
    }

    return matchesCategorySelection && !isHiddenClub && matchesSearch; 
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
                    <button className="header-icon-btn" onClick={() => navigate('/notifications')} aria-label="Notifications & reminders" style={{ position: 'relative' }}>
                        <Bell size={18} />
                        {reminderEventIds.size > 0 && <span className="header-bell-dot" />}
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
                        {(backendSlow || authLoading) && (
                            <div className="home-backend-slow-banner">
                                <span>⏳</span>
                                <span>The server is waking up from sleep — this can take up to 60 seconds on the free plan. Please wait…</span>
                            </div>
                        )}
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="home-empty">
                        <p>No events found</p>
                        <button
                            className="btn-link"
                            onClick={() => {
                                setSelectedCategories([]);
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
                    <div className="home-end-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                        <CheckCircle size={48} color="#2e7d32" style={{ marginBottom: '12px' }} />
                        <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }}>You're all caught up!</h3>
                        <p style={{ margin: 0, fontSize: '0.95rem' }}>You've seen all the upcoming events.</p>
                    </div>
                )}

                <div ref={sentinelRef} className="home-scroll-sentinel" aria-hidden="true" />
            </div>
        </div>
    );
};

export default Home;
