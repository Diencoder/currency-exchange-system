export const renderSettingsView = () => {
    return `
    <div id="settings-view" class="fade-in">
        <div style="width: 100%; margin: 0 auto;">
            <!-- Profile Overview -->
            <div class="section-card" style="margin-bottom: 30px; display: flex; align-items: center; gap: 25px; padding: 30px;">
                <div id="settings-avatar" style="width: 80px; height: 80px; background: var(--primary); color: black; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; box-shadow: 0 0 20px rgba(252, 213, 53, 0.2);">?</div>
                <div style="flex: 1;">
                    <h2 id="settings-username" style="font-size: 1.8rem; margin:0;">Account Profile</h2>
                    <p id="settings-email" style="color: var(--text-secondary); font-size: 1rem; margin-top: 5px;">user@example.com</p>
                </div>
                <button class="btn-primary" style="background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border-color);">Edit Profile</button>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <!-- Security & 2FA -->
                <div class="section-card">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <i data-lucide="shield-check" style="color: var(--up-color);"></i>
                        <h3 style="font-size: 1.1rem; margin:0;">Security</h3>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(0,0,0,0.1); border-radius: 12px; border: 1px solid var(--border-color);">
                        <div>
                            <div style="font-weight: 600;">Two-Factor Auth (2FA)</div>
                            <div id="twofa-status" style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Status: Disabled</div>
                        </div>
                        <button id="toggle-2fa-btn" onclick="window.auth.toggle2FA()" class="btn-primary" style="padding: 6px 15px; font-size: 0.85rem;">Enable</button>
                    </div>
                    <div style="margin-top: 20px; font-size: 0.85rem; color: var(--text-secondary);">
                        Protect your account with an extra layer of security.
                    </div>
                </div>

                <!-- Rewards Center -->
                <div class="section-card">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <i data-lucide="gift" style="color: var(--primary);"></i>
                        <h3 style="font-size: 1.1rem; margin:0;">Rewards Center</h3>
                    </div>
                    <div style="padding: 15px; background: linear-gradient(135deg, rgba(252, 213, 53, 0.1) 0%, transparent 100%); border-radius: 12px; border: 1px dotted var(--primary);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 600;">Active Quests</span>
                            <span id="reward-points" class="up" style="font-size: 0.8rem;">Earn USD</span>
                        </div>
                        <div id="quest-list" style="margin-top: 15px;"></div>
                    </div>
                </div>

                <!-- System Health -->
                <div class="section-card" style="grid-column: span 2;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <i data-lucide="activity" style="color: var(--primary);"></i>
                        <h3 style="font-size: 1.1rem; margin:0;">System Health</h3>
                    </div>
                    <div id="service-status-list" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                        <!-- Status items will be injected here -->
                    </div>
                </div>
            </div>

            <!-- Sign Out Button -->
            <div style="margin-top: 40px; display: flex; justify-content: center;">
                <button onclick="window.auth.performLogout()" class="btn-primary" style="background: rgba(246, 70, 93, 0.1); color: var(--down-color); border: 1px solid var(--down-color); display: flex; align-items: center; gap: 10px; padding: 12px 40px;">
                    <i data-lucide="log-out" style="width:18px;"></i>
                    Sign Out Account
                </button>
            </div>
        </div>
    </div>`;
};
