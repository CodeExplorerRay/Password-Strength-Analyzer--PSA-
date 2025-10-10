from flask import Flask, render_template, request, jsonify, send_from_directory
import requests
import hashlib
import secrets
import string
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import os

app = Flask(
    __name__,
    static_url_path='',  # Serve static files from the root URL
    static_folder='static' # Set the static folder to 'static'
)
app.static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

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

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)