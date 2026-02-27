// ==================== CONFIGURATION ====================
import API_URL from './config.js';

// ==================== CHECK AUTHENTICATION ====================
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    // Not logged in, redirect to login
    window.location.href = 'login.html';
}

// ==================== LOAD USER INFO ====================
document.getElementById('userName').textContent = user.name || 'User';
document.getElementById('userEmail').textContent = user.email || '';

// Update avatar with user's initials
const avatar = document.querySelector('.avatar');
if (user.name) {
    avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`;
}

// ==================== SIDEBAR TOGGLE ====================
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// ==================== LOGOUT ====================
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'home.html';
    }
});

// ==================== FETCH TICKETS ====================
async function loadTickets() {
    try {
        const response = await fetch(`${API_URL}/tickets`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tickets');
        }

        const data = await response.json();
        displayTickets(data.tickets);
        updateStats(data.tickets);
    } catch (error) {
        console.error('Error loading tickets:', error);
        document.getElementById('ticketsContainer').innerHTML = 
            '<p style="text-align: center; color: #64748b; padding: 40px;">No tickets found. Create your first ticket!</p>';
    }
}

// ==================== DISPLAY TICKETS ====================
function displayTickets(tickets) {
    const container = document.getElementById('ticketsContainer');
    
    if (tickets.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No tickets yet. Create your first ticket!</p>';
        return;
    }

    // Show only recent 5 tickets
    const recentTickets = tickets.slice(0, 5);
    
    container.innerHTML = recentTickets.map(ticket => `
        <div class="ticket-card" onclick="viewTicket(${ticket.id})">
            <div class="ticket-header">
                <span class="ticket-number">${ticket.ticket_number}</span>
                <span class="ticket-status ${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>
            </div>
            <h3 class="ticket-title">${ticket.title}</h3>
            <div class="ticket-meta">
                <span>📁 ${ticket.category}</span>
                <span>⚡ ${ticket.priority}</span>
                <span>🕒 ${formatDate(ticket.created_at)}</span>
            </div>
        </div>
    `).join('');
}

// ==================== UPDATE STATS ====================
function updateStats(tickets) {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'Open').length;
    const inProgress = tickets.filter(t => t.status === 'In Progress').length;
    const closed = tickets.filter(t => t.status === 'Closed').length;

    document.getElementById('totalTickets').textContent = total;
    document.getElementById('openTickets').textContent = open;
    document.getElementById('inProgressTickets').textContent = inProgress;
    document.getElementById('closedTickets').textContent = closed;
}

// ==================== LOAD ACTIVITIES ====================
async function loadActivities() {
    try {
        const response = await fetch(`${API_URL}/user/activities?limit=5`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch activities');
        }

        const data = await response.json();
        displayActivities(data.activities);
    } catch (error) {
        console.error('Error loading activities:', error);
        document.getElementById('activitiesContainer').innerHTML = 
            '<p style="text-align: center; color: #64748b; padding: 40px;">No recent activities.</p>';
    }
}

// ==================== DISPLAY ACTIVITIES ====================
function displayActivities(activities) {
    const container = document.getElementById('activitiesContainer');
    
    if (activities.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No recent activities.</p>';
        return;
    }

    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
            </div>
            <div class="activity-info">
                <p class="activity-description">${activity.description}</p>
                <span class="activity-time">${formatDate(activity.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

// ==================== HELPER FUNCTIONS ====================
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
    
    return date.toLocaleDateString();
}

function viewTicket(ticketId) {
    // For now, just show an alert
    // Later we'll create a ticket details page
    alert(`Ticket details page coming soon! Ticket ID: ${ticketId}`);
}

// ==================== LOAD DATA ON PAGE LOAD ====================
window.addEventListener('DOMContentLoaded', () => {
    loadTickets();
    loadActivities();
});