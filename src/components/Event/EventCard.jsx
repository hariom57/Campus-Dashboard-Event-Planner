import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, CalendarDays, Bell, BellRing, Share2 } from 'lucide-react';
import { shareEvent, shareEventOnWhatsApp } from '../../services/shareEvent';
import WhatsAppIcon from '../Icons/WhatsAppIcon';
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

const formatRelativeDate = (dateStr) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const eventDay = eventDate.toISOString().split('T')[0];
    const todayDay = today.toISOString().split('T')[0];
    const tomorrowDay = tomorrow.toISOString().split('T')[0];

    if (eventDay === todayDay) return 'Today';
    if (eventDay === tomorrowDay) return 'Tomorrow';

    return formatDate(dateStr);
};

const EventCard = ({ event, isReminderEnabled = false, onToggleReminder }) => {
    const navigate = useNavigate();

    const isAcademic = event.isAcademicCalendar;

    const gradient = useMemo(() => {
        const idVal = typeof event.id === 'string' ? event.id.length : (event.id || 0);
        const idx = idVal % GRADIENTS.length;
        return GRADIENTS[idx];
    }, [event.id]);

    const categoryList = Array.isArray(event.categories)
        ? event.categories.map((item) => (typeof item === 'string' ? item : item?.name)).filter(Boolean)
        : (typeof event.categories === 'string'
            ? event.categories.split(',').map((item) => item.trim()).filter(Boolean)
            : []);

    const primaryCategory = categoryList.length > 0 ? categoryList[0] : 'General';

    const categoryColor = CATEGORY_COLORS[primaryCategory] || '#607d8b';

    const canSetReminder = Boolean(event?.tentative_start_time) && !event?.isAllDay;

    const handleReminderClick = (evt) => {
        evt.stopPropagation();
        if (!canSetReminder || !onToggleReminder) return;
        onToggleReminder(event);
    };

    const handleShareClick = async (evt) => {
        evt.stopPropagation();
        const result = await shareEvent(event);
        if (result.method === 'clipboard') {
            window.alert('Event link copied to clipboard.');
        }
    };

    const handleWhatsAppShare = (evt) => {
        evt.stopPropagation();
        shareEventOnWhatsApp(event);
    };

    return (
        <div
            className={`event-card-new ${isAcademic ? 'academic-card' : ''}`}
            onClick={() => !isAcademic && navigate(`/event/${event.id}`)}
            style={isAcademic ? { cursor: 'default' } : {}}
        >
            {isAcademic && (
                <button
                    type="button"
                    className={`event-reminder-btn event-reminder-btn--academic ${isReminderEnabled ? 'enabled' : ''}`}
                    aria-label={isReminderEnabled ? 'Disable reminders' : 'Enable reminders'}
                    onClick={handleReminderClick}
                    title={canSetReminder ? 'Notify me 30 min and 5 min before' : 'Reminders unavailable for all-day events'}
                    disabled={!canSetReminder}
                >
                    {isReminderEnabled ? <BellRing size={14} /> : <Bell size={14} />}
                </button>
            )}

            {/* Banner - Only for non-academic events */}
            {!isAcademic && (
                <div className="event-card-banner" style={{ background: gradient }}>
                    <span className="event-category-badge" style={{ background: categoryColor }}>
                        {primaryCategory}
                    </span>
                    <button
                        type="button"
                        className={`event-reminder-btn ${isReminderEnabled ? 'enabled' : ''}`}
                        aria-label={isReminderEnabled ? 'Disable reminders' : 'Enable reminders'}
                        onClick={handleReminderClick}
                        title={canSetReminder ? 'Notify me 30 min and 5 min before' : 'Reminders unavailable for all-day events'}
                        disabled={!canSetReminder}
                    >
                        {isReminderEnabled ? <BellRing size={15} /> : <Bell size={15} />}
                    </button>
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
                        {(event.club_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="event-club-name">{event.club_name || 'Unknown Club'}</span>
                </div>

                <div className="event-card-meta">
                    <span className="event-meta-item">
                        <CalendarDays size={13} />
                        {formatRelativeDate(event.tentative_start_time)}
                    </span>
                    <span className="event-meta-item">
                        <Clock size={13} />
                        {event.isAllDay ? 'ALL DAY' : formatTime(event.tentative_start_time)}
                    </span>
                    <span className="event-meta-item">
                        <MapPin size={13} />
                        {event.location_name || 'Location TBA'}
                    </span>
                </div>

                {!isAcademic && (
                    <div className="event-card-footer">
                        <button
                            type="button"
                            className="event-share-btn event-share-btn--bottom event-share-btn--whatsapp"
                            aria-label="Share on WhatsApp"
                            onClick={handleWhatsAppShare}
                            title="Share on WhatsApp"
                        >
                            <WhatsAppIcon size={14} />
                        </button>
                        <button
                            type="button"
                            className="event-share-btn event-share-btn--bottom event-share-btn--icon"
                            aria-label="Share event"
                            onClick={handleShareClick}
                            title="Share event"
                        >
                            <Share2 size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventCard;
