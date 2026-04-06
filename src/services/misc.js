import api from './api';

const miscService = {
    // Get all locations
    getAllLocations: async () => {
        const response = await api.get('/locations/all');
        return response.data.locations;
    },

    // Get location by ID
    getLocationById: async (id) => {
        const response = await api.get(`/locations/${id}`);
        return response.data.locations[0];
    },

    // Create location
    createLocation: async (data) => {
        const response = await api.post('/locations/add', data);
        return response.data.location;
    },

    // Update location
    updateLocation: async (id, data) => {
        const response = await api.patch(`/locations/${id}`, data);
        return response.data.location;
    },

    // Delete location
    deleteLocation: async (id) => {
        const response = await api.delete(`/locations/${id}`);
        return response.data;
    },

    // Get all event categories
    getAllEventCategories: async () => {
        const response = await api.get('/event-categories/all');
        return response.data.categories;
    },

    // Create event category
    createEventCategory: async (data) => {
        const response = await api.post('/event-categories/add', data);
        return response.data.category;
    },

    // Update event category
    updateEventCategory: async (id, data) => {
        const response = await api.patch(`/event-categories/${id}`, data);
        return response.data.category;
    },

    // Delete event category
    deleteEventCategory: async (id) => {
        const response = await api.delete(`/event-categories/${id}`);
        return response.data;
    },
};

export default miscService;
