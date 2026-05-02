/**
 * API Module - Handles all backend communications
 */
export const API_BASE = "http://localhost:8080/api";

export const getAuthHeaders = () => {
    const token = localStorage.getItem('jwt_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const apiFetch = async (endpoint, options = {}) => {
    const isAuthRequest = endpoint.includes('/auth/signin') || endpoint.includes('/auth/signup');
    const headers = {
        ...(!isAuthRequest ? getAuthHeaders() : { 'Content-Type': 'application/json' }),
        ...options.headers
    };
    
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: headers
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    if (response.status === 204) return null;
    
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        return text;
    }
};
