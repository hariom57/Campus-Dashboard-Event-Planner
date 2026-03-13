import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Share2, Calendar, Clock, MapPin, Users,
    Bell, BellOff, ExternalLink, Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/events';
import './EventDetail.css';

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
    Workshop: '#00897b',
};

const formatFullDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getDurationLabel = (mins) => {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} Mins Duration`;
    return m ? `${h}h ${m}m Duration` : `${h} Hours Duration`;
};

const EventDetail = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { notifications, toggleNotification } = useAuth();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (!eventId) return;
        setLoading(true);
        eventService.getEventById(eventId)
            .then(data => { setEvent(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [eventId]);

    if (loading) {
        return (
            <div className="event-detail-loading">
                <Loader size={32} className="spin-icon" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="event-detail-loading">
                <p>Event not found.</p>
                <button className="btn-link" onClick={() => navigate('/home')}>Go Back</button>
            </div>
        );
    }

    const gradient = GRADIENTS[(event.id || 0) % GRADIENTS.length];
    const categories = event.categories ? event.categories.split(',').map(s => s.trim()) : ['General'];
    const primaryCat = categories[0];
    const catColor = CATEGORY_COLORS[primaryCat] || '#607d8b';

    const isNotified = notifications?.some(n => n.id === event.id);

    const handleToggleReminder = () => {
        toggleNotification({
            id: event.id,
            title: event.name,
            time: formatTime(event.tentative_start_time),
            date: formatFullDate(event.tentative_start_time),
        });
    };

    const descriptionWords = event.description ? event.description.split(' ') : [];
    const shortDesc = descriptionWords.slice(0, 40).join(' ');
    const isLong = descriptionWords.length > 40;

    return (
        <div className="event-detail-page">
            {/* Hero Banner */}
            <div className="event-detail-banner" style={{ background: gradient }}>
                <div className="event-detail-banner-actions">
                    <button className="event-detail-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <button className="event-detail-share-btn" title="Share">
                        <Share2 size={18} />
                    </button>
                </div>

                {/* Category Badges */}
                <div className="event-detail-badges">
                    {categories.map(cat => (
                        <span
                            key={cat}
                            className="event-detail-badge"
                            style={{ background: CATEGORY_COLORS[cat] || '#607d8b' }}
                        >
                            {cat}
                        </span>
                    ))}
                </div>

                <h1 className="event-detail-title">{event.name}</h1>
            </div>

            {/* Content */}
            <div className="event-detail-content">
                {/* Club Row */}
                <div className="event-detail-club-row">
                    <div className="event-detail-club-avatar">
                        {(event.club_name || 'E').charAt(0).toUpperCase()}
                    </div>
                    <div className="event-detail-club-info">
                        <span className="event-detail-club-name">{event.club_name || 'Campus Event'}</span>
                        <span className="event-detail-club-role">Main Organizer</span>
                    </div>
                    <button className="event-follow-btn">Follow</button>
                </div>

                {/* Date & Time Row */}
                <div className="event-detail-info-grid">
                    <div className="event-detail-info-card">
                        <div className="event-info-icon"><Calendar size={18} /></div>
                        <div>
                            <span className="event-info-label">DATE</span>
                            <span className="event-info-value">{formatFullDate(event.tentative_start_time)}</span>
                        </div>
                    </div>
                    <div className="event-detail-info-card">
                        <div className="event-info-icon"><Clock size={18} /></div>
                        <div>
                            <span className="event-info-label">TIME</span>
                            <span className="event-info-value">{formatTime(event.tentative_start_time)}</span>
                            {event.duration_minutes && (
                                <span className="event-info-sub">{getDurationLabel(event.duration_minutes)}</span>
                            )}
                        </div>
                    </div>
                    {event.location_name && (
                        <div className="event-detail-info-card full-width">
                            <div className="event-info-icon"><MapPin size={18} /></div>
                            <div>
                                <span className="event-info-label">LOCATION</span>
                                <span className="event-info-value">{event.location_name}</span>
                                {event.location_description && (
                                    <span className="event-info-sub">{event.location_description}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Description */}
                {event.description && (
                    <div className="event-detail-description">
                        <h3>About the Event</h3>
                        <p>
                            {expanded || !isLong ? event.description : `${shortDesc}...`}
                        </p>
                        {isLong && (
                            <button className="btn-link" onClick={() => setExpanded(e => !e)}>
                                {expanded ? 'Show less' : 'Read more...'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Action Bar */}
            <div className="event-detail-action-bar">
                <div className="event-notify-toggle">
                    <span>NOTIFY ME</span>
                    <button
                        className={`notify-toggle-btn ${isNotified ? 'on' : ''}`}
                        onClick={handleToggleReminder}
                    >
                        <span className="toggle-thumb" />
                    </button>
                </div>
                <button className="confirm-rsvp-btn" onClick={handleToggleReminder}>
                    {isNotified ? <><BellOff size={18} /> Remove RSVP</> : <><Bell size={18} /> Confirm RSVP</>}
                </button>
            </div>
        </div>
    );
};

export default EventDetail;
