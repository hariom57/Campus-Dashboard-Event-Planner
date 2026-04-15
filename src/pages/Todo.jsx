import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CheckCircle, Circle, ClipboardList, Sparkles, Loader } from 'lucide-react';
import todoService from '../services/todo';
import './Todo.css';

const Todo = () => {
    const [todos, setTodos] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

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
        e.preventDefault();
        if (!inputValue.trim() || saving) return;

        setSaving(true);
        try {
            const newTodo = await todoService.create(inputValue.trim());
            setTodos(prev => [newTodo, ...prev]);
            setInputValue('');
        } catch (err) {
            console.error('Failed to create todo', err);
            setError('Could not save task. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleTodo = async (todo) => {
        // Optimistic UI update
        setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t));
        try {
            await todoService.toggle(todo.id, !todo.completed);
        } catch (err) {
            // Revert on failure
            console.error('Failed to toggle todo', err);
            setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: todo.completed } : t));
        }
    };

    const deleteTodo = async (id) => {
        // Optimistic UI update
        setTodos(prev => prev.filter(t => t.id !== id));
        try {
            await todoService.delete(id);
        } catch (err) {
            console.error('Failed to delete todo', err);
            // Reload on failure to restore real state
            loadTodos();
        }
    };

    const completedCount = todos.filter(t => t.completed).length;

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

            <div className="todo-content container">
                <form className="todo-input-card card" onSubmit={handleAddTodo}>
                    <input
                        type="text"
                        placeholder="What's on your mind? (e.g. Lab report due tomorrow)"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={saving}
                    />
                    <button type="submit" className="todo-add-btn" disabled={!inputValue.trim() || saving}>
                        {saving ? <Loader size={18} className="spin" /> : <Plus size={20} />}
                    </button>
                </form>

                {error && <p className="todo-error-msg">{error}</p>}

                <div className="todo-list-section">
                    {loading ? (
                        <div className="todo-loading card">
                            <Loader size={28} className="spin" />
                            <p>Loading your tasks...</p>
                        </div>
                    ) : todos.length > 0 ? (
                        <div className="todo-items">
                            {todos.map(todo => (
                                <div key={todo.id} className={`todo-item card ${todo.completed ? 'completed' : ''}`}>
                                    <button
                                        className="todo-check-btn"
                                        onClick={() => toggleTodo(todo)}
                                    >
                                        {todo.completed ? (
                                            <CheckCircle size={22} className="check-icon" />
                                        ) : (
                                            <Circle size={22} className="circle-icon" />
                                        )}
                                    </button>
                                    <span className="todo-text">{todo.text}</span>
                                    <button
                                        className="todo-delete-btn"
                                        onClick={() => deleteTodo(todo.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
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

export default Todo;
