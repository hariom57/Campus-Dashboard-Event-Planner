import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Bell, BellOff, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './EventCard.css';

// Deterministic gradient per event id/name
const GRADIENTS = [
    'linear-gradient(145deg, #713364 0%, #4a1d3f 100%)',
    'linear-gradient(145deg, #8e4b7e 0%, #713364 100%)',
    'linear-gradient(145deg, #4a1d3f 0%, #1a1518 100%)',
    'linear-gradient(145deg, #5c2851 0%, #713364 100%)',
    'linear-gradient(145deg, #713364 0%, #FFD700 100%)',
];

const CATEGORY_COLORS = {
    Technical: '#713364',
    Cultural: '#e91e63',
    Sports: '#ff9800',
    Academic: '#8B6914',
    Fest: '#f44336',
    Holiday: '#2e7d32',
    Exam: '#c62828',
    'Timetable Reschedule': '#d84315',
    General: '#607d8b',
};

const formatTime = (dateStr) => {
    // Check if it's an "All Day" event by time suffix
    if (dateStr.includes('T00:00:00')) return 'ALL DAY';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
};

const EventCard = ({ event }) => {
    const navigate = useNavigate();
    const { notifications, toggleNotification } = useAuth();

    const isAcademic = event.isAcademicCalendar;

    const gradient = useMemo(() => {
        const idVal = typeof event.id === 'string' ? event.id.length : (event.id || 0);
        const idx = idVal % GRADIENTS.length;
        return GRADIENTS[idx];
    }, [event.id]);

    const primaryCategory = event.categories
        ? event.categories.split(',')[0].trim()
        : 'General';

    const categoryColor = CATEGORY_COLORS[primaryCategory] || '#607d8b';

    const isNotified = notifications?.some(n => n.id === event.id);

    const handleRsvp = (e) => {
        e.stopPropagation();
        toggleNotification({
            id: event.id,
            title: event.name,
            time: formatTime(event.tentative_start_time),
            date: formatDate(event.tentative_start_time),
        });
    };

    return (
        <div 
            className={`event-card-new ${isAcademic ? 'academic-card' : ''}`} 
            onClick={() => !isAcademic && navigate(`/event/${event.id}`)}
            style={isAcademic ? { cursor: 'default' } : {}}
        >
            {/* Banner - Only for non-academic events */}
            {!isAcademic && (
                <div className="event-card-banner" style={{ background: gradient }}>
                    <span className="event-category-badge" style={{ background: categoryColor }}>
                        {primaryCategory}
                    </span>
                </div>
            )}

            {/* Body */}
            <div className="event-card-body">
                {/* Slim header for academic cards to show category and color code */}
                {isAcademic && (
                    <div className="academic-card-header">
                        <span className="academic-badge" style={{ background: `${categoryColor}15`, color: categoryColor, borderColor: categoryColor }}>
                            {primaryCategory}
                        </span>
                    </div>
                )}

                <h3 className="event-card-title">{event.name}</h3>

                <div className="event-card-club-row">
                    <div className="event-club-avatar" style={isAcademic ? { background: categoryColor, color: 'white' } : {}}>
                        {(event.club_name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <span className="event-club-name">{event.club_name || 'Campus Event'}</span>
                </div>

                <div className="event-card-meta">
                    <span className="event-meta-item">
                        <Clock size={13} />
                        {event.isAllDay ? 'ALL DAY' : formatTime(event.tentative_start_time)}
                    </span>
                    {event.location_name && (
                        <span className="event-meta-item">
                            <MapPin size={13} />
                            {event.location_name}
                        </span>
                    )}
                </div>

                {/* Hide RSVP for academic calendar events */}
                {!isAcademic && (
                    <button
                        className={`event-rsvp-btn ${isNotified ? 'notified' : ''}`}
                        onClick={handleRsvp}
                        title={isNotified ? 'Remove reminder' : 'Set reminder / RSVP'}
                    >
                        {isNotified ? (
                            <><BellOff size={14} /> Reminded</>
                        ) : (
                            <><Plus size={14} /> RSVP</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default EventCard;
