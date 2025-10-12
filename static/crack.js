document.addEventListener('DOMContentLoaded', () => {
    // Centralized DOM Element Selectors
    const UI = {
        passwordInput: document.getElementById('passwordInput'),
        toggleVisibilityBtn: document.getElementById('toggleVisibilityBtn'),
        charCounter: document.getElementById('charCounter'),
        strengthBar: document.getElementById('strengthBar'),
        crackTimeSpan: document.getElementById('crackTime'),
        breachStatusSpan: document.getElementById('breachStatus'),
        generateBtn: document.getElementById('generateBtn'),
        copyBtn: document.getElementById('copyBtn'),
        generatedPasswordDiv: document.getElementById('generatedPassword'),
        crackAnimationDiv: document.getElementById('crackAnimation'),
        terminalTitle: document.getElementById('terminalTitle'),
        favicon: document.getElementById('favicon'),
        // Generator Options
        lengthSlider: document.getElementById('lengthSlider'),
        lengthValue: document.getElementById('lengthValue'),
        includeUppercase: document.getElementById('includeUppercase'),
        includeNumbers: document.getElementById('includeNumbers'),
        includeSymbols: document.getElementById('includeSymbols'),
    };

    // --- Constants ---
    const FAVICONS = {
        default: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>∅</text></svg>",
        weak: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23ff5f56%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22central%22 text-anchor=%22middle%22 font-size=%2280%22 fill=%22black%22>❌</text></svg>",
        medium: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23ffbd2e%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22central%22 text-anchor=%22middle%22 font-size=%2280%22 fill=%22black%22>⚠️</text></svg>",
        strong: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%2327c93f%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22central%22 text-anchor=%22middle%22 font-size=%2280%22 fill=%22black%22>✅</text></svg>",
    };

    // High-grade character sets excluding ambiguous characters (O, 0, I, l, |)
    const CHARSETS = {
        LOWERCASE: "abcdefghijkmnpqrstuvwxyz",
        UPPERCASE: "ABCDEFGHJKLMNPQRSTUVWXYZ",
        NUMBERS: "23456789",
        SYMBOLS: "!@#$%^&*()-_=+[]{};:'\",.<>/?`~", // Expanded symbol set
    };

    let debounceTimer;
    let currentGeneratedPassword = '';
    let simulationTimeout;

    // --- Main Event Listeners ---
    UI.passwordInput.addEventListener('input', () => {
        const password = UI.passwordInput.value;
        UI.charCounter.textContent = password.length; // Update character count

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

    UI.lengthSlider.addEventListener('input', (e) => {
        UI.lengthValue.textContent = e.target.value;
    });

    // --- Password Generation ---
    UI.generateBtn.addEventListener('click', () => {
        const options = {
            length: parseInt(UI.lengthSlider.value, 10),
            uppercase: UI.includeUppercase.checked,
            numbers: UI.includeNumbers.checked,
            symbols: UI.includeSymbols.checked,
        };

        currentGeneratedPassword = generateSecurePasswordClientSide(options);
        if (!currentGeneratedPassword) {
            alert("Please select at least one character type for the password generator.");
            return;
        }

        UI.passwordInput.value = currentGeneratedPassword;
        // Dispatch input event to trigger analysis and UI updates automatically
        UI.passwordInput.dispatchEvent(new Event('input'));

        UI.generatedPasswordDiv.textContent = `Generated: ${currentGeneratedPassword}`;
        UI.generatedPasswordDiv.style.display = 'block';
        UI.copyBtn.style.display = 'inline-block';
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
            UI.breachStatusSpan.textContent = 'BREACH CHECK SERVICE UNAVAILABLE';
            UI.breachStatusSpan.className = 'pwned'; // Reuse 'pwned' style for error state
        }

        startHackerSimulation(strength);
    }

    // --- UI Update Functions ---
    function updateStrengthUI(strength) {
        UI.crackTimeSpan.textContent = strength.crack_times_display.offline_slow_hashing_1e4_per_second.toUpperCase();
        const score = strength.score;
        const width = (score + 1) * 20;
        const colors = ['var(--color-danger)', 'var(--color-danger)', 'var(--color-accent)', 'var(--color-success)', 'var(--color-success)'];
        UI.strengthBar.style.width = `${width}%`;
        UI.strengthBar.style.backgroundColor = colors[score] || 'var(--color-danger)';

        // Update page title
        const strengthTextMap = {
            0: 'Very Weak', 1: 'Weak', 2: 'Medium', 3: 'Strong', 4: 'Very Strong'
        };
        document.title = `(${strengthTextMap[score]}) - Password Strength Analyzer`;

        // Update favicon
        const faviconMap = {
            0: FAVICONS.weak, 1: FAVICONS.weak,
            2: FAVICONS.medium, 3: FAVICONS.strong, 4: FAVICONS.strong
        };
        UI.favicon.href = faviconMap[score] || FAVICONS.default;

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
        UI.favicon.href = FAVICONS.default; // Reset favicon
        UI.strengthBar.style.width = '0%';
        UI.charCounter.textContent = '0';
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
    function generateSecurePasswordClientSide(options) {
        const { length, uppercase, numbers, symbols } = options; // Get generator options
        let characterPool = CHARSETS.LOWERCASE; // Start with lowercase by default
        const requiredChars = [getRandomChar(CHARSETS.LOWERCASE)]; // Always include at least one lowercase

        // Build the full character pool and gather one required character from each selected set
        if (uppercase) { characterPool += CHARSETS.UPPERCASE; requiredChars.push(getRandomChar(CHARSETS.UPPERCASE)); }
        if (numbers) { characterPool += CHARSETS.NUMBERS; requiredChars.push(getRandomChar(CHARSETS.NUMBERS)); }
        if (symbols) { characterPool += CHARSETS.SYMBOLS; requiredChars.push(getRandomChar(CHARSETS.SYMBOLS)); }

        // If the user unchecks all boxes, the pool would only be lowercase.
        // This check ensures we don't generate an empty password if all options are off.
        if (!characterPool) return null;

        const remainingLength = length - requiredChars.length;
        const passwordChars = [...requiredChars];

        // Generate the rest of the password from the full character pool
        if (remainingLength > 0) {
            const randomValues = new Uint32Array(remainingLength);
            window.crypto.getRandomValues(randomValues);
            for (let i = 0; i < remainingLength; i++) {
                passwordChars.push(characterPool[randomValues[i] % characterPool.length]);
            }
        }

        // Shuffle the final array to ensure required characters are not always at the start
        // This is a modern Fisher-Yates shuffle implementation
        const randomIndices = new Uint32Array(passwordChars.length);
        window.crypto.getRandomValues(randomValues);
        for (let i = passwordChars.length - 1; i > 0; i--) {
            const j = randomIndices[i] % (i + 1);
            [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
        }

        return passwordChars.join('');
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