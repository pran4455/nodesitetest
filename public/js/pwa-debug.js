// PWA Debug Console
const pwaDebug = {
    log: function(msg, data) {
        console.log(`[PWA Debug] ${msg}`, data || '');
        
        // Only show debug UI in development
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            const debugContainer = document.getElementById('pwa-debug') || this.createDebugContainer();
            const logEntry = document.createElement('div');
            logEntry.textContent = `${new Date().toLocaleTimeString()} - ${msg}`;
            debugContainer.appendChild(logEntry);
            
            // Limit number of messages
            if (debugContainer.children.length > 10) {
                debugContainer.removeChild(debugContainer.firstChild);
            }
        }
    },
    
    createDebugContainer: function() {
        const container = document.createElement('div');
        container.id = 'pwa-debug';
        Object.assign(container.style, {
            position: 'fixed',
            left: '10px',
            bottom: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 10000
        });
        document.body.appendChild(container);
        return container;
    },
    
    checkInstallationStatus: function() {
        this.log('Checking PWA installation capability...');
        
        // Check if running as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.log('Running as installed PWA');
            return;
        }
        
        // Check installation support
        if (!('serviceWorker' in navigator)) {
            this.log('Service Workers not supported');
            return;
        }
        
        if (!('install' in window)) {
            this.log('PWA installation not supported in this browser');
            return;
        }
        
        this.log('PWA installation is supported');
        
        // Check platform-specific requirements
        const platform = {
            isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
            isAndroid: /Android/.test(navigator.userAgent),
            isChrome: /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),
            isSafari: /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor)
        };
        
        this.log('Platform info:', platform);
    }
};

// Run checks when script loads
pwaDebug.checkInstallationStatus();
