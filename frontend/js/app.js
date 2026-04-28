/**
 * Binance Pro - Full Auth + JWT + 2FA + Swap Engine v7
 */

const API_BASE = "http://localhost:8080/api";

// ── Auth State ─────────────────────────────────────────────────
let currentUser = null; // { id, username, email, role, token }
let currentRates = {};
let previousRates = {};
let isFirstLoad = true;
let showMA = true;
let showVol = true;
let txHistory = [];

let userBalances = [
    { currencyCode: 'USD', balance: 500.00, name: 'US Dollar' },
    { currencyCode: 'VND', balance: 0,      name: 'Vietnamese Dong' },
    { currencyCode: 'BTC', balance: 0.0042, name: 'Bitcoin' },
    { currencyCode: 'ETH', balance: 0.085,  name: 'Ethereum' },
    { currencyCode: 'BNB', balance: 1.25,   name: 'Binance Coin' },
];

let marketChart, candleSeries, maSeries, volumeSeries;
let currentP2PTab = 'BUY'; // BUY or SELL
let p2pListings = [];
let newAdType = 'SELL';

// ══════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <p class="title">${title}</p>
            <p>${message}</p>
        </div>
        <span onclick="this.parentElement.remove()" style="cursor:pointer; font-size:1.1rem; color:var(--text-secondary);">✕</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.parentElement && toast.remove(), 4500);
}

// ══════════════════════════════════════════════════════════════
// AUTH HELPERS
// ══════════════════════════════════════════════════════════════
function getAuthHeaders() {
    const token = localStorage.getItem('jwt_token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                 : { 'Content-Type': 'application/json' };
}

function saveSession(data) {
    localStorage.setItem('jwt_token', data.token);
    localStorage.setItem('user_data', JSON.stringify({
        id: data.id, username: data.username, email: data.email, role: data.role
    }));
    currentUser = { id: data.id, username: data.username, email: data.email, role: data.role, token: data.token };
}

function loadSession() {
    const token = localStorage.getItem('jwt_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
        currentUser = { ...JSON.parse(userData), token };
        return true;
    }
    return false;
}

function clearSession() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    currentUser = null;
}

// ══════════════════════════════════════════════════════════════
// AUTH UI
// ══════════════════════════════════════════════════════════════
function switchAuthTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('form-login').style.display = isLogin ? 'block' : 'none';
    document.getElementById('form-signup').style.display = isLogin ? 'none' : 'block';
    document.getElementById('tab-login').style.cssText = isLogin
        ? 'flex:1; padding:0.6rem; border:none; border-radius:6px; font-weight:600; font-size:0.85rem; cursor:pointer; background:var(--primary); color:#000;'
        : 'flex:1; padding:0.6rem; border:none; border-radius:6px; font-weight:600; font-size:0.85rem; cursor:pointer; background:transparent; color:var(--text-secondary);';
    document.getElementById('tab-signup').style.cssText = isLogin
        ? 'flex:1; padding:0.6rem; border:none; border-radius:6px; font-weight:600; font-size:0.85rem; cursor:pointer; background:transparent; color:var(--text-secondary);'
        : 'flex:1; padding:0.6rem; border:none; border-radius:6px; font-weight:600; font-size:0.85rem; cursor:pointer; background:var(--primary); color:#000;';
}

