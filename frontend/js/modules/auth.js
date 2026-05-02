/**
 * Auth Module - Handles login, logout, and session management
 */
import { apiFetch } from './api.js';

export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loadSession();
    }

    async login(username, password) {
        try {
            const data = await apiFetch('/users/auth/signin', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            this.saveSession(data);
            return data;
        } catch (error) {
            throw error;
        }
    }

    async register(username, email, password) {
        try {
            const response = await apiFetch('/users/auth/signup', {
                method: 'POST',
                body: JSON.stringify({ username, email, password, role: "user" })
            });
            return response;
        } catch (error) {
            throw error;
        }
    }

    saveSession(data) {
        localStorage.setItem('jwt_token', data.token);
        const user = { id: data.id, username: data.username, email: data.email, role: data.role };
        localStorage.setItem('user_data', JSON.stringify(user));
        this.currentUser = user;
    }

    loadSession() {
        try {
            const token = localStorage.getItem('jwt_token');
            const userData = localStorage.getItem('user_data');
            if (token && userData) {
                this.currentUser = JSON.parse(userData);
                return true;
            }
        } catch (e) {
            console.error("Session load error:", e);
            this.logout();
        }
        return false;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    logout() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        this.currentUser = null;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}

export const auth = new AuthManager();
