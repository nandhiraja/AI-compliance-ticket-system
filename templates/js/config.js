// Change this after deployment
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000/api'  // Local development
    : 'https://your-app-name.onrender.com/api';  // Production

export default API_URL;