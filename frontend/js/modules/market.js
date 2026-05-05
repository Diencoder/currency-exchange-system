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
        const container = document.getElementById('tradingview_chart');
        if (!container) return;
        
        if (typeof TradingView === 'undefined') {
            console.error('TradingView library not loaded');
            container.innerHTML = '<div style="color:white; padding:20px;">Error: TradingView library not loaded. Please refresh.</div>';
            return;
        }

        new TradingView.widget({
            "autosize": true,
            "symbol": "BINANCE:BTCUSDT",
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_side_toolbar": false,
            "allow_symbol_change": true,
            "container_id": "tradingview_chart",
            "studies": [
                "MASimple@tv-basicstudies"
            ],
            "show_popup_button": true,
            "popup_width": "1000",
            "popup_height": "650",
            "backgroundColor": "rgba(24, 26, 32, 1)",
            "gridColor": "rgba(43, 49, 57, 0.1)"
        });
    }

    updateChartData() {
        // No longer needed for TradingView Widget as it handles its own data
        console.log('Using TradingView Widget - Auto data handling');
    }

    renderRates() {
        const usdRate = this.currentRates['VND'];
        const el = document.getElementById('usd-vnd-rate');
        if (el && usdRate) el.textContent = usdRate.toLocaleString();

        // Auto-refresh swap calculation if modal is open
        if (document.getElementById('swap-overlay')?.style.display === 'block') {
            window.calculateSwap?.();
        }
    }
}

export const market = new MarketManager();
