// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserInfo();
    loadSettings();
    setupEventListeners();
});

// ==================== AUTHENTICATION ====================
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

function loadUserInfo() {
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email') || `${username}@gmail.com`;
    
    if (username) {
        document.getElementById('userName').textContent = username;
        document.getElementById('userEmail').textContent = email;
        document.getElementById('username').value = username;
        document.getElementById('email').value = email;
        
        // Update avatar
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=2563eb&color=fff`;
        document.getElementById('userAvatar').src = avatarUrl;
    }
}

// ==================== LOAD SETTINGS ====================
function loadSettings() {
    // Load saved settings from localStorage
    const settings = {
        fullName: localStorage.getItem('fullName') || '',
        phone: localStorage.getItem('phone') || '',
        twoFactor: localStorage.getItem('twoFactor') === 'true',
        emailNotif: localStorage.getItem('emailNotif') !== 'false',
        smsNotif: localStorage.getItem('smsNotif') === 'true',
        browserNotif: localStorage.getItem('browserNotif') !== 'false',
        statusNotif: localStorage.getItem('statusNotif') !== 'false',
        assignmentNotif: localStorage.getItem('assignmentNotif') !== 'false',
        weeklyNotif: localStorage.getItem('weeklyNotif') === 'true',
        theme: localStorage.getItem('theme') || 'light',
        language: localStorage.getItem('language') || 'en',
        timezone: localStorage.getItem('timezone') || 'IST',
        dateFormat: localStorage.getItem('dateFormat') || 'MM/DD/YYYY'
    };

    // Apply settings
    document.getElementById('fullName').value = settings.fullName;
    document.getElementById('phone').value = settings.phone;
    document.getElementById('twoFactor').checked = settings.twoFactor;
    document.getElementById('emailNotif').checked = settings.emailNotif;
    document.getElementById('smsNotif').checked = settings.smsNotif;
    document.getElementById('browserNotif').checked = settings.browserNotif;
    document.getElementById('statusNotif').checked = settings.statusNotif;
    document.getElementById('assignmentNotif').checked = settings.assignmentNotif;
    document.getElementById('weeklyNotif').checked = settings.weeklyNotif;
    document.getElementById('theme').value = settings.theme;
    document.getElementById('language').value = settings.language;
    document.getElementById('timezone').value = settings.timezone;
    document.getElementById('dateFormat').value = settings.dateFormat;

    // Update toggle status
    updateToggleStatus('twoFactor', settings.twoFactor);
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('toggleSidebar')?.addEventListener('click', toggleSidebar);

    // Save buttons
    document.getElementById('saveAccountBtn').addEventListener('click', saveAccountSettings);
    document.getElementById('saveSecurityBtn').addEventListener('click', saveSecuritySettings);
    document.getElementById('saveNotifBtn').addEventListener('click', saveNotificationSettings);
    document.getElementById('saveAppearanceBtn').addEventListener('click', saveAppearanceSettings);

    // Danger zone buttons
    document.getElementById('clearHistoryBtn').addEventListener('click', () => showConfirmModal('Clear History', 'Are you sure you want to clear all your ticket history? This action cannot be undone.', clearHistory));
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('deleteAccountBtn').addEventListener('click', () => showConfirmModal('Delete Account', 'Are you sure you want to permanently delete your account? All your data will be lost forever.', deleteAccount));

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Two-factor toggle
    document.getElementById('twoFactor').addEventListener('change', function() {
        updateToggleStatus('twoFactor', this.checked);
    });

    // Modal buttons
    document.getElementById('closeModal')?.addEventListener('click', hideModal);
    document.getElementById('modalCancel')?.addEventListener('click', hideModal);
}

// ==================== SIDEBAR ====================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// ==================== SAVE ACCOUNT SETTINGS ====================
async function saveAccountSettings() {
    const btn = document.getElementById('saveAccountBtn');
    const originalText = btn.innerHTML;
    
    // Get values
    const email = document.getElementById('email').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();

    // Validation
    if (!email || !validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    // Show loading
    btn.disabled = true;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle></svg> Saving...';

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Save to localStorage
        localStorage.setItem('email', email);
        localStorage.setItem('fullName', fullName);
        localStorage.setItem('phone', phone);

        // Update display
        document.getElementById('userEmail').textContent = email;

        showToast('Account settings saved successfully!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to save settings. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ==================== SAVE SECURITY SETTINGS ====================
async function saveSecuritySettings() {
    const btn = document.getElementById('saveSecurityBtn');
    const originalText = btn.innerHTML;
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const twoFactor = document.getElementById('twoFactor').checked;

    // Validation
    if (newPassword || confirmPassword) {
        if (!currentPassword) {
            showToast('Please enter your current password', 'error');
            return;
        }
        if (newPassword.length < 8) {
            showToast('New password must be at least 8 characters', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
    }

    // Show loading
    btn.disabled = true;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="animation: spin 1s linear infinite;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Updating...';

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Save settings
        localStorage.setItem('twoFactor', twoFactor);

        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';

        showToast('Security settings updated successfully!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to update security settings', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ==================== SAVE NOTIFICATION SETTINGS ====================
async function saveNotificationSettings() {
    const btn = document.getElementById('saveNotifBtn');
    const originalText = btn.innerHTML;
    
    // Get values
    const settings = {
        emailNotif: document.getElementById('emailNotif').checked,
        smsNotif: document.getElementById('smsNotif').checked,
        browserNotif: document.getElementById('browserNotif').checked,
        statusNotif: document.getElementById('statusNotif').checked,
        assignmentNotif: document.getElementById('assignmentNotif').checked,
        weeklyNotif: document.getElementById('weeklyNotif').checked
    };

    // Show loading
    btn.disabled = true;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="animation: spin 1s linear infinite;"><polyline points="20 6 9 17 4 12"></polyline></svg> Saving...';

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        // Save to localStorage
        Object.keys(settings).forEach(key => {
            localStorage.setItem(key, settings[key]);
        });

        showToast('Notification preferences saved!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to save preferences', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ==================== SAVE APPEARANCE SETTINGS ====================
async function saveAppearanceSettings() {
    const btn = document.getElementById('saveAppearanceBtn');
    const originalText = btn.innerHTML;
    
    // Get values
    const settings = {
        theme: document.getElementById('theme').value,
        language: document.getElementById('language').value,
        timezone: document.getElementById('timezone').value,
        dateFormat: document.getElementById('dateFormat').value
    };

    // Show loading
    btn.disabled = true;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="5"></circle></svg> Applying...';

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        // Save to localStorage
        Object.keys(settings).forEach(key => {
            localStorage.setItem(key, settings[key]);
        });

        showToast('Appearance settings applied!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to apply settings', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ==================== DANGER ZONE ====================
async function clearHistory() {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clear history from localStorage
        // This would normally make an API call to your backend
        
        showToast('History cleared successfully', 'success');
        hideModal();
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to clear history', 'error');
    }
}

function exportData() {
    try {
        // Gather user data
        const userData = {
            username: localStorage.getItem('username'),
            email: localStorage.getItem('email'),
            fullName: localStorage.getItem('fullName'),
            phone: localStorage.getItem('phone'),
            settings: {
                theme: localStorage.getItem('theme'),
                language: localStorage.getItem('language'),
                timezone: localStorage.getItem('timezone'),
                dateFormat: localStorage.getItem('dateFormat')
            },
            exportDate: new Date().toISOString()
        };

        // Create downloadable file
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-system-data-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to export data', 'error');
    }
}

async function deleteAccount() {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clear all data
        localStorage.clear();
        
        // Redirect to login
        window.location.href = 'home.html';
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to delete account', 'error');
    }
}

// ==================== MODAL ====================
let modalConfirmCallback = null;

function showConfirmModal(title, message, callback) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    
    modalConfirmCallback = callback;
    modal.classList.add('active');
    
    // Setup confirm button
    const confirmBtn = document.getElementById('modalConfirm');
    confirmBtn.onclick = () => {
        if (modalConfirmCallback) {
            modalConfirmCallback();
        }
    };
}

function hideModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('active');
    modalConfirmCallback = null;
}

// ==================== UTILITIES ====================
function updateToggleStatus(toggleId, isEnabled) {
    const statusElement = document.getElementById(`${toggleId}Status`);
    if (statusElement) {
        statusElement.textContent = isEnabled ? 'Enabled' : 'Disabled';
        statusElement.style.color = isEnabled ? '#10b981' : '#64748b';
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    
    // Change color based on type
    if (type === 'error') {
        toast.style.background = 'linear-gradient(135deg, #dc2626, #ef4444)';
    } else {
        toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'home.html';
}

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
    // Escape to close modal
    if (e.key === 'Escape') {
        hideModal();
    }
});

// ==================== ANIMATIONS ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);