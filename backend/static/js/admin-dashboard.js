// ==================== CONFIGURATION ====================
import API_URL from './config.js';// ==================== CHECK AUTHENTICATION ====================
const adminToken = localStorage.getItem('adminToken');
if (!adminToken || adminToken !== 'admin_authenticated') {
    window.location.href = 'home.html';  // ✅ FIXED: Changed from login.html
}

// ==================== GLOBAL VARIABLES ====================
let allUsers = [];
let allTickets = [];
let filteredTickets = [];
let currentEditTicket = null;

// Priority order for sorting
const PRIORITY_ORDER = {
    'Critical': 1,
    'High': 2,
    'Medium': 3,
    'Low': 4
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadUsersData();
    loadTicketsData();
});

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            switchTab(tab);
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Search
    document.getElementById('userSearch')?.addEventListener('input', filterUsers);
    document.getElementById('ticketSearch')?.addEventListener('input', filterTickets);

    // Filters
    document.getElementById('statusFilter')?.addEventListener('change', filterTickets);
    document.getElementById('priorityFilter')?.addEventListener('change', filterTickets);

    // Modal
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
    document.getElementById('editForm')?.addEventListener('submit', saveTicketChanges);
}

// ==================== TAB SWITCHING ====================
function switchTab(tab) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tab) {
            item.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    if (tab === 'users') {
        document.getElementById('usersTab').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Users Management';
    } else if (tab === 'tickets') {
        document.getElementById('ticketsTab').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Tickets Management';
    }
}

// ==================== LOAD USERS DATA ====================
async function loadUsersData() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: {
                'Authorization': 'Bearer admin_token'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load users');
        }

        const data = await response.json();
        allUsers = data.users || [];
        
        displayUsers(allUsers);
        updateUserStats();

    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = `
            <tr>
                <td colspan="7" class="loading">Unable to load users. Make sure backend is running.</td>
            </tr>
        `;
    }
}

// ==================== DISPLAY USERS ====================
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">No users found</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>#${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.ticket_count || 0}</td>
            <td>${formatDate(user.created_at)}</td>
            <td><span class="status-badge active">Active</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-view" onclick="viewUserDetails(${user.id})">View</button>
                    <button class="btn-action btn-delete" onclick="deleteUser(${user.id}, '${user.name}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==================== UPDATE USER STATS ====================
function updateUserStats() {
    document.getElementById('totalUsers').textContent = allUsers.length;
    document.getElementById('activeUsers').textContent = allUsers.length;
    
    const totalTickets = allUsers.reduce((sum, user) => sum + (user.ticket_count || 0), 0);
    document.getElementById('totalUserTickets').textContent = totalTickets;
}

// ==================== FILTER USERS ====================
function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    
    const filtered = allUsers.filter(user => {
        return user.name.toLowerCase().includes(searchTerm) ||
               user.email.toLowerCase().includes(searchTerm) ||
               user.id.toString().includes(searchTerm);
    });

    displayUsers(filtered);
}

