from flask import Flask, request, jsonify, redirect ,render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
import os
import sqlite3  # ← Added for admin routes

from models import Database
from ml_predictor import TicketPredictor

# Initialize Flask app
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# Enable CORS (allows frontend to communicate with backend)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize JWT for authentication
jwt = JWTManager(app)

# JWT Error Handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"❌ Invalid token error: {error}")
    return jsonify({'error': 'Invalid token', 'message': str(error)}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print(f"❌ Token expired for user: {jwt_payload.get('sub')}")
    return jsonify({'error': 'Token expired', 'message': 'Please login again'}), 401

@jwt.unauthorized_loader
def unauthorized_callback(error):
    print(f"❌ No authorization header: {error}")
    return jsonify({'error': 'Missing authorization', 'message': 'No token provided'}), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    print(f"❌ Token revoked")
    return jsonify({'error': 'Token revoked', 'message': 'Token has been revoked'}), 401

# Initialize database
db = Database()

# Initialize AI predictor (loads BERT models)
print("\n🤖 Initializing AI Predictor...")
predictor = TicketPredictor()
print("✅ Backend ready!\n")


# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """User registration"""
    try:
        data = request.get_json()
        
        # Validate input
        if not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Hash password
        hashed_password = generate_password_hash(data['password'])
        
        # Create user
        user_id = db.create_user(
            email=data['email'],
            password=hashed_password,
            name=data['name']
        )
        
        if not user_id:
            return jsonify({'error': 'Email already exists'}), 409
        
        # Create JWT token - CONVERT TO STRING
        access_token = create_access_token(identity=str(user_id))
        
        return jsonify({
            'message': 'User created successfully',
            'access_token': access_token,
            'user': {
                'id': user_id,
                'email': data['email'],
                'name': data['name']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=["GET","POST"])
def login():
    """User login"""
    try:
        if request.method == "GET":
            return render_template("login.html")
        data = request.get_json()
        
        # Validate input
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing email or password'}), 400
        
        # Get user
        user = db.get_user_by_email(data['email'])
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check password
        if not check_password_hash(user['password'], data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create JWT token - CONVERT TO STRING
        access_token = create_access_token(identity=str(user['id']))
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# TICKET ROUTES
# ============================================================================

@app.route('/api/tickets/create', methods=['POST'])
@jwt_required()
def create_ticket_user():
    """Create a new ticket with AI prediction"""
    try:
        user_id = int(get_jwt_identity())  # CONVERT BACK TO INT
        data = request.get_json()
                
        # Validate input
        if not data.get('title') or not data.get('description'):
            return jsonify({'error': 'Missing title or description'}), 400
        
        # Use AI to predict category and priority
        print(f"\n🤖 Predicting for: {data['description'][:50]}...")
        prediction = predictor.predict(data['description'])
        
        if not prediction['success']:
            return jsonify({'error': 'AI prediction failed', 'details': prediction.get('error')}), 500
        
        # Create ticket in database
        ticket = db.create_ticket(
            user_id=user_id,
            title=data['title'],
            description=data['description'],
            category=prediction['department'],
            priority=prediction['priority']
        )
        
        # Get full ticket details
        ticket_details = db.get_ticket_by_id(ticket['id'])
        
        return jsonify({
            'message': 'Ticket created successfully',
            'ticket': ticket_details,
            'ai_prediction': {
                'department': prediction['department'],
                'priority': prediction['priority']
            }
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating ticket: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/tickets', methods=['GET'])
@jwt_required()
def get_tickets():
    """Get all tickets for logged-in user"""
    try:
        user_id = int(get_jwt_identity())  # CONVERT BACK TO INT
        
        # Get status filter if provided
        status = request.args.get('status', None)
        
        # Get tickets
        tickets = db.get_tickets_by_user(user_id, status)
        
        return jsonify({
            'tickets': tickets,
            'count': len(tickets)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/tickets/<int:ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket(ticket_id):
    """Get a single ticket by ID"""
    try:
        ticket = db.get_ticket_by_id(ticket_id)
        
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        return jsonify({'ticket': ticket}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/tickets/<int:ticket_id>/status', methods=['PUT'])
@jwt_required()
def update_ticket_status(ticket_id):
    """Update ticket status"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data.get('status'):
            return jsonify({'error': 'Missing status'}), 400
        
        # Valid statuses
        valid_statuses = ['Open', 'In Progress', 'Closed']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {valid_statuses}'}), 400
        
        # Update status
        success = db.update_ticket_status(ticket_id, data['status'], user_id)
        
        if success:
            ticket = db.get_ticket_by_id(ticket_id)
            return jsonify({
                'message': 'Status updated successfully',
                'ticket': ticket
            }), 200
        else:
            return jsonify({'error': 'Failed to update status'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# USER ROUTES
# ============================================================================

@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    try:
        user_id = int(get_jwt_identity())
        user = db.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Remove password from response
        user.pop('password', None)
        
        return jsonify({'user': user}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/user/activities', methods=['GET'])
@jwt_required()
def get_activities():
    """Get recent activities"""
    try:
        user_id = int(get_jwt_identity())
        limit = request.args.get('limit', 5, type=int)
        
        activities = db.get_recent_activities(user_id, limit)
        
        return jsonify({
            'activities': activities,
            'count': len(activities)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# AI ROUTES
# ============================================================================

@app.route('/api/ai/predict', methods=['POST'])
@jwt_required()
def predict():
    """Test AI prediction without creating ticket"""
    try:
        data = request.get_json()
        
        if not data.get('text'):
            return jsonify({'error': 'Missing text'}), 400
        
        # Predict
        prediction = predictor.predict(data['text'])
        
        return jsonify({
            'prediction': prediction
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ai/categories', methods=['GET'])
def get_categories():
    """Get available categories"""
    categories = predictor.get_available_categories()
    return jsonify(categories), 200


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Check if server is running"""
    return jsonify({
        'status': 'healthy',
        'message': 'Backend is running',
        'ai_loaded': True
    }), 200

# ============================================================================
# ROOT ROUTE - REDIRECT TO FRONTEND
# ============================================================================

@app.route('/')
def index():
    # return redirect('http://127.0.0.1:5500/frontend/home.html')
    return render_template('home.html')

# ============================================================================
# ADMIN ROUTES
# ============================================================================

def is_admin_request():
    """Check if request has admin authorization"""
    auth_header = request.headers.get('Authorization')
    return auth_header == 'Bearer admin_token'


@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    """Get all users with their ticket counts"""
    if not is_admin_request():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # ✅ FIXED: Use correct database path
        db_path = os.path.join(os.path.dirname(__file__), 'database', 'ticket_system.db')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all users with ticket count
        cursor.execute('''
            SELECT u.*, COUNT(t.id) as ticket_count
            FROM users u
            LEFT JOIN tickets t ON u.id = t.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        ''')
        
        users = []
        for row in cursor.fetchall():
            users.append({
                'id': row['id'],
                'name': row['name'],
                'email': row['email'],
                'created_at': row['created_at'],
                'ticket_count': row['ticket_count']
            })
        
        conn.close()
        print(f"✅ Admin fetched {len(users)} users")
        return jsonify({'users': users}), 200
        
    except Exception as e:
        print(f"❌ Error fetching users: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/tickets', methods=['GET'])
def admin_get_tickets():
    """Get all tickets from all users"""
    if not is_admin_request():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # ✅ FIXED: Use correct database path
        db_path = os.path.join(os.path.dirname(__file__), 'database', 'ticket_system.db')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all tickets with user info
        cursor.execute('''
            SELECT t.*, u.name as user_name, u.email as user_email
            FROM tickets t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        ''')
        
        tickets = []
        for row in cursor.fetchall():
            tickets.append({
                'id': row['id'],
                'ticket_number': row['ticket_number'],
                'title': row['title'],
                'description': row['description'],
                'category': row['category'],
                'priority': row['priority'],
                'status': row['status'],
                'user_id': row['user_id'],
                'user_name': row['user_name'],
                'user_email': row['user_email'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at']
            })
        
        conn.close()
        print(f"✅ Admin fetched {len(tickets)} tickets")
        return jsonify({'tickets': tickets}), 200
        
    except Exception as e:
        print(f"❌ Error fetching tickets: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/tickets/<int:ticket_id>', methods=['PUT'])
def admin_update_ticket(ticket_id):
    """Update ticket department, priority, or status"""
    if not is_admin_request():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        category = data.get('category')
        priority = data.get('priority')
        status = data.get('status')
        
        # ✅ FIXED: Use correct database path
        db_path = os.path.join(os.path.dirname(__file__), 'database', 'ticket_system.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE tickets 
            SET category = ?, priority = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (category, priority, status, ticket_id))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Admin updated ticket #{ticket_id}")
        return jsonify({
            'message': 'Ticket updated successfully',
            'ticket_id': ticket_id
        }), 200
        
    except Exception as e:
        print(f"❌ Error updating ticket: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/tickets/<int:ticket_id>', methods=['DELETE'])
def admin_delete_ticket(ticket_id):
    """Delete a ticket"""
    if not is_admin_request():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # ✅ FIXED: Use correct database path
        db_path = os.path.join(os.path.dirname(__file__), 'database', 'ticket_system.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Delete ticket
        cursor.execute('DELETE FROM tickets WHERE id = ?', (ticket_id,))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Admin deleted ticket #{ticket_id}")
        return jsonify({'message': 'Ticket deleted successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error deleting ticket: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    """Delete a user and all their tickets"""
    if not is_admin_request():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # ✅ FIXED: Use correct database path
        db_path = os.path.join(os.path.dirname(__file__), 'database', 'ticket_system.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Delete user's tickets first
        cursor.execute('DELETE FROM tickets WHERE user_id = ?', (user_id,))
        
        # Delete user
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Admin deleted user #{user_id}")
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error deleting user: {e}")
        return jsonify({'error': str(e)}), 500





## add enpoint for missing pages

@app.route('/api/auth/history')
def history():
    return render_template('history.html')

@app.route('/api/auth/settings')
def settings():
    return render_template('settings.html')

# dashboard
@app.route('/api/auth/dashboard')
def dashboard():
    return render_template('dashboard.html')

# remaining pages
@app.route('/api/auth/profile')
def profile():
    return render_template('profile.html')

@app.route('/api/auth/create_ticket')
def create_ticket():
    return render_template('create_ticket.html')

@app.route('/api/auth/progress')
def progress():
    return render_template('progress.html')

@app.route('/api/auth/home')
def home():
    return render_template('home.html')

@app.route('/api/auth/admin_login')
def admin_login():
    return render_template('admin_login.html')

@app.route('/api/auth/admin_dashboard')
def admin_dashboard():
    return render_template('admin_dashboard.html')

# ============================================================================
# RUN SERVER
# ============================================================================

# if __name__ == '__main__':
#     print("\n" + "="*60)
#     print("🚀 TICKET SYSTEM BACKEND SERVER")
#     print("="*60)
#     print("📍 Server running on: http://127.0.0.1:5000")
#     print("🤖 AI Models: Loaded")
#     print("🗄️  Database: Connected")
#     print("="*60 + "\n")
    
#     # For local development
#     app.run(debug=True, port=5000)
# else:
#     # For production (Render, Heroku, etc.)
#     import os
#     port = int(os.environ.get('PORT', 5000))
#     # App runs via gunicorn in production
#     app.run(host="0.0.0.0", port=port, debug=True)

if __name__ == "__main__":
    # Get port from environment variable (Render provides this)
    # Default to 10000 if not found
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)