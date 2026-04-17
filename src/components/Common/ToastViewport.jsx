import React, { useEffect, useState } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { subscribeToToasts } from '../../services/toast';
import './ToastViewport.css';

const ICON_BY_TYPE = {
    success: CircleCheck,
    error: CircleAlert,
    warning: CircleAlert,
    info: Info,
};

const ToastViewport = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToToasts((toast) => {
            setToasts((prev) => [...prev, toast]);

            window.setTimeout(() => {
                setToasts((prev) => prev.filter((item) => item.id !== toast.id));
            }, toast.duration);
        });

        return unsubscribe;
    }, []);

    const dismissToast = (id) => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
    };

    return (
        <div className="toast-viewport" aria-live="polite" aria-atomic="false">
            {toasts.map((item) => {
                const Icon = ICON_BY_TYPE[item.type] || Info;
                return (
                    <div key={item.id} className={`toast-item toast-${item.type}`} role="status">
                        <Icon size={16} className="toast-icon" />
                        <span className="toast-message">{item.message}</span>
                        <button
                            type="button"
                            className="toast-dismiss"
                            onClick={() => dismissToast(item.id)}
                            aria-label="Dismiss notification"
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ToastViewport;