async function performLogin() {
    const username = document.getElementById('login-username')?.value?.trim();
    const password = document.getElementById('login-password')?.value;

    if (!username || !password) {
        showToast('Missing Fields', 'Please enter username and password.', 'danger');
        return;
    }

    const btnText = document.getElementById('login-btn-text');
    if (btnText) btnText.textContent = 'Signing in...';

    try {
        const res = await fetch(`${API_BASE}/users/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            saveSession(data);
            bootApp();
            showToast('🎉 Welcome Back!', `Hello, ${data.username}!`, 'success');
        } else {
            const msg = await res.text();
            showToast('Login Failed', msg || 'Invalid credentials.', 'danger');
        }
    } catch (e) {
        // Offline demo mode: login with any credentials
        const demoUser = { id: 1, username, email: `${username}@demo.local`, role: 'ROLE_USER', token: 'DEMO_TOKEN' };
        saveSession(demoUser);
        bootApp();
        showToast('🔧 Demo Mode', `Logged in as ${username} (offline)`, 'info');
    } finally {
        if (btnText) btnText.textContent = 'Login';
    }
}

async function performSignup() {
    const username = document.getElementById('signup-username')?.value?.trim();
    const email = document.getElementById('signup-email')?.value?.trim();
    const password = document.getElementById('signup-password')?.value;

    if (!username || !email || !password) {
        showToast('Missing Fields', 'Please fill in all fields.', 'danger');
        return;
    }
    if (password.length < 6) {
        showToast('Weak Password', 'Password must be at least 6 characters.', 'danger');
        return;
    }

    const btnText = document.getElementById('signup-btn-text');
    if (btnText) btnText.textContent = 'Creating account...';

    try {
        const res = await fetch(`${API_BASE}/users/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        if (res.ok) {
            showToast('✅ Account Created!', 'You can now login.', 'success');
            switchAuthTab('login');
            document.getElementById('login-username').value = username;
        } else {
            const msg = await res.text();
            showToast('Signup Failed', msg, 'danger');
        }
    } catch (e) {
        // Offline create
        const demoUser = { id: 1, username, email, role: 'ROLE_USER', token: 'DEMO_TOKEN' };
        saveSession(demoUser);
        bootApp();
        showToast('🔧 Demo Mode', `Account created and logged in as ${username}`, 'info');
    } finally {
        if (btnText) btnText.textContent = 'Create Account';
    }
}

function performLogout() {
    clearSession();
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'block';
    // Reset app state
    isFirstLoad = true;
    if (marketChart) { marketChart.remove(); marketChart = null; candleSeries = null; maSeries = null; volumeSeries = null; }
    lucide.createIcons();
    showToast('Signed Out', 'Come back soon! 👋', 'info');
}

function bootApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';

    // Set avatar & username
    if (currentUser) {
        const initial = currentUser.username[0].toUpperCase();
        const avatar = document.getElementById('user-avatar');
        const settingsAvatar = document.getElementById('settings-avatar');
        if (avatar) avatar.textContent = initial;
        if (settingsAvatar) settingsAvatar.textContent = initial;
        const usernameEl = document.getElementById('settings-username');
        const emailEl = document.getElementById('settings-email');
        if (usernameEl) usernameEl.textContent = currentUser.username;
        if (emailEl) emailEl.textContent = currentUser.email;
    }

    setupEventListeners();
    renderSkeletons();
    fetchRates();
    setInterval(fetchRates, 10000);
    lucide.createIcons();
}

