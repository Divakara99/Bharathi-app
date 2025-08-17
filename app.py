from flask import Flask, request, jsonify, render_template_string
import sqlite3
import hashlib
import os
import re
import secrets

app = Flask(__name__)

# Secure secret key: read from env or generate a random secret
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or secrets.token_hex(32)

# Fixed: SQL injection vulnerability
def get_user_by_id(user_id):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # FIXED: Using parameterized query to prevent SQL injection
    query = "SELECT * FROM users WHERE id = ?"
    cursor.execute(query, (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user

# Fixed: Weak password hashing
def hash_password(password):
    # FIXED: Using bcrypt for secure password hashing
    import bcrypt
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt)

def verify_password(password, hashed_password):
    # FIXED: Secure password verification with robust handling of stored type
    import bcrypt
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

@app.route('/')
def index():
    return render_template_string('''
        <h1>User Management System</h1>
        <form method="POST" action="/login">
            <input type="text" name="username" placeholder="Username">
            <input type="password" name="password" placeholder="Password">
            <button type="submit">Login</button>
        </form>
        <form method="POST" action="/search">
            <input type="text" name="user_id" placeholder="User ID">
            <button type="submit">Search User</button>
        </form>
    ''')

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    
    # FIXED: Added input validation and secure password checking
    if username and password and len(username) <= 50 and len(password) <= 100:
        # Get user from database
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE username = ?", (username,))
        result = cursor.fetchone()
        conn.close()
        
        if result and verify_password(password, result[0]):
            return "Login successful!"
    return "Login failed!"

@app.route('/search', methods=['POST'])
def search_user():
    user_id = request.form.get('user_id')
    
    # Validate that user_id is a positive integer before querying
    if user_id and re.fullmatch(r"\d+", user_id):
        user = get_user_by_id(int(user_id))
        if user:
            return f"User found: {user}"
        else:
            return "User not found"
    return "Invalid or missing user ID"

@app.route('/api/users/<int:user_id>')
def get_user_api(user_id):
    # FIXED: Added basic authentication and removed sensitive data
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    # Simple token check (in production, use proper JWT or session management)
    token = auth_header.split(' ')[1]
    if token != 'valid_token_123':  # In production, validate against database
        return jsonify({'error': 'Invalid token'}), 401
    
    user = get_user_by_id(user_id)
    if user:
        return jsonify({
            'id': user[0],
            'username': user[1],
            'email': user[2]
            # FIXED: Removed password_hash from response
        })
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    # Run server with configuration from environment; default to production-safe values
    debug = os.environ.get('FLASK_DEBUG', '0') == '1'
    host = os.environ.get('FLASK_RUN_HOST', '127.0.0.1')
    port = int(os.environ.get('FLASK_RUN_PORT', '5000'))
    app.run(debug=debug, host=host, port=port)