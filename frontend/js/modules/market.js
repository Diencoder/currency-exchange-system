/**
 * Market Module - Handles TradingView charts and rates
 */
import { apiFetch } from './api.js';

export class MarketManager {
    constructor() {
        this.currentRates = {};
        this.previousRates = {};
        this.chart = null;
        this.candleSeries = null;
    }

    async fetchRates() {
        try {
            const data = await apiFetch('/exchange/rates');
            this.previousRates = { ...this.currentRates };
            // Convert list to object for easy lookup
            this.currentRates = data.reduce((acc, rate) => {
                acc[rate.currencyCode] = rate.rate;
                return acc;
            }, {});
            this.renderRates();
            // Trigger wallet update to reflect new rates in total balance
            if (window.wallet) window.wallet.updateTotalBalanceDisplay();
        } catch (error) {
            console.error("Fetch rates error:", error);
        }
    }

    initChart() {
        const container = document.getElementById('market-chart');
        if (!container || this.chart) return;

        this.chart = LightweightCharts.createChart(container, {
            layout: { background: { color: 'transparent' }, textColor: '#848E9C' },
            grid: { vertLines: { color: '#1E2329' }, horzLines: { color: '#1E2329' } },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            timeScale: { borderColor: '#1E2329' }
        });

        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: '#0ECB81', downColor: '#F6465D', borderVisible: false,
            wickUpColor: '#0ECB81', wickDownColor: '#F6465D'
        });

        // Mock data for initial load
        this.updateChartData();
    }

    updateChartData() {
        const data = [];
        let time = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
        let val = 24500;
        for (let i = 0; i < 100; i++) {
            const open = val + (Math.random() - 0.5) * 100;
            const high = open + Math.random() * 50;
            const low = open - Math.random() * 50;
            const close = val + (Math.random() - 0.5) * 100;
            data.push({ time: time.getTime() / 1000, open, high, low, close });
            time = new Date(time.getTime() + 24 * 60 * 60 * 1000);
            val = close;
        }
        this.candleSeries.setData(data);
    }

    renderRates() {
        const usdRate = this.currentRates['VND'];
        const el = document.getElementById('usd-vnd-rate');
        if (el && usdRate) el.textContent = usdRate.toLocaleString();

        // Render asset list on Home view
        const container = document.getElementById('asset-list');
        if (container && Object.keys(this.currentRates).length > 0) {
            // Sort to show balances first, then others
            const sortedCodes = Object.keys(this.currentRates).sort((a, b) => {
                const balA = window.wallet ? window.wallet.getBalance(a) : 0;
                const balB = window.wallet ? window.wallet.getBalance(b) : 0;
                if (balA > 0 && balB === 0) return -1;
                if (balB > 0 && balA === 0) return 1;
                return a.localeCompare(b);
            });

            container.innerHTML = sortedCodes.map(code => {
                const rate = this.currentRates[code];
                const prevRate = this.previousRates[code] || rate;
                const change = rate >= prevRate ? '+0.00%' : '-0.00%';
                const changeClass = rate >= prevRate ? 'up' : 'down';
                
                // Get user's balance
                const balance = window.wallet ? window.wallet.getBalance(code) : 0;
                const usdValue = balance * rate;
                
                // Determine icon class based on coin code
                let iconClass = 'icon-default';
                if (code === 'BTC') iconClass = 'icon-btc';
                if (code === 'ETH') iconClass = 'icon-eth';
                if (code === 'BNB') iconClass = 'icon-bnb';
                if (code === 'USD' || code === 'USDT') iconClass = 'icon-usd';

                return `
                    <div class="asset-item glass-card fade-in" onclick="window.switchView('market'); document.getElementById('market-pair-title').innerText = 'USD / ${code}';">
                        <div class="asset-info">
                            <div class="asset-icon ${iconClass}">${code.charAt(0)}</div>
                            <div class="asset-details">
                                <p class="name">${code}</p>
                                <p class="sub">$${rate.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</p>
                            </div>
                        </div>
                        <div class="asset-values" style="text-align:right;">
                            <p class="price">${balance > 0 ? balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6}) : '0.00'} ${code}</p>
                            <p class="change ${changeClass}" style="font-size:0.8rem;">$${usdValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Auto-refresh swap calculation if modal is open
        if (document.getElementById('swap-overlay')?.style.display === 'block') {
            window.calculateSwap?.();
        }
    }
}

export const market = new MarketManager();
