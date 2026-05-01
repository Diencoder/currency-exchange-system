/**
 * UI Module - Handles DOM manipulation and view management
 */
export const showToast = (title, message, type = 'success') => {
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
};

export const switchView = (viewId) => {
    // Hide all views
    document.querySelectorAll('.view-content').forEach(v => v.style.display = 'none');

    // Show active view — HTML uses pattern `${viewId}-view` (e.g., home-view, market-view)
    const activeView = document.getElementById(`${viewId}-view`);
    if (activeView) activeView.style.display = 'block';

    // Toggle navigation buttons
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(viewId)) {
            item.classList.add('active');
        }
    });

    // Handle special UI logic (hiding balance on non-home pages)
    const topSections = document.querySelectorAll('.balance-section, .action-row');
    if (viewId === 'home') {
        topSections.forEach(s => s.style.removeProperty('display'));
    } else {
        topSections.forEach(s => s.style.setProperty('display', 'none', 'important'));
    }
};

export const toggleSpinner = (id, show) => {
    const spinner = document.getElementById(id);
    if (spinner) spinner.style.display = show ? 'inline' : 'none';
};
