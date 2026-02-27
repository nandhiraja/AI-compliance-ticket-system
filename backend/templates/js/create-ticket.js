// ==================== CONFIGURATION ====================
import API_URL from './config.js';

// ==================== CHECK AUTHENTICATION ====================
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'login.html';
}

// ==================== LOAD USER INFO ====================
document.getElementById('userName').textContent = user.name || 'User';
document.getElementById('userEmail').textContent = user.email || '';

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

// ==================== CHARACTER COUNTERS ====================
const titleInput = document.getElementById('title');
const descInput = document.getElementById('description');

// Update character counts
titleInput.addEventListener('input', () => {
    const charCount = titleInput.closest('.form-group').querySelector('.char-count');
    if (charCount) {
        charCount.textContent = `${titleInput.value.length} / 100`;
    }
});

descInput.addEventListener('input', () => {
    const charCount = descInput.closest('.form-group').querySelector('.char-count');
    if (charCount) {
        charCount.textContent = `${descInput.value.length} / 1000`;
    }
});

// ==================== PREDICT BUTTON ====================
document.getElementById('predictBtn').addEventListener('click', async () => {
    const description = descInput.value.trim();
    
    if (!description) {
        alert('Please enter a description first!');
        return;
    }
    
    // Show loading state
    document.getElementById('predictionPlaceholder').style.display = 'none';
    document.getElementById('predictionLoading').style.display = 'block';
    document.getElementById('predictionResults').style.display = 'none';
    
    try {
        console.log('🔑 Sending request with token...');
        
        const response = await fetch(`${API_URL}/ai/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text: description })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Prediction failed');
        }
        
        console.log('✅ Prediction received:', data);
        
        // Hide loading, show results
        document.getElementById('predictionLoading').style.display = 'none';
        document.getElementById('predictionResults').style.display = 'block';
        
        // Display prediction
        document.getElementById('predictedCategory').textContent = data.prediction.department;
        document.getElementById('predictedPriority').textContent = data.prediction.priority;
        
        // Store prediction for ticket creation
        window.aiPrediction = data.prediction;
        
    } catch (error) {
        console.error('❌ Prediction error:', error);
        document.getElementById('predictionLoading').style.display = 'none';
        document.getElementById('predictionPlaceholder').style.display = 'block';
        alert('Failed to get AI prediction. Error: ' + error.message);
    }
});

// ==================== CREATE TICKET FORM ====================
document.getElementById('ticketForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    
    if (!title || !description) {
        alert('Please fill in all required fields!');
        return;
    }
    
    // Disable submit button
    const submitBtn = document.getElementById('submitBtn');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Creating...</span>';
    submitBtn.disabled = true;
    
    try {
        console.log('🎫 Creating ticket...');
        
        const response = await fetch(`${API_URL}/tickets/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: title,
                description: description
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create ticket');
        }
        
        console.log('✅ Ticket created:', data);
        
        // Show success modal
        document.getElementById('ticketNumber').textContent = data.ticket.ticket_number;
        document.getElementById('successModal').style.display = 'flex';
        
        // Reset form
        titleInput.value = '';
        descInput.value = '';
        const charCounts = document.querySelectorAll('.char-count');
        charCounts.forEach(el => el.textContent = el.textContent.replace(/\d+/, '0'));
        
        // Reset prediction display
        document.getElementById('predictionResults').style.display = 'none';
        document.getElementById('predictionPlaceholder').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Create ticket error:', error);
        alert(`Failed to create ticket: ${error.message}`);
    } finally {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    }
});

// ==================== MODAL FUNCTIONS ====================
function closeModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Make closeModal available globally
window.closeModal = closeModal;

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('successModal');
    if (e.target === modal) {
        closeModal();
    }
});