import api from './api';

const normalizeSingleEvent = (event) => {
    if (!event) return null;

    const categoriesArray = Array.isArray(event.categories)
        ? event.categories
        : (Array.isArray(event.EventCategories) ? event.EventCategories : []);

    const categoryNames = categoriesArray
        .map((cat) => (typeof cat === 'string' ? cat : cat?.name))
        .filter(Boolean);

    return {
        ...event,
        club_name:
            event.club_name
            || event['Club.club_name']
            || event.Club?.club_name
            || event.Club?.name
            || null,
        location_name:
            event.location_name
            || event['Location.location_name']
            || event.Location?.location_name
            || event.Location?.name
            || null,
        location_description:
            event.location_description
            || event['Location.location_description']
            || event.Location?.location_description
            || event.Location?.description
            || null,
        location_id:
            event.location_id
            || event['Location.location_id']
            || event.Location?.location_id
            || event.Location?.id
            || null,
        categories:
            typeof event.categories === 'string'
                ? event.categories
                : categoryNames,
        category_ids: Array.isArray(event.category_ids)
            ? event.category_ids
            : categoriesArray.map((cat) => Number(cat?.id)).filter((id) => Number.isInteger(id)),
    };
};

const normalizeListEvent = (event) => {
    if (!event) return null;

    return {
        ...event,
        club_name:
            event.club_name
            || event['Club.club_name']
            || event.Club?.club_name
            || event.Club?.name
            || null,
        location_name:
            event.location_name
            || event['Location.location_name']
            || event.Location?.location_name
            || event.Location?.name
            || null,
        location_description:
            event.location_description
            || event['Location.location_description']
            || event.Location?.location_description
            || event.Location?.description
            || null,
        location_id:
            event.location_id
            || event['Location.location_id']
            || event.Location?.location_id
            || event.Location?.id
            || null,
        club_id:
            event.club_id
            || event['Club.id']
            || event.Club?.id
            || null,
    };
};

/**
 * Event Service handles fetching and managing dynamic club events from the backend.
 * Official academic events are now handled via the separate AcademicCalendarService.
 */

const eventService = {
    // Get paginated vibrant dynamic events from the DB
    getAllEventsPage: async (page = 1, limit = 10) => {
        try {
            const response = await api.get('/events/all', {
                params: { page, limit }
            });

            const normalizedEvents = Array.isArray(response.data?.events)
                ? response.data.events.map(normalizeListEvent).filter(Boolean)
                : [];

            return {
                events: normalizedEvents,
                currentPage: response.data?.currentPage || page,
                pageSize: response.data?.pageSize || limit,
                totalEvents: response.data?.totalEvents ?? null,
                totalPages: response.data?.totalPages ?? null,
            };
        } catch (error) {
            console.error("Error fetching events from backend:", error);
            // Return empty if backend fails, official academic dates are served separately
            return {
                events: [],
                currentPage: page,
                pageSize: limit,
                totalEvents: 0,
                totalPages: 0,
            };
        }
    },

    // Backward-compatible helper: returns only events array for a single page
    getAllEvents: async (page = 1, limit = 10) => {
        const result = await eventService.getAllEventsPage(page, limit);
        return result.events;
    },

    // Get total count of events
    getCount: async () => {
        try {
            const response = await api.get('/events/count');
            return response.data?.count ?? 0;
        } catch (error) {
            console.error('Error fetching event count:', error);
            return null;
        }
    },

    // Get single event by ID
    getEventById: async (id) => {
        try {
            const response = await api.get(`/events/${id}`);
            const ev = response.data?.event
                || (response.data?.events && response.data.events.length > 0 ? response.data.events[0] : null);
            return normalizeSingleEvent(ev);
        } catch (error) {
            console.error(`Error fetching event ${id}:`, error);
            return null;
        }
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
