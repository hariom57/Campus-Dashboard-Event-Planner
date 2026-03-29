import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Trash2, Plus, ListTodo } from 'lucide-react';
import './TodoList.css';

const TodoList = () => {
    const [tasks, setTasks] = useState([]);
    const [inputValue, setInputValue] = useState('');

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem('iitr_todos');
        if (saved) {
            try { setTasks(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    // Save to local storage
    useEffect(() => {
        localStorage.setItem('iitr_todos', JSON.stringify(tasks));
    }, [tasks]);

    const addTask = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        setTasks([...tasks, { id: Date.now(), text: inputValue.trim(), completed: false }]);
        setInputValue('');
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    return (
        <div className="todo-widget card">
            <div className="todo-header">
                <ListTodo size={20} className="text-yellow" />
                <h3>To-Do List</h3>
            </div>

            <form onSubmit={addTask} className="todo-form">
                <input
                    type="text"
                    placeholder="Add a new task..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="todo-input"
                />
                <button type="submit" className="btn-icon todo-submit">
                    <Plus size={16} />
                </button>
            </form>

            <div className="todo-list">
                {tasks.length === 0 ? (
                    <p className="todo-empty">All caught up! Nothing to do.</p>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className={`todo-item ${task.completed ? 'completed' : ''}`}>
                            <button className="btn-icon-sm todo-check" onClick={() => toggleTask(task.id)}>
                                {task.completed ? <CheckCircle2 size={18} color="var(--green)" /> : <Circle size={18} color="var(--border-color)" />}
                            </button>
                            <span className="todo-text">{task.text}</span>
                            <button className="btn-icon-sm todo-delete text-red" onClick={() => deleteTask(task.id)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TodoList;
