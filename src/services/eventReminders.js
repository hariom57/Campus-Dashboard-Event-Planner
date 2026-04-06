const STORAGE_KEY = 'event-reminder-subscriptions-v1';
const SENT_KEY = 'event-reminder-sent-v1';
const REMINDER_OFFSETS_MINUTES = [30, 5];
const MAX_TIMEOUT_MS = 2147483647;
const CHECK_INTERVAL_MS = 20 * 1000;
const DUE_WINDOW_MS = 2 * 60 * 1000;

const timerMap = new Map();
let monitorIntervalId = null;
let monitorWired = false;

const parseJson = (value, fallback) => {
    try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};

const getSubscriptions = () => {
    if (typeof window === 'undefined') return {};
    return parseJson(localStorage.getItem(STORAGE_KEY), {});
};

const setSubscriptions = (subscriptions) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
};

const getSentMap = () => {
    if (typeof window === 'undefined') return {};
    return parseJson(localStorage.getItem(SENT_KEY), {});
};

const setSentMap = (sentMap) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SENT_KEY, JSON.stringify(sentMap));
};

const reminderKey = (eventId, offsetMinutes) => `${eventId}-${offsetMinutes}`;

const normalizeEvent = (event) => {
    if (!event || event.id == null || !event.tentative_start_time) return null;

    return {
        id: String(event.id),
        name: event.name || 'Upcoming Event',
        tentative_start_time: event.tentative_start_time,
        location_name: event.location_name || 'Campus',
        club_name: event.club_name || 'IITR Campus',
    };
};

const clearTimersForEvent = (eventId) => {
    REMINDER_OFFSETS_MINUTES.forEach((offset) => {
        const key = reminderKey(eventId, offset);
        const timer = timerMap.get(key);
        if (timer) {
            clearTimeout(timer);
            timerMap.delete(key);
        }
    });
};

const clearSentKeysForEvent = (eventId) => {
    const sentMap = getSentMap();
    REMINDER_OFFSETS_MINUTES.forEach((offset) => {
        delete sentMap[reminderKey(eventId, offset)];
    });
    setSentMap(sentMap);
};

const markSent = (eventId, offsetMinutes) => {
    const sentMap = getSentMap();
    sentMap[reminderKey(eventId, offsetMinutes)] = Date.now();
    setSentMap(sentMap);
};

const hasSent = (eventId, offsetMinutes) => {
    const sentMap = getSentMap();
    return Boolean(sentMap[reminderKey(eventId, offsetMinutes)]);
};

const pruneOldData = () => {
    const now = Date.now();
    const subscriptions = getSubscriptions();
    let changed = false;

    Object.values(subscriptions).forEach((sub) => {
        const startTs = new Date(sub.tentative_start_time).getTime();
        if (!Number.isFinite(startTs) || startTs < now - 24 * 60 * 60 * 1000) {
            changed = true;
            clearTimersForEvent(sub.id);
            delete subscriptions[sub.id];
            clearSentKeysForEvent(sub.id);
        }
    });

    if (changed) {
        setSubscriptions(subscriptions);
    }
};