// ══════════════════════════════════════════════════════════════
// 2FA
// ══════════════════════════════════════════════════════════════
async function toggle2FA() {
    if (!currentUser) return;
    const btn = document.getElementById('toggle-2fa-btn');
    if (btn) btn.textContent = 'Processing...';

    try {
        const res = await fetch(`${API_BASE}/users/${currentUser.id}/2fa/generate`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (res.ok) {
            const data = await res.json();
            document.getElementById('twofa-qr-area').style.display = 'block';
            const qrImg = document.getElementById('qr-img');
            if (qrImg) qrImg.src = data.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.otpAuthUrl || '')}`;
            const secretEl = document.getElementById('totp-secret');
            if (secretEl) secretEl.textContent = data.secret || 'Check backend response';
            document.getElementById('twofa-status').textContent = 'Status: Setup required — Scan QR Code';
            if (btn) btn.textContent = 'Enabled';
            showToast('2FA Setup', 'Scan the QR Code with Google Authenticator!', 'success');
        } else {
            // Demo mode
            const demoSecret = 'JBSWY3DPEHPK3PXP';
            document.getElementById('twofa-qr-area').style.display = 'block';
            const qrImg = document.getElementById('qr-img');
            if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/BinancePro:${currentUser.username}%3Fsecret=${demoSecret}%26issuer=BinancePro`;
            const secretEl = document.getElementById('totp-secret');
            if (secretEl) secretEl.textContent = demoSecret;
            document.getElementById('twofa-status').textContent = 'Status: Demo QR (Backend offline)';
            if (btn) btn.textContent = 'Enabled';
        }
    } catch (e) {
        // Demo fallback
        const demoSecret = 'JBSWY3DPEHPK3PXP';
        document.getElementById('twofa-qr-area').style.display = 'block';
        const qrImg = document.getElementById('qr-img');
        if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/BinancePro:${currentUser?.username}%3Fsecret=${demoSecret}%26issuer=BinancePro`;
        const secretEl = document.getElementById('totp-secret');
        if (secretEl) secretEl.textContent = demoSecret;
        document.getElementById('twofa-status').textContent = 'Status: Demo QR Ready';
        if (btn) btn.textContent = 'Enabled';
        showToast('2FA Demo', 'QR Code generated (demo mode).', 'info');
    }
}

// ══════════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// NAVIGATION & ROUTING
// ══════════════════════════════════════════════════════════════
function switchView(viewId) {
    console.log(`Switching view to: ${viewId}`);
    document.querySelectorAll('.view-content').forEach(v => {
        v.style.display = 'none';
        v.classList.remove('active');
    });
    const view = document.getElementById(viewId + '-view');
    if (!view) {
        console.warn(`View not found: ${viewId}-view`);
        return;
    }
    view.style.display = 'block';
    setTimeout(() => view.classList.add('active'), 10);

    // Update bottom nav active state
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('nav-' + viewId)?.classList.add('active');

    // Trigger data fetching based on view
    if (viewId === 'market') { initMarketChart(); fetchOHLCData('USD/VND'); }
    if (viewId === 'discover') { fetchTrends(); }
    if (viewId === 'p2p') { fetchP2PListings(); }
    if (viewId === 'settings') { fetchQuests(); }
    
    // Update hash without triggering hashchange again
    const currentHash = window.location.hash.slice(1);
    if (currentHash !== viewId) {
        history.replaceState(null, null, '#' + viewId);
    }

    lucide.createIcons();
}

function handleRouting() {
    const hash = window.location.hash.slice(1) || 'home';
    console.log(`Routing to hash: ${hash}`);
    switchView(hash);
}

function openSettings() { switchView('settings'); fetchQuests(); }

function openMarketView(assetCode) {
    const pair = assetCode === 'USD' ? 'USD/VND' : `USD/${assetCode}`;
    const titleEl = document.getElementById('market-pair-title');
    if (titleEl) titleEl.innerText = pair;
    switchView('market');
    fetchOHLCData(pair);
    window.scrollTo(0, 0);
}

// ══════════════════════════════════════════════════════════════
// SKELETON
// ══════════════════════════════════════════════════════════════
function renderSkeletons() {
    const list = document.getElementById('asset-list');
    if (!list) return;
    list.innerHTML = Array(5).fill(0).map(() => `
        <div class="asset-item">
            <div class="asset-left">
                <div class="asset-icon skeleton"></div>
                <div class="asset-name-grp">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text" style="width:100px;"></div>
                </div>
            </div>
            <div class="asset-right">
                <div class="skeleton skeleton-title" style="width:60px;"></div>
                <div class="skeleton skeleton-text" style="width:40px;"></div>
            </div>
        </div>`).join('');
}

// ══════════════════════════════════════════════════════════════
// CHART
// ══════════════════════════════════════════════════════════════
function initMarketChart() {
    if (marketChart) return;
    const container = document.getElementById('market-chart');
    if (!container) return;
    marketChart = LightweightCharts.createChart(container, {
        layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#848E9C' },
        grid: { vertLines: { color: 'rgba(71,77,87,0.05)' }, horzLines: { color: 'rgba(71,77,87,0.05)' } },
        timeScale: { borderColor: 'rgba(71,77,87,0.1)', timeVisible: true },
    });
    candleSeries = marketChart.addCandlestickSeries({ upColor:'#0ECB81', downColor:'#F6465D', borderUpColor:'#0ECB81', borderDownColor:'#F6465D', wickUpColor:'#0ECB81', wickDownColor:'#F6465D' });
    maSeries = marketChart.addLineSeries({ color:'#2962FF', lineWidth:1, priceLineVisible:false, lastValueVisible:false });
    volumeSeries = marketChart.addHistogramSeries({ priceFormat:{ type:'volume' }, priceScaleId:'' });
    marketChart.priceScale('').applyOptions({ scaleMargins:{ top:0.8, bottom:0 } });
}

function calculateMA(data, period) {
    return data.map((d, i) => {
        if (i < period - 1) return null;
        const sum = data.slice(i - period + 1, i + 1).reduce((s, x) => s + x.close, 0);
        return { time: d.time, value: sum / period };
    }).filter(Boolean);
}

async function fetchOHLCData(code) {
    if (!candleSeries) return;
    try {
        const res = await fetch(`${API_BASE}/exchange/ohlc?pair=${encodeURIComponent(code)}`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const formatted = data.map(d => ({
            time: Math.floor(new Date(d.timestamp).getTime() / 1000),
            open: parseFloat(d.openRate || d.open || 0),
            high: parseFloat(d.highRate || d.high || 0),
            low:  parseFloat(d.lowRate  || d.low  || 0),
            close:parseFloat(d.closeRate|| d.close|| 0),
        })).sort((a,b) => a.time - b.time);

        candleSeries.setData(formatted);
        maSeries.setData(showMA ? calculateMA(formatted, 5) : []);
        volumeSeries.setData(showVol ? formatted.map(d => ({
            time: d.time, value: Math.random()*100+10,
            color: d.close >= d.open ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)'
        })) : []);
    } catch (e) { /* silent */ }
}

// ══════════════════════════════════════════════════════════════
// RATES & ASSETS
// ══════════════════════════════════════════════════════════════
async function fetchRates() {
    try {
        const res = await fetch(`${API_BASE}/exchange/rates`, { headers: getAuthHeaders() });
        const rates = await res.json();
        if (!Array.isArray(rates)) return;

        previousRates = { ...currentRates };
        rates.forEach(r => {
            currentRates[r.code] = parseFloat(r.rateToBase);
            if (!isFirstLoad && previousRates[r.code]) {
                const pct = Math.abs((currentRates[r.code] - previousRates[r.code]) / previousRates[r.code]) * 100;
                if (pct > 1.0) {
                    const dir = currentRates[r.code] > previousRates[r.code] ? '🟢 +' : '🔴 -';
                    showToast('Price Alert', `${r.code} ${dir}${pct.toFixed(2)}%`, 'info');
                    const dot = document.getElementById('notif-dot');
                    if (dot) dot.style.display = 'block';
                }
            }
        });
        renderAssets();
        updateTotalBalance();
        updateSwapCalculation();
        isFirstLoad = false;
    } catch (e) { /* offline */ }
}

async function fetchTrends() {
    const list = document.getElementById('trends-list');
    if (list) list.innerHTML = '<div class="skeleton-text" style="width:100%;"></div>';

    try {
        const res = await fetch(`${API_BASE}/exchange/trends`, { headers: getAuthHeaders() });
        const trends = await res.json();
        
        if (Array.isArray(trends)) {
            // Update Top Gainer/Loser cards
            const gainer = trends[0];
            const loser = trends[trends.length - 1];
            
            if (gainer) {
                document.getElementById('top-gainer-card').innerHTML = `
                    <h4 style="color:var(--up-color); margin:4px 0;">${gainer.code}</h4>
                    <p style="font-size:0.75rem;">+${gainer.changePercentage.toFixed(2)}%</p>
                `;
            }
            if (loser) {
                document.getElementById('top-loser-card').innerHTML = `
                    <h4 style="color:var(--down-color); margin:4px 0;">${loser.code}</h4>
                    <p style="font-size:0.75rem;">${loser.changePercentage.toFixed(2)}%</p>
                `;
            }

            // Render list
            if (list) {
                list.innerHTML = trends.map(t => `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface); padding:10px 14px; border-radius:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:28px; height:28px; background:var(--bg-main); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.7rem;">${t.code[0]}</div>
                            <span style="font-weight:600; font-size:0.9rem;">${t.code}</span>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-weight:700; font-size:0.9rem;">$${t.currentRate.toFixed(4)}</div>
                            <div style="font-size:0.75rem; color:${t.changePercentage >= 0 ? 'var(--up-color)' : 'var(--down-color)'};">
                                ${t.changePercentage >= 0 ? '+' : ''}${t.changePercentage.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (e) { /* offline */ }
}

