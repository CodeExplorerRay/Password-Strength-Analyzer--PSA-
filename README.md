# 🔒 Password Strength Analyzer

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
  </a>
  <a href="https://password-strength-analyzer-psa.onrender.com">
    <img src="https://img.shields.io/badge/Render-Deployed-%23f5f5f5?logo=render&logoColor=46e3b7" alt="Render">
  </a>
</p>

A real-time password security assessment tool that evaluates your passwords against modern cracking techniques and known data breaches.

<p align="center">
  <img src="assets/psa-demo.gif" alt="Password Strength Analyzer Demo">
</p>

- **Brute-force time estimation** - See how long it would take to crack your password
- **Dark web breach check** - Verifies against HaveIBeenPwned's database
- **Live attack simulation** - Visual demonstration of cracking attempts
- **Configurable Password Generator** - Create cryptographically strong passwords with custom length and character sets.
- **Privacy-focused** - Password analysis is done 100% in your browser. Only a non-identifiable part of the password's hash is used for the breach check.
- **Responsive design** - Works on all devices

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Python 3.x
- pip (Python package installer)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/CodeExplorerRay/Password-Strength-Analyzer--PSA-.git
    cd Password-Strength-Analyzer--PSA-
    ```
2.  **Create and activate a virtual environment (recommended):**
    ```sh
    # For Windows
    python -m venv venv
    venv\Scripts\activate

    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```
3.  **Install the required Python packages:**
    ```sh
    pip install Flask requests cryptography
    ```
4.  **Run the Flask application:**
    ```sh
    python analyze.py
    ```
5.  **Open your browser** and navigate to `http://127.0.0.1:5000` to see the application in action.

## 🛠️ Technologies Used
- **Backend**: Python (Flask)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Security**: PBKDF2 hashing, HIBP API integration
- **Deployment**: Vercel (Serverless) ready

## 📸 Screenshot

!image

## ⚠️ DISCLAIMER: CYBER WEAPON CLASSIFICATION

**THIS TOOL IS DESIGNED FOR ETHICAL SECURITY TESTING ONLY.**  

- **Illegal use is strictly prohibited** - You are 100% responsible for your actions  
- **No warranty** - May the void (∅) have mercy on your systems  
- **Educational purpose** - Intended to expose password vulnerabilities, not exploit them  
- **No liability** - If you nuke your own data, that's a *you* problem  
- **HIBP API** follows [Have I Been Pwned's acceptable use policy](https://haveibeenpwned.com/API/v3#AcceptableUse)  

**By using this software, you agree that:**  
- You won't be a script kiddie  
- You won't sue us when your weak password gets cracked in 0.3 seconds  
- You acknowledge that [CodeExplorerRay](https://github.com/CodeExplorerRay) will mock you mercilessly for bad security practices

## 🌐 Live Demo
Check out the live version:  
[![Render](https://img.shields.io/badge/Render-Deployed-%23f5f5f5?logo=render&logoColor=46e3b7)](https://password-strength-analyzer-psa.onrender.com)

---

**Deployment Note**: This application is hosted on [Render.com](https://render.com)'s free tier. Initial loading may take 30-60 seconds due to cold starts.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/CodeExplorerRay/Password-Strength-Analyzer--PSA-/blob/main/License) file for details.
