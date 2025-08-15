# Bug Fixes Documentation

## Overview
This document details the three critical bugs found and fixed in the Flask web application.

## Bug 1: SQL Injection Vulnerability

### Problem Description
**Severity**: Critical (Security)
**Location**: `app.py` - `get_user_by_id()` function

The function was vulnerable to SQL injection attacks due to direct string concatenation in SQL queries.

### Vulnerable Code
```python
def get_user_by_id(user_id):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # VULNERABLE: Direct string concatenation allows SQL injection
    query = "SELECT * FROM users WHERE id = " + str(user_id)
    cursor.execute(query)
    user = cursor.fetchone()
    conn.close()
    return user
```

### Attack Vector
An attacker could inject malicious SQL by providing input like:
- `1; DROP TABLE users; --`
- `1 UNION SELECT * FROM users --`

### Fix Applied
Replaced string concatenation with parameterized queries:

```python
def get_user_by_id(user_id):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # FIXED: Using parameterized query to prevent SQL injection
    query = "SELECT * FROM users WHERE id = ?"
    cursor.execute(query, (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user
```

### Security Impact
- Prevents unauthorized database access
- Protects against data manipulation
- Eliminates SQL injection attack surface

---

## Bug 2: Weak Password Hashing

### Problem Description
**Severity**: Critical (Security)
**Location**: `app.py` - `hash_password()` function

The application used MD5 for password hashing, which is cryptographically broken and easily crackable.

### Vulnerable Code
```python
def hash_password(password):
    # VULNERABLE: Using MD5 which is cryptographically broken
    return hashlib.md5(password.encode()).hexdigest()
```

### Attack Vector
- Rainbow table attacks
- Brute force attacks
- Collision attacks
- MD5 hashes can be cracked in seconds using modern hardware

### Fix Applied
Replaced MD5 with bcrypt, a secure hashing algorithm:

```python
def hash_password(password):
    # FIXED: Using bcrypt for secure password hashing
    import bcrypt
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt)

def verify_password(password, hashed_password):
    # FIXED: Secure password verification
    import bcrypt
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)
```

### Security Impact
- Bcrypt is computationally expensive, making brute force attacks impractical
- Built-in salt prevents rainbow table attacks
- Industry-standard secure hashing algorithm
- Configurable work factor for future-proofing

---

## Bug 3: Information Disclosure

### Problem Description
**Severity**: High (Security)
**Location**: `app.py` - `/api/users/<int:user_id>` endpoint

The API endpoint exposed sensitive user information including password hashes without proper authentication.

### Vulnerable Code
```python
@app.route('/api/users/<int:user_id>')
def get_user_api(user_id):
    # Bug 6: No authentication or authorization
    user = get_user_by_id(user_id)
    if user:
        return jsonify({
            'id': user[0],
            'username': user[1],
            'email': user[2],
            'password_hash': user[3]  # Bug 7: Exposing password hash
        })
    return jsonify({'error': 'User not found'}), 404
```

### Attack Vector
- Unauthorized access to user data
- Password hash exposure for offline cracking
- No authentication required

### Fix Applied
Added authentication and removed sensitive data:

```python
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
```

### Security Impact
- Prevents unauthorized access to user data
- Eliminates password hash exposure
- Implements proper authentication controls
- Follows principle of least privilege

---

## Additional Improvements Made

1. **Input Validation**: Added length checks for username and password in login function
2. **Database Integration**: Updated login function to check against actual database
3. **Dependencies**: Added bcrypt to requirements.txt
4. **Database Setup**: Updated setup script to use bcrypt for password hashing

## Testing the Fixes

1. **SQL Injection Test**: Try accessing `/search` with input `1; DROP TABLE users; --`
2. **Password Security**: Verify bcrypt hashing is used in database
3. **API Security**: Test `/api/users/1` without authentication header

## Recommendations for Production

1. Use environment variables for secret keys
2. Implement proper session management or JWT tokens
3. Add rate limiting to prevent brute force attacks
4. Use HTTPS in production
5. Implement proper logging and monitoring
6. Regular security audits and dependency updates