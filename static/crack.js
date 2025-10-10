document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('passwordInput');
    const toggleVisibilityBtn = document.getElementById('toggleVisibilityBtn');
    const charCounter = document.getElementById('charCounter');
    const strengthBar = document.getElementById('strengthBar');
    const crackTimeSpan = document.getElementById('crackTime');
    const breachStatusSpan = document.getElementById('breachStatus');
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
        strengthBar.style.width = '0%';
        charCounter.textContent = '0';
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

        const addLine = (text, className = '', delay) => {
            return new Promise(resolve => {
                simulationTimeout = setTimeout(() => {
                    const p = document.createElement('p');
                    p.textContent = text;
                    if (className) p.className = className;
                    crackAnimationDiv.appendChild(p);
                    crackAnimationDiv.scrollTop = crackAnimationDiv.scrollHeight;
                    resolve();
                }, delay);
            });
        };

        const run = async () => {
            await addLine('> Initializing hashcat v6.2.5...', '', 0);
            await addLine('> Hash.Type........: NTLM (common web hash)', 'sim-progress', 500);

            if (score <= 1) {
                await addLine('> Attack.Mode......: Dictionary (rockyou.txt)', 'sim-progress', 400);
                await addLine('> STATUS: CRACKED', 'sim-fail', 600);
                await addLine(`> Cracked.Password.: ${password}`, 'pwned', 200);
            } else if (score === 2) {
                await addLine('> Attack.Mode......: Dictionary (rockyou.txt)', 'sim-progress', 400);
                await addLine('> STATUS: EXHAUSTED', 'sim-progress', 1000);
                await addLine('> Switching to rule-based attack (best64.rule)...', '', 500);
                await addLine('> STATUS: CRACKED', 'sim-fail', 1200);
                await addLine(`> Cracked.Password.: ${password}`, 'pwned', 200);
            } else {
                await addLine('> Attack.Mode......: Dictionary (rockyou.txt)', 'sim-progress', 400);
                await addLine('> STATUS: EXHAUSTED', 'sim-progress', 1000);
                await addLine('> Switching to rule-based attack (best64.rule)...', '', 500);
                await addLine('> STATUS: EXHAUSTED', 'sim-progress', 1200);
                await addLine('> Switching to brute-force (mask attack)...', '', 500);
                await addLine(`> Estimated.Time...: ${strength.crack_times_display.offline_slow_hashing_1e4_per_second.toUpperCase()}`, 'sim-progress', 800);
                await addLine('>> ATTACK ABORTED. TOO COMPLEX.', 'clear', 500);
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