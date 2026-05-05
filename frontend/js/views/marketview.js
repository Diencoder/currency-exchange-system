export const renderMarketView = () => {
    return `
    <div id="market-view" class="fade-in">
        <div class="market-grid" style="display: grid; grid-template-columns: 1fr 320px; gap: 20px;">
            <!-- Left: Advanced Chart Area -->
            <div class="chart-container section-card" style="padding: 0; overflow: hidden; position: relative; height: 650px;">
                <!-- TradingView Widget BEGIN -->
                <div class="tradingview-widget-container" style="height: 100%; width: 100%;">
                    <div id="tradingview_chart" style="height: 100%; width: 100%;"></div>
                </div>
                <!-- TradingView Widget END -->
            </div>

            <!-- Right: Order Book & Trading Actions -->
            <div class="market-sidebar">
                <div class="section-card" style="height: 100%; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1.1rem; margin:0;">Order Book</h3>
                        <div style="display: flex; gap: 5px;">
                            <div style="width: 12px; height: 12px; background: var(--up-color); border-radius: 2px;"></div>
                            <div style="width: 12px; height: 12px; background: var(--down-color); border-radius: 2px;"></div>
                        </div>
                    </div>
                    
                    <div id="order-book-mock" style="font-family: 'Roboto Mono', monospace; font-size: 0.85rem; flex: 1;">
                        <div style="color: var(--down-color); display: flex; justify-content: space-between; padding: 4px 0; opacity: 0.8;"><span>64,245.1</span> <span>0.042</span></div>
                        <div style="color: var(--down-color); display: flex; justify-content: space-between; padding: 4px 0; opacity: 0.9;"><span>64,242.8</span> <span>1.120</span></div>
                        <div style="color: var(--down-color); display: flex; justify-content: space-between; padding: 4px 0;"><span>64,238.5</span> <span>0.564</span></div>
                        
                        <div style="margin: 20px 0; padding: 15px; background: rgba(14, 203, 129, 0.05); border-radius: 8px; font-size: 1.4rem; font-weight: 800; text-align: center; color: var(--up-color); border: 1px solid rgba(14, 203, 129, 0.1);">
                            $64,231.50
                            <div style="font-size: 0.8rem; font-weight: 400; color: var(--text-secondary); margin-top: 4px;">≈ $64,231.50</div>
                        </div>

                        <div style="color: var(--up-color); display: flex; justify-content: space-between; padding: 4px 0;"><span>64,228.1</span> <span>0.892</span></div>
                        <div style="color: var(--up-color); display: flex; justify-content: space-between; padding: 4px 0; opacity: 0.9;"><span>64,225.4</span> <span>2.105</span></div>
                        <div style="color: var(--up-color); display: flex; justify-content: space-between; padding: 4px 0; opacity: 0.8;"><span>64,222.0</span> <span>0.123</span></div>
                    </div>

                    <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 10px;">
                        <button class="btn-primary" style="background: var(--up-color); color: #000;" onclick="window.ui.showToast('Order', 'Market Buy Order Placed', 'success')">Buy BTC</button>
                        <button class="btn-primary" style="background: var(--down-color); color: #FFF;" onclick="window.ui.showToast('Order', 'Market Sell Order Placed', 'error')">Sell BTC</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
};
