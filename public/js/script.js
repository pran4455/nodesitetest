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
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Show installation instructions based on device
function showInstallInstructions() {
    const container = document.createElement('div');
    container.id = 'install-instructions';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.backgroundColor = 'white';
    container.style.padding = '15px';
    container.style.borderRadius = '10px';
    container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    container.style.zIndex = '1000';
    container.style.maxWidth = '90%';
    container.style.width = '300px';
    
    if (isIOS) {
        container.innerHTML = `
            <p style="margin: 0 0 10px">Install this app on your iPhone:</p>
            <ol style="margin: 0; padding-left: 20px">
                <li>Tap the Share button</li>
                <li>Tap "Add to Home Screen"</li>
            </ol>
            <button onclick="this.parentElement.remove()" style="margin-top: 10px">Got it</button>
        `;
    }
    
    document.body.appendChild(container);
}

// PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    const installButton = document.createElement('button');
    installButton.id = 'install-button';
    installButton.textContent = 'Install App';
    installButton.className = 'install-button';
    
    // Style the button
    Object.assign(installButton.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 24px',
        backgroundColor: '#317EFB',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        zIndex: '1000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    });
    
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installButton.remove();
    });
    
    document.body.appendChild(installButton);
});

// Handle iOS devices
if (isIOS) {
    // Show iOS installation instructions if not already installed
    if (!window.navigator.standalone) {
        // Don't show immediately on iOS, wait a bit
        setTimeout(showInstallInstructions, 5000);
    }
}

// Handle successful installation
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    // Remove any install UI elements
    const installButton = document.getElementById('install-button');
    const installInstructions = document.getElementById('install-instructions');
    if (installButton) installButton.remove();
    if (installInstructions) installInstructions.remove();
});

// Online/Offline status handling
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

// Update status when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateOnlineStatus();
});