const notificationBody = (event, offsetMinutes) => {
    const start = new Date(event.tentative_start_time);
    const timeLabel = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${event.name} starts in ${offsetMinutes} minutes at ${timeLabel} (${event.location_name}).`;
};

const showReminderNotification = async (event, offsetMinutes) => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    const title = `Event Reminder • ${offsetMinutes} min`;
    const body = notificationBody(event, offsetMinutes);
    const commonOptions = {
        body,
        icon: '/pwa-icon-192.svg',
        badge: '/pwa-icon-192.svg',
        tag: `event-reminder-${event.id}-${offsetMinutes}`,
        data: {
            url: `/event/${event.id}`,
            eventId: event.id,
            offsetMinutes,
        },
    };

    try {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.showNotification(title, commonOptions);
                return;
            }
        }

        // Fallback when service worker registration is unavailable.
        // eslint-disable-next-line no-new
        new Notification(title, commonOptions);
    } catch (error) {
        console.error('Failed to show event reminder notification:', error);
    }
};

const scheduleWithLongTimeout = (delayMs, callback) => {
    if (delayMs <= MAX_TIMEOUT_MS) {
        return setTimeout(callback, delayMs);
    }

    return setTimeout(() => {
        scheduleWithLongTimeout(delayMs - MAX_TIMEOUT_MS, callback);
    }, MAX_TIMEOUT_MS);
};

const scheduleEventReminder = (event, offsetMinutes) => {
    const key = reminderKey(event.id, offsetMinutes);
    clearTimeout(timerMap.get(key));
    timerMap.delete(key);

    const eventStartMs = new Date(event.tentative_start_time).getTime();
    if (!Number.isFinite(eventStartMs)) return;

    const triggerAtMs = eventStartMs - offsetMinutes * 60 * 1000;
    const delayMs = triggerAtMs - Date.now();

    if (delayMs <= 0 || hasSent(event.id, offsetMinutes)) return;

    const timer = scheduleWithLongTimeout(delayMs, async () => {
        await showReminderNotification(event, offsetMinutes);
        markSent(event.id, offsetMinutes);
        timerMap.delete(key);
    });

    timerMap.set(key, timer);
};

const scheduleEvent = (event) => {
    REMINDER_OFFSETS_MINUTES.forEach((offsetMinutes) => {
        scheduleEventReminder(event, offsetMinutes);
    });
};

const checkAndFireDueReminders = async () => {
    const subscriptions = getSubscriptions();
    const now = Date.now();

    for (const event of Object.values(subscriptions)) {
        const eventStartMs = new Date(event.tentative_start_time).getTime();
        if (!Number.isFinite(eventStartMs)) continue;

        for (const offsetMinutes of REMINDER_OFFSETS_MINUTES) {
            const key = reminderKey(event.id, offsetMinutes);
            if (hasSent(event.id, offsetMinutes)) continue;

            const triggerAtMs = eventStartMs - offsetMinutes * 60 * 1000;
            // Fire if due now, or if app just resumed and reminder was missed shortly before.
            if (now >= triggerAtMs && now - triggerAtMs <= DUE_WINDOW_MS) {
                await showReminderNotification(event, offsetMinutes);
                markSent(event.id, offsetMinutes);
                const timer = timerMap.get(key);
                if (timer) {
                    clearTimeout(timer);
                    timerMap.delete(key);
                }
            }
        }
    }
};

const ensureReminderMonitor = () => {
    if (typeof window === 'undefined') return;

    if (!monitorIntervalId) {
        monitorIntervalId = setInterval(() => {
            checkAndFireDueReminders();
        }, CHECK_INTERVAL_MS);
    }

    if (!monitorWired) {
        const onForeground = () => {
            checkAndFireDueReminders();
        };

        window.addEventListener('focus', onForeground);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                onForeground();
            }
        });

        monitorWired = true;
    }
};

const isReminderSupported = () => {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window;
};

const requestPermission = async () => {
    if (!isReminderSupported()) return 'unsupported';

    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';

    try {
        return await Notification.requestPermission();
    } catch {
        return 'denied';
    }
};

const eventReminderService = {
    isReminderSupported,

    getReminderIds: () => {
        const subscriptions = getSubscriptions();
        return Object.keys(subscriptions);
    },

    isReminderEnabled: (eventId) => {
        const subscriptions = getSubscriptions();
        return Boolean(subscriptions[String(eventId)]);
    },

    scheduleStoredReminders: () => {
        pruneOldData();
        const subscriptions = getSubscriptions();
        Object.values(subscriptions).forEach((event) => scheduleEvent(event));
        ensureReminderMonitor();
        checkAndFireDueReminders();
    },

    updateReminderSnapshot: (event) => {
        const normalized = normalizeEvent(event);
        if (!normalized) return;

        const subscriptions = getSubscriptions();
        if (!subscriptions[normalized.id]) return;

        subscriptions[normalized.id] = normalized;
        setSubscriptions(subscriptions);
        scheduleEvent(normalized);
    },

    toggleReminder: async (event) => {
        const normalized = normalizeEvent(event);
        if (!normalized) {
            return { enabled: false, error: 'invalid-event' };
        }

        const subscriptions = getSubscriptions();

        if (subscriptions[normalized.id]) {
            clearTimersForEvent(normalized.id);
            delete subscriptions[normalized.id];
            setSubscriptions(subscriptions);
            clearSentKeysForEvent(normalized.id);
            return { enabled: false };
        }

        const permission = await requestPermission();
        if (permission !== 'granted') {
            return {
                enabled: false,
                error: permission === 'unsupported' ? 'unsupported' : 'permission-denied',
            };
        }

        const eventStartMs = new Date(normalized.tentative_start_time).getTime();
        if (!Number.isFinite(eventStartMs) || eventStartMs <= Date.now()) {
            return { enabled: false, error: 'event-started' };
        }

        subscriptions[normalized.id] = normalized;
        setSubscriptions(subscriptions);
        clearSentKeysForEvent(normalized.id);
        scheduleEvent(normalized);
        ensureReminderMonitor();
        checkAndFireDueReminders();

        return { enabled: true };
    },
};

export default eventReminderService;
