export const renderLayout = () => {
    return `
    <div class="app-container">
        <aside class="sidebar">
            <div class="sidebar-logo">
                <img src="assets/logo.png" alt="Dynacryst Logo" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">
                <span class="logo-text" style="font-family: 'Outfit', sans-serif; font-weight: 800; letter-spacing: 1px;">DYNACRYST</span>
            </div>
            
            <nav class="sidebar-nav">
                <div class="side-nav-item active" id="side-nav-home" onclick="window.ui.switchView('home')">
                    <i data-lucide="layout-dashboard"></i>
                    <span>Dashboard</span>
                </div>
                <div class="side-nav-item" id="side-nav-market" onclick="window.ui.switchView('market')">
                    <i data-lucide="trending-up"></i>
                    <span>Market</span>
                </div>
                <div class="side-nav-item" id="side-nav-p2p" onclick="window.ui.switchView('p2p')">
                    <i data-lucide="users"></i>
                    <span>P2P Trading</span>
                </div>
                <div class="side-nav-item" id="side-nav-discover" onclick="window.ui.switchView('discover')">
                    <i data-lucide="shopping-cart"></i>
                    <span>Mart</span>
                </div>
                <div class="side-nav-item" id="side-nav-chat" onclick="window.ui.switchView('chat')">
                    <i data-lucide="message-circle"></i>
                    <span>Support Chat</span>
                </div>
                <div class="side-nav-item" id="side-nav-settings" onclick="window.ui.switchView('settings')">
                    <i data-lucide="settings"></i>
                    <span>Settings</span>
                </div>
            </nav>

            <div class="sidebar-footer">
                <div class="side-nav-item" onclick="window.auth.performLogout()">
                    <i data-lucide="log-out"></i>
                    <span>Sign Out</span>
                </div>
            </div>
        </aside>

        <div class="main-wrapper">
            <header class="header">
                <div class="header-search">
                    <i data-lucide="search" style="width:16px; color:var(--text-secondary);"></i>
                    <input type="text" placeholder="Search markets, assets...">
                </div>
                
                <div class="header-actions">
                    <i data-lucide="bell"></i>
                    <i data-lucide="help-circle"></i>
                    <div class="user-profile-trigger" onclick="window.ui.switchView('settings')">
                        <div id="header-avatar" style="width:32px; height:32px; background:var(--primary); border-radius:50%; display:flex; align-items:center; justify-content:center; color:black; font-weight:bold; font-size:12px;">U</div>
                        <span id="header-username" style="font-weight:600; font-size:14px;">User</span>
                    </div>
                </div>
            </header>

            <main id="view-container"></main>
        </div>

        <!-- Mobile Bottom Nav removed for Desktop Pro focus -->
    </div>`;
};
