const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Normalize trailing slashes so URLs are built consistently.
export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');

// Backend origin without the /api suffix, used for OAuth and raw fetch calls.
export const BACKEND_URL = API_BASE_URL.replace(/\/api$/, '');
