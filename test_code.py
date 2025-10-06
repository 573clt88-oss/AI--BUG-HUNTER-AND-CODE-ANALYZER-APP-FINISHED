import os
import sqlite3

def login(username, password):
    # Security vulnerability: SQL injection
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    
    # Security vulnerability: hardcoded password
    if password == "admin123":
        return True
    
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    
    # Security vulnerability: executing raw query
    cursor.execute(query)
    result = cursor.fetchone()
    
    conn.close()
    return result is not None

# Performance issue: no input validation
def process_data(data):
    return eval(data)  # Security vulnerability: eval usage