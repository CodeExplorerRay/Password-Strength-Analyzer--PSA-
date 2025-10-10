# 🔒 Password Strength Analyzer
A real-time password security assessment tool that evaluates your passwords against modern cracking techniques and known data breaches.

![image](https://github.com/user-attachments/assets/83a89f23-4f3c-4f2d-85b2-f4e40a268c13)



## ✨ Features

- **Brute-force time estimation** - See how long it would take to crack your password
- **Dark web breach check** - Verifies against HaveIBeenPwned's database
- **Live attack simulation** - Visual demonstration of cracking attempts
- **Secure password generator** - Creates cryptographically strong passwords
- **Privacy-focused** - Password analysis is done 100% in your browser. Only a non-identifiable part of the password's hash is used for the breach check.
- **Responsive design** - Works on all devices

## 🛠️ Technologies Used
- **Backend**: Python (Flask)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Security**: PBKDF2 hashing, HIBP API integration
- **Deployment**: Vercel (Serverless) ready

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
