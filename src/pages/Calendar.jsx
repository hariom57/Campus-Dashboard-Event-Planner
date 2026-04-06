import React, { useState, useEffect, useMemo } from 'react';
import { Search, Bell, Filter, Clock, MapPin, Users, ChevronRight, ChevronLeft, Calendar as CalendarIcon, List as ListIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import eventService from '../services/events';
import academicCalendarService from '../services/academicCalendar';
import './Calendar.css';

const CATEGORY_FILTERS = ['All', 'Academic', 'Exam', 'Holiday', 'Timetable Reschedule', 'Technical', 'Cultural', 'Sports', 'Fest'];

const CATEGORY_COLORS = {
    Technical: '#713364',
    Cultural: '#e91e63',
    Sports: '#ff9800',
    Academic: '#8B6914',
    Fest: '#f44336',
    Holiday: '#2e7d32', // Green for holidays
    Exam: '#c62828',    // Red for exams
    'Timetable Reschedule': '#d84315', // Orange/Deep for rescheduled days
    General: '#607d8b',
};

// Helper to get YYYY-MM-DD in LOCAL time
const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

// Build a 14-day strip starting from today
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
    const [viewDate, setViewDate] = useState(new Date()); // For month navigation
    const [activeCategory, setActiveCategory] = useState('All');
    const [viewMode, setViewMode] = useState('strip'); // 'strip' or 'grid'

    const weekDays = useMemo(() => buildWeekStrip(), []);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [dynamicEvents, academicEvents] = await Promise.all([
                    eventService.getAllEvents(),
                    academicCalendarService.getAllEvents()
                ]);

                // Normalize academic events to match the displayed schema
                const normalizedAcademic = academicEvents.map(ae => ({
                    id: ae.id,
                    name: ae.title,
                    tentative_start_time: ae.startDate + 'T00:00:00',
                    tentative_end_time: ae.endDate + 'T23:59:59',
                    raw_start: ae.startDate, // Store raw YYYY-MM-DD for perfect filtering
                    raw_end: ae.endDate,
                    description: ae.description,
                    categories: ae.category,
                    location_name: ae.isHoliday ? 'Campus Holiday' : 'Departments',
                    isAcademicCalendar: true,
                    isAllDay: true,
                    club_name: 'IIT Roorkee',
                }));

                setEvents([...dynamicEvents, ...normalizedAcademic]);
            } catch (err) {
                console.error("Failed to load events", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    // Events for the selected date (using local comparison)
    const selectedDateStr = getLocalDateString(selectedDate);
    const todayStr = getLocalDateString(new Date());

    const dayEvents = useMemo(() => {
        return events.filter(ev => {
            // For academic events, we use the raw startDate/endDate strings for perfect matching
            let st, en;
            if (ev.isAcademicCalendar) {
                // These are already YYYY-MM-DD
                st = ev.raw_start;
                en = ev.raw_end;
            } else {
                // For dynamic events, parse the UTC/Local timestamp to local YYYY-MM-DD
                st = getLocalDateString(new Date(ev.tentative_start_time));
                en = ev.tentative_end_time ? getLocalDateString(new Date(ev.tentative_end_time)) : st;
            }

            const matchDate = selectedDateStr >= st && selectedDateStr <= en;

            const primaryCat = ev.categories ? ev.categories.split(',')[0].trim() : 'General';
            const matchCat = activeCategory === 'All' || primaryCat === activeCategory;

            return matchDate && matchCat;
        }).sort((a, b) => new Date(a.tentative_start_time) - new Date(b.tentative_start_time));
    }, [events, selectedDateStr, activeCategory]);

    // Mark which dates have events (using local comparison)
    const dateDotMap = useMemo(() => {
        const map = {};
        // Check ONLY the days displayed in the strip
        weekDays.forEach(d => {
            const dStr = getLocalDateString(d);
            const hasEvent = events.some(ev => {
                const st = getLocalDateString(new Date(ev.tentative_start_time));
                const en = ev.tentative_end_time ? getLocalDateString(new Date(ev.tentative_end_time)) : st;
                return dStr >= st && dStr <= en;
            });
            if (hasEvent) map[dStr] = true;
        });
        return map;
    }, [events, weekDays]);

    const formattedDate = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    }).toUpperCase();

    // Month Grid Logic
    const getDaysInMonth = (year, month) => {
        const date = new Date(year, month, 1);
        const days = [];

        while (date.getDay() !== 0) {
            date.setDate(date.getDate() - 1);
        }

        const firstDayOfGrid = new Date(date);
        const nextMonth = new Date(year, month + 1, 1);

        let current = new Date(firstDayOfGrid);
        while (current < nextMonth || current.getDay() !== 0 || days.length === 0) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
            if (days.length >= 42) break;
        }

        return days;
    };

    const monthDays = useMemo(() => {
        return getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    }, [viewDate]);

    const changeMonth = (offset) => {
        const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(next);
    };

    // Pre-calculate event map for grid (using local comparison)
    const monthEventMap = useMemo(() => {
        const map = {};
        events.forEach(ev => {
            const start = new Date(ev.tentative_start_time);
            const end = ev.tentative_end_time ? new Date(ev.tentative_end_time) : start;

            let curr = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            const stop = new Date(end.getFullYear(), end.getMonth(), end.getDate());

            while (curr <= stop) {
                const k = getLocalDateString(curr);
                if (!map[k]) map[k] = new Set();
                const primaryCat = ev.categories ? ev.categories.split(',')[0].trim() : 'General';
                map[k].add(primaryCat);
                curr.setDate(curr.getDate() + 1);
            }
        });
        return map;
    }, [events]);

    return (
        <div className="calendar-page-new">
            {/* Header */}
            <div className="page-header-bar">
                <h1>Calendar</h1>
                <div className="page-header-actions">
                    <button
                        className={`header-icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode(viewMode === 'strip' ? 'grid' : 'strip')}
                        aria-label="Toggle View"
                    >
                        {viewMode === 'strip' ? <CalendarIcon size={18} /> : <ListIcon size={18} />}
                    </button>
                    <button className="header-icon-btn" aria-label="Search"><Search size={18} /></button>
                    <button className="header-icon-btn" onClick={() => navigate('/profile')} aria-label="Alerts"><Bell size={18} /></button>
                </div>
            </div>

            {/* Month Header / Nav */}
            <div className="cal-view-header">
                <div className="cal-month-label">
                    {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <div className="cal-month-nav">
                    <button onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
                    <button className="cal-today-btn" onClick={() => {
                        const now = new Date();
                        setViewDate(now);
                        setSelectedDate(now);
                    }}>Today</button>
                    <button onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
                </div>
            </div>

            {viewMode === 'strip' ? (
                <div className="cal-week-strip">
                    {weekDays.map((d, i) => {
                        const dStr = getLocalDateString(d);
                        const isSelected = dStr === selectedDateStr;
                        const isToday = dStr === todayStr;
                        const hasDot = dateDotMap[dStr];
                        return (
                            <button
                                key={i}
                                className={`cal-day-chip ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}`}
                                onClick={() => {
                                    setSelectedDate(new Date(d));
                                    setViewDate(new Date(d));
                                }}
                            >
                                <span className="cal-day-name-label">{DAY_NAMES[d.getDay()]}</span>
                                <span className="cal-day-num">{d.getDate()}</span>
                                {hasDot && <span className="cal-event-dot-marker" />}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="cal-grid-container">
                    <div className="cal-grid-weekdays">
                        {DAY_NAMES.map(day => <span key={day}>{day[0]}</span>)}
                    </div>
                    <div className="cal-grid">
                        {monthDays.map((d, i) => {
                            const dStr = getLocalDateString(d);
                            const isSelected = dStr === selectedDateStr;
                            const isToday = dStr === todayStr;
                            const isCurrentMonth = d.getMonth() === viewDate.getMonth();
                            const dayCats = Array.from(monthEventMap[dStr] || []);
                            const isRescheduled = dayCats.includes('Timetable Reschedule');
                            const isWeekend = d.getDay() === 0 || (d.getDay() === 6 && !isRescheduled);
                            const isHoliday = dayCats.includes('Holiday') || isWeekend;
                            const isExam = dayCats.includes('Exam');

                            return (
                                <div
                                    key={i}
                                    className={`cal-grid-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''} ${isHoliday ? 'holiday' : ''} ${isExam ? 'exam' : ''}`}
                                    onClick={() => setSelectedDate(new Date(d))}
                                >
                                    <span className="cal-grid-date">{d.getDate()}</span>
                                    <div className="cal-grid-indicators">
                                        {dayCats.slice(0, 3).map((cat, idx) => (
                                            <span
                                                key={idx}
                                                className="cal-grid-dot"
                                                style={{ background: CATEGORY_COLORS[cat] || '#607d8b' }}
                                            />
                                        ))}
                                        {dayCats.length > 3 && <span className="cal-grid-more">+</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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

            <div className="cal-date-heading">
                <span className="cal-date-label">{formattedDate}</span>
                {dayEvents.length > 0 && (
                    <span className="cal-event-count">{dayEvents.length} EVENT{dayEvents.length > 1 ? 'S' : ''}</span>
                )}
            </div>

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
                                <div className="cal-time-col">
                                    <span className="cal-time">
                                        {ev.isAllDay ? 'ALL DAY' : formatTime(ev.tentative_start_time)}
                                    </span>
                                    <div className="cal-timeline-line" />
                                    <div className="cal-timeline-dot" style={{ background: catColor }} />
                                </div>

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

            <div className="cal-metrics-row">
                <div className="cal-metric-card">
                    <span className="cal-metric-val">70</span>
                    <span className="cal-metric-label">Total Teaching Days</span>
                </div>
                <div className="cal-metric-card">
                    <span className="cal-metric-val">12</span>
                    <span className="cal-metric-label">Public Holidays</span>
                </div>
            </div>

        </div>
    );
};

export default CalendarPage;
