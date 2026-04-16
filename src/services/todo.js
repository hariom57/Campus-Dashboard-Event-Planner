import api from './api';

const todoService = {
    getAll: async () => {
        const response = await api.get('/todos');
        return response.data?.todos || [];
    },

    create: async (data) => {
        const response = await api.post('/todos', data);
        return response.data?.todo;
    },

    update: async (id, data) => {
        const response = await api.patch(`/todos/${id}`, data);
        return response.data?.todo;
    },

    delete: async (id) => {
        await api.delete(`/todos/${id}`);
    },
};

export default todoService;
