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
console.log('Script loaded, checking for installation capability');

// Create install button
function createInstallButton() {
    const existingButton = document.getElementById('install-button');
    if (existingButton) return;

    console.log('Creating install button');
    const installButton = document.createElement('button');
    installButton.id = 'install-button';
    installButton.textContent = 'Install App';
    Object.assign(installButton.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#317EFB',
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        zIndex: 1000,
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
    });
    
    if (deferredPrompt) {
        installButton.addEventListener('click', installPWA);
    } else if (isIOS) {
        installButton.addEventListener('click', showIOSInstructions);
    }
    
    document.body.appendChild(installButton);
}

// Installation function
async function installPWA() {
    console.log('Install button clicked, deferredPrompt:', !!deferredPrompt);
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Installation outcome:', outcome);
    deferredPrompt = null;
    
    const button = document.getElementById('install-button');
    if (button) button.remove();
}

// Show iOS instructions
function showIOSInstructions() {
    const instructionsDiv = document.createElement('div');
    instructionsDiv.id = 'ios-instructions';
    Object.assign(instructionsDiv.style, {
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: 1000,
        maxWidth: '250px'
    });
    
    instructionsDiv.innerHTML = `
        <p style="margin: 0 0 10px">To install this app:</p>
        <ol style="margin: 0; padding-left: 20px">
            <li>Tap the share button <span style="margin: 0 5px">📤</span></li>
            <li>Select "Add to Home Screen" <span style="margin: 0 5px">📱</span></li>
        </ol>
        <button onclick="this.parentElement.remove()" 
                style="margin-top: 10px; padding: 5px 10px; border: none; 
                       background: #eee; border-radius: 4px; width: 100%">
            Got it
        </button>
    `;
    
    document.body.appendChild(instructionsDiv);
}

// Listen for installation capability
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired');
    e.preventDefault();
    deferredPrompt = e;
    createInstallButton();
});

// Check on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking installation status');
    if (isIOS) {
        createInstallButton();
    }
});

// Handle successful installation
window.addEventListener('appinstalled', (e) => {
    console.log('PWA was installed');
    const button = document.getElementById('install-button');
    const instructions = document.getElementById('ios-instructions');
    if (button) button.remove();
    if (instructions) instructions.remove();
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
