/**
 * Simple router to handle navigation between pages
 * Manages displaying the correct page based on URL
 */

class Router {
    constructor() {
        // Create page transition overlay element
        this.createTransitionOverlay();
        
        // Routes configuration - maps routes to page HTML files and CSS files
        this.routes = {
            '/': { 
                page: 'pages/home.html',
                title: 'Mentorship Matching Platform',
                css: 'css/home.css',
                bodyClass: 'home-page'
            },
            '/signin': { 
                page: 'pages/signin.html',
                title: 'Sign In - Mentorship Platform',
                css: 'css/auth.css',
                bodyClass: 'auth-page'
            },
            '/signup': { 
                page: 'pages/signup.html',
                title: 'Sign Up - Mentorship Platform',
                css: 'css/auth.css',
                bodyClass: 'auth-page'
            },
            '/dashboard': {
                page: 'dashboard.html',
                title: 'Dashboard - Mentorship Platform',
                css: 'css/dashboard.css',
                bodyClass: 'dashboard-page',
                requiresAuth: true,
                js: 'js/pages/dashboard/index.js'
            },
            '/dashboard/my-mentor': {
                page: 'dashboard.html',
                title: 'My Mentor - Mentorship Platform',
                css: 'css/dashboard.css',
                bodyClass: 'dashboard-page',
                requiresAuth: true,
                js: 'js/pages/dashboard/index.js'
            },
            '/dashboard/search-mentor': {
                page: 'dashboard.html',
                title: 'Find a Mentor - Mentorship Platform',
                css: 'css/dashboard.css',
                bodyClass: 'dashboard-page',
                requiresAuth: true,
                js: 'js/pages/dashboard/index.js'
            },
            '/dashboard/chat': {
                page: 'dashboard.html',
                title: 'Messages - Mentorship Platform',
                css: 'css/dashboard.css',
                bodyClass: 'dashboard-page',
                requiresAuth: true,
                js: 'js/pages/dashboard/index.js'
            },
            '/dashboard/profile': {
                page: 'dashboard.html',
                title: 'Profile - Mentorship Platform',
                css: 'css/dashboard.css',
                bodyClass: 'dashboard-page',
                requiresAuth: true,
                js: 'js/pages/dashboard/index.js'
            }
        };
        
        // DOM element to render pages into
        this.appContainer = document.getElementById('app');
        
        // Current active route
        this.currentRoute = window.location.pathname;
        
        if (this.currentRoute === '/' && window.location.hash) {
            this.currentRoute = window.location.hash.slice(1);
        }
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up click event listener for all links
        document.addEventListener('click', (e) => {
            // Only handle clicks on links
            if (e.target.tagName === 'A') {
                const href = e.target.getAttribute('href');
                
                // Only handle internal links (start with / or #)
                if (href && (href.startsWith('/') || href.startsWith('#'))) {
                    e.preventDefault();
                    
                    // Strip the # if it exists
                    const route = href.startsWith('#') ? href.slice(1) : href;
                    this.navigateTo(route);
                }
            }
        });
        
        // Handle browser back/forward navigation
        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });
        
        // Handle initial route
        this.handleRouteChange();
    }
    
    navigateTo(route) {
        // Ensure route starts with a slash for consistency
        if (!route.startsWith('/')) {
            route = '/' + route;
        }
        
        console.log('Navigating to route:', route);
        
        // Update browser history
        window.history.pushState({}, '', route);
        
        // Update current route
        this.currentRoute = route;
        
        // Render the page
        this.handleRouteChange();
    }
    
    createTransitionOverlay() {
        // Create transition overlay if it doesn't exist
        let overlay = document.getElementById('page-transition-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'page-transition-overlay';
            overlay.classList.add('page-transition-overlay');
            document.body.appendChild(overlay);
            
            // Add the style for the overlay if it doesn't exist
            if (!document.getElementById('transition-overlay-style')) {
                const style = document.createElement('style');
                style.id = 'transition-overlay-style';
                style.textContent = `
                    .page-transition-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: #121212;
                        z-index: 9999;
                        opacity: 0;
                        pointer-events: none;
                        transition: opacity 0.6s ease;
                    }
                    .page-transition-overlay.visible {
                        opacity: 1;
                        pointer-events: all;
                    }
                    .page-transition-overlay.fade-out {
                        opacity: 0;
                    }
                `;
                document.head.appendChild(style);
            }
        }
        this.transitionOverlay = overlay;
    }
    
    handleRouteChange() {
        // Get current route (path)
        const path = window.location.pathname;
        console.log('Router handling route change for path:', path);
        
        // Show transition overlay
        this.transitionOverlay.classList.add('visible');
        
        // Find the route configuration
        const route = this.routes[path] || this.routes['/'];
        if (!route) {
            console.error('No route configuration found for', path, 'defaulting to home');
        }
        
        console.log('Using route config:', route);
        
        // Check for authentication requirement
        if (route.requiresAuth) {
            const token = localStorage.getItem('authToken');
            if (!token) {
                // Redirect to signin page if user is not authenticated
                console.log('Authentication required for route, redirecting to signin');
                this.navigateTo('/signin');
                return;
            }
        }
        
        // If it's a dashboard route, redirect to the dashboard without showing .html
        if (path.startsWith('/dashboard')) {
            // Extract the specific dashboard page from the path if any
            const dashboardPath = path.replace('/dashboard', '');
            window.location.href = '/dashboard' + (dashboardPath ? dashboardPath : '');
            return;
        }
        
        // Update page title
        document.title = route.title;
        
        // Update body class - clear any previous classes first
        document.body.className = '';
        document.body.classList.add(route.bodyClass);
        
        // First hide the container immediately
        this.appContainer.style.opacity = '0';
        this.appContainer.style.transform = 'translateY(10px)';
        
        // Load CSS first, then content
        this.updatePageCSS(route.css)
            .then(() => {
                // Clear the container immediately
                this.appContainer.innerHTML = '';
                
                // Load new page content
                this.loadPage(route.page, false, route.js);
            })
            .catch(error => {
                console.error('Error loading CSS:', error);
                this.appContainer.innerHTML = '';
                this.loadPage(route.page, true);
            });
    }
    
    updatePageCSS(cssFile) {
        return new Promise((resolve) => {
            // Remove previous page-specific CSS if it exists
            const oldPageCSS = document.querySelector('link[data-page-css]');
            if (oldPageCSS) {
                oldPageCSS.remove();
            }
            
            // If no page-specific CSS needed, resolve immediately
            if (!cssFile || cssFile === 'css/global.css' || cssFile === 'css/layout.css') {
                // Add a small delay even if no new CSS to load
                setTimeout(() => resolve(), 200);
                return;
            }
            
            // Create and add the new CSS link
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssFile;
            link.setAttribute('data-page-css', '');
            
            // Wait for the CSS to load before resolving
            link.onload = () => {
                // Add additional delay after CSS loads to ensure browser applies it
                setTimeout(() => resolve(), 300);
            };
            link.onerror = () => {
                console.error('Failed to load CSS:', cssFile);
                setTimeout(() => resolve(), 200); // Still resolve to continue loading the page
            };
            
            document.head.appendChild(link);
        });
    }
    
    loadPage(pageUrl, applyTransition = true, jsFile = null) {
        console.log('Loading page:', pageUrl, 'with transition:', applyTransition);
        
        // Dispatch event before page load
        document.dispatchEvent(new CustomEvent('route:before'));
        
        // Completely unload any existing page content and scripts 
        this.unloadCurrentPage();
        
        // Fetch the HTML for the page
        fetch(pageUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load page');
                }
                return response.text();
            })
            .then(html => {
                // Render the HTML into the container
                this.appContainer.innerHTML = html;
                
                console.log('Page HTML loaded successfully');
                
                // Load page-specific JavaScript
                if (jsFile) {
                    this.loadPageScript(jsFile);
                } else {
                    this.initPageScripts();
                }
                
                // Ensure all resources are loaded before showing content
                // Use setTimeout to allow browser to render DOM changes
                setTimeout(() => {
                    // Apply smooth transition to make content visible
                    this.appContainer.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    this.appContainer.style.opacity = '1';
                    this.appContainer.style.transform = 'translateY(0)';
                    
                    // Hide the transition overlay
                    setTimeout(() => {
                        this.transitionOverlay.classList.add('fade-out');
                        setTimeout(() => {
                            this.transitionOverlay.classList.remove('visible');
                            this.transitionOverlay.classList.remove('fade-out');
                        }, 600); // Match the CSS transition duration
                    }, 200); // Longer delay before starting overlay fade out
                    
                    console.log('Content made visible with transition');
                }, 300); // Significantly increased timeout to ensure content is rendered
                
                // Dispatch event after page load
                document.dispatchEvent(new CustomEvent('route:after'));
            })
            .catch(error => {
                console.error('Error loading page:', error);
                this.appContainer.innerHTML = '<p>Error loading page. Please try again.</p>';
                this.transitionOverlay.classList.remove('visible');
            });
    }
    
    /**
     * Load a JavaScript file for a page
     * @param {string} jsFile - Path to the JavaScript file
     */
    // Helper method to completely unload the current page
    unloadCurrentPage() {
        // Clear the main content container
        this.appContainer.innerHTML = '';
        
        // Remove any page-specific scripts
        const pageScripts = document.querySelectorAll('script[data-page-script]');
        pageScripts.forEach(script => script.remove());
        
        // Clear any dynamic elements that might have been added outside the main container
        const dynamicElements = document.querySelectorAll('[data-dynamic-element]');
        dynamicElements.forEach(element => element.remove());
    }
    
    loadPageScript(jsFile) {
        try {
            console.log('Loading page script:', jsFile);
            
            // First, remove any previous instance of this script
            const existingScript = document.querySelector(`script[src="${jsFile}"]`);
            if (existingScript) {
                existingScript.remove();
                console.log('Removed previous script instance:', jsFile);
            }
            
            // Create script element and load it
            const script = document.createElement('script');
            script.src = jsFile;
            
            // Add type="module" for dashboard module script
            if (jsFile.includes('dashboard/index.js')) {
                script.type = 'module';
            }
            script.setAttribute('data-page-script', 'true'); // Mark as page script for easy cleanup
            
            // Handle script load event
            script.onload = () => {
                console.log('Script loaded successfully:', jsFile);
                
                // Initialize dashboard if it's the dashboard script
                // Dashboard initialization is handled inside the module
                // Module scripts can't expose global variables directly
            };
            
            // Handle script loading error
            script.onerror = () => {
                console.error('Error loading script:', jsFile);
            };
            
            // Add script to the document
            document.body.appendChild(script);
        } catch (error) {
            console.error('Error in loadPageScript:', error);
        }
    }
    
    initPageScripts() {
        // Initialize form handlers for authentication forms
        if (this.currentRoute === '/signin') {
            this.initSigninForm();
        } else if (this.currentRoute === '/signup') {
            this.initSignupForm();
        }
    }
    
    initSigninForm() {
        // Initialize login page functionality
        console.log('Initializing login page functionality');
        try {
            if (typeof LoginPage !== 'undefined') {
                console.log('LoginPage found, initializing...');
                LoginPage.init();
            } else {
                console.error('LoginPage component not found in global scope');
                
                // Load the script dynamically
                const script = document.createElement('script');
                script.src = 'js/pages/auth/login.js';
                script.onload = function() {
                    console.log('Login script loaded dynamically');
                    if (typeof LoginPage !== 'undefined') {
                        LoginPage.init();
                    } else {
                        console.error('LoginPage still not available after script load');
                    }
                };
                script.onerror = function() {
                    console.error('Error loading login script');
                };
                document.head.appendChild(script);
            }
        } catch (error) {
            console.error('Error initializing login form:', error);
        }
    }
    
    initSignupForm() {
        // Initialize registration page functionality
        console.log('Initializing signup page functionality');
        try {
            if (typeof RegisterPage !== 'undefined') {
                console.log('RegisterPage found, initializing...');
                RegisterPage.init();
            } else {
                console.error('RegisterPage component not found in global scope');
                
                // Load the script dynamically
                const script = document.createElement('script');
                script.src = 'js/pages/auth/register.js';
                script.onload = function() {
                    console.log('Register script loaded dynamically');
                    if (typeof RegisterPage !== 'undefined') {
                        RegisterPage.init();
                    } else {
                        console.error('RegisterPage still not available after script load');
                    }
                };
                script.onerror = function() {
                    console.error('Error loading register script');
                };
                document.head.appendChild(script);
            }
        } catch (error) {
            console.error('Error initializing register form:', error);
        }
    }
    
    /**
     * Load the navbar component for all pages to standardize layout
     */
    loadNavbarComponent() {
        // Skip navbar loading on dashboard pages
        if (window.location.pathname.startsWith('/dashboard')) {
            console.log('Skipping navbar for dashboard page');
            return;
        }
        
        console.log('Loading navbar component');
        try {
            // Always remove existing navbar to avoid duplicates or stale content
            const existingNavbar = document.querySelector('.navbar');
            if (existingNavbar) {
                console.log('Removing existing navbar');
                existingNavbar.remove();
            }
            
            // Check for navbar placeholder
            let navbarPlaceholder = document.getElementById('navbar-placeholder');
            
            // If there's no placeholder for the navbar, create one at the top of app container
            if (!navbarPlaceholder) {
                console.log('Creating navbar placeholder');
                navbarPlaceholder = document.createElement('div');
                navbarPlaceholder.id = 'navbar-placeholder';
                
                // Insert at the beginning of the app container
                if (this.appContainer.firstChild) {
                    this.appContainer.insertBefore(navbarPlaceholder, this.appContainer.firstChild);
                } else {
                    this.appContainer.appendChild(navbarPlaceholder);
                }
            }
            
            // Load the navbar component - use absolute path to avoid path issues
            fetch('/components/navbar.html')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to load navbar component');
                    }
                    return response.text();
                })
                .then(html => {
                    navbarPlaceholder.innerHTML = html;
                    console.log('Navbar component loaded successfully');
                    
                    // Make sure navbar is visible
                    navbarPlaceholder.style.display = 'block';
                })
                .catch(error => {
                    console.error('Error loading navbar component:', error);
                });
        } catch (error) {
            console.error('Error in loadNavbarComponent:', error);
        }
    }
}

// Create router instance when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.router = new Router();
});