/**
 * Auth View Component
 */
export const renderAuthView = () => {
    return `
    <div id="auth-screen" class="auth-screen">
        <div class="auth-container">
            <div class="auth-logo">
                <img src="assets/logo.png" alt="Dynacryst Logo" style="width: 100px; height: 100px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <h1>DYNACRYST</h1>
                <p>Digital Finance Excellence</p>
            </div>
            <div class="auth-card fade-in">
                <div class="auth-tabs">
                    <button class="auth-tab active" id="tab-login" onclick="window.auth.switchTab('login')">Login</button>
                    <button class="auth-tab" id="tab-register" onclick="window.auth.switchTab('register')">Register</button>
                </div>
                <div id="login-form">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="login-username" placeholder="Enter username">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="login-password" placeholder="••••••••">
                    </div>
                    <button class="btn-primary" onclick="window.auth.handleLogin()">Sign In</button>
                </div>
                <div id="register-form" style="display:none;">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="reg-username" placeholder="Choose username">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="reg-email" placeholder="email@example.com">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="reg-password" placeholder="••••••••">
                    </div>
                    <button class="btn-primary" onclick="window.auth.handleRegister()">Create Account</button>
                </div>
            </div>
        </div>
    </div>`;
};
