from flask import Flask, request, jsonify, session
import sqlite3
import hashlib
import time
from datetime import datetime
import bcrypt

app = Flask(__name__)
app.secret_key = 'very-secret-key-123'

# Initialize database
def init_db():
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create posts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Create comments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER,
            user_id INTEGER,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Insert sample data with hashed passwords
    admin_pass = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
    user_pass = bcrypt.hashpw('password1'.encode('utf-8'), bcrypt.gensalt())
    cursor.execute("INSERT OR IGNORE INTO users (username, password, email, is_admin) VALUES ('admin', ?, 'admin@example.com', 1)", (admin_pass,))
    cursor.execute("INSERT OR IGNORE INTO users (username, password, email) VALUES ('user1', ?, 'user1@example.com')", (user_pass,))
    
    conn.commit()
    conn.close()

# FIXED BUG #1: SQL Injection vulnerability - Now using parameterized queries
@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')
    
    # Input validation
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required'}), 400
    
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    
    # FIXED: Using parameterized query to prevent SQL injection
    # First, get the user by username only
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    # Then verify the password using bcrypt
    if user and bcrypt.checkpw(password.encode('utf-8'), user[2]):
        # Password is correct
        pass
    else:
        user = None  # Invalid credentials
    
    conn.close()
    
    if user:
        session['user_id'] = user[0]
        session['username'] = user[1]
        session['is_admin'] = user[4]
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

# FIXED BUG #2: N+1 Query Problem - Now using efficient JOIN query
@app.route('/posts', methods=['GET'])
def get_posts():
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    
    # FIXED: Single query with JOINs to get all data at once
    # This reduces database roundtrips from N+1 to just 1
    query = """
    SELECT 
        p.id,
        p.title,
        p.content,
        p.created_at,
        u.username,
        COUNT(c.id) as comment_count
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN comments c ON p.id = c.post_id
    GROUP BY p.id, p.title, p.content, p.created_at, u.username
    ORDER BY p.created_at DESC
    """
    
    cursor.execute(query)
    posts = cursor.fetchall()
    
    result = []
    for post in posts:
        result.append({
            'id': post[0],
            'title': post[1],
            'content': post[2],
            'created_at': post[3],
            'author': post[4] if post[4] else 'Unknown',
            'comment_count': post[5]
        })
    
    conn.close()
    return jsonify(result)

# FIXED BUG #3: Authorization logic error - Now properly checking admin privileges
@app.route('/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    # FIXED: Check both authentication and authorization
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    # FIXED: Verify user has admin privileges
    if not session.get('is_admin', False):
        return jsonify({'error': 'Admin privileges required'}), 403
    
    # Additional validation: Prevent admin from deleting themselves
    if session['user_id'] == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    
    # Check if user exists before deletion
    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    # Delete user and cascade delete their posts and comments
    cursor.execute("DELETE FROM comments WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM posts WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    
    deleted_rows = cursor.rowcount
    conn.commit()
    conn.close()
    
    if deleted_rows > 0:
        return jsonify({'success': True, 'message': 'User and related data deleted'})
    else:
        return jsonify({'error': 'Failed to delete user'}), 500

# Helper route to create posts
@app.route('/posts', methods=['POST'])
def create_post():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    title = request.json.get('title')
    content = request.json.get('content')
    
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    
    cursor.execute("INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)",
                   (session['user_id'], title, content))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Post created'})

@app.route('/')
def index():
    return '''
    <h1>Bharathi Enterprises Application</h1>
    <p>This is a sample application with intentional bugs for demonstration.</p>
    <h2>Available endpoints:</h2>
    <ul>
        <li>POST /login - Login with username and password</li>
        <li>GET /posts - Get all posts with comments count</li>
        <li>POST /posts - Create a new post</li>
        <li>DELETE /admin/users/{id} - Delete a user (admin only)</li>
    </ul>
    '''

if __name__ == '__main__':
    init_db()
    app.run(debug=True)