document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('passwordInput');
    const toggleVisibilityBtn = document.getElementById('toggleVisibilityBtn');
    const charCounter = document.getElementById('charCounter');
    const strengthBar = document.getElementById('strengthBar');
    const crackTimeSpan = document.getElementById('crackTime');
    const breachStatusSpan = document.getElementById('breachStatus');
    const lengthIndicator = document.getElementById('lengthIndicator');
    const uppercaseIndicator = document.getElementById('uppercaseIndicator');
    const numberIndicator = document.getElementById('numberIndicator');
    const symbolIndicator = document.getElementById('symbolIndicator');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const generatedPasswordDiv = document.getElementById('generatedPassword');
    const crackAnimationDiv = document.getElementById('crackAnimation');
    const terminalTitle = document.getElementById('terminalTitle');

    let debounceTimer;
    let currentGeneratedPassword = '';
    let simulationTimeout;

    // --- Main Event Listeners ---
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        charCounter.textContent = password.length; // Update character count
        updateRequirementIndicators(password); // Update all indicators

        resetBreachAndCrackTime();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (password) {
                analyzePassword(password);
            } else {
                resetUI();
            }
        }, 300);
    });

    toggleVisibilityBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleVisibilityBtn.textContent = isPassword ? '🙈' : '👁️';
    });

    // --- Password Generation ---
    generateBtn.addEventListener('click', () => {
        currentGeneratedPassword = generateSecurePasswordClientSide(20);
        passwordInput.value = currentGeneratedPassword;
        charCounter.textContent = currentGeneratedPassword.length;
        generatedPasswordDiv.textContent = `Generated: ${currentGeneratedPassword}`;
        generatedPasswordDiv.style.display = 'block';
        copyBtn.style.display = 'inline-block';
        analyzePassword(currentGeneratedPassword);
    });

    // --- Copy to Clipboard ---
    copyBtn.addEventListener('click', () => {
        if (currentGeneratedPassword) {
            navigator.clipboard.writeText(currentGeneratedPassword).then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '✅ Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy password: ', err);
                alert('Failed to copy password. Please copy it manually.');
            });
        }
    });

    // --- Core Analysis Function ---
    async function analyzePassword(password) {
        const strength = zxcvbn(password);
        updateStrengthUI(strength);
        
        try {
            const breachResponse = await checkBreachOnServer(password);
            updateBreachUI(breachResponse.breach);
        } catch (error) {
            console.error('Breach check failed:', error);
            breachStatusSpan.textContent = 'Error';
            breachStatusSpan.className = 'error';
        }

        startHackerSimulation(strength);
    }

    // --- UI Update Functions ---
    function updateStrengthUI(strength) {
        crackTimeSpan.textContent = strength.crack_times_display.offline_slow_hashing_1e4_per_second.toUpperCase();
        const score = strength.score;
        const width = (score + 1) * 20;
        const colors = ['#ff4d4d', '#ff9b4d', '#ffff4d', '#9bff4d', '#4dff4d'];
        strengthBar.style.width = `${width}%`;
        strengthBar.style.backgroundColor = colors[score];

        // Update page title
        const strengthTextMap = {
            0: 'Very Weak', 1: 'Weak', 2: 'Medium', 3: 'Strong', 4: 'Very Strong'
        };
        document.title = `(${strengthTextMap[score]}) - Password Strength Analyzer`;
    }

    function updateRequirementIndicators(password) {
        const requirements = [
            { indicator: lengthIndicator,    regex: /.{12,}/,       valid: password.length >= 12 },
            { indicator: uppercaseIndicator, regex: /[A-Z]/,         valid: /[A-Z]/.test(password) },
            { indicator: numberIndicator,    regex: /[0-9]/,         valid: /[0-9]/.test(password) },
            { indicator: symbolIndicator,    regex: /[^A-Za-z0-9]/, valid: /[^A-Za-z0-9]/.test(password) }
        ];

        requirements.forEach(req => {
            const icon = req.indicator.querySelector('.indicator-icon');
            if (req.valid) {
                req.indicator.classList.add('valid');
                icon.textContent = '✅';
            } else {
                req.indicator.classList.remove('valid');
                icon.textContent = '❌';
            }
        });
    }

    function updateBreachUI(isPwned) {
        if (isPwned) {
            breachStatusSpan.textContent = 'PWNED! FOUND IN A DATA BREACH.';
            breachStatusSpan.className = 'pwned';
        } else {
            breachStatusSpan.textContent = 'CLEAR. NOT FOUND IN KNOWN BREACHES.';
            breachStatusSpan.className = 'clear';
        }
    }

    function resetUI() {
        document.title = 'Password Strength Analyzer'; // Reset page title
        strengthBar.style.width = '0%';
        charCounter.textContent = '0';
        updateRequirementIndicators(""); // Reset all indicators
        resetBreachAndCrackTime();
        clearTimeout(simulationTimeout);
        crackAnimationDiv.innerHTML = '';
        generatedPasswordDiv.style.display = 'none';
        copyBtn.style.display = 'none';
        currentGeneratedPassword = '';
    }
    
    function resetBreachAndCrackTime() {
        crackTimeSpan.textContent = '—';
        breachStatusSpan.textContent = '—';
        breachStatusSpan.className = '';
    }

    // --- API Call ---
    async function checkBreachOnServer(password) {
        const response = await fetch('/check-breach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `password=${encodeURIComponent(password)}`
        });
        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
        return response.json();
    }

    // --- Client-Side Password Generator ---
    function generateSecurePasswordClientSide(length = 20) {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
        const randomValues = new Uint32Array(length);
        window.crypto.getRandomValues(randomValues);
        let password = "";
        for (let i = 0; i < length; i++) {
            password += charset[randomValues[i] % charset.length];
        }
        return password;
    }

    // --- Enhanced Hacker Simulation ---
    function startHackerSimulation(strength) {
        clearTimeout(simulationTimeout);
        crackAnimationDiv.innerHTML = '';
        const { score, password } = strength;
        
        const typeLine = (text, className = '', initialDelay = 0) => {
            return new Promise(resolve => {
                simulationTimeout = setTimeout(() => {
                    const p = document.createElement('p');
                    if (className) p.className = className;
                    crackAnimationDiv.appendChild(p);

                    let i = 0;
                    const typingSpeed = 25; // ms per character

                    const typeChar = () => {
                        if (i < text.length) {
                            p.textContent += text.charAt(i);
                            crackAnimationDiv.scrollTop = crackAnimationDiv.scrollHeight;
                            i++;
                            simulationTimeout = setTimeout(typeChar, typingSpeed);
                        } else {
                            resolve();
                        }
                    };
                    typeChar();
                }, initialDelay);
            });
        };

        const run = async () => {
            await typeLine('> Initializing hashcat v6.2.5...', '', 0);
            await typeLine('> Hash.Type........: NTLM (common web hash)', 'sim-progress', 500);

            if (score <= 1) {
                await typeLine('> Attack.Mode......: Dictionary (rockyou.txt)', 'sim-progress', 400);
                await typeLine('> STATUS: CRACKED', 'sim-fail', 600);
                await typeLine(`> Cracked.Password.: ${password}`, 'pwned', 200);
            } else if (score === 2) {
                await typeLine('> Attack.Mode......: Dictionary (rockyou.txt)', 'sim-progress', 400);
                await typeLine('> STATUS: EXHAUSTED', 'sim-progress', 1000);
                await typeLine('> Switching to rule-based attack (best64.rule)...', '', 500);
                await typeLine('> STATUS: CRACKED', 'sim-fail', 1200);
                await typeLine(`> Cracked.Password.: ${password}`, 'pwned', 200);
            } else {
                await typeLine('> Attack.Mode......: Dictionary (rockyou.txt)', 'sim-progress', 400);
                await typeLine('> STATUS: EXHAUSTED', 'sim-progress', 1000);
                await typeLine('> Switching to rule-based attack (best64.rule)...', '', 500);
                await typeLine('> STATUS: EXHAUSTED', 'sim-progress', 1200);
                await typeLine('> Switching to brute-force (mask attack)...', '', 500);
                await typeLine(`> Estimated.Time...: ${strength.crack_times_display.offline_slow_hashing_1e4_per_second.toUpperCase()}`, 'sim-progress', 800);
                await typeLine('>> ATTACK ABORTED. TOO COMPLEX.', 'clear', 500);
            }
        };

        run();
    }

    // --- Dynamic Terminal Title ---
    async function setDynamicTerminalTitle() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            if (!response.ok) throw new Error('Failed to fetch IP address');
            const data = await response.json();
            terminalTitle.textContent = `user@${data.ip}:~`;
        } catch (error) {
            console.error('Could not set dynamic terminal title:', error);
        }
    }

    // --- Initializations ---
    setDynamicTerminalTitle();
    resetUI();
});