async function fetchP2PListings() {
    const list = document.getElementById('p2p-ads-container');
    if (list) list.innerHTML = '<div class="skeleton-text" style="width:100%;"></div>';

    try {
        const res = await fetch(`${API_BASE}/p2p/listings`, { headers: getAuthHeaders() });
        p2pListings = await res.json();
        renderP2PListings();
    } catch (e) {
        showToast('P2P Error', 'Could not load listings.', 'danger');
    }
}

function switchP2PTab(tab) {
    currentP2PTab = tab;
    document.getElementById('p2p-buy-tab').classList.toggle('active', tab === 'BUY');
    document.getElementById('p2p-sell-tab').classList.toggle('active', tab === 'SELL');
    renderP2PListings();
}

function renderP2PListings() {
    const list = document.getElementById('p2p-ads-container');
    if (!list) return;

    const searchTerm = document.getElementById('p2p-search')?.value?.toLowerCase() || '';

    const filtered = p2pListings.filter(ad => {
        const matchesTab = currentP2PTab === 'BUY' ? ad.fromCurrency !== 'VND' : ad.fromCurrency === 'VND';
        const matchesSearch = ad.fromCurrency.toLowerCase().includes(searchTerm) || ad.toCurrency.toLowerCase().includes(searchTerm);
        return matchesTab && matchesSearch;
    });

    if (filtered.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:2rem;">No active ads for this category.</p>';
        return;
    }

    list.innerHTML = filtered.map(ad => `
        <div style="background:var(--bg-surface); border-radius:12px; padding:1rem; margin-bottom:10px; border-left:4px solid ${currentP2PTab === 'BUY' ? 'var(--up-color)' : 'var(--down-color)'};">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                <div>
                    <span style="font-weight:700; font-size:1.1rem;">${(ad.fixedRate || 1).toLocaleString()}</span>
                    <span style="font-size:0.75rem; color:var(--text-secondary);"> VND</span>
                </div>
                <div style="text-align:right;">
                    <p style="font-size:0.75rem; color:var(--text-secondary); margin:0;">Success Rate</p>
                    <p style="font-size:0.85rem; font-weight:600; margin:0;">98.5%</p>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:end;">
                <div style="font-size:0.8rem; color:var(--text-secondary);">
                    Limit: <span style="color:var(--text-primary);">${ad.minLimit.toLocaleString()} - ${ad.totalAmount.toLocaleString()}</span><br>
                    Payment: <span style="color:var(--primary);">Bank Transfer</span>
                </div>
                <button onclick="buyP2P(${ad.id}, ${ad.minLimit})" style="background:${currentP2PTab === 'BUY' ? 'var(--up-color)' : 'var(--down-color)'}; color:white; border:none; padding:6px 20px; border-radius:6px; font-weight:700; cursor:pointer;">
                    ${currentP2PTab === 'BUY' ? 'Buy' : 'Sell'} ${ad.fromCurrency}
                </button>
            </div>
        </div>
    `).join('');
}

