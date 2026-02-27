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
    await loadTickets();
}

// Setup event listeners
function setupEventListeners() {
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
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('priorityFilter').addEventListener('change', applyFilters);
    document.getElementById('departmentFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

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

// Load tickets
async function loadTickets() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const ticketsGrid = document.getElementById('ticketsGrid');

    try {
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        ticketsGrid.style.display = 'none';

        const response = await fetch(`${API_URL}/tickets`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load tickets');

        const data = await response.json();
        allTickets = data.tickets || [];

        // Filter only active tickets (Open or In Progress)
        allTickets = allTickets.filter(ticket => 
            ticket.status === 'Open' || ticket.status === 'In Progress'
        );

        filteredTickets = [...allTickets];
        
        loadingState.style.display = 'none';

        if (allTickets.length === 0) {
            emptyState.style.display = 'block';
        } else {
            ticketsGrid.style.display = 'grid';
            displayTickets();
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
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;

    // Filter tickets
    filteredTickets = allTickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(searchTerm) || 
                            ticket.ticket_number.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || ticket.status === statusFilter;
        const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
        const matchesDepartment = !departmentFilter || ticket.category === departmentFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
    });

    // Sort tickets
    sortTickets(sortFilter);

    // Display filtered tickets
    displayTickets();
    updateStats();
}

// Sort tickets
function sortTickets(sortType) {
    switch (sortType) {
        case 'date_asc':
            filteredTickets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'date_desc':
            filteredTickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'priority':
            const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
            filteredTickets.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            break;
    }
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('priorityFilter').value = '';
    document.getElementById('departmentFilter').value = '';
    document.getElementById('sortFilter').value = 'date_desc';
    applyFilters();
}

// Display tickets
function displayTickets() {
    const ticketsGrid = document.getElementById('ticketsGrid');
    const ticketCount = document.getElementById('ticketCount');

    ticketCount.textContent = `${filteredTickets.length} ticket${filteredTickets.length !== 1 ? 's' : ''}`;

    if (filteredTickets.length === 0) {
        ticketsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No Tickets Found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }

    ticketsGrid.innerHTML = filteredTickets.map(ticket => `
        <div class="ticket-card" onclick="viewTicketDetails(${ticket.id})">
            <div class="ticket-header">
                <span class="ticket-id">#${ticket.ticket_number}</span>
                <div class="ticket-badges">
                    <span class="status-badge status-${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>
                    <span class="priority-badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span>
                </div>
            </div>
            <h3 class="ticket-title">${ticket.title}</h3>
            <p class="ticket-description">${ticket.description}</p>
            <div class="ticket-meta">
                <div class="ticket-info">
                    <span>📁 ${ticket.category}</span>
                    <span>📅 ${formatDate(ticket.created_at)}</span>
                </div>
                <div class="ticket-actions" onclick="event.stopPropagation()">
                    <button class="btn-action btn-view" onclick="viewTicketDetails(${ticket.id})">View</button>
                    <button class="btn-action btn-update" onclick="updateTicketStatus(${ticket.id}, '${ticket.status}')">Update</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update stats
function updateStats() {
    const totalActive = allTickets.length;
    const openCount = allTickets.filter(t => t.status === 'Open').length;
    const inProgressCount = allTickets.filter(t => t.status === 'In Progress').length;
    const urgentCount = allTickets.filter(t => t.priority === 'Critical' || t.priority === 'High').length;

    document.getElementById('totalActive').textContent = totalActive;
    document.getElementById('openCount').textContent = openCount;
    document.getElementById('inProgressCount').textContent = inProgressCount;
    document.getElementById('urgentCount').textContent = urgentCount;
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

    ticketDetails.innerHTML = `
        <div class="detail-section">
            <h3>Ticket Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Ticket Number</span>
                    <span class="detail-value">#${ticket.ticket_number}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="status-badge status-${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>
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
                    <span class="detail-value">${formatDate(ticket.created_at)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Last Updated</span>
                    <span class="detail-value">${formatDate(ticket.updated_at)}</span>
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

        <div class="modal-actions">
            ${ticket.status === 'Open' ? 
                `<button class="btn-primary" onclick="updateTicketStatus(${ticket.id}, 'Open')">Mark In Progress</button>` :
                `<button class="btn-primary" onclick="updateTicketStatus(${ticket.id}, 'In Progress')">Mark as Closed</button>`
            }
            <button class="btn-secondary" onclick="closeModal()">Close</button>
        </div>
    `;

    modal.classList.add('active');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('ticketModal');
    modal.classList.remove('active');
}

// Update ticket status
async function updateTicketStatus(ticketId, currentStatus) {
    let newStatus;
    if (currentStatus === 'Open') {
        newStatus = 'In Progress';
    } else if (currentStatus === 'In Progress') {
        newStatus = 'Closed';
    } else {
        return;
    }

    const confirmMessage = `Change ticket status from "${currentStatus}" to "${newStatus}"?`;
    if (!confirm(confirmMessage)) return;

    try {
        const response = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update status');

        closeModal();
        await loadTickets(); // Reload tickets
        alert(`Ticket status updated to "${newStatus}"`);

    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update ticket status');
    }
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