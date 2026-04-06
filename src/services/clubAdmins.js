import api from './api';

const clubAdminsService = {
    getClubAdmins: async (clubId) => {
        const response = await api.get(`/club-admins/club/${clubId}`);
        return Array.isArray(response.data?.admins) ? response.data.admins : [];
    },

    addClubAdmin: async (clubId, enrolmentNumber) => {
        const response = await api.post(`/club-admins/club/${clubId}/add`, {
            enrolment_number: enrolmentNumber,
        });
        return response.data;
    },

    removeClubAdmin: async (clubId, userId) => {
        const response = await api.delete(`/club-admins/club/${clubId}/${userId}`);
        return response.data;
    },
};

export default clubAdminsService;
