// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('../service-worker.js');
            console.log('ServiceWorker registration successful with scope:', registration.scope);
            
            // Check if there's a waiting service worker
            if (registration.waiting) {
                console.log('New service worker waiting to activate');
            }
            
            // Listen for new service workers
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('New service worker installing:', newWorker);
                
                newWorker.addEventListener('statechange', () => {
                    console.log('Service worker state:', newWorker.state);
                });
            });
            
        } catch (err) {
            console.error('ServiceWorker registration failed:', err);
        }
    });
    
    // Listen for controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New service worker activated');
    });
}