async function buyP2P(listingId, amount) {
    if (!currentUser) return showToast('Login Required', 'Please login to trade.', 'danger');
    
    showToast('P2P Trade', 'Initiating escrow transaction...', 'info');
    
    try {
        const res = await fetch(`${API_BASE}/p2p/escrow`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                listingId,
                buyerId: currentUser.id,
                amount: amount,
                idempotencyKey: `p2p-${listingId}-${Date.now()}`
            })
        });
        
        if (res.ok) {
            const data = await res.json();
            showToast('✅ Escrow Started', `Trade #${data.id} is in holding. Please transfer funds.`, 'success');
        } else {
            const err = await res.json();
            showToast('Trade Failed', err.error || 'Could not start escrow.', 'danger');
        }
    } catch (e) {
        showToast('P2P Error', 'Network error.', 'danger');
    }
}

function openCreateListing() {
    if (!currentUser) return showToast('Login Required', 'Please login to post ads.', 'danger');
    document.getElementById('p2p-modal').style.display = 'block';
    lucide.createIcons();
}

function setAdType(type) {
    newAdType = type;
    const buyBtn = document.getElementById('ad-type-buy');
    const sellBtn = document.getElementById('ad-type-sell');
    if (type === 'BUY') {
        buyBtn.style.background = 'var(--primary)'; buyBtn.style.color = '#000'; buyBtn.style.fontWeight = '700';
        sellBtn.style.background = 'var(--bg-surface)'; sellBtn.style.color = 'var(--text-secondary)'; sellBtn.style.fontWeight = '400';
    } else {
        sellBtn.style.background = 'var(--primary)'; sellBtn.style.color = '#000'; sellBtn.style.fontWeight = '700';
        buyBtn.style.background = 'var(--bg-surface)'; buyBtn.style.color = 'var(--text-secondary)'; buyBtn.style.fontWeight = '400';
    }
}

