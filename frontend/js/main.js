/**
 * Main Application Entry Point
 */
import { auth } from './modules/auth.js';
import { wallet } from './modules/wallet.js';
import { market } from './modules/market.js';
import { p2p } from './modules/p2p.js';
import { chat } from './modules/chat.js';
import { calculateSwap, executeSwap } from './modules/swap.js';
import { switchView, showToast } from './modules/ui.js';
import { apiFetch } from './modules/api.js';

// ===================== GLOBAL EXPOSE (Singleton Pattern) =====================
window.wallet = wallet;
window.market = market;
window.calculateSwap = calculateSwap;
window.executeSwap = executeSwap;
window.showToast = showToast;

window.switchView = (viewId) => {
    switchView(viewId);
    if (viewId === 'market') market.initChart();
    if (viewId === 'p2p') p2p.fetchListings();
    if (viewId === 'chat') chat.connect();
    if (viewId === 'settings') loadQuests();
};

window.performLogin = async () => {
    const user = document.getElementById('login-username')?.value;
    const pass = document.getElementById('login-password')?.value;
    if (!user || !pass) return showToast('Error', 'Please enter all fields', 'danger');
    const btnText = document.getElementById('login-btn-text');
    if (btnText) btnText.innerText = 'Logging in...';
    try {
        await auth.login(user, pass);
        showToast('Success', 'Welcome back!');
        initApp();
    } catch (e) {
        showToast('Login Failed', e.message, 'danger');
    } finally {
        if (btnText) btnText.innerText = 'Login';
    }
};

window.performSignup = async () => {
    const user = document.getElementById('signup-username')?.value;
    const email = document.getElementById('signup-email')?.value;
    const pass = document.getElementById('signup-password')?.value;
    if (!user || !email || !pass) return showToast('Error', 'Please enter all fields', 'danger');
    const btnText = document.getElementById('signup-btn-text');
    if (btnText) btnText.innerText = 'Creating...';
    try {
        await auth.register(user, email, pass);
        showToast('Success', 'Account created! Please login.');
        window.switchAuthTab('login');
    } catch (e) {
        showToast('Signup Failed', e.message, 'danger');
    } finally {
        if (btnText) btnText.innerText = 'Create Account';
    }
};

window.switchAuthTab = (tab) => {
    const isLogin = tab === 'login';
    const formLogin = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');
    if (formLogin) formLogin.style.display = isLogin ? 'block' : 'none';
    if (formSignup) formSignup.style.display = isLogin ? 'none' : 'block';
    
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    if (isLogin) {
        if (tabLogin) { tabLogin.style.background = 'var(--primary)'; tabLogin.style.color = '#000'; }
        if (tabSignup) { tabSignup.style.background = 'transparent'; tabSignup.style.color = 'var(--text-secondary)'; }
    } else {
        if (tabSignup) { tabSignup.style.background = 'var(--primary)'; tabSignup.style.color = '#000'; }
        if (tabLogin) { tabLogin.style.background = 'transparent'; tabLogin.style.color = 'var(--text-secondary)'; }
    }
};

window.performLogout = () => {
    auth.logout();
    localStorage.clear();
    location.reload();
};

window.openSwap = () => {
    const overlay = document.getElementById('swap-overlay');
    if (overlay) {
        overlay.style.display = 'block';
        calculateSwap();
    }
};

window.openSettings = () => window.switchView('settings');

// ===================== P2P FUNCTIONS =====================
window.switchP2PTab = (type) => {
    p2p.fetchListings(type);
};

window.openCreateListing = () => {
    if (!auth.isAuthenticated()) return showToast('Error', 'Please login first', 'danger');
    const modal = document.getElementById('p2p-modal');
    if (modal) modal.style.display = 'flex';
};

window.submitP2PAd = async () => {
    const asset = document.getElementById('ad-asset')?.value;
    const amount = parseFloat(document.getElementById('ad-amount')?.value);
    const price = parseFloat(document.getElementById('ad-price')?.value);
    if (!asset || !amount || !price) return showToast('Error', 'Fill in all fields', 'danger');
    await p2p.createListing({
        type: 'SELL',
        fromCurrency: asset,
        toCurrency: 'VND',
        totalAmount: amount,
        fixedRate: price,
        minLimit: Math.floor(amount * 0.1),
    });
    const modal = document.getElementById('p2p-modal');
    if (modal) modal.style.display = 'none';
};

// ===================== QUESTS =====================
const loadQuests = async () => {
    if (!auth.isAuthenticated()) return;
    try {
        const quests = await apiFetch(`/users/quests/${auth.currentUser.id}`);
        const container = document.getElementById('quest-list');
        if (!container || !quests) return;
        container.innerHTML = quests.map(q => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem; background:var(--bg-main); border-radius:10px;">
                <div>
                    <p style="margin:0; font-size:0.85rem; font-weight:600;">${q.name || q.title}</p>
                    <p style="margin:2px 0 0; font-size:0.75rem; color:var(--text-secondary);">${q.description || ''}</p>
                </div>
                <div style="text-align:right;">
                    <p style="margin:0; font-size:0.8rem; color:var(--primary); font-weight:700;">+${q.rewardAmount || 0} USD</p>
                    <span style="font-size:0.7rem; color:${q.completed ? 'var(--up-color)' : 'var(--text-secondary)'};">${q.completed ? '✓ Done' : 'In Progress'}</span>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.warn('Quests load error:', e.message);
    }
};

// ===================== INIT =====================
const initApp = async () => {
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app');

    if (auth.isAuthenticated()) {
        if (authScreen) authScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';

        const user = auth.currentUser;
        if (user && user.username) {
            const avatarChar = user.username.charAt(0).toUpperCase();
            ['user-avatar', 'settings-avatar'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = avatarChar;
            });
            const settingsUsername = document.getElementById('settings-username');
            if (settingsUsername) settingsUsername.innerText = user.username;
        }

        // Parallel load to avoid blocking
        Promise.all([
            market.fetchRates(),
            wallet.fetchBalances(),
            wallet.fetchTransactions()
        ]).catch(e => console.error('Initial load error:', e));

        // Periodic refresh
        setInterval(() => market.fetchRates().catch(() => {}), 10000);

        switchView('home');
    } else {
        if (authScreen) authScreen.style.display = 'block';
        if (mainApp) mainApp.style.display = 'none';
    }
};

// Start the app
try {
    initApp();
} catch (e) {
    console.error('App startup error:', e);
}
