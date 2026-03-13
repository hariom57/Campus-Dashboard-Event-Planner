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
    Academic: '#ccac00',
    Fest: '#f44336',
    General: '#607d8b',
    Competition: '#9c27b0',
    Workshop: '#00897b',
};

const formatTime = (dateStr) => {
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

    const gradient = useMemo(() => {
        const idx = (event.id || 0) % GRADIENTS.length;
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
        <div className="event-card-new" onClick={() => navigate(`/event/${event.id}`)}>
            {/* Banner */}
            <div className="event-card-banner" style={{ background: gradient }}>
                <span className="event-category-badge" style={{ background: categoryColor }}>
                    {primaryCategory}
                </span>
            </div>

            {/* Body */}
            <div className="event-card-body">
                <h3 className="event-card-title">{event.name}</h3>

                <div className="event-card-club-row">
                    <div className="event-club-avatar">
                        {(event.club_name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <span className="event-club-name">{event.club_name || 'Campus Event'}</span>
                </div>

                <div className="event-card-meta">
                    <span className="event-meta-item">
                        <Clock size={13} />
                        {formatTime(event.tentative_start_time)}
                    </span>
                    {event.location_name && (
                        <span className="event-meta-item">
                            <MapPin size={13} />
                            {event.location_name}
                        </span>
                    )}
                </div>

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
            </div>
        </div>
    );
};

export default EventCard;
