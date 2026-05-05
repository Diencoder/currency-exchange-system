import { auth } from './modules/auth.js';
import { wallet } from './modules/wallet.js';
import { market } from './modules/market.js';
import { p2p } from './modules/p2p.js';
import { chat } from './modules/chat.js';
import { notification } from './modules/notification.js';
import { calculateSwap, executeSwap } from './modules/swap.js';
import { switchView, showToast, copyToClipboard, updateHeader, updateProfile } from './modules/ui.js';
import { renderLayout } from './views/layout.js';
import { renderAuthView } from './views/authview.js';

// Global Expose
window.ui = { switchView, showToast, copyToClipboard, updateHeader, updateProfile };
window.auth = auth;
window.p2p = p2p;
window.market = market;
window.swap = { openModal: () => { /* open swap modal logic */ }, calculateSwap, executeSwap };

console.log('Main.js loading...');

const initApp = async () => {
    console.log('initApp starting...');
    const app = document.getElementById('app');
    if (app) app.innerHTML = '<div style="color:white; padding:20px;">Loading Antigravity...</div>';
    
    if (auth.isAuthenticated()) {
        console.log('User is authenticated');
        app.innerHTML = renderLayout();
        
        // Initial UI Polish
        updateHeader();
        
        // Load initial data
        try {
            await Promise.all([
                market.fetchRates(),
                wallet.fetchBalances(),
                wallet.fetchTransactions()
            ]);
        } catch (e) {
            console.error('Data load error:', e);
        }

        notification.connect();
        switchView('home');

        if (window.lucide) window.lucide.createIcons();
    } else {
        console.log('User is NOT authenticated');
        app.innerHTML = renderAuthView();
        if (window.lucide) window.lucide.createIcons();
    }
};

// Handle Authentication State Changes (Custom Event or simple check)
window.addEventListener('authChange', () => {
    console.log('Auth state changed');
    initApp();
});

// Start the app
console.log('Triggering initApp');
initApp();
