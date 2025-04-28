/**
 * Main application file
 * Initializes the application and coordinates between different modules
 */

class App {
    constructor() {
        this.initApp();
    }

    initApp() {
        // Add loading indicator for page transitions
        this.setupLoadingIndicator();
        
        // Setup any global event handlers
        this.setupGlobalHandlers();
        
        // Check authentication state (if available)
        this.checkAuthState();
    }

    setupLoadingIndicator() {
        // Add loading indicator for route transitions
        document.addEventListener('route:before', () => {
            // Show loading indicator
            console.log('Page transition started');
            // Force a repaint to ensure transition animations work properly
            document.body.style.display = 'none';
            void document.body.offsetHeight; // Force a reflow
            document.body.style.display = '';
        });

        document.addEventListener('route:after', () => {
            // Hide loading indicator
            console.log('Page transition complete');
        });
    }

    setupGlobalHandlers() {
        // Handle any global events here
        console.log('Global handlers initialized');
    }

    checkAuthState() {
        // Check if user is logged in
        const token = localStorage.getItem('authToken');
        if (token) {
            console.log('User is authenticated');
            // Update UI for authenticated state
            this.updateUIForAuthState(true);
        } else {
            console.log('User is not authenticated');
            // Update UI for unauthenticated state
            this.updateUIForAuthState(false);
        }
    }

    updateUIForAuthState(isAuthenticated) {
        // Update UI elements based on authentication state
        const authElements = document.querySelectorAll('[data-auth-required]');
        const guestElements = document.querySelectorAll('[data-guest-only]');

        authElements.forEach(el => {
            el.style.display = isAuthenticated ? '' : 'none';
        });

        guestElements.forEach(el => {
            el.style.display = isAuthenticated ? 'none' : '';
        });
    }
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // The router is initialized in router.js
    window.app = new App();
});
