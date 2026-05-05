export const renderHomeView = () => {
    return `
    <div id="home-view" class="fade-in">
        <!-- Market Stats Row -->
        <div class="market-stats">
            <div class="stat-card">
                <div class="label">BTC/USDT</div>
                <div class="value">$64,231.50</div>
                <div class="change up">+1.24%</div>
            </div>
            <div class="stat-card">
                <div class="label">ETH/USDT</div>
                <div class="value">$3,452.12</div>
                <div class="change down">-0.45%</div>
            </div>
            <div class="stat-card">
                <div class="label">BNB/USDT</div>
                <div class="value">$582.30</div>
                <div class="change up">+2.10%</div>
            </div>
        </div>

        <div class="home-grid">
            <!-- Left Column: Balance & Assets -->
            <div class="grid-left">
                <section class="balance-card">
                    <div class="balance-label">
                        <span>Estimated Balance</span>
                        <i data-lucide="eye" style="width:16px; cursor:pointer;"></i>
                    </div>
                    <div class="main-balance" id="total-balance">$0.00</div>
                    <div class="sub-balance up">
                        <i data-lucide="trending-up" style="width:16px;"></i>
                        <span id="balance-change">+0.00% (Today)</span>
                    </div>
                    
                    <div class="balance-actions">
                        <div class="action-pill primary" onclick="window.ui.showToast('Info', 'Deposit feature coming soon', 'info')">
                            <i data-lucide="plus"></i> Buy Crypto
                        </div>
                        <div class="action-pill" onclick="window.swap.openModal()">
                            <i data-lucide="refresh-cw"></i> Swap
                        </div>
                        <div class="action-pill" onclick="window.ui.switchView('chat')">
                            <i data-lucide="send"></i> Transfer
                        </div>
                    </div>
                </section>

                <section class="section-card" style="margin-top: 2rem;">
                    <div class="section-title">
                        <span>My Assets</span>
                        <div style="display:flex; gap:10px; font-size:0.8rem; color:var(--text-secondary);">
                            <span style="cursor:pointer; color:var(--primary);">Crypto</span>
                            <span style="cursor:pointer;">Fiat</span>
                        </div>
                    </div>
                    <div id="asset-list">
                        <!-- Assets will be injected here -->
                    </div>
                </section>
            </div>

            <!-- Right Column: Recent Activity & Market -->
            <div class="grid-right">
                <section class="section-card">
                    <div class="section-title">
                        <span>Recent Transactions</span>
                        <span style="font-size:0.8rem; color:var(--primary); cursor:pointer;">View All</span>
                    </div>
                    <div id="recent-tx-list">
                        <!-- Transactions will be injected here -->
                    </div>
                </section>

                <section class="section-card" style="margin-top: 2rem;">
                    <div class="section-title">
                        <span>Security Tips</span>
                    </div>
                    <div style="background:rgba(240,185,11,0.05); border:1px solid rgba(240,185,11,0.1); border-radius:12px; padding:1rem; font-size:0.85rem; color:var(--text-secondary);">
                        <p style="margin-bottom:8px;">• Never share your private keys or seed phrase with anyone.</p>
                        <p>• Enable 2FA for maximum security on your account.</p>
                    </div>
                </section>
            </div>
        </div>
    </div>`;
};
