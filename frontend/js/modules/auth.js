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
        const data = await apiFetch('/users/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        this.saveSession(data);
        window.dispatchEvent(new CustomEvent('authChange'));
        return data;
    }

    async register(username, email, password) {
        return await apiFetch('/users/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, role: "user" })
        });
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
            this.performLogout();
        }
        return false;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    performLogout() {
        localStorage.clear();
        this.currentUser = null;
        window.dispatchEvent(new CustomEvent('authChange'));
    }

    // UI Handlers
    async handleLogin() {
        const user = document.getElementById('login-username').value;
        const pass = document.getElementById('login-password').value;
        try {
            await this.login(user, pass);
            window.ui.showToast('Success', 'Logged in successfully');
        } catch (e) {
            window.ui.showToast('Login Failed', e.message, 'error');
        }
    }

    async handleRegister() {
        const user = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-password').value;
        try {
            await this.register(user, email, pass);
            window.ui.showToast('Success', 'Account created! Please login.');
            this.switchTab('login');
        } catch (e) {
            window.ui.showToast('Registration Failed', e.message, 'error');
        }
    }

    switchTab(tab) {
        const isLogin = tab === 'login';
        document.getElementById('login-form').style.display = isLogin ? 'block' : 'none';
        document.getElementById('register-form').style.display = isLogin ? 'none' : 'block';
        document.getElementById('tab-login').classList.toggle('active', isLogin);
        document.getElementById('tab-register').classList.toggle('active', !isLogin);
    }
}

export const auth = new AuthManager();
