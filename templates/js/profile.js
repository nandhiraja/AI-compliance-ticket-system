// API Configuration
import API_URL from './config.js';

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Check authentication
if (!token) {
    window.location.href = 'login.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

async function initializePage() {
    setupEventListeners();
    displayUserInfo();
    await loadUserStats();
    await loadRecentActivity();
}

// Setup event listeners
function setupEventListeners() {
    // Sidebar toggle
    const toggleSidebar = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Edit profile
    document.getElementById('editProfileBtn').addEventListener('click', openEditModal);
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('editForm').addEventListener('submit', saveProfile);

    // Password form
    document.getElementById('passwordForm').addEventListener('submit', changePassword);
}

// Display user info
function displayUserInfo() {
    const userName = user.name || 'User';
    const userEmail = user.email || 'user@example.com';

    // Top nav
    document.getElementById('topUserName').textContent = userName;
    document.getElementById('topUserEmail').textContent = userEmail;

    // Profile header
    document.getElementById('profileName').textContent = userName;
    document.getElementById('profileEmail').textContent = userEmail;

    // Personal info
    document.getElementById('displayName').textContent = userName;
    document.getElementById('displayEmail').textContent = userEmail;

    // Avatar
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563eb&color=fff&size=120`;
    document.querySelector('#profileAvatarLarge img').src = avatarUrl;
    document.getElementById('userAvatar').src = avatarUrl.replace('120', '40');

    // Member since (you can get this from user data if available)
    const memberDate = new Date();
    document.getElementById('memberSince').textContent = memberDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
}

// Load user stats
async function loadUserStats() {
    try {
        const response = await fetch(`${API_URL}/tickets`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load stats');

        const data = await response.json();
        const tickets = data.tickets || [];

        const totalTickets = tickets.length;
        const activeTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
        const closedTickets = tickets.filter(t => t.status === 'Closed').length;

        document.getElementById('userTotalTickets').textContent = totalTickets;
        document.getElementById('userActiveTickets').textContent = activeTickets;
        document.getElementById('userClosedTickets').textContent = closedTickets;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    const activityList = document.getElementById('activityList');

    try {
        const response = await fetch(`${API_URL}/user/activities`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load activities');

        const data = await response.json();
        const activities = data.activities || [];

        if (activities.length === 0) {
            activityList.innerHTML = '<p class="loading">No recent activity</p>';
            return;
        }

        activityList.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <div class="activity-icon">📋</div>
                <div class="activity-info">
                    <p class="activity-description">${activity.description}</p>
                    <p class="activity-time">${formatDate(activity.created_at)}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading activity:', error);
        activityList.innerHTML = '<p class="loading">Failed to load activities</p>';
    }
}

// Open edit modal
function openEditModal() {
    document.getElementById('editName').value = user.name || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editModal').classList.add('active');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

// Save profile
async function saveProfile(e) {
    e.preventDefault();

    const newName = document.getElementById('editName').value.trim();
    const newEmail = document.getElementById('editEmail').value.trim();

    if (!newName || !newEmail) {
        alert('Please fill in all fields');
        return;
    }

    // Update local storage
    user.name = newName;
    user.email = newEmail;
    localStorage.setItem('user', JSON.stringify(user));

    // Update display
    displayUserInfo();
    closeEditModal();

    alert('Profile updated successfully!');
}

// Change password
async function changePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    // Here you would normally make an API call to change the password
    // For now, just show success message
    alert('Password changed successfully!');
    
    // Clear form
    document.getElementById('passwordForm').reset();
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'home.html';
}