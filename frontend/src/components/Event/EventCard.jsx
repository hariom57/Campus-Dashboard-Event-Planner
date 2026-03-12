import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Bookmark, Bell, Users, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './EventCard.css';

const EventCard = ({ event, compact = false }) => {
    const { notifications, toggleNotification } = useAuth();
    const [bookmarked, setBookmarked] = useState(false);

    // Check if this event is in the global notifications array
    const isReminded = notifications.some(n => n.id === event.id);

    const handleReminder = (e) => {
        e.stopPropagation();

        // Let the global context handle the tracking
        toggleNotification(event);

        if (!isReminded) {
            if ("Notification" in window) {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification("Reminder Set!", {
                            body: `We'll remind you about ${event.title} at ${event.venue}.`,
                        });
                    }
                });
            }
        }
    };

    const categoryColors = {
        'Technical': 'tag-blue',
        'Cultural': 'tag-purple',
        'Sports': 'tag-green',
        'Academic': 'tag-yellow',
        'Fest': 'tag-red',
    };

    if (compact) {
        return (
            <div className="event-card compact card">
                <div className="compact-time">
                    <span className="time-text">{event.time}</span>
                    <div className="timeline-dot" style={{ background: event.gradient }}></div>
                </div>
                <div className="compact-content">
                    <h3 className="compact-title">{event.title}</h3>
                    <div className="compact-meta">
                        <span className="compact-club">{event.club}</span>
                        <span className="separator">•</span>
                        <span className="compact-venue"><MapPin size={12} style={{ marginRight: '4px' }} />{event.venue}</span>
                    </div>
                </div>
                <div className="compact-action">
                    <button className="btn-icon-sm" onClick={() => setBookmarked(!bookmarked)}>
                        <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="event-card card">
            <div className="event-card-image">
                <div className="event-card-gradient" style={{ background: event.gradient }}></div>
                <div className="event-card-overlay">
                    <div className="tags-container">
                        <span className={`tag ${categoryColors[event.category] || 'tag-yellow'}`}>
                            {event.category}
                        </span>
                        {/* Render Special Tags from rawCategories if they exist */}
                        {event.rawCategories && event.rawCategories.map((cat, idx) => {
                            if (cat === 'COGNI ASPECT') return <span key={idx} className="tag tag-red" style={{ marginLeft: '4px' }}>Cogni Required</span>;
                            if (cat === 'PhD Support') return <span key={idx} className="tag tag-purple" style={{ marginLeft: '4px' }}>PhD</span>;
                            return null;
                        })}
                    </div>
                    <div className="event-card-actions-top">
                        <button
                            className={`btn-icon event-action ${bookmarked ? 'active' : ''}`}
                            onClick={() => setBookmarked(!bookmarked)}
                            title="Bookmark"
                        >
                            <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                        </button>
                        <button
                            className={`btn-icon event-action ${reminded ? 'active' : ''}`}
                            onClick={handleReminder}
                            title="Set Reminder"
                        >
                            <Bell size={16} fill={reminded ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                </div>
                {event.isLive && <div className="live-badge">● LIVE</div>}
            </div>

            <div className="event-card-body">
                <h3 className="event-title">{event.title}</h3>
                <p className="event-club">{event.club}</p>

                <div className="event-meta">
                    <div className="event-meta-item">
                        <Calendar size={14} />
                        <span>{event.date}</span>
                    </div>
                    <div className="event-meta-item">
                        <Clock size={14} />
                        <span>{event.time}</span>
                    </div>
                    <div className="event-meta-item">
                        <MapPin size={14} />
                        <span>{event.venue}</span>
                    </div>
                    <div className="event-meta-item">
                        <Users size={14} />
                        <span>{event.attendees || 0} attending</span>
                    </div>
                </div>

                <div className="event-card-footer">
                    <button className="btn btn-yellow event-rsvp-btn">
                        RSVP Now
                    </button>
                    <button className="btn btn-ghost">
                        <ExternalLink size={16} />
                        Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
