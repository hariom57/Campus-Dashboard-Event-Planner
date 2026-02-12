import React, { useState } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';
import './Calendar.css';

const calendarEvents = {
    '2026-02-15': [{ title: 'Cogni Hackathon', category: 'Technical', time: '9 AM' }],
    '2026-02-18': [{ title: 'Thomso Cultural Night', category: 'Cultural', time: '6 PM' }],
    '2026-02-20': [{ title: 'Inter-Branch Cricket', category: 'Sports', time: '4 PM' }],
    '2026-02-22': [{ title: 'E-Summit Keynote', category: 'Technical', time: '10 AM' }],
    '2026-02-24': [{ title: 'Fashion Show Auditions', category: 'Cultural', time: '5 PM' }],
    '2026-02-25': [{ title: 'Guest Lecture: AI', category: 'Academic', time: '2 PM' }],
    '2026-03-10': [{ title: 'MTE Begins', category: 'Academic', time: 'All Day' }],
    '2026-03-15': [{ title: 'Thomso 2026', category: 'Fest', time: 'All Day' }],
};

const categoryDots = {
    Technical: '#667eea',
    Cultural: '#f5576c',
    Sports: '#4facfe',
    Academic: '#f0c040',
    Fest: '#ef4444',
};

const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage = () => {
    const [currentMonth, setCurrentMonth] = useState(1);
    const [currentYear, setCurrentYear] = useState(2026);
    const [selectedDate, setSelectedDate] = useState(null);

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
                                const isToday = day === 10 && currentMonth === 1 && currentYear === 2026;

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
                                            <div className="cal-event-dot" style={{ background: categoryDots[ev.category] }}></div>
                                            <div>
                                                <span className="cal-event-title">{ev.title}</span>
                                                <span className="cal-event-meta">
                                                    <Clock size={12} /> {ev.time} • {ev.category}
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

                        <div className="card major-events">
                            <h3>🔥 Major Events</h3>
                            <div className="major-list">
                                <div className="major-item">
                                    <span className="major-date">Mar 10</span>
                                    <span>MTE Begins</span>
                                </div>
                                <div className="major-item">
                                    <span className="major-date">Mar 15</span>
                                    <span>Thomso 2026</span>
                                </div>
                                <div className="major-item">
                                    <span className="major-date">Apr 5</span>
                                    <span>Cogni 2026</span>
                                </div>
                                <div className="major-item">
                                    <span className="major-date">Apr 20</span>
                                    <span>E-Summit 2026</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
