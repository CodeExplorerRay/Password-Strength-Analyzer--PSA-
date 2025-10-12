document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('passwordInput');
    const strengthBar = document.getElementById('strengthBar');
    const crackTimeSpan = document.getElementById('crackTime');

    let debounceTimer;

    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (password) {
                analyzePassword(password);
            } else {
                resetUI();
            }
        }, 300);
    });

    function analyzePassword(password) {
        const strength = zxcvbn(password);
        updateStrengthUI(strength);
    }

    function updateStrengthUI(strength) {
        crackTimeSpan.textContent = strength.crack_times_display.offline_slow_hashing_1e4_per_second.toUpperCase();
        const score = strength.score;
        const width = (score + 1) * 20;
        const colors = ['var(--color-danger)', 'var(--color-danger)', 'var(--color-accent)', 'var(--color-success)', 'var(--color-success)'];
        strengthBar.style.width = `${width}%`;
        strengthBar.style.backgroundColor = colors[score] || 'var(--color-danger)';
    }

    function resetUI() {
        strengthBar.style.width = '0%';
        crackTimeSpan.textContent = '—';
    }

    // Set initial focus to the input field for better usability
    if (passwordInput) {
        passwordInput.focus();
    }
});