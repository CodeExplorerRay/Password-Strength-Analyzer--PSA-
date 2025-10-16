from flask import Flask, render_template, request, jsonify, send_from_directory
import requests
import hashlib
import os
import yaml
from datetime import datetime

app = Flask(__name__, static_folder='static', static_url_path='/static')

# HIBP API (Breach Check)
HIBP_API_URL = "https://api.pwnedpasswords.com/range/"

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

# Flask Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/insights')
def insights():
    return render_template('insights.html')

@app.route('/insight-post.html')
def insight_post():
    return render_template('insight-post.html')

@app.route('/api/insights')
def get_insights_data():
    """
    Scans the /content directory, parses frontmatter from .md files,
    and returns a sorted list of post metadata as JSON.
    """
    posts = []
    content_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'content')
    for root, _, files in os.walk(content_root):
        for filename in files:
            if filename.endswith('.md'):
                filepath = os.path.join(root, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Split content at the second '---' to get the frontmatter
                    try:
                        _, frontmatter_str, _ = content.split('---', 2)
                        metadata = yaml.safe_load(frontmatter_str)
                        # Create a slug that includes the subdirectory path
                        relative_path = os.path.relpath(filepath, content_root)
                        metadata['slug'] = os.path.splitext(relative_path)[0].replace('\\', '/')
                        posts.append(metadata)
                    except (ValueError, yaml.YAMLError) as e:
                        print(f"Warning: Could not parse frontmatter for {filename}: {e}")
    # Sort posts by date, oldest first (chronological order)
    posts.sort(key=lambda p: datetime.strptime(p.get('date', '1970-01-01'), '%Y-%m-%d'))
    return jsonify(posts)

@app.route('/content/<path:filename>')
def serve_content(filename):
    return send_from_directory('content', filename)

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/check-breach', methods=['POST'])
def check_breach():
    password = request.form['password']
    if not password:
        return jsonify({"error": "Password is required"}), 400

    breach = is_password_pwned(password)
    return jsonify({"breach": breach})

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