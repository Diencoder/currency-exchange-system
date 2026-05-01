/**
 * P2P Module - Handles Peer-to-Peer trading logic
 */
import { apiFetch } from './api.js';
import { auth } from './auth.js';
import { showToast } from './ui.js';

export class P2PManager {
    constructor() {
        this.listings = [];
    }

    async fetchListings(type = 'BUY') {
        try {
            const data = await apiFetch(`/p2p/listings?type=${type}`);
            this.listings = data;
            this.renderListings();
        } catch (error) {
            console.error("Fetch P2P listings error:", error);
        }
    }

    renderListings() {
        const container = document.getElementById('p2p-ads-container');
        if (!container) return;

        if (this.listings.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:2rem;">No active ads found.</p>';
            return;
        }

        container.innerHTML = this.listings.map(l => `
            <div class="p2p-card glass-card" style="margin-bottom:12px; padding:1rem; border:1px solid var(--border-color); border-radius:12px;">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div style="display:flex; gap:12px; align-items:center;">
                        <div style="width:36px; height:36px; background:var(--primary); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#000; font-weight:700;">
                            ${l.username ? l.username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <p style="margin:0; font-weight:700; font-size:0.9rem;">${l.username || 'Anonymous'}</p>
                            <p style="margin:2px 0 0; font-size:0.75rem; color:var(--text-secondary);">100% | 50+ trades</p>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <p style="margin:0; font-size:1.1rem; font-weight:800; color:var(--primary);">${l.fixedRate ? l.fixedRate.toLocaleString() : 'Market'} VND</p>
                        <p style="margin:4px 0 0; font-size:0.75rem; color:var(--text-secondary);">Limit: ${l.minLimit.toLocaleString()} - ${l.totalAmount.toLocaleString()}</p>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
                    <div style="font-size:0.8rem;">
                        <span style="color:var(--text-secondary);">Asset:</span> <span style="font-weight:600;">${l.fromCurrency}</span>
                    </div>
                    <button onclick="window.initiateOrder(${l.id})" style="background:var(--primary); color:#000; border:none; padding:8px 20px; border-radius:8px; font-weight:700; cursor:pointer;">
                        Trade ${l.fromCurrency}
                    </button>
                </div>
            </div>
        `).join('');
    }

    async createListing(data) {
        if (!auth.isAuthenticated()) return;
        try {
            await apiFetch('/p2p/listings', {
                method: 'POST',
                body: JSON.stringify({ ...data, userId: auth.currentUser.id })
            });
            showToast('Success', 'Ad posted successfully!');
            this.fetchListings();
        } catch (error) {
            showToast('Failed', error.message, 'danger');
        }
    }
}

export const p2p = new P2PManager();
