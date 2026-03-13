import api from './api';

// Hardcoded Academic & External Events as requested by user
const hardcodedEvents = [
    {
        id: 'hc-1',
        name: 'Mid-Term Examinations (MTE)',
        tentative_start_time: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
        duration_minutes: 1440 * 7, // 7 days
        description: 'Autumn Semester Mid-Term Examinations.',
        club_name: 'Academic',
        location_name: 'Campus Wide',
        categories: 'Academic'
    },
    {
        id: 'hc-2',
        name: 'End-Term Examinations (ETE)',
        tentative_start_time: new Date(new Date().setDate(new Date().getDate() + 45)).toISOString(),
        duration_minutes: 1440 * 14, // 14 days
        description: 'Autumn Semester End-Term Examinations.',
        club_name: 'Academic',
        location_name: 'Campus Wide',
        categories: 'Academic'
    },
    {
        id: 'hc-3',
        name: 'Cognizance Tech Fest',
        tentative_start_time: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
        duration_minutes: 1440 * 3,
        description: 'Annual Technical Festival. External Audience allowed.',
        club_name: 'Cognizance',
        location_name: 'MAC & LHC',
        categories: 'Fest, COGNI ASPECT'
    },
    {
        id: 'hc-4',
        name: 'PhD Research Symposium',
        tentative_start_time: new Date(new Date().setDate(new Date().getDate() + 8)).toISOString(),
        duration_minutes: 360,
        description: 'Research presentations by doctoral candidates.',
        club_name: 'Research Council',
        location_name: 'Senate Hall',
        categories: 'Academic, PhD Support'
    }
];

const eventService = {
    // Get all events
    getAllEvents: async () => {
        try {
            const response = await api.get('/events/all');
            const dbEvents = response.data.events || [];
            // Combine DB events with hardcoded academic events
            return [...dbEvents, ...hardcodedEvents].sort((a, b) =>
                new Date(a.tentative_start_time) - new Date(b.tentative_start_time)
            );
        } catch (error) {
            console.error("Error fetching all events:", error);
            // If backend fails, at least return the hardcoded academic calendar
            return hardcodedEvents;
        }
    },

    // Get single event by ID (supports hardcoded 'hc-' events too)
    getEventById: async (id) => {
        // Check hardcoded events first
        const hc = hardcodedEvents.find(e => String(e.id) === String(id));
        if (hc) return hc;
        // Otherwise fetch from API
        const response = await api.get(`/events/${id}`);
        return response.data.events[0]; // Backend returns array
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
