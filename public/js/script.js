// Form validation helper
function validateForm(isLogin = false) {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const email = isLogin ? null : document.getElementById("email").value.trim();

    if (!username || !password || (!isLogin && !email)) {
        alert("Please fill in all required fields");
        return null;
    }

    if (!isLogin && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        alert("Please enter a valid email address");
        return null;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters long");
        return null;
    }

    return { username, password, email };
}

async function register() {
    const formData = validateForm(false);
    if (!formData) return;

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await res.json();
        
        if (res.ok) {
            alert("Registration successful! Please login to continue.");
            // Clear the form
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
            document.getElementById("email").value = "";
        } else {
            alert(data.error || "Registration failed");
        }
    } catch (err) {
        alert("An error occurred during registration");
        console.error(err);
    }
}

async function login() {
    const formData = validateForm(true);
    if (!formData) return;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            window.location.href = '/policy_choice';
        } else {
            const data = await res.json();
            alert(data.error || "Invalid credentials");
        }
    } catch (err) {
        alert("An error occurred during login");
        console.error(err);
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname === "/policies") {
        const tableBody = document.querySelector("#policyTable tbody");
        const response = await fetch('/api/policies');
        const policies = await response.json();

        policies.forEach(policy => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${policy.Policies || "N/A"}</td>
                <td>${policy.Desc || "N/A"}</td>
                <td><input type="radio" name="selectedPolicy" value="${policy.Policies}"></td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelector("#submitSelection").addEventListener("click", async function() {
            const selected = document.querySelector('input[name="selectedPolicy"]:checked');
            if (!selected) return alert("Please select a policy.");

            await fetch('/api/select-policy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ policy: selected.value })
            });

            alert("Policy selection saved!");
        });
    }

    updateOnlineStatus();
});

// PWA Installation handling
let deferredPrompt;
let installPromptShown = false;

// PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install prompt after a short delay if not already shown
    if (!installPromptShown && !localStorage.getItem('pwaInstallDismissed')) {
        setTimeout(showInstallPrompt, 3000);
    }
});

// Handle successful installation
window.addEventListener('appinstalled', () => {
    installPromptShown = false;
    deferredPrompt = null;
    hideInstallPrompt();
    // Track successful installation
    localStorage.setItem('pwaInstalled', 'true');
});

// Show custom install prompt
function showInstallPrompt() {
    if (installPromptShown) return;
    
    const promptContainer = document.createElement('div');
    promptContainer.id = 'pwa-install-prompt';
    promptContainer.innerHTML = `
        <div class="prompt-content">
            <p>Install Policy Predictor for a better experience!</p>
            <div class="prompt-buttons">
                <button id="pwa-install-btn">Install</button>
                <button id="pwa-dismiss-btn">Not Now</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(promptContainer);
    installPromptShown = true;
    
    // Handle install button click
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
        hideInstallPrompt();
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
    });
    
    // Handle dismiss button click
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        hideInstallPrompt();
        localStorage.setItem('pwaInstallDismissed', 'true');
    });
}

// Hide install prompt
function hideInstallPrompt() {
    const prompt = document.getElementById('pwa-install-prompt');
    if (prompt) {
        prompt.remove();
        installPromptShown = false;
    }
}

// Check online status and update UI
function updateOnlineStatus() {
    const statusIndicator = document.getElementById('online-status');
    if (!statusIndicator) return;
    
    if (navigator.onLine) {
        statusIndicator.textContent = '🟢 Online';
        statusIndicator.classList.remove('offline');
        statusIndicator.classList.add('online');
    } else {
        statusIndicator.textContent = '🔴 Offline';
        statusIndicator.classList.remove('online');
        statusIndicator.classList.add('offline');
    }
}

// Listen for online/offline events
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
