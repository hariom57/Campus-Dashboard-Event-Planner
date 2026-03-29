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
    }
};

export default miscService;
