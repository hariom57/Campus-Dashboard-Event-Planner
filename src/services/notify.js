import { toast } from './toast';

const ERROR_HINTS = [
    'failed',
    'could not',
    'error',
    'not supported',
    'cannot',
    'invalid',
    'must',
    'try again',
    'permission-denied',
];

const SUCCESS_HINTS = [
    'success',
    'added',
    'updated',
    'created',
    'deleted',
    'copied',
    'saved',
];

const DEFAULT_DURATION_BY_TYPE = {
    success: 3800,
    error: 5200,
    warning: 4600,
    info: 3800,
};

const resolveTypeFromMessage = (normalizedText) => {
    if (SUCCESS_HINTS.some((hint) => normalizedText.includes(hint))) {
        return 'success';
    }

    if (ERROR_HINTS.some((hint) => normalizedText.includes(hint))) {
        return 'error';
    }

    return 'info';
};

export const notify = (message, typeOrOptions = 'auto', maybeOptions = {}) => {
    const text = typeof message === 'string' ? message : String(message ?? '');
    const normalized = text.toLowerCase();

    const explicitType = typeof typeOrOptions === 'string' ? typeOrOptions : 'auto';
    const options = typeof typeOrOptions === 'string' ? maybeOptions : (typeOrOptions || {});

    const type = explicitType === 'auto' ? resolveTypeFromMessage(normalized) : explicitType;
    const duration = options.duration ?? DEFAULT_DURATION_BY_TYPE[type] ?? DEFAULT_DURATION_BY_TYPE.info;

    return toast[type]?.(text, { ...options, duration }) ?? toast.info(text, { ...options, duration });
};
