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
            if (window.lucide) window.lucide.createIcons();
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
                        <div class="stats">
                            <span style="color:var(--up-color); font-weight:700;">100+ Trades</span>
                            <span style="color:var(--text-secondary); margin:0 4px;">|</span>
                            <span>99% Completion</span>
                        </div>
                    </div>
                </div>

                <div class="p2p-price-row">
                    <div class="price-main">${(l.fixedRate || 0).toLocaleString()} <span style="font-size:0.8rem; opacity:0.6;">VND</span></div>
                    <div class="limit-info">
                        <div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-secondary); margin-bottom:2px;">Available</div>
                        <div style="color:white; font-weight:700;">${l.remainingAmount} ${l.fromCurrency}</div>
                    </div>
                </div>

                <div style="margin-bottom:1.5rem;">
                    <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px;">Limit Range</div>
                    <div style="font-weight:600; font-size:0.85rem; color:var(--text-primary);">
                        ₫ ${(l.minLimit || 0).toLocaleString()} - ₫ ${(l.totalAmount * l.fixedRate).toLocaleString()}
                    </div>
                </div>

                <div class="p2p-action-row">
                    <div class="p2p-methods">
                        <div style="display:flex; align-items:center; gap:6px; background:rgba(240,185,11,0.1); padding:4px 10px; border-radius:8px; border:1px solid rgba(240,185,11,0.2);">
                            <div class="method-tag tag-bank"></div>
                            <span style="font-size:0.7rem; color:var(--primary); font-weight:700;">BANK TRANSFER</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        ${isMyAd ? `
                            <button onclick="window.p2p.updatePrice(${l.id}, ${l.fixedRate})" 
                                    style="background:rgba(255,255,255,0.05); color:var(--primary); border:1px solid rgba(240,185,11,0.3); padding:10px 20px; border-radius:12px; font-weight:700; font-size:0.85rem; cursor:pointer;">Edit</button>
                            <button onclick="window.p2p.cancelListing(${l.id})" 
                                    style="background:rgba(246,70,93,0.05); color:var(--down-color); border:1px solid rgba(246,70,93,0.2); padding:10px 20px; border-radius:12px; font-weight:700; font-size:0.85rem; cursor:pointer;">Cancel</button>
                        ` : `
                            <button onclick="window.p2p.openInitModal(${l.id})" 
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

    openInitModal(listingId) {
        const listing = this.listings.find(l => l.id === listingId);
        if (!listing) return;
        
        if (auth.currentUser && listing.sellerId === auth.currentUser.id) {
            return showToast('Warning', 'You cannot trade your own ad', 'warning');
        }

        this.selectedListing = listing;
        const modal = document.getElementById('p2p-init-modal');
        if (!modal) return;

        // Fill modal details
        document.getElementById('init-modal-title').innerText = `${listing.type === 'SELL' ? 'Buy' : 'Sell'} ${listing.fromCurrency}`;
        document.getElementById('init-modal-price').innerText = `${(listing.fixedRate || 0).toLocaleString()} VND`;
        document.getElementById('init-modal-available').innerText = `${listing.remainingAmount} ${listing.fromCurrency}`;
        document.getElementById('init-modal-limit').innerText = `${(listing.minLimit || 0).toLocaleString()} - ${(listing.totalAmount * listing.fixedRate).toLocaleString()} VND`;
        document.getElementById('init-modal-asset-label').innerText = listing.fromCurrency;
        
        // Reset inputs
        const fiatInput = document.getElementById('p2p-init-fiat-input');
        const cryptoInput = document.getElementById('p2p-init-crypto-input');
        fiatInput.value = '';
        cryptoInput.value = '';

        modal.style.display = 'flex';
        if (window.lucide) lucide.createIcons();

        // Setup confirm button
        document.getElementById('p2p-confirm-trade-btn').onclick = () => this.confirmTrade();
    }

    syncInitAmount(source) {
        if (!this.selectedListing) return;
        const rate = this.selectedListing.fixedRate;
        const fiatInput = document.getElementById('p2p-init-fiat-input');
        const cryptoInput = document.getElementById('p2p-init-crypto-input');

        if (source === 'fiat') {
            const fiat = parseFloat(fiatInput.value) || 0;
            cryptoInput.value = (fiat / rate).toFixed(6);
        } else {
            const crypto = parseFloat(cryptoInput.value) || 0;
            fiatInput.value = Math.round(crypto * rate);
        }
    }

    async confirmTrade() {
        if (!auth.isAuthenticated()) return showToast('Error', 'Please login first', 'danger');
        if (!this.selectedListing) return;

        const cryptoAmount = parseFloat(document.getElementById('p2p-init-crypto-input').value);
        const fiatAmount = parseFloat(document.getElementById('p2p-init-fiat-input').value);

        if (!cryptoAmount || cryptoAmount <= 0) {
            return showToast('Error', 'Please enter a valid amount', 'warning');
        }

        if (fiatAmount < this.selectedListing.minLimit) {
            return showToast('Error', `Minimum order is ${this.selectedListing.minLimit.toLocaleString()} VND`, 'warning');
        }

        const btn = document.getElementById('p2p-confirm-trade-btn');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = 'Creating Order...';

        try {
            const order = await apiFetch('/p2p/escrow', {
                method: 'POST',
                body: JSON.stringify({
                    listingId: this.selectedListing.id,
                    buyerId: auth.currentUser.id,
                    amount: cryptoAmount,
                    idempotencyKey: `p2p-${auth.currentUser.id}-${Date.now()}`
                })
            });
            
            this.currentOrder = order;
            document.getElementById('p2p-init-modal').style.display = 'none';
            this.openTradingRoom(order);
            showToast('Success', 'Order created successfully!', 'success');
        } catch (error) {
            showToast('Trade Failed', error.message, 'danger');
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
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
            buttons = `<button onclick="window.p2p.markAsPaid(${order.id})" class="btn-primary" style="flex:2;">I have paid</button>
                       <button onclick="window.p2p.cancelOrder(${order.id})" style="flex:1; background:var(--bg-main); color:var(--down-color); border:1px solid var(--border-color); border-radius:8px; cursor:pointer;">Cancel</button>`;
        } else if (order.status === 'PAID' && isSeller) {
            buttons = `<button onclick="window.p2p.releaseAssets(${order.id})" class="btn-primary" style="flex:2;">Release Assets</button>
                       <button onclick="window.p2p.disputeOrder(${order.id})" style="flex:1; background:var(--bg-main); color:var(--down-color); border:1px solid var(--border-color); border-radius:8px; cursor:pointer;">Dispute</button>`;
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

        const isMe = auth.currentUser && msg.senderId === auth.currentUser.id;
        const msgHtml = `
            <div class="chat-bubble ${isMe ? 'me' : 'them'} fade-in">
                ${msg.content}
                <div style="font-size:0.6rem; opacity:0.6; margin-top:4px; text-align:right;">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
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
