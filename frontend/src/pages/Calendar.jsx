import React, { useState, useEffect } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Clock, Loader } from 'lucide-react';
import eventService from '../services/events';
import './Calendar.css';

const categoryDots = {
    Technical: '#667eea',
    Cultural: '#f5576c',
    Sports: '#4facfe',
    Academic: '#f0c040',
    Fest: '#ef4444',
    General: '#999',
};

const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage = () => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(null);
    const [calendarEvents, setCalendarEvents] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const data = await eventService.getAllEvents();

                // Group events by date key (YYYY-MM-DD)
                const grouped = {};
                data.forEach(ev => {
                    const dt = new Date(ev.tentative_start_time);
                    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
                    const categoryString = ev.categories || 'General';
                    const primaryCategory = categoryString.split(',')[0].trim();

                    const formatted = {
                        title: ev.name,
                        category: primaryCategory,
                        time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        club: ev.club_name || 'Unknown',
                        venue: ev.location_name || 'TBD',
                    };

                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(formatted);
                });

                setCalendarEvents(grouped);
            } catch (error) {
                console.error('Failed to fetch events for calendar', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const days = daysInMonth(currentMonth, currentYear);
    const firstDay = firstDayOfMonth(currentMonth, currentYear);

    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
        else setCurrentMonth(currentMonth - 1);
    };

    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
        else setCurrentMonth(currentMonth + 1);
    };

    const getDateKey = (day) => {
        const m = String(currentMonth + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${currentYear}-${m}-${d}`;
    };

    const selectedEvents = selectedDate ? calendarEvents[selectedDate] || [] : [];

    return (
        <div className="calendar-page" style={{ paddingTop: '72px' }}>
            <div className="container">
                <div className="map-page-header">
                    <h1 className="page-title">
                        <CalIcon size={28} style={{ color: 'var(--brand-accent)' }} />
                        Event Calendar
                    </h1>
                    <p className="page-subtitle">Keep track of all upcoming events and important dates</p>
                </div>

                {loading ? (
                    <div className="loading-state" style={{ padding: '4rem', textAlign: 'center' }}>
                        <Loader size={32} className="animate-spin" />
                        <p>Loading events...</p>
                    </div>
                ) : (
                    <div className="calendar-layout">
                        <div className="calendar-main card">
                            <div className="calendar-nav">
                                <button className="btn btn-ghost" onClick={prevMonth}><ChevronLeft size={20} /></button>
                                <h2 className="calendar-month">{monthNames[currentMonth]} {currentYear}</h2>
                                <button className="btn btn-ghost" onClick={nextMonth}><ChevronRight size={20} /></button>
                            </div>

                            <div className="calendar-grid">
                                {dayNames.map(d => <div key={d} className="cal-day-name">{d}</div>)}
                                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="cal-day empty"></div>)}
                                {Array.from({ length: days }).map((_, i) => {
                                    const day = i + 1;
                                    const dateKey = getDateKey(day);
                                    const events = calendarEvents[dateKey];
                                    const isSelected = selectedDate === dateKey;
                                    const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

                                    return (
                                        <button
                                            key={day}
                                            className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${events ? 'has-events' : ''}`}
                                            onClick={() => setSelectedDate(dateKey)}
                                        >
                                            <span className="cal-day-number">{day}</span>
                                            {events && (
                                                <div className="cal-dots">
                                                    {events.map((e, idx) => (
                                                        <span key={idx} className="cal-dot" style={{ background: categoryDots[e.category] || '#999' }}></span>
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="calendar-legend">
                                {Object.entries(categoryDots).map(([cat, color]) => (
                                    <div key={cat} className="legend-item">
                                        <span className="legend-dot" style={{ background: color }}></span>
                                        <span>{cat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="calendar-sidebar">
                            <div className="card" style={{ padding: 'var(--space-lg)' }}>
                                <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>
                                    {selectedDate ? `Events on ${selectedDate}` : 'Select a date'}
                                </h3>
                                {selectedEvents.length > 0 ? (
                                    <div className="cal-events-list">
                                        {selectedEvents.map((ev, i) => (
                                            <div key={i} className="cal-event-item">
                                                <div className="cal-event-dot" style={{ background: categoryDots[ev.category] || '#999' }}></div>
                                                <div>
                                                    <span className="cal-event-title">{ev.title}</span>
                                                    <span className="cal-event-meta">
                                                        <Clock size={12} /> {ev.time} • {ev.category} • {ev.club}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        {selectedDate ? 'No events on this date.' : 'Click a date on the calendar to see events.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarPage;
