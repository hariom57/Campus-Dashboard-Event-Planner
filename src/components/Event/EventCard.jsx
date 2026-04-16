import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, CalendarDays, Bell, BellRing, Share2, Pointer, ClipboardList } from 'lucide-react';
import { shareEvent, shareEventOnWhatsApp } from '../../services/shareEvent';
import todoService from '../../services/todo';
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
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatRelativeDate = (dateStr, isShort = false) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const eventDay = eventDate.toISOString().split('T')[0];
    const todayDay = today.toISOString().split('T')[0];
    const tomorrowDay = tomorrow.toISOString().split('T')[0];

    if (eventDay === todayDay) return 'Today';
    if (eventDay === tomorrowDay) return 'Tomorrow';

    if (isShort) return eventDate.getDate();
    
    return eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
};

const formatEventDateRange = (startTime, durationMinutes) => {
    const startDate = new Date(startTime);
    if (!durationMinutes || durationMinutes <= 1440) {
        const endDateObj = new Date(startDate.getTime() + (durationMinutes || 0) * 60000);
        if (startDate.getDate() === endDateObj.getDate()) {
            return formatRelativeDate(startTime);
        }
    }
    
    const endDate = new Date(startDate.getTime() + (durationMinutes || 0) * 60000);
    
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = startDate.toLocaleDateString('en-IN', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-IN', { month: 'short' });

    if (startDate.toISOString().split('T')[0] === todayDay() ) {
         // handle relatively if needed, but for range 18-19 Apr is clearer
    }

    if (startMonth === endMonth) {
        return `${startDay}-${endDay} ${startMonth}`;
    }
    
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
};

const todayDay = () => new Date().toISOString().split('T')[0];

const EventCard = ({ event, isReminderEnabled = false, onToggleReminder }) => {
    const navigate = useNavigate();

    const isAcademic = event.isAcademicCalendar;
    const isTodo = event.isTodoEvent;
    const isSlimFormat = isAcademic || isTodo;

    const numericId = typeof event.id === 'string' ? parseInt(event.id.replace(/\D/g, '')) || event.id.length : event.id;
    const fallbackGradient = GRADIENTS[(numericId || 0) % GRADIENTS.length];
    
    const bannerStyle = event.image_url 
        ? { 
            background: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${event.image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }
        : { background: fallbackGradient };

    const categoryList = Array.isArray(event.categories)
        ? event.categories.map((item) => (typeof item === 'string' ? item : item?.name)).filter(Boolean)
        : (typeof event.categories === 'string'
            ? event.categories.split(',').map((item) => item.trim()).filter(Boolean)
            : []);

    const primaryCategory = categoryList.length > 0 ? categoryList[0] : 'General';

    const categoryColor = CATEGORY_COLORS[primaryCategory] || '#607d8b';

    // Allow setting reminders for all events, including all-day ones (they will trigger the night before at 11:30 PM)
    const canSetReminder = Boolean(event?.tentative_start_time);

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

    const handleAddToTodo = async (evt) => {
        evt.stopPropagation();
        try {
            let localDate = null;
            let localTime = null;
            if (event.tentative_start_time) {
                const d = new Date(event.tentative_start_time);
                localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                localTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }

            await todoService.create({
                text: `Attend ${event.name || 'Event'}`,
                notes: event.description ? event.description.substring(0, 200) + (event.description.length > 200 ? '...' : '') : null,
                due_date: localDate,
                due_time: localTime,
                linked_event_id: isAcademic ? null : numericId, // Only link if it's a real event with an ID
                linked_event_name: event.name,
                linked_event_club: event.club_name || primaryCategory,
                linked_event_date: event.tentative_start_time
            });
            window.alert('Task added to your Assistant Todo list!');
        } catch (err) {
            console.error('Failed to add to Todo', err);
            window.alert('Failed to add to Todo list. Please try again.');
        }
    };

    return (
        <div
                className={`event-card-new ${isTodo ? 'todo-event-card' : ''}`}
                onClick={() => isTodo ? navigate('/todo') : navigate(`/event/${event.id}`)}
            style={{ cursor: 'pointer' }}
        >
            {/* Slim Header actions for Academic & Todo */}
            {isSlimFormat && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px', zIndex: 3 }}>
                    {!isTodo && (
                        <button
                            type="button"
                            className={`event-reminder-btn event-reminder-btn--academic`}
                            aria-label="Add to Todo"
                            onClick={handleAddToTodo}
                            title="Add to Assistant Task List"
                            style={{ position: 'static' }}
                        >
                            <ClipboardList size={14} />
                        </button>
                    )}
                    <button
                        type="button"
                        className={`event-reminder-btn event-reminder-btn--academic ${isReminderEnabled ? 'enabled' : ''}`}
                        aria-label={isReminderEnabled ? 'Disable reminders' : 'Enable reminders'}
                        onClick={handleReminderClick}
                        title={canSetReminder ? 'Notify me 30 min and 5 min before' : 'Reminders unavailable'}
                        style={{ position: 'static' }}
                        disabled={!canSetReminder}
                    >
                        {isReminderEnabled ? <BellRing size={14} /> : <Bell size={14} />}
                    </button>
                </div>
            )}

            {/* Banner - Only for non-academic/non-todo events */}
            {!isSlimFormat && (
                <div className="event-card-banner" style={bannerStyle}>
                    <span className="event-category-badge" style={{ background: categoryColor }}>
                        {primaryCategory}
                    </span>
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                        <button
                            type="button"
                            className={`event-reminder-btn`}
                            aria-label="Add to Todo"
                            onClick={handleAddToTodo}
                            title="Add to Assistant Task List"
                            style={{ position: 'static' }}
                        >
                            <ClipboardList size={15} />
                        </button>
                        <button
                            type="button"
                            className={`event-reminder-btn ${isReminderEnabled ? 'enabled' : ''}`}
                            aria-label={isReminderEnabled ? 'Disable reminders' : 'Enable reminders'}
                            onClick={handleReminderClick}
                            title={canSetReminder ? 'Notify me 30 min and 5 min before' : 'Reminders unavailable'}
                            style={{ position: 'static' }}
                            disabled={!canSetReminder}
                        >
                            {isReminderEnabled ? <BellRing size={15} /> : <Bell size={15} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="event-card-body">
                {/* Slim header for academic/todo cards to show category and color code */}
                {isSlimFormat && (
                    <div className="academic-card-header">
                        <span className="academic-badge" style={{ background: `${categoryColor}15`, color: categoryColor, borderColor: categoryColor }}>
                            {primaryCategory}
                        </span>
                    </div>
                )}

                <h3 className="event-card-title">{event.name}</h3>

                <div className="event-club-avatar" style={isSlimFormat ? { background: categoryColor, color: 'white' } : { overflow: 'hidden' }}>
                    {event.club_logo_url || event.logo_url ? (
                        <img src={event.club_logo_url || event.logo_url} alt={event.club_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        (event.club_name || 'U').charAt(0).toUpperCase()
                    )}
                </div>

                <div className="event-card-meta">
                    <span className="event-meta-item">
                        <CalendarDays size={13} />
                        {formatEventDateRange(event.tentative_start_time, event.duration_minutes)}
                    </span>
                    <span className="event-meta-item">
                        <Clock size={13} />
                        {event.is_all_day || event.isAllDay ? 'ALL DAY' : formatTime(event.tentative_start_time)}
                    </span>
                    <span className="event-meta-item">
                        <MapPin size={13} />
                        {event.location_name || 'Location TBA'}
                    </span>
                </div>

                {!isSlimFormat && (
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
