/**
 * Currency Exchange System (Binance Pro)
 * Frontend Logic
 */

// API Configuration - All routed through Gateway
const API_BASE = {
    USER: '/api/users',
    EXCHANGE: '/api/exchange',
    TRANSACTION: '/api/transactions'
};

// Global State
const state = {
    user: null,
    jwt: localStorage.getItem('jwt'),
    rates: [],
    selectedPair: 'USD/VND',
    chart: null,
    series: null,
    activeView: 'auth'
};

// ===================== AUTH LOGIC =====================

async function performLogin() {
    const userEl = document.getElementById('login-username');
    const passEl = document.getElementById('login-password');
    const btnText = document.getElementById('login-btn-text');
    
    if(!userEl.value || !passEl.value) return showToast('Please enter credentials', 'error');

    btnText.innerText = 'Logging in...';
    try {
        const response = await fetch(`${API_BASE.USER}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userEl.value, password: passEl.value })
        });

        if (response.ok) {
            const data = await response.json();
            state.jwt = data.accessToken;
            localStorage.setItem('jwt', state.jwt);
            state.user = data;
            showToast('Welcome back, ' + data.username);
            initializeMainApp();
        } else {
            showToast('Invalid username or password', 'error');
        }
    } catch (err) {
        showToast('Server connection failed', 'error');
    } finally {
        btnText.innerText = 'Login';
    }
}

async function performSignup() {
    const userEl = document.getElementById('signup-username');
    const emailEl = document.getElementById('signup-email');
    const passEl = document.getElementById('signup-password');
    const btnText = document.getElementById('signup-btn-text');

    if(!userEl.value || !emailEl.value || !passEl.value) return showToast('Fill all fields', 'error');

    btnText.innerText = 'Creating Account...';
    try {
        const response = await fetch(`${API_BASE.USER}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userEl.value, email: emailEl.value, password: passEl.value })
        });

        if (response.ok) {
            showToast('Registered! Please login.');
            switchAuthTab('login');
        } else {
            const msg = await response.text();
            showToast(msg || 'Registration failed', 'error');
        }
    } catch (err) {
        showToast('Server error', 'error');
    } finally {
        btnText.innerText = 'Create Account';
    }
}

function performLogout() {
    state.jwt = null;
    state.user = null;
    localStorage.removeItem('jwt');
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'block';
}

function switchAuthTab(tab) {
    const loginTab = document.getElementById('tab-login');
    const signupTab = document.getElementById('tab-signup');
    const loginForm = document.getElementById('form-login');
    const signupForm = document.getElementById('form-signup');

    if (tab === 'login') {
        loginTab.style.background = 'var(--primary)';
        loginTab.style.color = '#000';
        signupTab.style.background = 'transparent';
        signupTab.style.color = 'var(--text-secondary)';
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        signupTab.style.background = 'var(--primary)';
        signupTab.style.color = '#000';
        loginTab.style.background = 'transparent';
        loginTab.style.color = 'var(--text-secondary)';
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
    }
}

// ===================== DATA FETCHING =====================

async function loadRates() {
    try {
        const res = await fetch(`${API_BASE.EXCHANGE}/rates`);
        if (res.ok) {
            state.rates = await res.json();
            renderAssetList();
        }
    } catch (e) { console.error('Rate fetch failed'); }
}

async function loadChartData() {
    if (!state.chart) initChart();
    
    try {
        const res = await fetch(`${API_BASE.EXCHANGE}/ohlc?pair=${state.selectedPair}`);
        if(res.ok) {
            const data = await res.json();
            // Transform for Lightweight Charts
            const chartData = data.map(d => ({
                time: Math.floor(new Date(d.timestamp).getTime() / 1000),
                open: parseFloat(d.open),
                high: parseFloat(d.high),
                low: parseFloat(d.low),
                close: parseFloat(d.close)
            })).sort((a,b) => a.time - b.time);
            
            state.series.setData(chartData);
            
            if (chartData.length > 0) {
                const last = chartData[chartData.length-1];
                document.getElementById('market-pair-price').innerText = last.close.toLocaleString(undefined, {minimumFractionDigits:2});
            }
        }
    } catch(e) { console.error('Chart failed'); }
}

