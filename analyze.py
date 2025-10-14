from flask import Flask, render_template, request, jsonify, send_from_directory
import requests
import hashlib
import secrets
import string
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import os

app = Flask(__name__)

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
        response = requests.get(f"{HIBP_API_URL}{prefix}", timeout=5) # Add a timeout
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        # The HIBP API returns a list of hashes. We need to check if our suffix is in any of the lines.
        return any(line.startswith(suffix) for line in response.text.splitlines())
    except requests.RequestException:
        return False

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

@app.route('/check-breach', methods=['POST'])
def check_breach():
    password = request.form['password']
    if not password:
        return jsonify({"error": "Password is required"}), 400

    breach = is_password_pwned(password)
    return jsonify({"breach": breach})

@app.route('/generate-password', methods=['GET'])
def get_generated_password():
    # It's better to generate passwords on the client, but if a backend endpoint is desired, this is how.
    new_password = generate_password()
    return jsonify({"password": new_password})

@app.route('/robots.txt')
def serve_robots():
    # Correctly serve robots.txt from the project's root directory
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'robots.txt')

@app.route('/sitemap.xml')
def serve_sitemap():
    # Correctly serve sitemap.xml from the static directory
    return send_from_directory(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static'), 'sitemap.xml')

@app.route('/ads.txt')
def serve_ads_txt():
    # Correctly serve ads.txt from the project's root directory
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'ads.txt')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)