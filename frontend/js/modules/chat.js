/**
 * Chat Module - Handles WebSocket/STOMP real-time messaging
 */
import { auth } from './auth.js';

export class ChatManager {
    constructor() {
        this.stompClient = null;
        this.messages = [];
    }

    connect() {
        if (!auth.isAuthenticated()) return;
        
        const socket = new SockJS('http://localhost:8080/ws');
        this.stompClient = Stomp.over(socket);
        this.stompClient.connect({ 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }, (frame) => {
            console.log('Connected to WS:', frame);
            this.stompClient.subscribe(`/topic/messages/${auth.currentUser.id}`, (msg) => {
                this.onMessageReceived(JSON.parse(msg.body));
            });
        });
    }

    onMessageReceived(msg) {
        this.messages.push(msg);
        this.renderMessages();
    }

    sendMessage(text, recipientId) {
        if (this.stompClient && text) {
            this.stompClient.send("/app/chat", {}, JSON.stringify({
                senderId: auth.currentUser.id,
                recipientId: recipientId,
                content: text
            }));
        }
    }

    renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        container.innerHTML = this.messages.map(m => `
            <div class="message ${m.senderId === auth.currentUser.id ? 'sent' : 'received'}">
                <p>${m.content}</p>
            </div>
        `).join('');
    }
}

export const chat = new ChatManager();
