import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarDays, ChevronRight, Clock3, MapPin, PencilLine, Slash, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import eventReminderService from '../services/eventReminders';
import './Notifications.css';

const REMINDER_OPTIONS = [5, 15, 30, 60];

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatOffset = (offset) => {
    if (offset >= 60) {
        const hours = offset / 60;
        return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
    }
    return `${offset}m`;
};

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [reminders, setReminders] = useState(() => eventReminderService.getReminderEntries());
    const [savingId, setSavingId] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState('info');

    const refreshReminders = () => {
        setReminders(eventReminderService.getReminderEntries());
    };

    useEffect(() => {
        refreshReminders();

        const onStorage = (event) => {
            if (event.key === 'event-reminder-subscriptions-v1' || event.key === null) {
                refreshReminders();
            }
        };

        window.addEventListener('storage', onStorage);
        window.addEventListener('focus', refreshReminders);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('focus', refreshReminders);
        };
    }, []);

    const nextEvent = useMemo(() => {
        return reminders.find((reminder) => new Date(reminder.tentative_start_time).getTime() > Date.now()) || null;
    }, [reminders]);

    const handleToggleOffset = async (reminder, offset) => {
        setSavingId(reminder.id);
        setStatusMessage('');
        try {
            const currentOffsets = Array.isArray(reminder.offsetsMinutes) ? reminder.offsetsMinutes : [];
            const nextOffsets = currentOffsets.includes(offset)
                ? currentOffsets.filter((value) => value !== offset)
                : [...currentOffsets, offset];

            let result;
            if (nextOffsets.length === 0) {
                result = await eventReminderService.toggleReminder(reminder);
            } else {
                result = await eventReminderService.setReminderOffsets(reminder, nextOffsets);
            }

            if (result?.error) {
                setStatusType('error');
                setStatusMessage('Could not update reminder timing for this event.');
                return;
            }

            refreshReminders();
            setStatusType('info');
            setStatusMessage('Reminder timing updated.');
        } finally {
            setSavingId(null);
        }
    };

    const handleDisable = async (reminder) => {
        setSavingId(reminder.id);
        setStatusMessage('');
        try {
            const result = await eventReminderService.toggleReminder(reminder);
            if (result?.error) {
                setStatusType('error');
                setStatusMessage('Could not disable reminders for this event.');
                return;
            }

            refreshReminders();
            setStatusType('info');
            setStatusMessage('Reminder disabled.');
        } finally {
            setSavingId(null);
        }
    };

    const upcomingCount = reminders.filter((reminder) => new Date(reminder.tentative_start_time).getTime() > Date.now()).length;

    return (
        <div className="notifications-page">
            <div className="page-header-bar">
                <h1>Notifications</h1>
            </div>

            <section className="notifications-hero card">
                <div className="notifications-hero-copy">
                    <div className="notifications-hero-kicker">
                        <Sparkles size={14} />
                        <span>Reminder hub</span>
                    </div>
                    <h2>Track every event you are watching</h2>
                    <p>
                        Manage the reminder offsets for each event from one place. These notifications are stored locally in your browser.
                    </p>
                </div>
                <div className="notifications-hero-stats">
                    <div className="notifications-stat">
                        <span>{reminders.length}</span>
                        <small>Tracked events</small>
                    </div>
                    <div className="notifications-stat">
                        <span>{upcomingCount}</span>
                        <small>Upcoming</small>
                    </div>
                </div>
            </section>

            {statusMessage && (
                <div className={`notifications-banner ${statusType === 'error' ? 'error' : 'info'}`}>
                    {statusMessage}
                </div>
            )}

            {nextEvent && (
                <section className="notifications-next card">
                    <div className="notifications-next-label">
                        <BellRing size={14} />
                        <span>Next reminder</span>
                    </div>
                    <div className="notifications-next-copy">
                        <strong>{nextEvent.name}</strong>
                        <span>{formatDate(nextEvent.tentative_start_time)} • {formatTime(nextEvent.tentative_start_time)}</span>
                    </div>
                    <button type="button" className="notifications-next-btn" onClick={() => navigate(`/event/${nextEvent.id}`)}>
                        Open event
                        <ChevronRight size={16} />
                    </button>
                </section>
            )}

            <section className="notifications-list">
                {reminders.length === 0 ? (
                    <div className="notifications-empty card">
                        <div className="notifications-empty-icon">
                            <BellRing size={22} />
                        </div>
                        <h3>No tracked events yet</h3>
                        <p>Open an event card in the feed or event details and enable reminders there. Your active reminders will appear here.</p>
                        <button type="button" className="notifications-empty-btn" onClick={() => navigate('/home')}>
                            Go to feed
                        </button>
                    </div>
                ) : (
                    reminders.map((reminder) => {
                        const activeOffsets = Array.isArray(reminder.offsetsMinutes) ? reminder.offsetsMinutes : [];
                        return (
                            <article key={reminder.id} className="notification-card card">
                                <div className="notification-card-main">
                                    <div className="notification-card-head">
                                        <div className="notification-card-title-wrap">
                                            <h3>{reminder.name}</h3>
                                            <div className="notification-card-meta">
                                                <span><CalendarDays size={12} />{formatDate(reminder.tentative_start_time)}</span>
                                                <span><Clock3 size={12} />{formatTime(reminder.tentative_start_time)}</span>
                                                <span><MapPin size={12} />{reminder.location_name}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="notification-disable-btn"
                                            onClick={() => handleDisable(reminder)}
                                            disabled={savingId === reminder.id}
                                        >
                                            <Slash size={14} />
                                            Disable
                                        </button>
                                    </div>

                                    <div className="notification-card-club">
                                        <PencilLine size={12} />
                                        <span>{reminder.club_name}</span>
                                    </div>

                                    <div className="notification-offsets">
                                        {REMINDER_OPTIONS.map((offset) => {
                                            const active = activeOffsets.includes(offset);
                                            return (
                                                <button
                                                    key={offset}
                                                    type="button"
                                                    className={`notification-offset-chip ${active ? 'active' : ''}`}
                                                    onClick={() => handleToggleOffset(reminder, offset)}
                                                    disabled={savingId === reminder.id}
                                                >
                                                    {formatOffset(offset)} before
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </article>
                        );
                    })
                )}
            </section>
        </div>
    );
};

export default NotificationsPage;
