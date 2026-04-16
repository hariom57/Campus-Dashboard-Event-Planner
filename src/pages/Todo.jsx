import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CheckCircle, Circle, ClipboardList, Sparkles, Loader, AlignLeft, Calendar, Link as LinkIcon, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import todoService from '../services/todo';
import './Todo.css';

const Todo = () => {
    const navigate = useNavigate();
    const [todos, setTodos] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [expandedTodoId, setExpandedTodoId] = useState(null);
    const [editData, setEditData] = useState({});
    const [showInFeed, setShowInFeed] = useState(() => localStorage.getItem('iitr_show_feed_todos') === 'true');
    const [isCreating, setIsCreating] = useState(false);
    const [createData, setCreateData] = useState({ text: '', notes: '', due_date: '', due_time: '' });

    useEffect(() => {
        localStorage.setItem('iitr_show_feed_todos', showInFeed);
    }, [showInFeed]);

    const loadTodos = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await todoService.getAll();
            setTodos(data);
        } catch (err) {
            console.error('Failed to load todos', err);
            setError('Could not load your tasks. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTodos();
    }, [loadTodos]);

    const handleAddTodo = async (e) => {
        if (e) e.preventDefault();
        if (!createData.text.trim() || saving) return;

        setSaving(true);
        try {
            const newTodo = await todoService.create({
                text: createData.text.trim(),
                notes: createData.notes || null,
                due_date: createData.due_date || null,
                due_time: createData.due_time || null,
            });
            setTodos(prev => [newTodo, ...prev]);
            setCreateData({ text: '', notes: '', due_date: '', due_time: '' });
            setIsCreating(false);
        } catch (err) {
            console.error('Failed to create todo', err);
            setError('Could not save task. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleTodo = async (todo, e) => {
        if (e) e.stopPropagation();
        // Optimistic UI update
        setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t));
        try {
            await todoService.update(todo.id, { completed: !todo.completed });
        } catch (err) {
            // Revert on failure
            console.error('Failed to toggle todo', err);
            setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: todo.completed } : t));
        }
    };

    const deleteTodo = async (id, e) => {
        if (e) e.stopPropagation();
        // Optimistic UI update
        setTodos(prev => prev.filter(t => t.id !== id));
        if (expandedTodoId === id) setExpandedTodoId(null);
        try {
            await todoService.delete(id);
        } catch (err) {
            console.error('Failed to delete todo', err);
            // Reload on failure to restore real state
            loadTodos();
        }
    };

    const handleExpand = (todo) => {
        if (expandedTodoId === todo.id) {
            handleSaveEdit();
            setExpandedTodoId(null);
        } else {
            if (expandedTodoId) {
                handleSaveEdit();
            }
            setExpandedTodoId(todo.id);
            setEditData({
                text: todo.text || '',
                notes: todo.notes || '',
                due_date: todo.due_date || '',
                due_time: todo.due_time || '',
            });
        }
    };

    const handleSaveEdit = async () => {
        if (!expandedTodoId) return;
        const currentTodo = todos.find(t => t.id === expandedTodoId);
        if (!currentTodo) return;

        // Check if anything changed
        const isChanged = currentTodo.text !== editData.text || 
                          (currentTodo.notes || '') !== editData.notes || 
                          (currentTodo.due_date || '') !== editData.due_date || 
                          (currentTodo.due_time || '') !== editData.due_time;
        
        if (!isChanged) return;

        // Optimistic UI update
        const updatedTodo = { ...currentTodo, ...editData, text: editData.text.trim() || 'Untitled Task' };
        setTodos(prev => prev.map(t => t.id === expandedTodoId ? updatedTodo : t));

        try {
            await todoService.update(expandedTodoId, {
                text: editData.text.trim() || 'Untitled Task',
                notes: editData.notes || null,
                due_date: editData.due_date || null,
                due_time: editData.due_time || null,
            });
        } catch (err) {
            console.error('Failed to update todo', err);
            loadTodos(); // revert
        }
    };

    const formatDisplayDate = (dateString, timeString) => {
        if (!dateString) return null;
        const d = new Date(dateString);
        let formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
        if (timeString) {
            const [h, m] = timeString.split(':');
            const hh = parseInt(h, 10);
            const ampm = hh >= 12 ? 'PM' : 'AM';
            const h12 = hh % 12 || 12;
            formatted += `, ${h12}:${m} ${ampm}`;
        }
        return formatted;
    };

    const completedCount = todos.filter(t => t.completed).length;

    // Split into uncompleted and completed
    const activeTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);

    return (
        <div className="todo-page">
            <div className="page-header-bar">
                <div className="todo-header-content">
                    <h1>Assistant</h1>
                    <p className="todo-subtitle">Manage your personal campus life</p>
                </div>
                <div className="todo-stats">
                    <div className="todo-stat-badge">
                        <Sparkles size={14} />
                        <span>{completedCount}/{todos.length} Done</span>
                    </div>
                </div>
            </div>

            <div className="todo-feed-toggle container">
                <label className="feed-toggle-label">
                    <input 
                        type="checkbox" 
                        checked={showInFeed} 
                        onChange={(e) => setShowInFeed(e.target.checked)}
                    />
                    <span className="feed-toggle-text">Show my active tasks in Home Feed and Calendar</span>
                    <span className="feed-toggle-badge">New</span>
                </label>
            </div>

            <div className="todo-content container">
                {isCreating ? (
                    <div className="todo-item-wrapper expanded create-mode card" style={{ padding: '0' }}>
                        <div className="todo-editor" style={{ borderTop: 'none', paddingLeft: '16px', paddingTop: '16px' }}>
                            <div className="todo-editor-group">
                                <label>Task</label>
                                <input 
                                    type="text" 
                                    className="todo-editor-input" 
                                    value={createData.text} 
                                    onChange={e => setCreateData({...createData, text: e.target.value})}
                                    placeholder="Task name"
                                    autoFocus
                                />
                            </div>
                            
                            <div className="todo-editor-group">
                                <label><AlignLeft size={14} /> Details</label>
                                <textarea 
                                    className="todo-editor-input todo-editor-textarea" 
                                    value={createData.notes} 
                                    onChange={e => setCreateData({...createData, notes: e.target.value})}
                                    placeholder="Add details..."
                                    rows="2"
                                />
                            </div>
                            
                            <div className="todo-editor-row">
                                <div className="todo-editor-group">
                                    <label><Calendar size={14} /> Date</label>
                                    <input 
                                        type="date" 
                                        className="todo-editor-input" 
                                        value={createData.due_date} 
                                        onChange={e => setCreateData({...createData, due_date: e.target.value})}
                                    />
                                </div>
                                <div className="todo-editor-group">
                                    <label>Time</label>
                                    <input 
                                        type="time" 
                                        className="todo-editor-input" 
                                        value={createData.due_time} 
                                        onChange={e => setCreateData({...createData, due_time: e.target.value})}
                                    />
                                </div>
                            </div>

                            {error && <p className="todo-error-msg">{error}</p>}

                            <div className="todo-editor-actions" style={{ marginTop: '12px', gap: '8px', display: 'flex' }}>
                                <button className="todo-cancel-btn" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </button>
                                <button className="todo-done-btn" onClick={handleAddTodo} disabled={!createData.text.trim() || saving}>
                                    {saving ? <Loader size={18} className="spin" /> : 'Save Task'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="todo-input-card card" onClick={() => setIsCreating(true)} style={{ cursor: 'text' }}>
                        <input
                            type="text"
                            placeholder="What's on your mind? (Click to add a custom task)"
                            value={createData.text}
                            onChange={(e) => setCreateData({...createData, text: e.target.value})}
                            style={{ pointerEvents: 'none' }}
                            readOnly
                        />
                        <button className="todo-add-btn" title="Add Task"><Plus size={20} /></button>
                    </div>
                )}

                <div className="todo-list-section">
                    {loading ? (
                        <div className="todo-loading card">
                            <Loader size={28} className="spin" />
                            <p>Loading your tasks...</p>
                        </div>
                    ) : todos.length > 0 ? (
                        <div className="todo-items-container">
                            <div className="todo-items">
                                {activeTodos.map(todo => (
                                    <TodoItem
                                        key={todo.id}
                                        todo={todo}
                                        isExpanded={expandedTodoId === todo.id}
                                        editData={editData}
                                        setEditData={setEditData}
                                        onToggle={(e) => toggleTodo(todo, e)}
                                        onDelete={(e) => deleteTodo(todo.id, e)}
                                        onExpand={() => handleExpand(todo)}
                                        formatDisplayDate={formatDisplayDate}
                                        navigate={navigate}
                                    />
                                ))}
                            </div>
                            
                            {completedTodos.length > 0 && (
                                <div className="todo-completed-section">
                                    <div className="todo-completed-header">
                                        <h4>Completed ({completedTodos.length})</h4>
                                    </div>
                                    <div className="todo-items">
                                        {completedTodos.map(todo => (
                                            <TodoItem
                                                key={todo.id}
                                                todo={todo}
                                                isExpanded={expandedTodoId === todo.id}
                                                editData={editData}
                                                setEditData={setEditData}
                                                onToggle={(e) => toggleTodo(todo, e)}
                                                onDelete={(e) => deleteTodo(todo.id, e)}
                                                onExpand={() => handleExpand(todo)}
                                                formatDisplayDate={formatDisplayDate}
                                                navigate={navigate}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="todo-empty card">
                            <div className="todo-empty-icon">
                                <ClipboardList size={48} />
                            </div>
                            <h3>Your list is empty</h3>
                            <p>Capture tasks, assignments, and reminders here to stay on top of your campus life.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Extracted Component for Todo Item to keep it clean
const TodoItem = ({ todo, isExpanded, editData, setEditData, onToggle, onDelete, onExpand, formatDisplayDate, navigate }) => {
    return (
        <div className={`todo-item-wrapper card ${todo.completed ? 'completed' : ''} ${isExpanded ? 'expanded' : ''}`}>
            {/* Header (Always visible) */}
            <div className="todo-item" onClick={onExpand}>
                <button
                    className="todo-check-btn"
                    onClick={onToggle}
                >
                    {todo.completed ? (
                        <CheckCircle size={22} className="check-icon" />
                    ) : (
                        <Circle size={22} className="circle-icon" />
                    )}
                </button>
                
                <div className="todo-text-content">
                    <span className="todo-text">{todo.text}</span>
                    
                    {!isExpanded && (
                        <div className="todo-badges">
                            {todo.due_date && (
                                <span className={`todo-badge ${new Date(`${todo.due_date}T23:59:59`) < new Date() && !todo.completed ? 'overdue' : ''}`}>
                                    <Calendar size={12} /> {formatDisplayDate(todo.due_date, todo.due_time)}
                                </span>
                            )}
                            {todo.linked_event_name && (
                                <span className="todo-badge linked-event" onClick={(e) => { e.stopPropagation(); navigate(`/event/${todo.linked_event_id}`); }}>
                                    <LinkIcon size={12} /> {todo.linked_event_name}
                                </span>
                            )}
                            {todo.notes && (
                                <span className="todo-badge notes-indicator">
                                    <AlignLeft size={12} />
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <button
                    className="todo-delete-btn"
                    onClick={onDelete}
                    title="Delete Task"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Expanded Editor (Only visible when clicked) */}
            {isExpanded && (
                <div className="todo-editor" onClick={(e) => e.stopPropagation()}>
                    <div className="todo-editor-group">
                        <label>Task</label>
                        <input 
                            type="text" 
                            className="todo-editor-input" 
                            value={editData.text} 
                            onChange={e => setEditData({...editData, text: e.target.value})}
                            placeholder="Task name"
                            autoFocus
                        />
                    </div>
                    
                    <div className="todo-editor-group">
                        <label><AlignLeft size={14} /> Details</label>
                        <textarea 
                            className="todo-editor-input todo-editor-textarea" 
                            value={editData.notes} 
                            onChange={e => setEditData({...editData, notes: e.target.value})}
                            placeholder="Add details..."
                            rows="2"
                        />
                    </div>
                    
                    <div className="todo-editor-row">
                        <div className="todo-editor-group">
                            <label><Calendar size={14} /> Date</label>
                            <input 
                                type="date" 
                                className="todo-editor-input" 
                                value={editData.due_date} 
                                onChange={e => setEditData({...editData, due_date: e.target.value})}
                            />
                        </div>
                        <div className="todo-editor-group">
                            <label>Time</label>
                            <input 
                                type="time" 
                                className="todo-editor-input" 
                                value={editData.due_time} 
                                onChange={e => setEditData({...editData, due_time: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    {todo.linked_event_name && (
                        <div className="todo-editor-group linked-event-info">
                            <label><LinkIcon size={14} /> Linked Event</label>
                            <div className="linked-event-card" onClick={() => navigate(`/event/${todo.linked_event_id}`)}>
                                <strong>{todo.linked_event_name}</strong>
                                <span>{todo.linked_event_club}</span>
                                {todo.linked_event_date && <span>• {new Date(todo.linked_event_date).toLocaleDateString()}</span>}
                            </div>
                        </div>
                    )}

                    <div className="todo-editor-actions">
                        <button className="todo-done-btn" onClick={onExpand}>
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Todo;
