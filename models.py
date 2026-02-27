from datetime import datetime
import sqlite3
import os

class Database:
    """
    Simple database handler for tickets and users
    Using SQLite for easy setup
    """
    
    def __init__(self, db_path='database/ticket_system.db'):
        """Initialize database connection"""
        # Get absolute path
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.db_path = os.path.join(base_dir, db_path)
        
        # Ensure database directory exists
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        # Create tables if they don't exist
        self.create_tables()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Return rows as dictionaries
        return conn
    
    def create_tables(self):
        """Create all database tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                avatar TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tickets table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_number TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                priority TEXT NOT NULL,
                status TEXT DEFAULT 'Open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        # Ticket history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ticket_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                changed_by INTEGER NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id),
                FOREIGN KEY (changed_by) REFERENCES users(id)
            )
        ''')
        
        # Activities table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                activity_type TEXT NOT NULL,
                description TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ Database tables created successfully")
    
    # USER OPERATIONS
    
    def create_user(self, email, password, name):
        """Create a new user"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
                (email, password, name)
            )
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
            return user_id
        except sqlite3.IntegrityError:
            conn.close()
            return None  # Email already exists
    
    def get_user_by_email(self, email):
        """Get user by email"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        conn.close()
        return dict(user) if user else None
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        return dict(user) if user else None
    
    # TICKET OPERATIONS
    
    def create_ticket(self, user_id, title, description, category, priority):
        """Create a new ticket"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Generate ticket number
        cursor.execute('SELECT COUNT(*) as count FROM tickets')
        count = cursor.fetchone()['count']
        ticket_number = f"TKT-{count + 1:05d}"
        
        # Insert ticket
        cursor.execute('''
            INSERT INTO tickets (ticket_number, user_id, title, description, category, priority)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (ticket_number, user_id, title, description, category, priority))
        
        ticket_id = cursor.lastrowid
        
        # Add to history
        cursor.execute('''
            INSERT INTO ticket_history (ticket_id, action, changed_by)
            VALUES (?, 'Created', ?)
        ''', (ticket_id, user_id))
        
        # Add activity
        cursor.execute('''
            INSERT INTO activities (user_id, activity_type, description)
            VALUES (?, 'ticket_created', ?)
        ''', (user_id, f'Created ticket {ticket_number}'))
        
        conn.commit()
        conn.close()
        
        return {
            'id': ticket_id,
            'ticket_number': ticket_number
        }
    
    def get_tickets_by_user(self, user_id, status=None):
        """Get all tickets for a user"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if status:
            cursor.execute('''
                SELECT * FROM tickets 
                WHERE user_id = ? AND status = ?
                ORDER BY created_at DESC
            ''', (user_id, status))
        else:
            cursor.execute('''
                SELECT * FROM tickets 
                WHERE user_id = ?
                ORDER BY created_at DESC
            ''', (user_id,))
        
        tickets = cursor.fetchall()
        conn.close()
        
        return [dict(ticket) for ticket in tickets]
    
    def get_ticket_by_id(self, ticket_id):
        """Get a single ticket by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM tickets WHERE id = ?', (ticket_id,))
        ticket = cursor.fetchone()
        conn.close()
        return dict(ticket) if ticket else None
    
    def update_ticket_status(self, ticket_id, status, user_id):
        """Update ticket status"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE tickets 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (status, ticket_id))
        
        # Add to history
        cursor.execute('''
            INSERT INTO ticket_history (ticket_id, action, changed_by)
            VALUES (?, ?, ?)
        ''', (ticket_id, f'Status changed to {status}', user_id))
        
        conn.commit()
        conn.close()
        
        return True
    
    def get_recent_activities(self, user_id, limit=5):
        """Get recent activities for a user"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM activities 
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (user_id, limit))
        
        activities = cursor.fetchall()
        conn.close()
        
        return [dict(activity) for activity in activities]


# Test database if this file is run directly
if __name__ == "__main__":
    print("\n🧪 Testing Database...\n")
    
    db = Database()
    
    # Test user creation
    print("Creating test user...")
    user_id = db.create_user('test@example.com', 'password123', 'Test User')
    if user_id:
        print(f"✅ User created with ID: {user_id}")
    else:
        print("⚠️ User already exists")
        user = db.get_user_by_email('test@example.com')
        user_id = user['id']
    
    # Test ticket creation
    print("\nCreating test ticket...")
    ticket = db.create_ticket(
        user_id=user_id,
        title='Test Ticket',
        description='This is a test ticket',
        category='Technical',
        priority='High'
    )
    print(f"✅ Ticket created: {ticket['ticket_number']}")
    
    # Get user tickets
    print("\nFetching user tickets...")
    tickets = db.get_tickets_by_user(user_id)
    print(f"✅ Found {len(tickets)} ticket(s)")
    
    for t in tickets:
        print(f"   - {t['ticket_number']}: {t['title']} ({t['status']})")
    
    print("\n✅ Database test complete!")