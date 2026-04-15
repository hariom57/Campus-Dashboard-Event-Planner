import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Circle, ClipboardList, Sparkles } from 'lucide-react';
import './Todo.css';

const Todo = () => {
    const [todos, setTodos] = useState(() => {
        const saved = localStorage.getItem('personal_todos');
        return saved ? JSON.parse(saved) : [];
    });
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        localStorage.setItem('personal_todos', JSON.stringify(todos));
    }, [todos]);

    const handleAddTodo = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        
        const newTodo = {
            id: Date.now(),
            text: inputValue.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        setTodos([newTodo, ...todos]);
        setInputValue('');
    };

    const toggleTodo = (id) => {
        setTodos(todos.map(todo => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    const deleteTodo = (id) => {
        setTodos(todos.filter(todo => todo.id !== id));
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
                    />
                    <button type="submit" className="todo-add-btn" disabled={!inputValue.trim()}>
                        <Plus size={20} />
                    </button>
                </form>

                <div className="todo-list-section">
                    {todos.length > 0 ? (
                        <div className="todo-items">
                            {todos.map(todo => (
                                <div key={todo.id} className={`todo-item card ${todo.completed ? 'completed' : ''}`}>
                                    <button 
                                        className="todo-check-btn" 
                                        onClick={() => toggleTodo(todo.id)}
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
