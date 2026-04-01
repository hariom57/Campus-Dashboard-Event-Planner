import api from './api';

const academicCalendarService = {
    /**
     * Get all hardcoded academic calendar events from the backend.
     */
    getAllEvents: async () => {
        try {
            const response = await api.get('/academic-calendar');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching academic calendar:', error);
            throw error;
        }
    },

    /**
     * Get a specific academic calendar event by its hardcoded ID.
     */
    getEventById: async (id) => {
        try {
            const response = await api.get(`/academic-calendar/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching academic calendar event ${id}:`, error);
            throw error;
        }
    }
};

export default academicCalendarService;
