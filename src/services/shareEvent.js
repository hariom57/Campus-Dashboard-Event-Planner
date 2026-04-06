const formatShareTime = (dateStr) => {
    if (!dateStr) return 'soon';

    const date = new Date(dateStr);
    return date.toLocaleString([], {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const buildEventLink = (event) => {
    if (typeof window === 'undefined' || !event?.id) return '';
    return `${window.location.origin}/event/${event.id}`;
};

const buildSharePayload = (event) => {
    const url = buildEventLink(event);
    const title = event?.name || 'IITR Campus Event Dashboard';
    const timeText = formatShareTime(event?.tentative_start_time);
    const clubText = event?.club_name || 'IITR Campus';
    const locationText = event?.location_name || 'Venue will be shared soon';

    const text = [
        "Let's attend this event!",
        `Event: ${title}`,
        `Organizer: ${clubText}`,
        `When: ${timeText}`,
        `Where: ${locationText}`,
        `View full details: ${url}`,
        url,
    ].join('\n');

    return { title, text, url };
};

const buildWhatsAppShareUrl = (payload) => {
    const encoded = encodeURIComponent(payload.text);
    return `https://wa.me/?text=${encoded}`;
};

export const shareEvent = async (event) => {
    if (typeof window === 'undefined' || !event) {
        return { success: false, reason: 'unsupported' };
    }

    const payload = buildSharePayload(event);

    try {
        if (navigator.share) {
            await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
            return { success: true, method: 'native' };
        }

        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
            return { success: true, method: 'clipboard' };
        }

        return { success: false, reason: 'unsupported' };
    } catch (error) {
        if (error?.name === 'AbortError') {
            return { success: false, reason: 'cancelled' };
        }

        return { success: false, reason: 'failed' };
    }
};

export const shareEventOnWhatsApp = (event) => {
    if (typeof window === 'undefined' || !event) {
        return { success: false, reason: 'unsupported' };
    }

    const payload = buildSharePayload(event);
    const whatsappUrl = buildWhatsAppShareUrl(payload);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    return { success: true, method: 'whatsapp' };
};
