// ==================== CONFIGURATION ====================
import API_URL from './config.js';

// ==================== TAB SWITCHING ====================
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
});

// ==================== ALERT FUNCTIONS ====================
function showAlert(message, type) {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

// ==================== LOGIN HANDLER ====================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // ==================== CHECK IF ADMIN ====================
    // Admin credentials: username = "admin", password = "123456"
    if (email === 'admin' && password === '123456') {
        // Admin login
        localStorage.setItem('adminToken', 'admin_authenticated');
        localStorage.setItem('adminUser', 'Administrator');
        
        showAlert('Admin login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1000);
        return;
    }
    
    // ==================== REGULAR USER LOGIN ====================
    // Disable button during request
    const submitBtn = loginForm.querySelector('.btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Signing in...</span>';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token and user info
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }
            
            showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard after 1 second
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showAlert(data.error || 'Login failed. Please try again.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Cannot connect to server. Make sure backend is running.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// ==================== SIGNUP HANDLER ====================
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    // Basic validation
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long.', 'error');
        return;
    }
    
    // Disable button during request
    const submitBtn = signupForm.querySelector('.btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Creating account...</span>';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token and user info
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showAlert('Account created successfully! Redirecting...', 'success');
            
            // Redirect to dashboard after 1 second
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showAlert(data.error || 'Signup failed. Please try again.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Signup error:', error);
        showAlert('Cannot connect to server. Make sure backend is running.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// ==================== CHECK IF ALREADY LOGGED IN ====================
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    
    if (adminToken === 'admin_authenticated') {
        // Admin is logged in, redirect to admin dashboard
        window.location.href = 'admin-dashboard.html';
    } else if (token) {
        // User is already logged in, redirect to dashboard
        window.location.href = 'dashboard.html';
    }
});