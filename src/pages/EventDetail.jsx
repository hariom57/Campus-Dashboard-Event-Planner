import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Share2, Calendar, Clock, MapPin, Loader, Bell, BellRing
} from 'lucide-react';
import eventService from '../services/events';
import eventReminderService from '../services/eventReminders';
import { shareEvent, shareEventOnWhatsApp } from '../services/shareEvent';
import WhatsAppIcon from '../components/Icons/WhatsAppIcon';
import './EventDetail.css';
import academicCalendarService from '../services/academicCalendar';
import { notify } from '../services/notify';

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

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [isReminderEnabled, setIsReminderEnabled] = useState(false);

    useEffect(() => {
        if (!eventId) return;
        setLoading(true);

        if (eventId.startsWith('academic-')) {
            const rawId = eventId.replace('academic-', '');
            academicCalendarService.getAllEvents().then(data => {
                const ae = data.find(e => String(e.id) === rawId);
                if (ae) {
                    setEvent({
                        id: `academic-${ae.id}`,
                        name: ae.title,
                        tentative_start_time: ae.startDate + 'T00:00:00',
                        tentative_end_time: ae.endDate + 'T23:59:59',
                        description: ae.description,
                        categories: ae.category,
                        location_name: ae.isHoliday ? 'Institute Holiday' : 'Campus-wide',
                        isAcademicCalendar: true,
                        isAllDay: true,
                        club_name: 'IIT Roorkee',
                    });
                }
                setLoading(false);
            }).catch(() => setLoading(false));
        } else {
            eventService.getEventById(eventId)
                .then(data => {
                    setEvent(data);
                    setIsReminderEnabled(data ? eventReminderService.isReminderEnabled(data.id) : false);
                    if (data) eventReminderService.updateReminderSnapshot(data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [eventId]);

    const handleToggleReminder = async () => {
        if (!event) return;

        const result = await eventReminderService.toggleReminder(event);
        setIsReminderEnabled(result.enabled);

        if (result.error === 'unsupported') {
            notify('Notifications are not supported on this browser.', 'warning');
        } else if (result.error === 'permission-denied') {
            notify('Please allow notifications in browser settings to get reminders.', 'warning');
        } else if (result.error === 'event-started') {
            notify('This event has already started, so reminders cannot be scheduled.', 'warning');
        } else if (result.error === 'sync-failed') {
            notify('Could not sync reminder to your account right now. Please try again.', 'error');
        }
    };

    const handleShareEvent = async () => {
        if (!event) return;

        const result = await shareEvent(event);
        if (result.method === 'clipboard') {
            notify('Event link copied to clipboard.');
        }
    };

    const handleWhatsAppShare = () => {
        if (!event) return;
        shareEventOnWhatsApp(event);
    };

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

    const numericId = typeof event.id === 'string' ? parseInt(event.id.replace(/\D/g, '')) || event.id.length : event.id;
    const fallbackGradient = GRADIENTS[(numericId || 0) % GRADIENTS.length];
    
    const bannerStyle = event.image_url 
        ? { 
            background: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url(${event.image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }
        : { background: fallbackGradient };

    const categories = Array.isArray(event.categories)
        ? event.categories.map((item) => (typeof item === 'string' ? item : item?.name)).filter(Boolean)
        : (typeof event.categories === 'string'
            ? event.categories.split(',').map((s) => s.trim()).filter(Boolean)
            : ['General']);

    const descriptionWords = event.description ? event.description.split(' ') : [];
    const shortDesc = descriptionWords.slice(0, 40).join(' ');
    const isLong = descriptionWords.length > 40;
    const canSetReminder = Boolean(event?.tentative_start_time) && !event?.isAllDay;

    return (
        <div className="event-detail-page">
            {/* Hero Banner */}
            <div className="event-detail-banner" style={bannerStyle}>
                <div className="event-detail-banner-actions">
                    <button className="event-detail-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="event-detail-right-actions">
                        <button
                            className={`event-detail-reminder-btn ${isReminderEnabled ? 'enabled' : ''}`}
                            onClick={handleToggleReminder}
                            title={canSetReminder ? 'Notify 30 min and 5 min before' : 'Reminders unavailable for all-day events'}
                            disabled={!canSetReminder}
                        >
                            {isReminderEnabled ? <BellRing size={18} /> : <Bell size={18} />}
                        </button>
                        <button className="event-detail-whatsapp-btn" title="Share on WhatsApp" onClick={handleWhatsAppShare}>
                            <WhatsAppIcon size={16} />
                        </button>
                        <button className="event-detail-share-btn" title="Share" onClick={handleShareEvent}>
                            <Share2 size={18} />
                        </button>
                    </div>
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
                    <div className="event-detail-club-avatar" style={{ overflow: 'hidden' }}>
                        {event.club_logo_url || event.logo_url ? (
                            <img src={event.club_logo_url || event.logo_url} alt={event.club_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            (event.club_name || 'E').charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="event-detail-club-info">
                        <span className="event-detail-club-name">{event.club_name || 'Campus Event'}</span>
                        <span className="event-detail-club-role">Main Organizer</span>
                    </div>
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
        </div>
    );
};

export default EventDetail;
