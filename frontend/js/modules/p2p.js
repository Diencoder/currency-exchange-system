/**
 * P2P Module - Handles Peer-to-Peer trading and Chat
 */
import { apiFetch } from './api.js';
import { auth } from './auth.js';
import { showToast, toggleSpinner } from './ui.js';

class P2PManager {
    constructor() {
        this.listings = [];
        this.currentOrder = null;
        this.stompClient = null;
        this.chatSubscription = null;
    }

    async fetchListings(type = 'BUY') {
        try {
            const data = await apiFetch(`/p2p/listings?type=${type}`);
            this.listings = data || [];
            this.renderListings();
        } catch (error) {
            console.error("Fetch P2P listings error:", error);
        }
    }

    renderListings() {
        const container = document.getElementById('p2p-ads-container');
        if (!container) return;

        if (this.listings.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-secondary);"><i data-lucide="inbox" style="width:48px; height:48px; margin-bottom:1rem; opacity:0.3;"></i><p>No active ads found.</p></div>';
            if (window.lucide) lucide.createIcons();
            return;
        }

        container.innerHTML = this.listings.map(l => {
            const currentUserId = auth.currentUser ? auth.currentUser.id : null;
            const isMyAd = l.sellerId === currentUserId;
            const type = l.type || 'SELL';
            return `
            <div class="p2p-card-premium fade-in">
                <div class="p2p-badge ${type === 'SELL' ? 'badge-sell' : 'badge-buy'}">${type}</div>
                
                <div class="p2p-merchant-info">
                    <div class="merchant-avatar">${l.username ? l.username.charAt(0).toUpperCase() : (l.sellerId ? 'M' : '?')}</div>
                    <div class="merchant-meta">
                        <div class="name">${l.username || 'Merchant #' + l.sellerId} <i data-lucide="check-circle-2" style="width:14px; color:var(--up-color);"></i></div>
                        <div class="stats">120 Trades | 98.5% Completion</div>
                    </div>
                </div>

                <div class="p2p-price-row">
                    <div class="price-main">${(l.fixedRate || 0).toLocaleString()} <span>VND</span></div>
                    <div class="limit-info">
                        Available: ${l.remainingAmount} ${l.fromCurrency}<br>
                        Limit: ${(l.minLimit || 0).toLocaleString()} - ${(l.totalAmount || 0).toLocaleString()}
                    </div>
                </div>

                <div class="p2p-action-row">
                    <div class="p2p-methods">
                        <div class="method-tag tag-bank" title="Bank Transfer"></div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        ${isMyAd ? `
                            <button onclick="window.p2p.updatePrice(${l.id}, ${l.fixedRate})" 
                                    style="background:var(--bg-surface-hover); color:var(--primary); border:1px solid var(--primary); padding:8px 16px; border-radius:10px; font-weight:700; font-size:0.8rem; cursor:pointer; position:relative !important; z-index:99999 !important; pointer-events:auto !important;">Edit</button>
                            <button onclick="window.p2p.cancelListing(${l.id})" 
                                    style="background:var(--bg-surface-hover); color:var(--down-color); border:1px solid var(--down-color); padding:8px 16px; border-radius:10px; font-weight:700; font-size:0.8rem; cursor:pointer; position:relative !important; z-index:99999 !important; pointer-events:auto !important;">Cancel</button>
                        ` : `
                            <button onclick="window.initiateP2PTrade(${l.id})" 
                                    class="p2p-trade-btn ${type === 'SELL' ? '' : 'sell'}">
                                ${type === 'SELL' ? 'Buy' : 'Sell'} ${l.fromCurrency}
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `}).join('');

        if (window.lucide) lucide.createIcons();
    }

    async initiateTrade(listingId) {
        if (!auth.isAuthenticated()) return showToast('Error', 'Please login first', 'danger');
        
        const listing = this.listings.find(l => l.id === listingId);
        if (!listing) return;

        if (listing.sellerId === auth.currentUser.id) {
            return showToast('Warning', 'You cannot trade your own ad', 'warning');
        }

        const btn = document.getElementById(`trade-btn-${listingId}`);
        if (btn) {
            btn.disabled = true;
            btn.innerText = 'Processing...';
        }

        // For simplicity, we trade 0.01 of the asset or min limit
        const amount = listing.minLimit / listing.fixedRate;

        try {
            const order = await apiFetch('/p2p/escrow', {
                method: 'POST',
                body: JSON.stringify({
                    listingId: listingId,
                    buyerId: auth.currentUser.id,
                    amount: amount,
                    idempotencyKey: `p2p-${auth.currentUser.id}-${Date.now()}`
                })
            });
            
            this.currentOrder = order;
            this.openTradingRoom(order);
        } catch (error) {
            showToast('Trade Failed', error.message, 'danger');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = `Trade ${listing.fromCurrency}`;
            }
        }
    }

    openTradingRoom(order) {
        const overlay = document.getElementById('p2p-trading-overlay');
        if (!overlay) return;
        
        overlay.style.display = 'flex';
        document.getElementById('p2p-order-id').innerText = `Order #${order.id}`;
        document.getElementById('p2p-order-status').innerText = order.status || 'PENDING';
        document.getElementById('p2p-order-price').innerText = `${(order.totalPrice || 0).toLocaleString()} VND`;
        document.getElementById('p2p-order-amount').innerText = `${order.amount || 0} ${order.fromCurrency || ''}`;
        
        this.updateActionButtons(order);
        this.connectChat(order.id);
        this.fetchChatHistory(order.id);
    }

    updateActionButtons(order) {
        const container = document.getElementById('p2p-order-actions');
        if (!container) return;

        const isBuyer = auth.currentUser.id === order.buyerId;
        const isSeller = auth.currentUser.id === order.sellerId;

        let buttons = '';
        if (order.status === 'PENDING' && isBuyer) {
            buttons = `<button onclick="window.p2pMarkPaid(${order.id})" class="btn-primary" style="flex:2;">I have paid</button>
                       <button onclick="window.p2pCancel(${order.id})" style="flex:1; background:var(--bg-main); color:var(--down-color); border:1px solid var(--border-color); border-radius:8px; cursor:pointer;">Cancel</button>`;
        } else if (order.status === 'PAID' && isSeller) {
            buttons = `<button onclick="window.p2pRelease(${order.id})" class="btn-primary" style="flex:2;">Release Assets</button>
                       <button onclick="window.p2pDispute(${order.id})" style="flex:1; background:var(--bg-main); color:var(--down-color); border:1px solid var(--border-color); border-radius:8px; cursor:pointer;">Dispute</button>`;
        } else if (order.status === 'PAID' && isBuyer) {
            buttons = `<p style="font-size:0.85rem; color:var(--text-secondary);">Waiting for seller to release assets...</p>`;
        } else if (order.status === 'RELEASED') {
            buttons = `<p style="color:var(--up-color); font-weight:700;">TRADE COMPLETED ✓</p>
                       <button onclick="window.openReviewModal(${order.id})" style="margin-left:10px; background:transparent; border:1px solid var(--primary); color:var(--primary); padding:4px 12px; border-radius:6px; cursor:pointer;">Rate User</button>`;
        }

        container.innerHTML = buttons;
    }

    // ===================== CHAT & WEBSOCKET =====================
    connectChat(orderId) {
        if (this.stompClient) {
            this.stompClient.disconnect();
        }

        const socket = new SockJS('http://localhost:8080/p2p-chat');
        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = null; // Disable logging

        this.stompClient.connect({}, () => {
            this.chatSubscription = this.stompClient.subscribe(`/topic/messages/${orderId}`, (msg) => {
                const message = JSON.parse(msg.body);
                this.appendMessage(message);
            });
        });
    }

    async fetchChatHistory(orderId) {
        try {
            const messages = await apiFetch(`/p2p/escrow/${orderId}/messages`);
            const container = document.getElementById('p2p-chat-container');
            if (container) {
                container.innerHTML = '';
                messages.forEach(m => this.appendMessage(m));
            }
        } catch (e) {
            console.warn("History fetch error:", e);
        }
    }

    sendMessage() {
        const input = document.getElementById('p2p-chat-input');
        if (!input || !input.value.trim() || !this.currentOrder) return;

        const message = {
            senderId: auth.currentUser.id,
            content: input.value.trim()
        };

        this.stompClient.send(`/app/chat/${this.currentOrder.id}`, {}, JSON.stringify(message));
        input.value = '';
    }

    appendMessage(msg) {
        const container = document.getElementById('p2p-chat-container');
        if (!container) return;

        const isMe = msg.senderId === auth.currentUser.id;
        const msgHtml = `
            <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; 
                        background: ${isMe ? 'var(--primary)' : 'var(--bg-main)'}; 
                        color: ${isMe ? 'black' : 'white'}; 
                        padding: 8px 12px; border-radius: 12px; max-width: 80%; font-size: 0.85rem;">
                ${msg.content}
            </div>
        `;
        container.insertAdjacentHTML('beforeend', msgHtml);
        container.scrollTop = container.scrollHeight;
    }

    // ===================== ORDER ACTIONS =====================
    async markAsPaid(orderId) {
        try {
            const order = await apiFetch(`/p2p/escrow/${orderId}/pay`, { method: 'POST' });
            this.currentOrder = order;
            this.openTradingRoom(order);
            showToast('Success', 'Payment marked. Waiting for seller.');
        } catch (e) {
            showToast('Error', e.message, 'danger');
        }
    }

    async releaseAssets(orderId) {
        try {
            const order = await apiFetch(`/p2p/escrow/${orderId}/release`, { method: 'POST' });
            this.currentOrder = order;
            this.openTradingRoom(order);
            showToast('Success', 'Assets released to buyer!');
            // Refresh wallet balance
            if (window.wallet) window.wallet.fetchBalances();
        } catch (e) {
            showToast('Error', e.message, 'danger');
        }
    }

    async createListing(data) {
        console.log("P2PManager: Creating listing...", data);
        if (!auth.isAuthenticated()) {
            console.warn("P2PManager: Not authenticated!");
            return;
        }
        try {
            const result = await apiFetch('/p2p/listings', {
                method: 'POST',
                body: JSON.stringify({ ...data, sellerId: auth.currentUser.id, rateType: 'FIXED' })
            });
            console.log("P2PManager: Listing created success:", result);
            showToast('Success', 'Ad posted successfully!');
            this.fetchListings();
        } catch (error) {
            console.error("P2PManager: Create listing error:", error);
            showToast('Failed', error.message, 'danger');
        }
    }

    async cancelListing(id) {
        const modal = document.getElementById('p2p-cancel-modal');
        const confirmBtn = document.getElementById('p2p-confirm-cancel-btn');
        if (!modal || !confirmBtn) return;
        
        modal.style.display = 'flex';
        
        confirmBtn.onclick = async () => {
            modal.style.display = 'none';
            try {
                await apiFetch(`/p2p/listings/${id}?sellerId=${auth.currentUser.id}`, { method: 'DELETE' });
                showToast('Success', 'Ad cancelled');
                this.fetchListings();
            } catch (e) {
                showToast('Error', e.message, 'danger');
            }
        };
    }

    async updatePrice(id, currentPrice) {
        const modal = document.getElementById('p2p-edit-modal');
        const input = document.getElementById('p2p-edit-price-input');
        const confirmBtn = document.getElementById('p2p-confirm-edit-btn');
        if (!modal || !input || !confirmBtn) return;

        input.value = currentPrice;
        modal.style.display = 'flex';
        input.focus();

        confirmBtn.onclick = async () => {
            const newPrice = input.value;
            if (!newPrice || isNaN(newPrice)) return;
            
            modal.style.display = 'none';
            try {
                await apiFetch(`/p2p/listings/${id}/price?sellerId=${auth.currentUser.id}&price=${newPrice}`, { method: 'PUT' });
                showToast('Success', 'Price updated');
                this.fetchListings();
            } catch (e) {
                showToast('Error', e.message, 'danger');
            }
        };
    }
}

export const p2p = new P2PManager();
