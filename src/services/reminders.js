import api from './api';

const remindersService = {
    getAll: async () => {
        const response = await api.get('/reminders');
        return Array.isArray(response.data?.reminders) ? response.data.reminders : [];
    },

    setOffsets: async (eventId, offsetsMinutes) => {
        const response = await api.put(`/reminders/${eventId}`, { offsetsMinutes });
        return response.data?.reminder;
    },

    disable: async (eventId) => {
        await api.delete(`/reminders/${eventId}`);
    },
};

export default remindersService;
