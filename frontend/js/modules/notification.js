/**
 * Notification Module - Handles real-time push notifications via WebSocket
 */
import { auth } from './auth.js';

export class NotificationManager {
    constructor() {
        this.stompClient = null;
    }

    connect() {
        if (!auth.isAuthenticated()) return;
        
        // Connect to API Gateway -> Notification Service
        const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
        const url = token ? `http://localhost:8080/api/notifications/ws?token=${token}` : 'http://localhost:8080/api/notifications/ws';
        console.log("Attempting WS connect to:", url);
        console.log("Token found:", token ? "YES (starts with " + token.substring(0, 10) + "...)" : "NO");
        const socket = new SockJS(url);
        this.stompClient = Stomp.over(socket);
        
        // Optional: disable debug logs in production
        this.stompClient.debug = null;

        // Use the token already retrieved at line 15
        this.stompClient.connect({ 'Authorization': `Bearer ${token}` }, (frame) => {
            console.log('Notification WS Connected');
            
            // Subscribe to personal notifications
            this.stompClient.subscribe(`/topic/notifications/${auth.currentUser.id}`, (msg) => {
                this.onNotificationReceived(JSON.parse(msg.body));
            });
        }, (error) => {
            console.error('Notification WS Error:', error);
            // Reconnect after 5 seconds
            setTimeout(() => this.connect(), 5000);
        });
    }

    onNotificationReceived(notification) {
        // notification object: {title, message, type}
        if (window.showToast) {
            window.showToast(notification.title || 'Notification', notification.message, notification.type || 'info');
        } else {
            console.log("Notification received:", notification);
        }
        
        // Optional: if it's a P2P update, auto-refresh P2P listings
        if (notification.title && notification.title.includes('P2P')) {
            if (window.p2p && typeof window.p2p.fetchListings === 'function') {
                // Determine current active tab
                const activeTab = document.querySelector('.p2p-type-btn.active');
                if (activeTab) {
                    const type = activeTab.id.includes('buy') ? 'BUY' : 'SELL';
                    window.p2p.fetchListings(type);
                }
            }
        }
    }
}

export const notification = new NotificationManager();
