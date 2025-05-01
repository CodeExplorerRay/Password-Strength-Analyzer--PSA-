from flask import Flask, render_template, request, jsonify, send_from_directory
import requests
import hashlib
import secrets
import string
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import os
import re

# Get absolute paths in a deployment-safe way
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__,)

# HIBP API (Breach Check)
HIBP_API_URL = "https://api.pwnedpasswords.com/range/"

# Generate Military-Grade Password
def generate_password(length=16, include_special=True):
    chars = string.ascii_letters + string.digits
    if include_special:
        chars += string.punctuation
    return ''.join(secrets.choice(chars) for _ in range(length))

# Check Password Breach (HIBP)
def is_password_pwned(password):
    sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix, suffix = sha1_hash[:5], sha1_hash[5:]
    try:
        response = requests.get(f"{HIBP_API_URL}{prefix}")
        return suffix in response.text
    except:
        return False

# Estimate Brute-Force Time
def estimate_crack_time(password):
    entropy = len(password) * 4  # Rough estimate
    if entropy < 40:
        return "INSTANT"
    elif entropy < 60:
        return "SECONDS"
    elif entropy < 80:
        return "HOURS"
    elif entropy < 100:
        return "YEARS"
    else:
        return "CENTURIES"

# PBKDF2 Hash (For Demo)
def hash_password(password):
    salt = os.urandom(16)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    return kdf.derive(password.encode())

# Flask Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/check', methods=['POST'])
def check_password():
    password = request.form['password']
    breach = is_password_pwned(password)
    crack_time = estimate_crack_time(password)
    return jsonify({
        "breach": breach,
        "crack_time": crack_time,
        "strength": len(password) * 4
    })

# === STATIC FILES ===
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    app.run(debug=True)