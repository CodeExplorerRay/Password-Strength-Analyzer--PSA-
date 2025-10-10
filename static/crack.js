document.addEventListener('DOMContentLoaded', () => {
    // Centralized DOM Element Selectors
    const UI = {
        passwordInput: document.getElementById('passwordInput'),
        toggleVisibilityBtn: document.getElementById('toggleVisibilityBtn'),
        charCounter: document.getElementById('charCounter'),
        strengthBar: document.getElementById('strengthBar'),
        crackTimeSpan: document.getElementById('crackTime'),
        breachStatusSpan: document.getElementById('breachStatus'),
        lengthIndicator: document.getElementById('lengthIndicator'),
        uppercaseIndicator: document.getElementById('uppercaseIndicator'),
        numberIndicator: document.getElementById('numberIndicator'),
        symbolIndicator: document.getElementById('symbolIndicator'),
        generateBtn: document.getElementById('generateBtn'),
        copyBtn: document.getElementById('copyBtn'),
        generatedPasswordDiv: document.getElementById('generatedPassword'),
        crackAnimationDiv: document.getElementById('crackAnimation'),
        terminalTitle: document.getElementById('terminalTitle'),
    };

    let debounceTimer;
    let currentGeneratedPassword = '';
    let simulationTimeout;

    // --- Main Event Listeners ---
    UI.passwordInput.addEventListener('input', () => {
        const password = UI.passwordInput.value;
        UI.charCounter.textContent = password.length; // Update character count
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

    UI.toggleVisibilityBtn.addEventListener('click', () => {
        const isPassword = UI.passwordInput.type === 'password';
        UI.passwordInput.type = isPassword ? 'text' : 'password';
        UI.toggleVisibilityBtn.textContent = isPassword ? '🙈' : '👁️';
    });

    // --- Password Generation ---
    UI.generateBtn.addEventListener('click', () => {
        currentGeneratedPassword = generateSecurePasswordClientSide(20);
        UI.passwordInput.value = currentGeneratedPassword;
        UI.charCounter.textContent = currentGeneratedPassword.length;
        UI.generatedPasswordDiv.textContent = `Generated: ${currentGeneratedPassword}`;
        UI.generatedPasswordDiv.style.display = 'block';
        UI.copyBtn.style.display = 'inline-block';
        analyzePassword(currentGeneratedPassword);
    });

    // --- Copy to Clipboard ---
    UI.copyBtn.addEventListener('click', () => {
        if (currentGeneratedPassword) {
            navigator.clipboard.writeText(currentGeneratedPassword).then(() => {
                const originalText = UI.copyBtn.innerHTML;
                UI.copyBtn.innerHTML = '✅ Copied!';
                setTimeout(() => {
                    UI.copyBtn.innerHTML = originalText;
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
            UI.breachStatusSpan.textContent = 'Error';
            UI.breachStatusSpan.className = 'error';
        }

        startHackerSimulation(strength);
    }

    // --- UI Update Functions ---
    function updateStrengthUI(strength) {
        UI.crackTimeSpan.textContent = strength.crack_times_display.offline_slow_hashing_1e4_per_second.toUpperCase();
        const score = strength.score;
        const width = (score + 1) * 20;
        const colors = ['#ff4d4d', '#ff9b4d', '#ffff4d', '#9bff4d', '#4dff4d'];
        UI.strengthBar.style.width = `${width}%`;
        UI.strengthBar.style.backgroundColor = colors[score];

        // Update page title
        const strengthTextMap = {
            0: 'Very Weak', 1: 'Weak', 2: 'Medium', 3: 'Strong', 4: 'Very Strong'
        };
        document.title = `(${strengthTextMap[score]}) - Password Strength Analyzer`;
    }

    function updateRequirementIndicators(password) {
        const requirements = [
            { indicator: UI.lengthIndicator,    regex: /.{12,}/,       valid: password.length >= 12 },
            { indicator: UI.uppercaseIndicator, regex: /[A-Z]/,         valid: /[A-Z]/.test(password) },
            { indicator: UI.numberIndicator,    regex: /[0-9]/,         valid: /[0-9]/.test(password) },
            { indicator: UI.symbolIndicator,    regex: /[^A-Za-z0-9]/, valid: /[^A-Za-z0-9]/.test(password) }
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
            UI.breachStatusSpan.textContent = 'PWNED! FOUND IN A DATA BREACH.';
            UI.breachStatusSpan.className = 'pwned';
        } else {
            UI.breachStatusSpan.textContent = 'CLEAR. NOT FOUND IN KNOWN BREACHES.';
            UI.breachStatusSpan.className = 'clear';
        }
    }

    function resetUI() {
        document.title = 'Password Strength Analyzer'; // Reset page title
        UI.strengthBar.style.width = '0%';
        UI.charCounter.textContent = '0';
        updateRequirementIndicators(""); // Reset all indicators
        resetBreachAndCrackTime();
        clearTimeout(simulationTimeout);
        UI.crackAnimationDiv.innerHTML = '';
        UI.generatedPasswordDiv.style.display = 'none';
        UI.copyBtn.style.display = 'none';
        currentGeneratedPassword = '';
    }
    
    function resetBreachAndCrackTime() {
        UI.crackTimeSpan.textContent = '—';
        UI.breachStatusSpan.textContent = '—';
        UI.breachStatusSpan.className = '';
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
        UI.crackAnimationDiv.innerHTML = '';
        const { score, password } = strength;
        
        const typeLine = (text, className = '', initialDelay = 0) => {
            return new Promise(resolve => {
                simulationTimeout = setTimeout(() => {
                    const p = document.createElement('p');
                    if (className) p.className = className;
                    UI.crackAnimationDiv.appendChild(p);

                    let i = 0;
                    const typingSpeed = 25; // ms per character

                    const typeChar = () => {
                        if (i < text.length) {
                            p.textContent += text.charAt(i);
                            UI.crackAnimationDiv.scrollTop = UI.crackAnimationDiv.scrollHeight;
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
            UI.terminalTitle.textContent = `user@${data.ip}:~`;
        } catch (error) {
            console.error('Could not set dynamic terminal title:', error);
        }
    }

    // --- Initializations ---
    setDynamicTerminalTitle();
    resetUI();
});