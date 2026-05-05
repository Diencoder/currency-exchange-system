/**
 * Wallet Module - Handles asset management and balances
 */
import { apiFetch } from './api.js';
import { auth } from './auth.js';
import { market } from './market.js';

export class WalletManager {
    constructor() {
        this.balances = [];
        this.transactions = [];
    }

    /**
     * Fetches all balances for the current user and refreshes the UI.
     */
    async fetchBalances() {
        if (!auth.isAuthenticated()) return;
        const user = auth.currentUser || JSON.parse(localStorage.getItem('user_data'));
        
        if (!user || !user.id) {
            console.error("Cannot fetch balances: User ID missing", user);
            return;
        }

        try {
            console.log(`Fetching balances for user ID: ${user.id}...`);
            const data = await apiFetch(`/users/wallets/user/${user.id}`);
            console.log("Balances received (stringified):", JSON.stringify(data));
            this.balances = data || [];
            
            // Force a small delay to ensure DOM is ready
            setTimeout(() => {
                this.refreshUI();
                console.log("UI Refresh triggered after data load");
            }, 100);
        } catch (error) {
            console.error("Fetch balances error:", error);
        }
    }

    /**
     * Fetches transaction history for the current user.
     */
    async fetchTransactions() {
        if (!auth.isAuthenticated()) return;
        try {
            const data = await apiFetch(`/transactions/user/${auth.currentUser.id}`);
            this.transactions = data || [];
            this.renderTransactions();
        } catch (error) {
            console.warn("Fetch transactions error:", error.message);
        }
    }

    /**
     * Refreshes all UI components that depend on wallet data.
     */
    refreshUI() {
        this.updateTotalBalanceDisplay();
        this.renderAssets();
        if (window.market && typeof window.market.renderRates === 'function') {
            window.market.renderRates();
        }
        // Update swap calculation if modal is visible
        if (window.calculateSwap) window.calculateSwap();
    }

    /**
     * Calculates and displays the total portfolio balance in USD.
     */
    updateTotalBalanceDisplay() {
        const rates = window.market ? (window.market.currentRates || {}) : {};
        
        // Ensure we handle BigDecimals (strings) and rates properly
        const totalUSD = this.balances.reduce((acc, b) => {
            const balance = parseFloat(b.balance) || 0;
            const rate = parseFloat(rates[b.currencyCode]) || (b.currencyCode === 'USD' ? 1 : 0);
            
            // If rate is 0 and it's not USD, we can't value it properly, so skip
            if (rate === 0 && b.currencyCode !== 'USD') return acc;
            
            // Value in USD = Amount * Rate (where Rate is USD price per 1 unit)
            return acc + (balance * rate);
        }, 0);

        const el = document.getElementById('total-balance');
        if (el) {
            el.textContent = `$${totalUSD.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            })}`;
        }
    }

    /**
     * Returns the balance for a specific currency.
     * @param {string} currencyCode 
     * @returns {number}
     */
    getBalance(currencyCode) {
        const wallet = this.balances.find(b => b.currencyCode === currencyCode);
        return wallet ? parseFloat(wallet.balance) : 0;
    }

    /**
     * Renders the transaction history list into the DOM.
     */
    renderAssets() {
        const container = document.getElementById('asset-list');
        if (!container) return;

        const rates = window.market ? (window.market.currentRates || {}) : {};
        
        if (this.balances.length === 0) {
            container.innerHTML = `<p style="color:var(--text-secondary); padding:20px; text-align:center;">No assets found. Start by buying some!</p>`;
            return;
        }

        container.innerHTML = this.balances.map(b => {
            const balance = parseFloat(b.balance) || 0;
            const rate = parseFloat(rates[b.currencyCode]) || (b.currencyCode === 'USD' ? 1 : 0);
            const valueUSD = balance * rate;
            
            return `
                <div class="asset-row fade-in">
                    <div class="asset-info">
                        <div class="asset-icon" style="background: rgba(252, 213, 53, 0.1); color: var(--primary);">
                            <i data-lucide="circle-dollar-sign"></i>
                        </div>
                        <div class="asset-details">
                            <h4 style="font-weight: 700;">${b.currencyCode}</h4>
                            <p style="color: var(--text-secondary); font-size: 0.75rem;">$${rate.toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="asset-value" style="text-align: right;">
                        <div style="font-weight: 800;">${balance.toLocaleString()} ${b.currencyCode}</div>
                        <div style="color: var(--text-secondary); font-size: 0.75rem;">≈ $${valueUSD.toLocaleString()}</div>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
    }

    renderTransactions() {
        const container = document.getElementById('tx-history-list');
        if (!container) return;
        
        if (this.transactions.length === 0) {
            container.innerHTML = `<p style="color:var(--text-secondary); font-size:0.8rem; text-align:center; padding:1rem;">No transactions yet.</p>`;
            return;
        }

        const sorted = [...this.transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = sorted.map(tx => {
            const isSwap = tx.type === 'EXCHANGE' || tx.type === 'SWAP';
            const date = new Date(tx.createdAt).toLocaleString();
            const statusColor = tx.status === 'COMPLETED' ? 'var(--up-color)' : 'var(--text-secondary)';
            
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 0; border-bottom:1px solid var(--border-color); animation: fadeIn 0.3s ease;">
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:8px; height:8px; border-radius:50%; background:${statusColor};"></div>
                            <p style="margin:0; font-size:0.85rem; font-weight:700;">${tx.type}</p>
                        </div>
                        <p style="margin:2px 0 0; font-size:0.7rem; color:var(--text-secondary);">${date}</p>
                    </div>
                    <div style="text-align:right;">
                        <p style="margin:0; font-size:0.85rem; font-weight:800; color:var(--up-color);">
                            ${isSwap ? `+${tx.toAmount} ${tx.toCurrency}` : `${tx.amountIn || 0} ${tx.fromCurrency}`}
                        </p>
                        <p style="margin:2px 0 0; font-size:0.7rem; color:var(--text-secondary);">${tx.status}</p>
                    </div>
                </div>
            `;
        }).join('');
    }
}

export const wallet = new WalletManager();
