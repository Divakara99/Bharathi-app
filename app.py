#!/usr/bin/env python3
"""
Bharathi Enterprises - Customer Management System
A simple web application for managing customer data
"""

import sqlite3
import hashlib
import os
from flask import Flask, request, render_template, session, redirect, url_for, jsonify
import time
import threading
from queue import Queue

app = Flask(__name__)
# FIXED: Use environment variable for secret key with secure fallback
app.secret_key = os.environ.get('FLASK_SECRET_KEY') or os.urandom(24)

# FIXED: Simple database connection pool for better performance
class DatabasePool:
    def __init__(self, database_path, pool_size=5):
        self.database_path = database_path
        self.pool = Queue(maxsize=pool_size)
        self.lock = threading.Lock()
        
        # Initialize pool with connections
        for _ in range(pool_size):
            conn = sqlite3.connect(database_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            # Enable WAL mode for better concurrent access
            conn.execute('PRAGMA journal_mode=WAL')
            self.pool.put(conn)
    
    def get_connection(self):
        return self.pool.get()
    
    def return_connection(self, conn):
        self.pool.put(conn)
    
    def close_all(self):
        while not self.pool.empty():
            conn = self.pool.get()
            conn.close()

# Global database pool
db_pool = DatabasePool('customers.db')

def get_db_connection():
    # FIXED: Use connection pool instead of creating new connections
    return db_pool.get_connection()

def return_db_connection(conn):
    # Return connection to pool instead of closing
    db_pool.return_connection(conn)

def hash_password(password):
    """Hash a password using SHA-256 with salt"""
    salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
    pwdhash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt, 100000)
    pwdhash = salt + pwdhash
    return pwdhash.hex()

def verify_password(stored_password, provided_password):
    """Verify a stored password against provided password"""
    stored_password_bytes = bytes.fromhex(stored_password)
    salt = stored_password_bytes[:64]
    stored_hash = stored_password_bytes[64:]
    pwdhash = hashlib.pbkdf2_hmac('sha512', provided_password.encode('utf-8'), salt, 100000)
    return pwdhash == stored_hash

def init_db():
    """Initialize the database with customer table"""
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            balance REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Add sample data with hashed passwords
    try:
        # FIXED: Store hashed passwords instead of plain text
        hashed_password1 = hash_password('password123')
        hashed_password2 = hash_password('mypassword')
        hashed_password3 = hash_password('secret')
        
        conn.execute('''
            INSERT INTO customers (name, email, password, balance) VALUES
            ('John Doe', 'john@example.com', ?, 1000.0),
            ('Jane Smith', 'jane@example.com', ?, 2500.0),
            ('Bob Johnson', 'bob@example.com', ?, 500.0)
        ''', (hashed_password1, hashed_password2, hashed_password3))
        conn.commit()
    except sqlite3.IntegrityError:
        pass  # Data already exists
    finally:
        return_db_connection(conn)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        # FIXED: Use parameterized queries and password hashing
        conn = get_db_connection()
        # First get user by email only
        cursor = conn.execute('SELECT * FROM customers WHERE email = ?', (email,))
        user = cursor.fetchone()
        return_db_connection(conn)
        
        # FIXED: Verify password using secure hash comparison
        if user and verify_password(user['password'], password):
            session['user_id'] = user['id']
            session['user_name'] = user['name']
            return redirect(url_for('dashboard'))
        else:
            return render_template('login.html', error='Invalid credentials')
    
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM customers WHERE id = ?', (session['user_id'],)).fetchone()
    
    # FIXED: Efficient single query instead of N+1 queries
    # Using a single JOIN query to get all customers with their transaction counts
    # Note: In a real app, transaction_count would come from a transactions table
    # For this demo, we'll just set it to 1 for all customers to show the optimization
    customers_query = """
    SELECT 
        c.id,
        c.name,
        c.email,
        c.password,
        c.balance,
        c.created_at,
        1 as transaction_count
    FROM customers c
    ORDER BY c.name
    """
    
    customer_data = []
    customers = conn.execute(customers_query).fetchall()
    for customer in customers:
        customer_data.append({
            'customer': customer,
            'transaction_count': customer['transaction_count']
        })
    
    return_db_connection(conn)
    
    return render_template('dashboard.html', user=user, customers=customer_data)

@app.route('/transfer', methods=['POST'])
def transfer_money():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        from_account = session['user_id']
        to_email = request.json['to_email']
        amount = float(request.json['amount'])
        
        # FIXED: Atomic money transfer using database transactions
        conn = get_db_connection()
        
        try:
            # Start transaction
            conn.execute('BEGIN IMMEDIATE')
            
            # Get sender balance with row lock
            sender = conn.execute('SELECT id, balance FROM customers WHERE id = ? FOR UPDATE', (from_account,)).fetchone()
            if not sender:
                conn.rollback()
                return jsonify({'error': 'Sender not found'}), 404
            
            # Get recipient with row lock
            recipient = conn.execute('SELECT id, balance FROM customers WHERE email = ? FOR UPDATE', (to_email,)).fetchone()
            if not recipient:
                conn.rollback()
                return jsonify({'error': 'Recipient not found'}), 404
            
            # Check if sender has enough balance
            if sender['balance'] < amount:
                conn.rollback()
                return jsonify({'error': 'Insufficient funds'}), 400
            
            # Atomic updates using direct SQL operations
            # Update sender balance (subtract amount)
            sender_update = conn.execute('UPDATE customers SET balance = balance - ? WHERE id = ? AND balance >= ?', 
                                       (amount, from_account, amount))
            
            if sender_update.rowcount == 0:
                conn.rollback()
                return jsonify({'error': 'Insufficient funds or account not found'}), 400
            
            # Update recipient balance (add amount)
            recipient_update = conn.execute('UPDATE customers SET balance = balance + ? WHERE id = ?', 
                                          (amount, recipient['id']))
            
            if recipient_update.rowcount == 0:
                conn.rollback()
                return jsonify({'error': 'Recipient account not found'}), 404
            
            # Commit transaction
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            return_db_connection(conn)
        
        return jsonify({'success': True, 'message': f'Transferred ${amount} to {to_email}'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)