import React, { useState } from 'react';
import { Bell, Check, Trash2, Plus, ListTodo, User, LogOut, Settings, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tinkeringLogo from '../assets/tinkering_logo.png';
import './Alerts.css';

// ---- Todo Mini Widget ----
const useTodos = () => {
    const [tasks, setTasks] = useState(() => {
        try { return JSON.parse(localStorage.getItem('iitr_todos') || '[]'); } catch { return []; }
    });

    const save = (updated) => {
        setTasks(updated);
        localStorage.setItem('iitr_todos', JSON.stringify(updated));
    };

    const addTask = (text) => save([...tasks, { id: Date.now(), text, completed: false }]);
    const toggleTask = (id) => save(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    const deleteTask = (id) => save(tasks.filter(t => t.id !== id));

    return { tasks, addTask, toggleTask, deleteTask };
};

const AlertsPage = () => {
    const navigate = useNavigate();
    const { user, notifications, toggleNotification, logout } = useAuth();
    const { tasks, addTask, toggleTask, deleteTask } = useTodos();

    const [newTask, setNewTask] = useState('');
    const [pushEnabled, setPushEnabled] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(false);

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        addTask(newTask.trim());
        setNewTask('');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const formatTimeAgo = (isoString) => {
        if (!isoString) return '';
        const diff = (Date.now() - new Date(isoString)) / 1000;
        if (diff < 3600) return `${Math.floor(diff / 60)} MINS AGO`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} HOURS AGO`;
        return `${Math.floor(diff / 86400)} DAYS AGO`;
    };

    return (
        <div className="alerts-page">
            {/* Header */}
            <div className="page-header-bar">
                <h1>Alerts & Settings</h1>
            </div>

            {/* Profile Section */}
            {user && (
                <div className="alerts-profile-card">
                    {user.display_picture ? (
                        <img
                            src={user.display_picture}
                            alt={user.full_name}
                            className="alerts-avatar"
                        />
                    ) : (
                        <div className="alerts-avatar-placeholder">
                            {(user.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="alerts-profile-info">
                        <span className="alerts-profile-name">{user.full_name}</span>
                        <span className="alerts-profile-sub">{user.enrolment_number || user.branch || ''}</span>
                    </div>
                </div>
            )}

            {/* Recent Alerts */}
            <div className="alerts-section">
                <div className="alerts-section-header">
                    <h2>Recent Alerts</h2>
                    {notifications.length > 0 && (
                        <button className="alerts-mark-all-btn" onClick={() => notifications.forEach(n => toggleNotification(n))}>
                            Mark all as read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="alerts-empty">
                        <Bell size={32} />
                        <p>No alerts yet</p>
                        <span>RSVP to events to get reminders here</span>
                    </div>
                ) : (
                    <div className="alerts-list">
                        {notifications.map(n => (
                            <div key={n.id} className="alert-item" onClick={() => navigate(`/event/${n.id}`)}>
                                <div className="alert-icon-wrap">
                                    <Bell size={18} />
                                </div>
                                <div className="alert-body">
                                    <p className="alert-title">{n.title}</p>
                                    <span className="alert-meta">{n.date} · {n.time}</span>
                                    <span className="alert-time-ago">{formatTimeAgo(n.addedAt)}</span>
                                </div>
                                <button
                                    className="alert-remove-btn"
                                    onClick={(e) => { e.stopPropagation(); toggleNotification(n); }}
                                    title="Remove"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* My Agenda / Todo */}
            <div className="alerts-section">
                <div className="alerts-section-header">
                    <h2>My Agenda</h2>
                </div>

                <div className="agenda-card">
                    <form onSubmit={handleAddTask} className="agenda-form">
                        <input
                            type="text"
                            placeholder="+ Add a new task..."
                            value={newTask}
                            onChange={e => setNewTask(e.target.value)}
                            className="agenda-input"
                        />
                        <button type="submit" className="agenda-add-btn"><Plus size={16} /></button>
                    </form>

                    <div className="agenda-tasks">
                        {tasks.length === 0 && (
                            <p className="agenda-empty">All caught up! Nothing to do 🎉</p>
                        )}
                        {tasks.map(task => (
                            <div key={task.id} className={`agenda-task ${task.completed ? 'done' : ''}`}>
                                <button className="agenda-check" onClick={() => toggleTask(task.id)}>
                                    {task.completed
                                        ? <Check size={16} color="var(--green)" />
                                        : <div className="agenda-check-circle" />
                                    }
                                </button>
                                <span className="agenda-task-text">{task.text}</span>
                                <button className="agenda-delete" onClick={() => deleteTask(task.id)}>
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* App Preferences */}
            <div className="alerts-section">
                <div className="alerts-section-header"><h2>App Preferences</h2></div>
                <div className="prefs-card">
                    <div className="pref-row">
                        <div className="pref-icon-wrap"><Bell size={18} /></div>
                        <div className="pref-info">
                            <span className="pref-title">Push Notifications</span>
                            <span className="pref-sub">Get instant alerts for event changes</span>
                        </div>
                        <button className={`toggle-switch ${pushEnabled ? 'on' : ''}`} onClick={() => setPushEnabled(v => !v)}>
                            <span className="toggle-thumb" />
                        </button>
                    </div>
                    <div className="pref-row">
                        <div className="pref-icon-wrap"><Mail size={18} /></div>
                        <div className="pref-info">
                            <span className="pref-title">Email Updates</span>
                            <span className="pref-sub">Weekly campus digest &amp; MTE schedules</span>
                        </div>
                        <button className={`toggle-switch ${emailEnabled ? 'on' : ''}`} onClick={() => setEmailEnabled(v => !v)}>
                            <span className="toggle-thumb" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Account */}
            <div className="alerts-section">
                <div className="alerts-section-header"><h2>Account</h2></div>
                <div className="account-card">
                    <button className="account-row logout-row" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout from Channel-I</span>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="alerts-footer">
                <div className="alerts-footer-logos">
                    <img src={tinkeringLogo} alt="Tinkering Labs" className="footer-tl-logo" />
                </div>
                <p>made with <span className="heart">❤</span> by tinkering labs</p>
            </div>
        </div>
    );
};

export default AlertsPage;