async function submitP2PAd() {
    const asset = document.getElementById('ad-asset').value;
    const amount = parseFloat(document.getElementById('ad-amount').value);
    const price = parseFloat(document.getElementById('ad-price').value);

    if (!amount || amount <= 0 || !price || price <= 0) {
        return showToast('Invalid Input', 'Please enter valid amount and price.', 'danger');
    }

    try {
        const res = await fetch(`${API_BASE}/p2p/listings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                sellerId: currentUser.id,
                fromCurrency: asset,
                toCurrency: 'VND',
                totalAmount: amount,
                fixedRate: price,
                rateType: 'FIXED'
            })
        });

        if (res.ok) {
            showToast('✅ Ad Posted', 'Your P2P listing is now active.', 'success');
            document.getElementById('p2p-modal').style.display = 'none';
            fetchP2PListings();
        } else {
            showToast('Post Failed', 'Could not create listing.', 'danger');
        }
    } catch (e) {
        showToast('P2P Error', 'Network error.', 'danger');
    }
}

function renderAssets() {
    const list = document.getElementById('asset-list');
    if (!list) return;
    
    const searchTerm = document.getElementById('asset-search')?.value?.toLowerCase() || '';

    list.innerHTML = userBalances
        .filter(a => a.currencyCode.toLowerCase().includes(searchTerm) || a.name.toLowerCase().includes(searchTerm))
        .map(asset => {
            const curVal = currentRates[asset.currencyCode] || 0;
            const prevVal = previousRates[asset.currencyCode] || 0;
            const flashClass = (!isFirstLoad && prevVal && curVal !== prevVal) ? (curVal > prevVal ? 'flash-up' : 'flash-down') : '';
            const usdVal = asset.currencyCode === 'USD' ? asset.balance : asset.balance * curVal;
            return `
                <div class="asset-item ${flashClass}" onclick="openMarketView('${asset.currencyCode}')">
                    <div class="asset-left">
                        <div class="asset-icon" style="background:${getIconBg(asset.currencyCode)}">${asset.currencyCode[0]}</div>
                        <div class="asset-name-grp">
                            <p class="name">${asset.currencyCode}</p>
                            <p class="sub">${asset.name}</p>
                        </div>
                    </div>
                    <div class="asset-right">
                        <p class="amount">${asset.balance.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:8})}</p>
                        <p class="value">≈ $${usdVal.toLocaleString(undefined, {maximumFractionDigits:2})}</p>
                    </div>
                </div>`;
        }).join('');
}

function getIconBg(code) {
    return { BNB:'#F3BA2F', BTC:'#F7931A', ETH:'#627EEA', VND:'#DA251D', EUR:'#003399', GBP:'#012169', USD:'#2B9348' }[code] || '#474D57';
}

function updateTotalBalance() {
    const usdTotal = userBalances.reduce((sum, a) => {
        const r = a.currencyCode === 'USD' ? 1 : (currentRates[a.currencyCode] || 0);
        return sum + a.balance * r;
    }, 0);
    const el = document.getElementById('total-balance');
    if (el) el.textContent = `$${usdTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} USD`;
}

// ══════════════════════════════════════════════════════════════
// SWAP ENGINE
// ══════════════════════════════════════════════════════════════
function updateSwapCalculation() {
    const from = document.getElementById('from-select')?.value;
    const to   = document.getElementById('to-select')?.value;
    const amt  = parseFloat(document.getElementById('swap-input')?.value) || 0;

    if (!from || !to) return;

    const wallet = userBalances.find(b => b.currencyCode === from);
    const balLabel = document.getElementById('from-balance-label');
    if (balLabel) balLabel.textContent = `Balance: ${wallet ? wallet.balance.toFixed(4) : '--'} ${from}`;

    const fromRate = currentRates[from] || 1;
    const toRate   = currentRates[to] || 1;
    let rate, result;
    if (from === 'USD')      { rate = toRate;         result = amt * toRate; }
    else if (to === 'USD')   { rate = 1 / fromRate;   result = amt / fromRate; }
    else                     { rate = toRate / fromRate; result = (amt / fromRate) * toRate; }

    const outputEl = document.getElementById('swap-output');
    const rateEl = document.getElementById('rate-display');
    if (outputEl) outputEl.value = amt > 0 ? result.toFixed(6) : '';
    if (rateEl) rateEl.textContent = `1 ${from} ≈ ${rate.toFixed(6)} ${to}`;
}

async function executeSwap() {
    const from = document.getElementById('from-select')?.value;
    const to   = document.getElementById('to-select')?.value;
    const amountIn  = parseFloat(document.getElementById('swap-input')?.value);
    const amountOut = parseFloat(document.getElementById('swap-output')?.value);

    if (!amountIn || amountIn <= 0) return showToast('Invalid Amount', 'Enter a valid amount.', 'danger');
    if (from === to) return showToast('Invalid Pair', 'Cannot swap the same currency.', 'danger');

    const wallet = userBalances.find(b => b.currencyCode === from);
    if (!wallet || wallet.balance < amountIn) return showToast('Insufficient Balance', `Not enough ${from}.`, 'danger');

    document.getElementById('swap-btn-text').style.display = 'none';
    document.getElementById('swap-spinner').style.display = 'inline';

    const idempotencyKey = `swap-${currentUser?.id || 1}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
    const fromRate = currentRates[from] || 1;
    const toRate   = currentRates[to] || 1;
    const rate = from === 'USD' ? toRate : (to === 'USD' ? 1/fromRate : toRate/fromRate);

    await new Promise(r => setTimeout(r, 1500)); // Simulate network

    try {
        const res = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                userId: currentUser?.id || 1,
                type: 'EXCHANGE',
                fromCurrency: from, toCurrency: to,
                amountIn, amountOut, rate, fee: 0,
                idempotencyKey,
                description: `Swap ${amountIn} ${from} → ${amountOut.toFixed(6)} ${to}`
            })
        });

        const ok = res.ok;
        const tx = ok ? await res.json() : { id: 'LOCAL-' + Date.now() };

        wallet.balance -= amountIn;
        const toWallet = userBalances.find(b => b.currencyCode === to);
        if (toWallet) toWallet.balance += amountOut;
        else userBalances.push({ currencyCode: to, balance: amountOut, name: to });

        txHistory.unshift({ id: tx.id, from, to, amountIn, amountOut, time: new Date().toLocaleTimeString() });
        renderTxHistory();
        renderAssets();
        updateTotalBalance();

        const dot = document.getElementById('notif-dot');
        if (dot) dot.style.display = 'block';

        showToast('✅ Swap Successful!', `${amountIn} ${from} → ${amountOut.toFixed(6)} ${to} | ID: ${tx.id}`, 'success');
        document.getElementById('swap-input').value = '';
        document.getElementById('swap-output').value = '';
    } catch (e) {
        wallet.balance -= amountIn;
        const toWallet = userBalances.find(b => b.currencyCode === to);
        if (toWallet) toWallet.balance += amountOut;
        else userBalances.push({ currencyCode: to, balance: amountOut, name: to });
        txHistory.unshift({ id: 'LOCAL-' + Date.now(), from, to, amountIn, amountOut, time: new Date().toLocaleTimeString() });
        renderTxHistory(); renderAssets(); updateTotalBalance();
        showToast('✅ Swap Done (Offline)', `${amountIn} ${from} → ${amountOut.toFixed(6)} ${to}`, 'success');
        document.getElementById('swap-input').value = '';
        document.getElementById('swap-output').value = '';
    } finally {
        document.getElementById('swap-btn-text').style.display = 'inline';
        document.getElementById('swap-spinner').style.display = 'none';
    }
}

