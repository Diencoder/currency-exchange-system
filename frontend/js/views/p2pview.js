export const renderP2PView = () => {
    return `
    <div id="p2p-view" class="fade-in">
        <div class="section-card" style="padding: 1.5rem;">
            <div class="p2p-nav" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <div style="display: flex; gap: 30px;">
                    <div class="p2p-tab active" style="font-size: 1.2rem; font-weight: 700; color: var(--up-color); cursor: pointer; border-bottom: 3px solid var(--up-color); padding-bottom: 10px;">Buy</div>
                    <div class="p2p-tab" style="font-size: 1.2rem; font-weight: 700; color: var(--text-secondary); cursor: pointer; padding-bottom: 10px;">Sell</div>
                </div>
                <div style="display: flex; gap: 15px; align-items: center;">
                    <select class="action-pill" style="background: #2B3139; color: white; border: none; padding: 8px 15px;">
                        <option>USDT</option>
                        <option>BTC</option>
                        <option>ETH</option>
                    </select>
                    <select class="action-pill" style="background: #2B3139; color: white; border: none; padding: 8px 15px;">
                        <option>VND</option>
                        <option>USD</option>
                    </select>
                </div>
            </div>

            <!-- Filter Row -->
            <div class="p2p-filters" style="display: flex; gap: 20px; margin-bottom: 2rem;">
                <div style="flex: 1;">
                    <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 5px;">Amount</label>
                    <input type="text" placeholder="Enter amount" style="width: 100%; background: #2B3139; border: 1px solid var(--border-color); padding: 10px; border-radius: 8px; color: white;">
                </div>
                <div style="flex: 1;">
                    <label style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 5px;">Payment</label>
                    <select style="width: 100%; background: #2B3139; border: 1px solid var(--border-color); padding: 10px; border-radius: 8px; color: white;">
                        <option>All Payments</option>
                        <option>Bank Transfer</option>
                        <option>Momo</option>
                    </select>
                </div>
                <div style="display: flex; align-items: flex-end;">
                    <button class="btn-primary" style="padding: 10px 30px;">Refresh</button>
                </div>
            </div>

            <!-- Ads Table -->
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="text-align: left; color: var(--text-secondary); font-size: 0.85rem; border-bottom: 1px solid var(--border-color);">
                        <th style="padding: 12px 0;">Advertiser</th>
                        <th>Price</th>
                        <th>Limit / Available</th>
                        <th>Payment</th>
                        <th style="text-align: right;">Trade</th>
                    </tr>
                </thead>
                <tbody id="p2p-ads-container">
                    <!-- Mock Row for immediate visual feedback -->
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 20px 0;">
                            <div style="font-weight: 700; color: var(--primary);">VipTrader_99</div>
                            <div style="font-size: 0.75rem; color: var(--up-color);">1,245 orders | 98.5% completion</div>
                        </td>
                        <td style="font-size: 1.2rem; font-weight: 800;">25,430 VND</td>
                        <td>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">Available: <span style="color: white;">1,245.00 USDT</span></div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">Limit: <span style="color: white;">1,000,000 - 50,000,000 VND</span></div>
                        </td>
                        <td><span style="background: rgba(252, 213, 53, 0.1); color: var(--primary); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Bank Transfer</span></td>
                        <td style="text-align: right;"><button class="btn-primary" style="background: var(--up-color); color: black; padding: 8px 25px;">Buy USDT</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>`;
};
