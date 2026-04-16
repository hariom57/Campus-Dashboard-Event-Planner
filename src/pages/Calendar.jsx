import React, { useState, useMemo } from 'react';
import { Clock, MapPin, ChevronRight, ChevronLeft, Calendar as CalendarIcon, List as ListIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import eventService from '../services/events';
import academicCalendarService from '../services/academicCalendar';
import todoService from '../services/todo';
import { useAuth } from '../context/AuthContext';
import './Calendar.css';

const CATEGORY_FILTERS = ['All', 'Academic', 'Exam', 'Holiday', 'Timetable Reschedule', 'Technical', 'Cultural', 'Sports', 'Fest', 'Personal/Todo'];

const CATEGORY_COLORS = {
    Technical: '#713364',
    Cultural: '#e91e63',
    Sports: '#ff9800',
    Academic: '#8B6914',
    Fest: '#f44336',
    Holiday: '#2e7d32', // Green for holidays
    Exam: '#c62828',    // Red for exams
    'Timetable Reschedule': '#d84315', // Orange/Deep for rescheduled days
    'Personal/Todo': '#d4af37', // Gold for personal tasks
    General: '#607d8b',
};

// Helper to get YYYY-MM-DD in LOCAL time
const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getEventBounds = (ev) => {
    let st, en;
    if (ev.isAcademicCalendar) {
        st = ev.raw_start;
        en = ev.raw_end;
    } else {
        const startDate = new Date(ev.tentative_start_time);
        st = getLocalDateString(startDate);
        const endDate = new Date(startDate.getTime() + (ev.duration_minutes || 0) * 60000);
        en = getLocalDateString(endDate);
    }
    return { st, en };
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
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date()); // For month navigation
    const [activeCategory, setActiveCategory] = useState('All');
    const [viewMode, setViewMode] = useState('grid'); // 'strip' or 'grid'

    const weekDays = useMemo(() => buildWeekStrip(), []);

    const { data: dynamicEvents = [], isLoading: loadDyn } = useSWR(
        user !== undefined ? 'cal_dynamic' : null,
        () => eventService.getAllEvents()
    );

    const { data: rawAcademicEvents = [], isLoading: loadAcad } = useSWR(
        user !== undefined ? 'cal_academic' : null,
        () => academicCalendarService.getAllEvents()
    );

    const { data: rawTodos = [] } = useSWR(
        user !== undefined && localStorage.getItem('iitr_show_feed_todos') === 'true' ? 'cal_todos' : null,
        () => todoService.getAll()
    );

    const loading = loadDyn || loadAcad;

    const events = useMemo(() => {
        const normalizedAcademic = rawAcademicEvents.map(ae => ({
            id: `academic-${ae.id}`,
            name: ae.title,
            tentative_start_time: ae.startDate + 'T00:00:00',
            tentative_end_time: ae.endDate + 'T23:59:59',
            raw_start: ae.startDate,
            raw_end: ae.endDate,
            description: ae.description,
            categories: ae.category,
            location_name: ae.isHoliday ? 'Campus Holiday' : 'Departments',
            isAcademicCalendar: true,
            isAllDay: true,
            club_name: 'IIT Roorkee',
        }));

        const activeTodos = rawTodos.filter(t => !t.completed);
        const todoData = activeTodos.map(todo => {
            const todayStr = new Date().toISOString().split('T')[0];
            const dateStr = todo.due_date || todayStr;
            const timeStr = todo.due_time || '00:00';
            
            return {
                id: `todo-${todo.id}`,
                name: todo.text,
                tentative_start_time: `${dateStr}T${timeStr}:00`,
                description: todo.notes,
                categories: 'Personal/Todo',
                location_name: todo.linked_event_name || 'Personal Task',
                isTodoEvent: true,
                isAllDay: !todo.due_time,
                club_name: user?.full_name || 'Personal',
            };
        });

        return [...dynamicEvents, ...normalizedAcademic, ...todoData];
    }, [dynamicEvents, rawAcademicEvents, rawTodos, user]);

    // Events for the selected date (using local comparison)
    const selectedDateStr = getLocalDateString(selectedDate);
    const todayStr = getLocalDateString(new Date());

    const dayEvents = useMemo(() => {
        return events.filter(ev => {
            const { st, en } = getEventBounds(ev);
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
                const { st, en } = getEventBounds(ev);
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
            const { st, en } = getEventBounds(ev);
            const startArr = st.split('-').map(Number);
            const endArr = en.split('-').map(Number);

            let curr = new Date(startArr[0], startArr[1] - 1, startArr[2]);
            const stop = new Date(endArr[0], endArr[1] - 1, endArr[2]);

            while (curr <= stop) {
                const k = getLocalDateString(curr);
                if (!map[k]) map[k] = new Set();
                const primaryCat = ev.categories ? String(typeof ev.categories === 'string' ? ev.categories : (ev.categories[0]?.name || 'General')).split(',')[0].trim() : 'General';
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
                    <div className="calendar-view-toggle" role="group" aria-label="Choose calendar view">
                        <button
                            className={`calendar-view-toggle-btn ${viewMode === 'strip' ? 'active' : ''}`}
                            onClick={() => setViewMode('strip')}
                            aria-label="Roster View"
                            aria-pressed={viewMode === 'strip'}
                        >
                            <ListIcon size={16} />
                            <span>Roster View</span>
                        </button>
                        <button
                            className={`calendar-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            aria-label="Grid View"
                            aria-pressed={viewMode === 'grid'}
                        >
                            <CalendarIcon size={16} />
                            <span>Grid View</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Month Header / Nav */}
            <div className="cal-view-header">
                <div className="cal-month-switcher" role="group" aria-label="Month navigator">
                    <button aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
                    <div className="cal-month-label">
                        {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
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
                            <div key={ev.id} className="cal-timeline-item" onClick={() => ev.isTodoEvent ? navigate(`/todo`) : navigate(`/event/${ev.id}`)}>
                                <div className="cal-time-col">
                                    <span className="cal-time">
                                        {ev.is_all_day || ev.isAllDay ? 'ALL DAY' : formatTime(ev.tentative_start_time)}
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