function renderTxHistory() {
    const c = document.getElementById('tx-history-list');
    if (!c) return;
    if (!txHistory.length) {
        c.innerHTML = '<p style="color:var(--text-secondary); font-size:0.8rem; text-align:center; padding:1rem;">No transactions yet.</p>';
        return;
    }
    c.innerHTML = txHistory.slice(0,10).map(tx => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0; border-bottom:1px solid var(--border-color);">
            <div>
                <p style="font-size:0.85rem; font-weight:600;">${parseFloat(tx.amountIn).toLocaleString()} ${tx.from} → ${parseFloat(tx.amountOut).toFixed(4)} ${tx.to}</p>
                <p style="font-size:0.72rem; color:var(--text-secondary);">${tx.time} · ID: ${tx.id}</p>
            </div>
            <span style="color:var(--up-color); font-size:0.75rem; font-weight:600;">✓ Done</span>
        </div>`).join('');
}

// ══════════════════════════════════════════════════════════════
// QUESTS & REWARDS
// ══════════════════════════════════════════════════════════════
async function fetchQuests() {
    if (!currentUser) return;
    const list = document.getElementById('quest-list');
    if (!list) return;

    try {
        const res = await fetch(`${API_BASE}/users/${currentUser.id}/quests`, { headers: getAuthHeaders() });
        const quests = await res.json();
        
        if (!Array.isArray(quests)) return;

        list.innerHTML = quests.map(uq => {
            const q = uq.quest;
            const isPending = uq.status === 'PENDING';
            const isCompleted = uq.status === 'COMPLETED';
            const isClaimed = uq.status === 'CLAIMED';

            return `
                <div style="background:var(--bg-main); padding:12px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid ${isCompleted ? 'var(--up-color)' : 'var(--border-color)'}; margin-bottom:8px;">
                    <div>
                        <p style="font-size:0.85rem; font-weight:700; margin:0;">${q.name}</p>
                        <p style="font-size:0.7rem; color:var(--text-secondary); margin:2px 0;">${q.description}</p>
                        <p style="font-size:0.75rem; color:var(--primary); font-weight:600;">+ $${q.rewardAmount} ${q.rewardCurrency}</p>
                    </div>
                    <div>
                        ${isPending ? `<span style="font-size:0.7rem; color:var(--text-secondary);">In Progress</span>` : ''}
                        ${isCompleted ? `<button onclick="claimReward(${q.id})" style="background:var(--up-color); color:white; border:none; padding:4px 12px; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">Claim</button>` : ''}
                        ${isClaimed ? `<span style="color:var(--up-color); font-size:0.75rem; font-weight:700;">✓ Claimed</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        list.innerHTML = '<p style="color:var(--text-secondary); font-size:0.8rem; text-align:center;">Could not load rewards.</p>';
    }
}

async function claimReward(questId) {
    if (!currentUser) return showToast('Error', 'Please login first.', 'danger');
    try {
        const res = await fetch(`${API_BASE}/users/${currentUser.id}/quests/${questId}/claim`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        if (res.ok) {
            const data = await res.json();
            showToast('🎉 Reward Claimed!', `Added $${data.amount} to your wallet.`, 'success');
            fetchQuests();
            fetchRates(); // Update balance
        } else {
            const err = await res.json();
            showToast('Claim Failed', err.error || 'Could not claim reward.', 'danger');
        }
    } catch (e) {
        showToast('Error', 'Network error.', 'danger');
    }
}

// ══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════════════════════════
function openSwapOverlay() {
    document.getElementById('swap-overlay').style.display = 'block';
    updateSwapCalculation();
    fetchUserTxHistory();
    lucide.createIcons();
}

async function fetchUserTxHistory() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/transactions/user/${currentUser.id}`, { headers: getAuthHeaders() });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                txHistory = data.map(t => ({
                    id: t.id, from: t.fromCurrency, to: t.toCurrency,
                    amountIn: t.amountIn, amountOut: t.amountOut || 0,
                    time: new Date(t.createdAt).toLocaleTimeString()
                }));
                renderTxHistory();
            }
        }
    } catch(e) { /* offline */ }
}

