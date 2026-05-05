import { renderHomeView } from '../views/homeview.js';
import { renderMarketView } from '../views/marketview.js';
import { renderP2PView } from '../views/p2pview.js';
import { renderChatView } from '../views/chatview.js';
import { renderSettingsView } from '../views/settingsview.js';

const viewRenderers = {
    'home': renderHomeView,
    'market': renderMarketView,
    'p2p': renderP2PView,
    'chat': renderChatView,
    'settings': renderSettingsView,
    'discover': () => `<iframe src="discovery.html" style="width:100%; height:calc(100vh - 120px); border:none; border-radius: 20px; box-shadow: var(--card-shadow);"></iframe>`
};

export const showToast = (title, message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'check-circle';
    if (type === 'error') icon = 'alert-circle';
    if (type === 'info') icon = 'info';

    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
    `;

    container.appendChild(toast);
    
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 400);
    }, 4500);
};

export const switchView = async (viewId) => {
    const container = document.getElementById('view-container');
    if (!container) return;

    // Inject View HTML
    const renderer = viewRenderers[viewId];
    if (renderer) {
        container.innerHTML = renderer();
    }

    // Toggle navigation active state (Bottom Nav)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.id === `nav-${viewId}`) item.classList.add('active');
    });

    // Toggle Sidebar active state
    document.querySelectorAll('.side-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.id === `side-nav-${viewId}`) item.classList.add('active');
    });

    // Trigger Data Fetching based on View
    if (viewId === 'home') {
        if (window.wallet) {
            await window.wallet.fetchBalances();
            await window.wallet.fetchTransactions();
        }
        if (window.market) {
            await window.market.fetchRates();
        }
    } else if (viewId === 'market') {
        if (window.market) {
            await window.market.fetchRates();
            window.market.initChart();
        }
    } else if (viewId === 'chat') {
        if (window.chat) window.chat.fetchMessages();
    }

    // Re-trigger icons
    if (window.lucide) window.lucide.createIcons();

    // Update User Info
    updateHeader();
    if (viewId === 'settings') {
        updateProfile();
    }
};

export const updateHeader = () => {
    const userData = localStorage.getItem('user_data');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        const nameEl = document.getElementById('header-username');
        const avatarEl = document.getElementById('header-avatar');
        
        if (nameEl) nameEl.textContent = user.username;
        if (avatarEl) avatarEl.textContent = user.username.charAt(0).toUpperCase();
    } catch (e) {
        console.error('Error updating header:', e);
    }
};

export const updateProfile = () => {
    const userData = localStorage.getItem('user_data');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        const nameEl = document.getElementById('settings-username');
        const emailEl = document.getElementById('settings-email');
        const avatarEl = document.getElementById('settings-avatar');
        
        if (nameEl) nameEl.textContent = user.username;
        if (emailEl) emailEl.textContent = user.email || 'No email provided';
        if (avatarEl) avatarEl.textContent = user.username.charAt(0).toUpperCase();
    } catch (e) {
        console.error('Error updating profile:', e);
    }
};

export const toggleSpinner = (id, show) => {
    const spinner = document.getElementById(id);
    if (spinner) spinner.style.display = show ? 'inline' : 'none';
};

export const renderRecentTransactions = (transactions) => {
    const list = document.getElementById('recent-tx-list');
    if (!list) return;

    if (!transactions || transactions.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-secondary); font-size:0.85rem; padding:1rem;">No recent transactions</p>';
        return;
    }

    list.innerHTML = transactions.map(tx => {
        const isBuy = tx.type.toLowerCase().includes('buy') || tx.type.toLowerCase() === 'deposit';
        const icon = isBuy ? 'arrow-down-left' : 'arrow-up-right';
        const colorClass = isBuy ? 'up' : 'down';
        const sign = isBuy ? '+' : '-';

        return `
            <div class="asset-row">
                <div class="asset-info">
                    <div class="asset-icon">
                        <i data-lucide="${icon}" class="${colorClass}"></i>
                    </div>
                    <div class="asset-details">
                        <h4>${tx.type} ${tx.asset}</h4>
                        <p>${new Date(tx.timestamp).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="asset-value">
                    <div class="main ${colorClass}">${sign}${tx.amount} ${tx.asset}</div>
                    <div class="sub">${tx.status}</div>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
};

export const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied', 'Text copied to clipboard', 'info');
    });
};
