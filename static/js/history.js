// API Configuration
import API_URL from './config.js';

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Check authentication
if (!token) {
    window.location.href = 'login.html';
}

// Global variables
let allTickets = [];
let filteredTickets = [];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

async function initializePage() {
    setupEventListeners();
    displayUserInfo();
    setDefaultDates();
    await loadTickets();
}

// Setup event listeners
function setupEventListeners() {
    // Menu toggle
    // Menu toggle
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

    // Filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('startDate').addEventListener('change', applyFilters);
    document.getElementById('endDate').addEventListener('change', applyFilters);
    document.getElementById('priorityFilter').addEventListener('change', applyFilters);
    document.getElementById('departmentFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

    // Export
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);

    // Modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('ticketModal').addEventListener('click', (e) => {
        if (e.target.id === 'ticketModal') closeModal();
    });
}

// Display user info
function displayUserInfo() {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    userName.textContent = user.name || 'User';
    userAvatar.textContent = (user.name || 'U')[0].toUpperCase();
}

// Set default dates (last 30 days)
function setDefaultDates() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    document.getElementById('endDate').valueAsDate = endDate;
    document.getElementById('startDate').valueAsDate = startDate;
}

// Load tickets
async function loadTickets() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const ticketsTimeline = document.getElementById('ticketsTimeline');

    try {
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        ticketsTimeline.style.display = 'none';

        const response = await fetch(`${API_URL}/tickets`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load tickets');

        const data = await response.json();
        allTickets = data.tickets || [];

        // Filter only closed tickets
        allTickets = allTickets.filter(ticket => ticket.status === 'Closed');

        filteredTickets = [...allTickets];
        
        loadingState.style.display = 'none';

        if (allTickets.length === 0) {
            emptyState.style.display = 'block';
        } else {
            ticketsTimeline.style.display = 'flex';
            applyFilters();
            updateStats();
        }

    } catch (error) {
        console.error('Error loading tickets:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;

    // Filter tickets
    filteredTickets = allTickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(searchTerm) || 
                            ticket.ticket_number.toLowerCase().includes(searchTerm) ||
                            ticket.description.toLowerCase().includes(searchTerm);
        
        const ticketDate = new Date(ticket.updated_at);
        const matchesStartDate = !startDate || ticketDate >= new Date(startDate);
        const matchesEndDate = !endDate || ticketDate <= new Date(endDate + 'T23:59:59');
        
        const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
        const matchesDepartment = !departmentFilter || ticket.category === departmentFilter;

        return matchesSearch && matchesStartDate && matchesEndDate && matchesPriority && matchesDepartment;
    });

    // Sort tickets
    sortTickets(sortFilter);

    // Display filtered tickets
    displayTickets();
}

// Sort tickets
function sortTickets(sortType) {
    switch (sortType) {
        case 'closed_desc':
            filteredTickets.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            break;
        case 'closed_asc':
            filteredTickets.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
            break;
        case 'created_desc':
            filteredTickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'created_asc':
            filteredTickets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
    }
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('priorityFilter').value = '';
    document.getElementById('departmentFilter').value = '';
    document.getElementById('sortFilter').value = 'closed_desc';
    setDefaultDates();
    applyFilters();
}

