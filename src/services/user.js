import api from './api';

const userService = {
    updatePreferences: async (preferences) => {
        const response = await api.patch('/user/preferences', preferences);
        return response.data;
    },
};

export default userService;
