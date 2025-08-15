import sqlite3
import bcrypt

def setup_database():
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    
    # Insert sample user with bcrypt hashed password
    password_hash = bcrypt.hashpw("password".encode('utf-8'), bcrypt.gensalt())
    cursor.execute('''
        INSERT OR REPLACE INTO users (id, username, email, password_hash)
        VALUES (1, 'admin', 'admin@example.com', ?)
    ''', (password_hash,))
    
    conn.commit()
    conn.close()
    print("Database setup complete!")

if __name__ == '__main__':
    setup_database()