// ===================== UI RENDERING =====================

function initializeMainApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    // Set user info
    if (state.user) {
        document.getElementById('user-avatar').innerText = state.user.username[0].toUpperCase();
        document.getElementById('total-balance').innerText = `${state.user.balance.toLocaleString()} ${state.user.currencyCode}`;
        document.getElementById('settings-username').innerText = state.user.username;
        document.getElementById('settings-email').innerText = state.user.email;
        document.getElementById('settings-avatar').innerText = state.user.username[0].toUpperCase();
    }
    
    loadRates();
    startPolling();
    switchView('home');
}

function renderAssetList() {
    const list = document.getElementById('asset-list');
    list.innerHTML = '';
    
    state.rates.forEach(rate => {
        const div = document.createElement('div');
        div.className = 'asset-item fade-in';
        div.onclick = () => {
            state.selectedPair = `USD/${rate.code}`;
            document.getElementById('market-pair-title').innerText = state.selectedPair;
            switchView('market');
        };
        
        div.innerHTML = `
            <div class="asset-info">
                <div class="asset-icon">${rate.code[0]}</div>
                <div>
                    <div class="asset-name">${rate.name || rate.code}</div>
                    <div class="asset-symbol">${rate.code}</div>
                </div>
            </div>
            <div class="asset-price-box">
                <div class="asset-price">${rate.rateToBase.toLocaleString()}</div>
                <div class="asset-trend up">+0.42%</div>
            </div>
        `;
        list.appendChild(div);
    });
}

function switchView(viewId) {
    const views = ['home-view', 'market-view', 'settings-view'];
    views.forEach(id => document.getElementById(id).style.display = 'none');
    
    document.getElementById(`${viewId}-view`).style.display = 'block';
    
    // Update nav colors
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${viewId}`).classList.add('active');
    
    if (viewId === 'market') loadChartData();
}

function initChart() {
    const container = document.getElementById('market-chart');
    state.chart = LightweightCharts.createChart(container, {
        layout: { background: { color: '#0B0E11' }, textColor: '#848E9C' },
        grid: { vertLines: { color: '#2B3139' }, horzLines: { color: '#2B3139' } },
        timeScale: { borderColor: '#2B3139', timeVisible: true, secondsVisible: false }
    });
    
    state.series = state.chart.addCandlestickSeries({
        upColor: '#0ecb81', downColor: '#f6465d', borderVisible: false,
        wickUpColor: '#0ecb81', wickDownColor: '#f6465d'
    });

    window.addEventListener('resize', () => {
        state.chart.resize(container.offsetWidth, container.offsetHeight);
    });
}

// ===================== UTILS =====================

function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = type === 'error' ? 'var(--down-color)' : 'var(--primary)';
    toast.style.color = type === 'error' ? '#fff' : '#000';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.marginBottom = '10px';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    toast.innerText = msg;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function startPolling() {
    setInterval(() => {
        loadRates();
        if (state.activeView === 'market') loadChartData();
    }, 10000);
}

// ===================== EVENT BINDINGS =====================

document.getElementById('nav-home').addEventListener('click', () => switchView('home'));
document.getElementById('nav-market').addEventListener('click', () => switchView('market'));
document.getElementById('nav-settings').addEventListener('click', () => switchView('settings'));

// Swap Logic Placeholder
document.getElementById('open-swap').addEventListener('click', () => {
    document.getElementById('swap-overlay').style.display = 'block';
});
document.getElementById('close-swap').addEventListener('click', () => {
    document.getElementById('swap-overlay').style.display = 'none';
});

// Initialization
window.onload = () => {
    lucide.createIcons();
    // Check if token exists
    if (state.jwt) {
        // In real app, verify token first
        initializeMainApp();
    } else {
        document.getElementById('auth-screen').style.display = 'block';
    }
};