// Display tickets
function displayTickets() {
    const ticketsTimeline = document.getElementById('ticketsTimeline');
    const ticketCount = document.getElementById('ticketCount');

    ticketCount.textContent = `${filteredTickets.length} ticket${filteredTickets.length !== 1 ? 's' : ''}`;

    if (filteredTickets.length === 0) {
        ticketsTimeline.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No Tickets Found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    ticketsTimeline.innerHTML = filteredTickets.map(ticket => `
        <div class="timeline-item">
            <div class="timeline-marker">✅</div>
            <div class="timeline-content" onclick="viewTicketDetails(${ticket.id})">
                <div class="ticket-header">
                    <span class="ticket-id">#${ticket.ticket_number}</span>
                    <div class="ticket-badges">
                        <span class="priority-badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span>
                    </div>
                </div>
                <h3 class="ticket-title">${ticket.title}</h3>
                <p class="ticket-description">${ticket.description}</p>
                <div class="ticket-meta">
                    <div class="meta-left">
                        <span class="meta-item">📁 ${ticket.category}</span>
                        <span class="meta-item">📅 Closed ${formatDate(ticket.updated_at)}</span>
                    </div>
                    <span class="resolution-time">⚡ ${calculateResolutionTime(ticket)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Update stats
function updateStats() {
    const totalClosed = allTickets.length;
    
    // This month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = allTickets.filter(t => new Date(t.updated_at) >= firstDayOfMonth).length;
    
    // Average resolution time
    const avgResolution = calculateAverageResolution();
    
    // Critical resolved
    const criticalResolved = allTickets.filter(t => t.priority === 'Critical').length;

    document.getElementById('totalClosed').textContent = totalClosed;
    document.getElementById('thisMonth').textContent = thisMonth;
    document.getElementById('avgResolution').textContent = avgResolution;
    document.getElementById('criticalResolved').textContent = criticalResolved;
}

// Calculate resolution time
function calculateResolutionTime(ticket) {
    const created = new Date(ticket.created_at);
    const closed = new Date(ticket.updated_at);
    const diffMs = closed - created;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return '<1h';
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
}

// Calculate average resolution
function calculateAverageResolution() {
    if (allTickets.length === 0) return '0h';

    const totalHours = allTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const closed = new Date(ticket.updated_at);
        const diffHours = Math.floor((closed - created) / 3600000);
        return sum + diffHours;
    }, 0);

    const avgHours = Math.floor(totalHours / allTickets.length);
    
    if (avgHours < 24) return `${avgHours}h`;
    const avgDays = Math.floor(avgHours / 24);
    return `${avgDays}d`;
}

// View ticket details
async function viewTicketDetails(ticketId) {
    try {
        const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load ticket details');

        const data = await response.json();
        const ticket = data.ticket;

        showTicketModal(ticket);

    } catch (error) {
        console.error('Error loading ticket details:', error);
        alert('Failed to load ticket details');
    }
}

// Show ticket modal
function showTicketModal(ticket) {
    const modal = document.getElementById('ticketModal');
    const ticketDetails = document.getElementById('ticketDetails');

    const resolutionTime = calculateResolutionTime(ticket);

    ticketDetails.innerHTML = `
        <div class="detail-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0;">Ticket Information</h3>
                <div class="resolution-badge">
                    ⚡ Resolved in ${resolutionTime}
                </div>
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Ticket Number</span>
                    <span class="detail-value">#${ticket.ticket_number}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="status-badge">Closed</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Priority</span>
                    <span class="priority-badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Department</span>
                    <span class="detail-value">${ticket.category}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Created</span>
                    <span class="detail-value">${formatFullDate(ticket.created_at)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Closed</span>
                    <span class="detail-value">${formatFullDate(ticket.updated_at)}</span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3>Title</h3>
            <div class="detail-content">${ticket.title}</div>
        </div>

        <div class="detail-section">
            <h3>Description</h3>
            <div class="detail-content">${ticket.description}</div>
        </div>

        <div style="padding: 20px 24px; text-align: center; border-top: 2px solid #f1f5f9;">
            <button class="btn-primary" onclick="closeModal()" style="border: none; cursor: pointer;">Close</button>
        </div>
    `;

    modal.classList.add('active');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('ticketModal');
    modal.classList.remove('active');
}

// Export to CSV
function exportToCSV() {
    if (filteredTickets.length === 0) {
        alert('No tickets to export');
        return;
    }

    // CSV Headers
    const headers = ['Ticket Number', 'Title', 'Description', 'Status', 'Priority', 'Department', 'Created', 'Closed', 'Resolution Time'];
    
    // CSV Rows
    const rows = filteredTickets.map(ticket => {
        return [
            ticket.ticket_number,
            `"${ticket.title.replace(/"/g, '""')}"`,
            `"${ticket.description.replace(/"/g, '""')}"`,
            ticket.status,
            ticket.priority,
            ticket.category,
            formatFullDate(ticket.created_at),
            formatFullDate(ticket.updated_at),
            calculateResolutionTime(ticket)
        ];
    });

    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `ticket_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Format date (relative)
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

// Format date (full)
function formatFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'home.html';
}