function setupEventListeners() {
    // Navigation - Event Delegation for better reliability
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        bottomNav.addEventListener('click', (e) => {
            const item = e.target.closest('.nav-item');
            if (item) {
                const viewId = item.id.replace('nav-', '');
                window.location.hash = viewId;
            }
        });
    }

    window.addEventListener('hashchange', handleRouting);

    document.getElementById('open-swap')?.addEventListener('click', openSwapOverlay);
    document.getElementById('close-swap')?.addEventListener('click', () => {
        document.getElementById('swap-overlay').style.display = 'none';
    });
    document.getElementById('bell-trigger')?.addEventListener('click', () => {
        const dot = document.getElementById('notif-dot');
        if (dot) dot.style.display = 'none';
        showToast('Notifications', txHistory.length > 0 ? `${txHistory.length} recent transaction(s).` : 'No new alerts.', 'info');
    });
    document.getElementById('swap-input')?.addEventListener('input', updateSwapCalculation);
    document.getElementById('from-select')?.addEventListener('change', updateSwapCalculation);
    document.getElementById('to-select')?.addEventListener('change', updateSwapCalculation);
    document.getElementById('flip-btn')?.addEventListener('click', () => {
        const f = document.getElementById('from-select');
        const t = document.getElementById('to-select');
        if (!f || !t) return;
        [f.value, t.value] = [t.value, f.value];
        updateSwapCalculation();
        const btn = document.getElementById('flip-btn');
        if (btn) { btn.style.transform = 'rotate(180deg)'; setTimeout(() => btn.style.transform = '', 400); }
    });
    document.getElementById('confirm-swap')?.addEventListener('click', executeSwap);
    document.getElementById('toggle-ma')?.addEventListener('click', function() {
        showMA = !showMA; this.classList.toggle('active', showMA); fetchOHLCData('USD/VND');
    });
    document.getElementById('toggle-vol')?.addEventListener('click', function() {
        showVol = !showVol; this.classList.toggle('active', showVol); fetchOHLCData('USD/VND');
    });
    document.querySelectorAll('.t-btn[data-tf]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.t-btn[data-tf]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    document.querySelectorAll('.asset-tabs .tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.asset-tabs .tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
    // Enter key on login
    document.getElementById('login-password')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') performLogin();
    });
    document.getElementById('login-username')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') performLogin();
    });

    // Search input event listeners
    document.getElementById('asset-search')?.addEventListener('input', renderAssets);
    document.getElementById('p2p-search')?.addEventListener('input', renderP2PListings);
}

// ══════════════════════════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════════════════════════
window.onload = () => {
    if (loadSession()) {
        bootApp();
        handleRouting(); // Initial routing based on hash
    } else {
        document.getElementById('auth-screen').style.display = 'block';
        lucide.createIcons();
    }
};
