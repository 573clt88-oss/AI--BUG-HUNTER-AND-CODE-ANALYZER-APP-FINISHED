import os
import subprocess

def login(username, password):
    # SQL Injection vulnerability
    query = f"SELECT * FROM users WHERE name='{username}' AND pwd='{password}'"
    
    # Command injection vulnerability
    os.system(f"echo {username}")
    
    # Code injection vulnerability
    result = eval(password)
    
    return result

# Hardcoded credentials
admin_password = "admin123"