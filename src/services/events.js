import api from './api';

/**
 * Event Service handles fetching and managing dynamic club events from the backend.
 * Official academic events are now handled via the separate AcademicCalendarService.
 */

const eventService = {
    // Get all vibrant dynamic events from the DB
    getAllEvents: async () => {
        try {
            const response = await api.get('/events/all');
            return response.data.events || [];
        } catch (error) {
            console.error("Error fetching events from backend:", error);
            // Return empty if backend fails, official academic dates are served separately
            return [];
        }
    },

    // Get single event by ID
    getEventById: async (id) => {
        try {
            const response = await api.get(`/events/${id}`);
            // Check if backend returns array
            const ev = response.data.events && response.data.events.length > 0
                ? response.data.events[0]
                : (response.data.event || null);
            return ev;
        } catch (error) {
            console.error(`Error fetching event ${id}:`, error);
            return null;
        }
    },

    // Create new event
    createEvent: async (eventData) => {
        const response = await api.post('/events/add', eventData);
        return response.data.event;
    },

    // Update event
    updateEvent: async (id, eventData) => {
        const response = await api.patch(`/events/${id}`, eventData);
        return response.data.event;
    },

    // Delete event
    deleteEvent: async (id) => {
        const response = await api.delete(`/events/${id}`);
        return response.data;
    },

    // Get preferred club events
    getPreferredClubEvents: async () => {
        const response = await api.get('/events/clubs/preferred');
        return response.data.events;
    },

    // Get preferred category events
    getPreferredCategoryEvents: async () => {
        const response = await api.get('/events/categories/preferred');
        return response.data.events;
    }
};

export default eventService;
