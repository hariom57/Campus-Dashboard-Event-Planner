import React, { useState, useEffect, useMemo } from 'react';
import { Search, Bell, Filter, Clock, MapPin, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import eventService from '../services/events';
import './Calendar.css';

const CATEGORY_FILTERS = ['All', 'Academic', 'Technical', 'Cultural', 'Sports', 'Fest'];

const CATEGORY_COLORS = {
    Technical: '#713364',
    Cultural: '#e91e63',
    Sports: '#ff9800',
    Academic: '#8B6914',
    Fest: '#f44336',
    General: '#607d8b',
};

const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getDurationLabel = (mins) => {
    if (!mins) return '';
    if (mins < 60) return `${mins} Mins`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h} Hour${h > 1 ? 's' : ''}`;
};

// Build a 7-day strip starting from today
const buildWeekStrip = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push(d);
    }
    return days;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeCategory, setActiveCategory] = useState('All');

    const weekDays = useMemo(() => buildWeekStrip(), []);

    useEffect(() => {
        eventService.getAllEvents().then(data => {
            setEvents(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // Events for the selected date
    const selectedDateStr = selectedDate.toISOString().split('T')[0];

    const dayEvents = useMemo(() => {
        return events.filter(ev => {
            const evDate = new Date(ev.tentative_start_time).toISOString().split('T')[0];
            const matchDate = evDate === selectedDateStr;
            const primaryCat = ev.categories ? ev.categories.split(',')[0].trim() : 'General';
            const matchCat = activeCategory === 'All' || primaryCat === activeCategory;
            return matchDate && matchCat;
        }).sort((a, b) => new Date(a.tentative_start_time) - new Date(b.tentative_start_time));
    }, [events, selectedDateStr, activeCategory]);

    // Mark which dates have events
    const dateDotMap = useMemo(() => {
        const map = {};
        events.forEach(ev => {
            const k = new Date(ev.tentative_start_time).toISOString().split('T')[0];
            map[k] = true;
        });
        return map;
    }, [events]);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const formattedDate = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    }).toUpperCase();

    return (
        <div className="calendar-page-new">
            {/* Header */}
            <div className="page-header-bar">
                <h1>Calendar</h1>
                <div className="page-header-actions">
                    <button className="header-icon-btn" aria-label="Search"><Search size={18} /></button>
                    <button className="header-icon-btn" onClick={() => navigate('/alerts')} aria-label="Alerts"><Bell size={18} /></button>
                </div>
            </div>

            {/* Month Label */}
            <div className="cal-month-label">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>

            {/* Week Strip */}
            <div className="cal-week-strip">
                {weekDays.map((d, i) => {
                    const dStr = d.toISOString().split('T')[0];
                    const isSelected = dStr === selectedDateStr;
                    const isToday = dStr === todayStr;
                    const hasDot = dateDotMap[dStr];
                    return (
                        <button
                            key={i}
                            className={`cal-day-chip ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}`}
                            onClick={() => setSelectedDate(new Date(d))}
                        >
                            <span className="cal-day-name-label">{DAY_NAMES[d.getDay()]}</span>
                            <span className="cal-day-num">{d.getDate()}</span>
                            {hasDot && <span className="cal-event-dot-marker" />}
                        </button>
                    );
                })}
            </div>

            {/* Category Chips */}
            <div className="cal-category-chips">
                {CATEGORY_FILTERS.map(c => (
                    <button
                        key={c}
                        className={`home-chip ${activeCategory === c ? 'active' : ''}`}
                        onClick={() => setActiveCategory(c)}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {/* Date Heading */}
            <div className="cal-date-heading">
                <span className="cal-date-label">{formattedDate}</span>
                {dayEvents.length > 0 && (
                    <span className="cal-event-count">{dayEvents.length} EVENT{dayEvents.length > 1 ? 'S' : ''}</span>
                )}
            </div>

            {/* Timeline */}
            <div className="cal-timeline">
                {loading ? (
                    <div className="home-loading"><div className="home-spinner" /><p>Loading...</p></div>
                ) : dayEvents.length === 0 ? (
                    <div className="cal-empty">
                        <p>No events on this day</p>
                        <span>Try a different date or category</span>
                    </div>
                ) : (
                    dayEvents.map((ev, idx) => {
                        const primaryCat = ev.categories ? ev.categories.split(',')[0].trim() : 'General';
                        const catColor = CATEGORY_COLORS[primaryCat] || '#607d8b';
                        return (
                            <div key={ev.id} className="cal-timeline-item" onClick={() => navigate(`/event/${ev.id}`)}>
                                {/* Time column */}
                                <div className="cal-time-col">
                                    <span className="cal-time">{formatTime(ev.tentative_start_time)}</span>
                                    <div className="cal-timeline-line" />
                                    <div className="cal-timeline-dot" style={{ background: catColor }} />
                                </div>

                                {/* Event card */}
                                <div className="cal-event-card">
                                    <div className="cal-event-cat-badge" style={{ background: `${catColor}18`, color: catColor }}>
                                        {primaryCat}
                                    </div>
                                    <h4 className="cal-event-title">{ev.name}</h4>
                                    {ev.club_name && (
                                        <div className="cal-event-club-row">
                                            <div className="cal-club-dot" />{ev.club_name}
                                        </div>
                                    )}
                                    <div className="cal-event-foot">
                                        {ev.location_name && (
                                            <span><MapPin size={12} />{ev.location_name}</span>
                                        )}
                                        {ev.duration_minutes && (
                                            <span><Clock size={12} />{getDurationLabel(ev.duration_minutes)}</span>
                                        )}
                                    </div>
                                    <ChevronRight size={16} className="cal-event-arrow" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Sync promo */}
            <div className="cal-sync-card">
                <div className="cal-sync-icon">🔗</div>
                <div className="cal-sync-text">
                    <strong>Stay Synced!</strong>
                    <span>Add IITR Campus Calendar to your Google or iCal account.</span>
                </div>
                <button className="cal-sync-btn">Sync</button>
            </div>
        </div>
    );
};

export default CalendarPage;
