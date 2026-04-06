import api from './api';

const clubsService = {
    getAllClubs: async () => {
        const response = await api.get('/clubs');
        return response.data?.clubs || [];
    },

    createClub: async (data) => {
        const response = await api.post('/clubs/create', data);
        return response.data?.clubs;
    },

    updateClub: async (id, data) => {
        const response = await api.patch(`/clubs/update/${id}`, data);
        return response.data?.clubs;
    },

    deleteClub: async (id) => {
        const response = await api.delete(`/clubs/delete/${id}`);
        return response.data?.clubs;
    },
};

export default clubsService;