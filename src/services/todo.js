import api from './api';

const todoService = {
    getAll: async () => {
        const response = await api.get('/todos');
        return response.data?.todos || [];
    },

    create: async (text) => {
        const response = await api.post('/todos', { text });
        return response.data?.todo;
    },

    toggle: async (id, completed) => {
        const response = await api.patch(`/todos/${id}`, { completed });
        return response.data?.todo;
    },

    delete: async (id) => {
        await api.delete(`/todos/${id}`);
    },
};

export default todoService;
