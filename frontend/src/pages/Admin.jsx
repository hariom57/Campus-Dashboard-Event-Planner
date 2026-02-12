import React, { useState } from 'react';
import { Shield, Plus, Calendar, MapPin, Clock, Upload, Users, Trash2, Edit3, Eye, BarChart3 } from 'lucide-react';
import './Admin.css';

const mockClubEvents = [
    { id: 1, title: 'Cogni Hackathon', date: '2026-02-15', venue: 'MAC', status: 'Approved', attendees: 234 },
    { id: 2, title: 'Workshop: React Basics', date: '2026-02-20', venue: 'LHC 101', status: 'Pending', attendees: 0 },
    { id: 3, title: 'Tech Talk: ML Ops', date: '2026-03-01', venue: 'LHC 301', status: 'Draft', attendees: 0 },
];

const Admin = () => {
    const [activeTab, setActiveTab] = useState('events');
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="admin-page" style={{ paddingTop: '72px' }}>
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 className="page-title">
                            <Shield size={28} style={{ color: 'var(--brand-purple)' }} />
                            Club Admin Panel
                        </h1>
                        <p className="page-subtitle">Manage your club events and track engagement</p>
                    </div>
                    <button className="btn btn-yellow" onClick={() => setShowForm(!showForm)}>
                        <Plus size={18} />
                        Post New Event
                    </button>
                </div>

                {/* Stats */}
                <div className="admin-stats grid-4">
                    <div className="admin-stat-card card">
                        <BarChart3 size={24} style={{ color: 'var(--brand-blue)' }} />
                        <h3>3</h3>
                        <p>Total Events</p>
                    </div>
                    <div className="admin-stat-card card">
                        <Users size={24} style={{ color: 'var(--brand-green)' }} />
                        <h3>234</h3>
                        <p>Total RSVPs</p>
                    </div>
                    <div className="admin-stat-card card">
                        <Eye size={24} style={{ color: 'var(--brand-purple)' }} />
                        <h3>1.2K</h3>
                        <p>Page Views</p>
                    </div>
                    <div className="admin-stat-card card">
                        <Calendar size={24} style={{ color: 'var(--brand-accent)' }} />
                        <h3>2</h3>
                        <p>Upcoming</p>
                    </div>
                </div>

                {/* Create Event Form */}
                {showForm && (
                    <div className="create-event-form card animate-fade-in">
                        <h3>Create New Event</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Event Title</label>
                                <input type="text" placeholder="Enter event name" />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select>
                                    <option>Technical</option>
                                    <option>Cultural</option>
                                    <option>Sports</option>
                                    <option>Academic</option>
                                    <option>Fest</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" />
                            </div>
                            <div className="form-group">
                                <label>Time</label>
                                <input type="time" />
                            </div>
                            <div className="form-group">
                                <label>Venue</label>
                                <input type="text" placeholder="e.g., MAC Auditorium" />
                            </div>
                            <div className="form-group">
                                <label>Expected Attendees</label>
                                <input type="number" placeholder="100" />
                            </div>
                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea placeholder="Describe your event..." rows={3}></textarea>
                            </div>
                            <div className="form-group full-width">
                                <label>Event Poster</label>
                                <div className="upload-zone">
                                    <Upload size={24} />
                                    <p>Drag & drop or click to upload</p>
                                    <span>PNG, JPG up to 5MB</span>
                                </div>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn btn-outline">Save as Draft</button>
                            <button className="btn btn-yellow">Submit for Approval</button>
                        </div>
                    </div>
                )}

                {/* Events Table */}
                <div className="admin-table card">
                    <div className="table-header">
                        <h3>Your Events</h3>
                        <div className="table-tabs">
                            {['events', 'analytics', 'feedback'].map(tab => (
                                <button
                                    key={tab}
                                    className={`table-tab ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeTab === 'events' && (
                        <div className="table-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Date</th>
                                        <th>Venue</th>
                                        <th>Status</th>
                                        <th>RSVPs</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockClubEvents.map(event => (
                                        <tr key={event.id}>
                                            <td className="table-event-name">{event.title}</td>
                                            <td>{event.date}</td>
                                            <td>{event.venue}</td>
                                            <td>
                                                <span className={`status-badge status-${event.status.toLowerCase()}`}>
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td>{event.attendees}</td>
                                            <td className="table-actions">
                                                <button className="btn-icon" title="Edit"><Edit3 size={16} /></button>
                                                <button className="btn-icon" title="View"><Eye size={16} /></button>
                                                <button className="btn-icon delete-btn" title="Delete"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="table-content" style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <BarChart3 size={48} style={{ color: 'var(--grey-300)', marginBottom: 'var(--space-md)' }} />
                            <h4>Analytics Dashboard</h4>
                            <p>Detailed analytics will be available here. Track RSVPs, page views, and engagement metrics.</p>
                        </div>
                    )}

                    {activeTab === 'feedback' && (
                        <div className="table-content" style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <Users size={48} style={{ color: 'var(--grey-300)', marginBottom: 'var(--space-md)' }} />
                            <h4>Event Feedback</h4>
                            <p>Post-event feedback from attendees will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Admin;
