import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Plus, Calendar, Settings, Users,
    X, Check, Loader, Edit, Trash2, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import miscService from '../services/misc';
import eventService from '../services/events';
import './Admin.css';

const Admin = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('events');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState([]);
    const [events, setEvents] = useState([]);
    const [editingEventId, setEditingEventId] = useState(null);

    // Get the clubs this admin manages from the Auth context
    const clubs = user?.managedClubs || [];
    const isAdmin = user?.isAdmin || false;

    const [newEvent, setNewEvent] = useState({
        name: '',
        club_id: '',
        location_id: '',
        date: '',
        time: '',
        duration_minutes: 60,
        description: ''
    });

    useEffect(() => {
        fetchLocations();
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const data = await eventService.getAllEvents();
            setEvents(data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        }
    };

    const fetchLocations = async () => {
        try {
            const data = await miscService.getAllLocations();
            setLocations(data);
        } catch (error) {
            console.error("Failed to fetch locations", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEvent(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Combine date and time for tentative_start_time
            const startDateTime = new Date(`${newEvent.date}T${newEvent.time}`);

            const payload = {
                name: newEvent.name,
                club_id: parseInt(newEvent.club_id),
                location_id: parseInt(newEvent.location_id),
                tentative_start_time: startDateTime.toISOString(),
                duration_minutes: parseInt(newEvent.duration_minutes),
                description: newEvent.description
            };

            if (editingEventId) {
                await eventService.updateEvent(editingEventId, payload);
                alert('Event updated successfully!');
            } else {
                await eventService.createEvent(payload);
                alert('Event created successfully!');
            }

            setShowCreateModal(false);
            setEditingEventId(null);
            setNewEvent({ name: '', club_id: '', location_id: '', date: '', time: '', duration_minutes: 60, description: '' });
            fetchEvents();
        } catch (error) {
            console.error("Failed to save event", error);
            alert('Failed to save event. Please check your permissions or try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (event) => {
        const dateObj = new Date(event.tentative_start_time);

        setNewEvent({
            name: event.name,
            club_id: clubs.find(c => c.name === event.club_name)?.id || '',
            location_id: event.location_id || '',
            date: dateObj.toISOString().split('T')[0],
            time: dateObj.toTimeString().slice(0, 5),
            duration_minutes: event.duration_minutes,
            description: event.description || ''
        });
        setEditingEventId(event.id);
        setShowCreateModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await eventService.deleteEvent(id);
            setEvents(events.filter(e => e.id !== id));
            alert('Event deleted successfully!');
        } catch (err) {
            console.error("Failed to delete event", err);
            alert("Failed to delete event.");
        }
    };

    const openCreateModal = () => {
        setEditingEventId(null);
        setNewEvent({ name: '', club_id: '', location_id: '', date: '', time: '', duration_minutes: 60, description: '' });
        setShowCreateModal(true);
    };

    if (authLoading) {
        return (
            <div className="admin-page flex-center" style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--brand-purple-pale)' }}>
                <Loader className="spin" size={32} color="var(--brand-purple)" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="admin-page flex-center" style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--brand-purple-pale)' }}>
                <div className="card text-center" style={{ padding: '3rem', maxWidth: '400px' }}>
                    <ShieldAlert size={48} color="var(--brand-purple)" style={{ margin: '0 auto 1rem' }} />
                    <h2>Admin Access Required</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Please log in to access the Club Admin panel.</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="admin-page flex-center" style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--brand-purple-pale)' }}>
                <div className="card text-center" style={{ padding: '3rem', maxWidth: '400px' }}>
                    <ShieldAlert size={48} color="var(--red)" style={{ margin: '0 auto 1rem' }} />
                    <h2>Access Denied</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You do not have club administrator privileges.</p>
                    <button className="btn btn-outline" onClick={() => navigate('/')}>Return to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page" style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--brand-purple-pale)' }}>
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 className="page-title">Club Admin</h1>
                        <p className="page-subtitle">Manage your club events</p>
                    </div>
                    <button className="btn btn-yellow" onClick={openCreateModal}>
                        <Plus size={18} />
                        Post New Event
                    </button>
                </div>

                {/* Stats Row (Mocked / Placeholder) */}
                <div className="stats-grid grid-4 stagger">
                    {/* Stats Removed/Reduced to keep it strict. Backend doesn't provide these counts directly yet. */}
                    <div className="stat-card card animate-fade-in">
                        <div className="stat-icon" style={{ background: 'rgba(113, 51, 100, 0.1)', color: 'var(--brand-purple)' }}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3>{events.length}</h3>
                            <p>Manage Events</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Tabs */}
                <div className="admin-tabs">
                    <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
                        Create / Manage
                    </button>
                </div>

                {activeTab === 'events' && (
                    <div className="events-table-container card animate-fade-in">
                        {events.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--grey-200)', background: 'var(--brand-purple-pale)' }}>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Event Name</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Club</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Date & Time</th>
                                            <th style={{ padding: '1rem', fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map((ev) => (
                                            <tr key={ev.id} style={{ borderBottom: '1px solid var(--grey-100)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{ev.name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{ev.club_name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(ev.tentative_start_time).toLocaleString('en-US', { disable12Hour: true })}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button className="btn-icon" style={{ display: 'inline-flex', marginRight: '0.5rem', color: 'var(--grey-500)' }} onClick={() => handleEdit(ev)} title="Edit Event">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="btn-icon" style={{ display: 'inline-flex', color: 'var(--brand-red)' }} onClick={() => handleDelete(ev.id)} title="Delete Event">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                                <Calendar size={48} style={{ color: 'var(--grey-300)', margin: '0 auto 1rem auto' }} />
                                <p style={{ color: 'var(--grey-500)' }}>Use the "Post New Event" button to add events to the calendar.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="modal-overlay animate-fade-in">
                        <div className="modal-content card">
                            <div className="modal-header">
                                <h2>{editingEventId ? 'Edit Event' : 'Post New Event'}</h2>
                                <button className="btn-icon" onClick={() => setShowCreateModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="event-form">
                                <div className="form-group">
                                    <label>Event Title</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newEvent.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Intro to Machine Learning"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Club</label>
                                    <select
                                        name="club_id"
                                        value={newEvent.club_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Club</option>
                                        {clubs.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <small style={{ color: 'var(--grey-500)', fontSize: '0.75rem', marginTop: '4px' }}>
                                        * You must be an admin of the selected club to post.
                                    </small>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Date</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={newEvent.date}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Time</label>
                                        <input
                                            type="time"
                                            name="time"
                                            value={newEvent.time}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Duration (minutes)</label>
                                    <input
                                        type="number"
                                        name="duration_minutes"
                                        value={newEvent.duration_minutes}
                                        onChange={handleInputChange}
                                        min="15"
                                        step="15"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Venue</label>
                                    <select
                                        name="location_id"
                                        value={newEvent.location_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Venue</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={newEvent.description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        placeholder="Event details..."
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-yellow" disabled={loading}>
                                        {loading ? <Loader size={16} className="animate-spin" /> : (editingEventId ? 'Save Changes' : 'Create Event')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
