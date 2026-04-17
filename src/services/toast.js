const listeners = new Set();

const DEFAULT_DURATION = 3200;

const emitToast = (payload) => {
    listeners.forEach((listener) => {
        try {
            listener(payload);
        } catch (error) {
            console.error('Toast listener failed', error);
        }
    });
};

export const subscribeToToasts = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const createToast = (type, message, options = {}) => {
    if (!message) return null;

    const payload = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        message,
        duration: options.duration ?? DEFAULT_DURATION,
    };

    emitToast(payload);
    return payload.id;
};

export const toast = {
    success: (message, options) => createToast('success', message, options),
    error: (message, options) => createToast('error', message, options),
    warning: (message, options) => createToast('warning', message, options),
    info: (message, options) => createToast('info', message, options),
};