// ==================== LOAD TICKETS DATA ====================
async function loadTicketsData() {
    try {
        const response = await fetch(`${API_URL}/admin/tickets`, {
            headers: {
                'Authorization': 'Bearer admin_token'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load tickets');
        }

        const data = await response.json();
        allTickets = data.tickets || [];
        
        // ==================== SORT BY PRIORITY ====================
        allTickets.sort((a, b) => {
            return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        });
        
        filteredTickets = [...allTickets];
        
        displayTickets(filteredTickets);
        updateTicketStats();

    } catch (error) {
        console.error('Error loading tickets:', error);
        document.getElementById('ticketsTableBody').innerHTML = `
            <tr>
                <td colspan="8" class="loading">Unable to load tickets. Make sure backend is running.</td>
            </tr>
        `;
    }
}

// ==================== DISPLAY TICKETS (SORTED BY PRIORITY) ====================
function displayTickets(tickets) {
    const tbody = document.getElementById('ticketsTableBody');

    if (tickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="loading">No tickets found</td>
            </tr>
        `;
        return;
    }

    // Sort tickets by priority before displaying
    const sortedTickets = [...tickets].sort((a, b) => {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });

    tbody.innerHTML = sortedTickets.map(ticket => `
        <tr>
            <td>#${ticket.ticket_number}</td>
            <td>${ticket.title}</td>
            <td>${ticket.user_name || 'Unknown'}</td>
            <td>${ticket.category}</td>
            <td><span class="priority-badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span></td>
            <td><span class="status-badge status-${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span></td>
            <td>${formatDate(ticket.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editTicket(${ticket.id})">Edit</button>
                    <button class="btn-action btn-delete" onclick="deleteTicket(${ticket.id}, '${ticket.ticket_number}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==================== UPDATE TICKET STATS ====================
function updateTicketStats() {
    const total = allTickets.length;
    const open = allTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
    const closed = allTickets.filter(t => t.status === 'Closed').length;
    const critical = allTickets.filter(t => t.priority === 'Critical').length;

    document.getElementById('totalTickets').textContent = total;
    document.getElementById('openTickets').textContent = open;
    document.getElementById('closedTickets').textContent = closed;
    document.getElementById('criticalTickets').textContent = critical;
}

// ==================== FILTER TICKETS ====================
function filterTickets() {
    const searchTerm = document.getElementById('ticketSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;

    filteredTickets = allTickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(searchTerm) ||
                            ticket.ticket_number.toLowerCase().includes(searchTerm) ||
                            ticket.description.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || ticket.status === statusFilter;
        const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    displayTickets(filteredTickets);
}

// ==================== EDIT TICKET ====================
async function editTicket(ticketId) {
    try {
        const ticket = allTickets.find(t => t.id === ticketId);
        
        if (!ticket) {
            showToast('Ticket not found', 'error');
            return;
        }

        currentEditTicket = ticket;

        // Populate form
        document.getElementById('editTicketId').value = ticket.id;
        document.getElementById('editTicketNumber').value = ticket.ticket_number;
        document.getElementById('editTitle').value = ticket.title;
        document.getElementById('editDescription').value = ticket.description;
        document.getElementById('editDepartment').value = ticket.category;
        document.getElementById('editPriority').value = ticket.priority;
        document.getElementById('editStatus').value = ticket.status;

        // Show modal
        document.getElementById('editModal').classList.add('active');

    } catch (error) {
        console.error('Error editing ticket:', error);
        showToast('Failed to load ticket details', 'error');
    }
}

// ==================== SAVE TICKET CHANGES ====================
async function saveTicketChanges(e) {
    e.preventDefault();

    const ticketId = document.getElementById('editTicketId').value;
    const department = document.getElementById('editDepartment').value;
    const priority = document.getElementById('editPriority').value;
    const status = document.getElementById('editStatus').value;

    try {
        const response = await fetch(`${API_URL}/admin/tickets/${ticketId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin_token'
            },
            body: JSON.stringify({
                category: department,
                priority: priority,
                status: status
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update ticket');
        }

        // Update local data
        const ticketIndex = allTickets.findIndex(t => t.id == ticketId);
        if (ticketIndex !== -1) {
            allTickets[ticketIndex].category = department;
            allTickets[ticketIndex].priority = priority;
            allTickets[ticketIndex].status = status;
        }

        closeModal();
        filterTickets(); // Refresh display with priority sorting
        updateTicketStats();
        showToast('Ticket updated successfully!', 'success');

    } catch (error) {
        console.error('Error updating ticket:', error);
        showToast('Failed to update ticket', 'error');
    }
}

// ==================== DELETE TICKET ====================
async function deleteTicket(ticketId, ticketNumber) {
    if (!confirm(`Are you sure you want to delete ticket ${ticketNumber}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/tickets/${ticketId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer admin_token'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete ticket');
        }

        // Remove from local array
        allTickets = allTickets.filter(t => t.id !== ticketId);
        filteredTickets = filteredTickets.filter(t => t.id !== ticketId);

        displayTickets(filteredTickets);
        updateTicketStats();
        showToast('Ticket deleted successfully!', 'success');

    } catch (error) {
        console.error('Error deleting ticket:', error);
        showToast('Failed to delete ticket', 'error');
    }
}

// ==================== VIEW USER DETAILS ====================
function viewUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        alert(`User Details:\n\nID: ${user.id}\nName: ${user.name}\nEmail: ${user.email}\nTickets: ${user.ticket_count || 0}\nJoined: ${formatDate(user.created_at)}`);
    }
}

// ==================== DELETE USER ====================
async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"?\nThis will also delete all their tickets!`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer admin_token'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }

        // Remove from local array
        allUsers = allUsers.filter(u => u.id !== userId);

        displayUsers(allUsers);
        updateUserStats();
        showToast('User deleted successfully!', 'success');

    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Failed to delete user', 'error');
    }
}

// ==================== MODAL FUNCTIONS ====================
function closeModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEditTicket = null;
}

// Close modal when clicking outside
document.getElementById('editModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeModal();
    }
});

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== UTILITY FUNCTIONS ====================
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// ==================== LOGOUT ====================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'home.html';  // ✅ Already correct
    }
}

// ==================== MAKE FUNCTIONS GLOBAL ====================
window.editTicket = editTicket;
window.deleteTicket = deleteTicket;
window.viewUserDetails = viewUserDetails;
window.deleteUser = deleteUser;