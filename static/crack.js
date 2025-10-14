document.addEventListener('DOMContentLoaded', () => {
    // Centralized DOM Element Selectors
    const UI = {
        passwordInput: document.getElementById('passwordInput'),
        toggleVisibilityBtn: document.getElementById('toggleVisibilityBtn'),
        charCounter: document.getElementById('charCounter'),
        strengthMeter: document.getElementById('strengthMeter'),
        crackTimeSpan: document.getElementById('crackTime'),
        strengthTextSpan: document.getElementById('strengthText'),
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
        achievementUnlock: document.getElementById('achievementUnlock'),
        // Live Stats
        usersOnline: document.getElementById('usersOnline'),
        passwordsAnalyzed: document.getElementById('passwordsAnalyzed'),
        breachChecks: document.getElementById('breachChecks'),
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

    // --- Gamification State ---
    let analysisCount = parseInt(localStorage.getItem('securepass_analysisCount') || '0');
    let achievements = JSON.parse(localStorage.getItem('securepass_achievements') || '[]');

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

    // --- Social Sharing ---
    window.shareResult = function() {
        const passwordStrength = document.title;
        const shareText = `I just tested a password on SecurePass and the result was: ${passwordStrength}. How strong is yours?`;
        const shareUrl = window.location.href;

        if (navigator.share) {
            navigator.share({ title: 'SecurePass Password Analysis', text: shareText, url: shareUrl });
        } else {
            // Fallback for desktop
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
            window.open(twitterUrl, '_blank');
        }
    }
    // --- Core Analysis Function ---
    async function analyzePassword(password) {
        const strength = zxcvbn(password);
        updateStrengthUI(strength);
        
        try {
            const breachResponse = await checkBreachOnServer(password);
            if (UI.breachChecks) { // Increment breach check counter
                UI.breachChecks.textContent = (parseInt(UI.breachChecks.textContent.replace(/,/g, '')) + 1).toLocaleString();
            }
            updateBreachUI(breachResponse.breach);
        } catch (error) {
            console.error('Breach check failed:', error);
            UI.breachStatusSpan.textContent = 'BREACH CHECK SERVICE UNAVAILABLE';
            UI.breachStatusSpan.className = 'pwned'; // Reuse 'pwned' style for error state
        }

        if (UI.passwordsAnalyzed) { // Increment analyzed counter
            UI.passwordsAnalyzed.textContent = (parseInt(UI.passwordsAnalyzed.textContent.replace(/,/g, '')) + 1).toLocaleString();
        }

        // --- Gamification Hooks ---
        analysisCount++;
        localStorage.setItem('securepass_analysisCount', analysisCount);
        checkAchievements(strength);

        startHackerSimulation(strength);
    }

    // --- UI Update Functions ---
    function updateStrengthUI(strength) {
        UI.crackTimeSpan.textContent = strength.crack_times_display.offline_slow_hashing_1e4_per_second.toUpperCase();
        
        const score = strength.score;
        const segments = UI.strengthMeter.querySelectorAll('.strength-segment');
        const colors = ['var(--color-danger)', 'var(--color-danger)', 'var(--color-accent)', 'var(--color-success)', 'var(--color-success)'];

        segments.forEach((segment, index) => {
            if (index <= score) {
                segment.classList.add('active');
                segment.style.backgroundColor = colors[score];
            } else {
                segment.classList.remove('active');
                segment.style.backgroundColor = 'var(--color-bg-meter)';
            }
        });
        // Update strength text
        const strengthTextMap = {
            0: 'Very Weak', 1: 'Weak', 2: 'Medium', 3: 'Strong', 4: 'Very Strong'
        };
        UI.strengthTextSpan.textContent = strengthTextMap[score].toUpperCase();
        UI.strengthTextSpan.className = colors[score].includes('danger') ? 'pwned' : (colors[score].includes('accent') ? 'sim-progress' : 'clear');
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
        UI.favicon.href = '/static/favicon.ico?v=5'; // Reset favicon with cache buster
        UI.strengthMeter.querySelectorAll('.strength-segment').forEach(segment => {
            segment.classList.remove('active');
            segment.style.backgroundColor = 'var(--color-bg-meter)';
        });
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
        UI.strengthTextSpan.textContent = '—';
        UI.strengthTextSpan.className = '';
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

    // Helper function to get a random character from a given string
    function getRandomChar(charset) {
        const randomValues = new Uint32Array(1);
        window.crypto.getRandomValues(randomValues);
        return charset[randomValues[0] % charset.length];
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
        window.crypto.getRandomValues(randomIndices);
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
        const { score, password, guesses_log10 } = strength;
        
        const typeLine = (text, className = '', delay = 0, speed = 25) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    const p = document.createElement('p');
                    if (className) p.className = className;
                    UI.crackAnimationDiv.appendChild(p);

                    let i = 0;
                    const typeChar = () => {
                        if (i < text.length) {
                            p.textContent += text.charAt(i);
                            UI.crackAnimationDiv.scrollTop = UI.crackAnimationDiv.scrollHeight;
                            i++;
                            simulationTimeout = setTimeout(typeChar, speed + (Math.random() * speed));
                        } else {
                            resolve();
                        }
                    };
                    typeChar();
                }, delay);
            });
        };

        const showProgress = (duration) => {
            return new Promise(resolve => {
                const p = document.createElement('p');
                UI.crackAnimationDiv.appendChild(p);
                const startTime = Date.now();
                const updateInterval = 100;

                const update = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const barLength = 20;
                    const filledLength = Math.round(barLength * progress);
                    const bar = '█'.repeat(filledLength) + ' '.repeat(barLength - filledLength);
                    p.textContent = `> Progress: [${bar}] ${Math.round(progress * 100)}%`;
                    UI.crackAnimationDiv.scrollTop = UI.crackAnimationDiv.scrollHeight;

                    if (progress < 1) {
                        simulationTimeout = setTimeout(update, updateInterval);
                    } else {
                        p.textContent = `> Progress: [${'█'.repeat(barLength)}] 100%`;
                        resolve();
                    }
                };
                update();
            });
        };

        const showGuesses = (count, delay) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    const p = document.createElement('p');
                    p.className = 'sim-progress';
                    UI.crackAnimationDiv.appendChild(p);
                    let i = 0;
                    const interval = setInterval(() => {
                        if (i >= count) {
                            clearInterval(interval);
                            resolve();
                            return;
                        }
                        p.textContent = `> Trying: ${generateRandomString(password.length)}`;
                        UI.crackAnimationDiv.scrollTop = UI.crackAnimationDiv.scrollHeight;
                        i++;
                    }, 100);
                }, delay);
            });
        };

        const generateRandomString = (len) => {
            const chars = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
            let result = '';
            for (let i = 0; i < len; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        const run = async () => {
            await typeLine('> Initializing SecurePass Cracker v3.0...', '', 0, 10);
            await typeLine('> GPUs detected: 1 | Activating device #1: NVIDIA RTX 4090', 'sim-progress', 200);
            await typeLine(`> Target Hash Type..: NTLM (guesses: ${Math.round(Math.pow(10, guesses_log10)).toLocaleString()})`, 'sim-progress', 400);

            if (score <= 1) {
                await typeLine('> Attack Mode.......: Dictionary (rockyou.txt)', 'sim-progress', 400);
                await showProgress(1500);
                await typeLine('> STATUS: CRACKED', 'sim-fail', 100);
                await typeLine(`> Cracked Password..: ${password}`, 'pwned', 200);
            } else if (score === 2) {
                await typeLine('> Attack Mode.......: Dictionary + Rules (best64.rule)', 'sim-progress', 400);
                await showProgress(3000);
                await typeLine('> STATUS: CRACKED', 'sim-fail', 100);
                await typeLine(`> Cracked Password..: ${password}`, 'pwned', 200);
            } else {
                await typeLine('> Attack Mode.......: Brute-force (Mask Attack)', 'sim-progress', 400);
                await typeLine('> Mask..............: ?a?a?a?a?a?a...', 'sim-progress', 500);
                showGuesses(50, 600);
                await showProgress(5000);
                await typeLine(`> Estimated Time....: ${strength.crack_times_display.offline_slow_hashing_1e4_per_second.toUpperCase()}`, 'sim-progress', 100);
                await typeLine('>> ATTACK ABORTED. TIME-TO-CRACK EXCEEDS FEASIBILITY.', 'clear', 500);
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

    // --- Gamification & Achievements ---
    function checkAchievements(strength) {
        const achievementMap = {
            'first_blood': { condition: analysisCount === 1, text: "First Blood - Analyzed your first password" },
            'addicted': { condition: analysisCount === 10, text: "Addicted - Analyzed 10 passwords" },
            'cypher_master': { condition: strength.score === 4, text: "Cypher Master - Created a 'Very Strong' password" }
        };

        for (const [key, achievement] of Object.entries(achievementMap)) {
            if (achievement.condition && !achievements.includes(key)) {
                achievements.push(key);
                localStorage.setItem('securepass_achievements', JSON.stringify(achievements));
                showAchievement(achievement.text);
                break; // Show one achievement at a time
            }
        }
    }

    function showAchievement(text) {
        const achievementText = UI.achievementUnlock.querySelector('.achievement-text');
        achievementText.textContent = text;
        UI.achievementUnlock.classList.add('show');
        setTimeout(() => {
            UI.achievementUnlock.classList.remove('show');
        }, 4000);
    }

    // --- Live Stats Simulation & Obfuscation ---
    function formatStatNumber(num) {
        const number = Math.floor(num);
        if (number >= 1000000) {
            return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (number >= 1000) {
            return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return number.toString();
    }

    function renderAnimatedNumber(element, number) {
        // Use the new formatting function for display
        const numberStr = formatStatNumber(number);
        const oldStr = Array.from(element.children).map(span => span.textContent).join('');

        // Clear previous content
        element.innerHTML = '';

        for (let i = 0; i < numberStr.length; i++) {
            const digitSpan = document.createElement('span');
            digitSpan.className = 'stat-digit';
            digitSpan.textContent = numberStr[i];

            // Add a subtle animation if the digit has changed
            if (oldStr[i] !== numberStr[i]) {
                digitSpan.classList.add('tick');
                digitSpan.addEventListener('animationend', () => digitSpan.classList.remove('tick'), { once: true });
            }

            element.appendChild(digitSpan);
        }
    }

    function initializeLiveStats() {
        if (!UI.usersOnline) return; // Don't run if the elements don't exist

        // Base numbers on time of day for more "realistic" starting points
        const now = new Date();
        const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();

        let users = 120 + Math.floor(Math.sin(minutesSinceMidnight / 30) * 50) + Math.floor(Math.random() * 20);
        let analyzed = 7500 + Math.floor(minutesSinceMidnight * 15.5);
        let breaches = 11500 + Math.floor(minutesSinceMidnight * 22.3);

        // Initial render
        renderAnimatedNumber(UI.usersOnline, users);
        renderAnimatedNumber(UI.passwordsAnalyzed, analyzed);
        renderAnimatedNumber(UI.breachChecks, breaches);

        // Fluctuate user count
        setInterval(() => {
            const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
            users = Math.max(100, users + change); // Keep it above a minimum
            renderAnimatedNumber(UI.usersOnline, users);
        }, 3000); // Update every 3 seconds

        // Increment counters slowly
        setInterval(() => {
            analyzed += 1;
            renderAnimatedNumber(UI.passwordsAnalyzed, analyzed);
        }, 1500); // Update every 1.5 seconds

        setInterval(() => {
            breaches += (Math.random() > 0.5 ? 1 : 2);
            renderAnimatedNumber(UI.breachChecks, breaches);
        }, 1500); // Update every 1.5 seconds
    }

    // --- Initializations ---
    setDynamicTerminalTitle();

    // --- VOID-ENHANCEMENT PROTOCOL: Quick Wins ---
    let sessionCount = parseInt(localStorage.getItem('securepass_sessions')) || 0;
    sessionCount++;
    localStorage.setItem('securepass_sessions', sessionCount);

    if (sessionCount === 1) { // First visit hook
        setTimeout(() => {
            showAchievement("🌀 Welcome to the Void. Your journey begins.");
        }, 3000);
    } else { // Return visitor hook
        console.log(`%c∅: Welcome back, Void Walker. Session #${sessionCount}`, 'color: #00ff00; font-family: "Courier New", monospace;');
    }
    // --- End Protocol ---

    initializeLiveStats();
    resetUI();
});