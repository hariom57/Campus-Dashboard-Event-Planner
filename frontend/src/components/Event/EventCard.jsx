import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Bookmark, Bell, Users, ExternalLink } from 'lucide-react';
import './EventCard.css';

const EventCard = ({ event }) => {
    const [bookmarked, setBookmarked] = useState(false);
    const [reminded, setReminded] = useState(false);

    const categoryColors = {
        'Technical': 'tag-blue',
        'Cultural': 'tag-purple',
        'Sports': 'tag-green',
        'Academic': 'tag-yellow',
        'Fest': 'tag-red',
    };

    return (
        <div className="event-card card">
            <div className="event-card-image">
                <div className="event-card-gradient" style={{ background: event.gradient }}></div>
                <div className="event-card-overlay">
                    <span className={`tag ${categoryColors[event.category] || 'tag-yellow'}`}>
                        {event.category}
                    </span>
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
                            onClick={() => setReminded(!reminded)}
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
                        <span>{event.attendees} attending</span>
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
