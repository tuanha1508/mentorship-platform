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
            '/about': { 
                page: 'pages/about.html',
                title: 'About Us - Mentorship Platform',
                css: 'css/about.css',
                bodyClass: 'about-page'
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
        
        // Add exit animation to current content if possible
        if (this.appContainer.children.length) {
            this.appContainer.classList.add('slide-exit');
            
            // Force a reflow to ensure animation works properly
            void this.appContainer.offsetWidth;
            
            this.appContainer.classList.add('slide-exit-active');
        }
        
        // Update browser history
        window.history.pushState({}, '', route);
        
        // Update current route
        this.currentRoute = route;
        
        // Short delay to allow exit animation to start
        setTimeout(() => {
            // Remove exit animation classes
            this.appContainer.classList.remove('slide-exit');
            this.appContainer.classList.remove('slide-exit-active');
            
            // Render the page
            this.handleRouteChange();
        }, 100);
    }
    
    createTransitionOverlay() {
        // Create transition overlay if it doesn't exist
        let overlay = document.getElementById('page-transition-overlay');
        if (!overlay) {
            // Load the transitions CSS if not already loaded
            if (!document.querySelector('link[href="css/transitions.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'css/transitions.css';
                link.id = 'transitions-css';
                document.head.appendChild(link);
            }
            
            // Create the overlay element
            overlay = document.createElement('div');
            overlay.id = 'page-transition-overlay';
            overlay.classList.add('page-transition-overlay');
            
            // Create loader element
            const loader = document.createElement('div');
            loader.className = 'page-loader';
            
            // Add loader circles
            for (let i = 0; i < 3; i++) {
                const circle = document.createElement('div');
                circle.className = 'loader-circle';
                loader.appendChild(circle);
            }
            
            overlay.appendChild(loader);
            document.body.appendChild(overlay);
        }
        this.transitionOverlay = overlay;
    }
    
    handleRouteChange() {
        // Get current route (path)
        const path = window.location.pathname;
        
        // Show transition overlay
        this.transitionOverlay.classList.add('visible');
        
        // Find the route configuration
        const route = this.routes[path] || this.routes['/'];
        
        // Check for authentication requirement
        if (route.requiresAuth) {
            const token = localStorage.getItem('authToken');
            if (!token) {
                // Redirect to signin page if user is not authenticated
                this.navigateTo('/signin');
                return;
            }
        }
        
        // If it's a dashboard route, redirect to the dashboard with proper extension
        if (path.startsWith('/dashboard')) {
            // Extract the specific dashboard page from the path if any
            const dashboardPath = path.replace('/dashboard', '');
            
            // On Vercel and other static hosts, we need to include the .html extension
            // Check if we're in production (deployed) environment
            const isProduction = window.location.hostname !== 'localhost' && 
                               !window.location.hostname.includes('127.0.0.1');
            
            const extension = isProduction ? '.html' : '';
            window.location.href = '/dashboard' + extension + (dashboardPath ? dashboardPath : '');
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
        
        // Show loading animation in the overlay
        this.showLoadingAnimation();
        
        // Preload CSS to ensure it's in the browser cache
        this.preloadCSS(route.css)
            .then(() => {
                // Clear the container immediately before loading the page
                this.appContainer.innerHTML = '';
                
                // Add slide-enter class to prepare for animation
                this.appContainer.classList.add('slide-enter');
                
                // Start loading content and CSS in parallel
                return Promise.all([
                    this.updatePageCSS(route.css),
                    this.fetchPageContent(route.page)
                ]);
            })
            .then(([_, html]) => {
                // Insert the HTML content
                this.appContainer.innerHTML = html;
                
                // Load page-specific JavaScript
                if (route.js) {
                    this.loadPageScript(route.js);
                } else {
                    this.initPageScripts();
                }
                
                // Force a reflow to ensure animation works properly
                void this.appContainer.offsetWidth;
                
                // Start entrance animation
                this.appContainer.classList.add('slide-enter-active');
                this.appContainer.classList.remove('slide-enter');
                
                // Short delay to ensure all CSS is properly applied
                setTimeout(() => {
                    // Hide the loading animation
                    this.hideLoadingAnimation();
                    
                    // Apply smooth transition to make content fully visible
                    this.appContainer.style.opacity = '1';
                    this.appContainer.style.transform = 'translateY(0)';
                    
                    // Hide the transition overlay with a nice fade
                    setTimeout(() => {
                        this.transitionOverlay.classList.add('fade-out');
                        setTimeout(() => {
                            this.transitionOverlay.classList.remove('visible');
                            this.transitionOverlay.classList.remove('fade-out');
                            // Clean up animation classes
                            this.appContainer.classList.remove('slide-enter-active');
                        }, 500); // Match the CSS transition duration
                    }, 200);
                    
                    // Dispatch event after page load
                    document.dispatchEvent(new CustomEvent('route:after'));
                }, 150);
            });
    }
    
    /**
     * Preload a CSS file to ensure it's in the browser cache
     * @param {string} cssFile - Path to the CSS file
     * @returns {Promise} - Resolves when the CSS is preloaded
     */
    preloadCSS(cssFile) {
        return new Promise((resolve) => {
            // Skip preloading if no CSS file specified
            if (!cssFile || cssFile === 'css/global.css' || cssFile === 'css/layout.css') {
                resolve();
                return;
            }
            
            // Check if this CSS is already loaded
            const existingLink = document.querySelector(`link[href='${cssFile}']`);
            if (existingLink) {
                resolve();
                return;
            }
            
            // Create a preload link
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'style';
            preloadLink.href = cssFile;
            
            preloadLink.onload = () => {
                resolve();
            };
            
            preloadLink.onerror = () => {
                console.warn(`Failed to preload CSS: ${cssFile}`);
                resolve(); // Resolve anyway to not block navigation
            };
            
            document.head.appendChild(preloadLink);
        });
    }
    
    /**
     * Update the page-specific CSS
     * @param {string} cssFile - Path to the CSS file
     * @returns {Promise} - Resolves when the CSS is loaded and applied
     */
    updatePageCSS(cssFile) {
        return new Promise((resolve) => {
            // Remove previous page-specific CSS if it exists
            const oldPageCSS = document.querySelector('link[data-page-css]');
            
            // Create and add the new CSS link if needed
            if (cssFile && cssFile !== 'css/global.css' && cssFile !== 'css/layout.css') {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssFile;
                link.setAttribute('data-page-css', '');
                
                // Wait for the CSS to load before removing old CSS and resolving
                link.onload = () => {
                    // Remove old CSS only after new CSS is loaded
                    if (oldPageCSS) {
                        oldPageCSS.remove();
                    }
                    
                    // Add a small delay to ensure browser has applied styles
                    setTimeout(() => resolve(), 100);
                };
                
                link.onerror = () => {
                    console.error(`Failed to load CSS: ${cssFile}`);
                    if (oldPageCSS) {
                        oldPageCSS.remove();
                    }
                    // Still resolve to not block navigation, but with a shorter delay
                    setTimeout(() => resolve(), 50);
                };
                
                document.head.appendChild(link);
            } else {
                // If no new CSS needed, just remove old CSS and resolve
                if (oldPageCSS) {
                    oldPageCSS.remove();
                }
                resolve();
            }
        });
    }
    
    /**
     * Fetch page content without rendering it
     * @param {string} pageUrl - URL of the page to fetch
     * @returns {Promise<string>} - Resolves with the HTML content
     */
    fetchPageContent(pageUrl) {
        // Dispatch event before page load
        document.dispatchEvent(new CustomEvent('route:before'));
        
        // Completely unload any existing page content and scripts 
        this.unloadCurrentPage();
        
        // Fetch the HTML for the page
        return fetch(pageUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load page');
                }
                return response.text();
            });
    }
    
    /**
     * Load a page (legacy method - now uses fetchPageContent and updatePageCSS)
     * @param {string} pageUrl - URL of the page to load
     * @param {boolean} applyTransition - Whether to apply a transition
     * @param {string} jsFile - Optional JavaScript file to load
     */
    loadPage(pageUrl, applyTransition = true, jsFile = null) {
        // Dispatch event before page load
        document.dispatchEvent(new CustomEvent('route:before'));
        
        // Completely unload any existing page content and scripts 
        this.unloadCurrentPage();
        
        // Fetch the HTML for the page
        this.fetchPageContent(pageUrl)
            .then(html => {
                // Render the HTML into the container
                this.appContainer.innerHTML = html;
                
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
                }, 300); // Significantly increased timeout to ensure content is rendered
                
                // Dispatch event after page load
                document.dispatchEvent(new CustomEvent('route:after'));
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
        // First, remove any previous instance of this script
        const existingScript = document.querySelector(`script[src="${jsFile}"]`);
        if (existingScript) {
            existingScript.remove();
        }
        
        // Create script element and load it
        const script = document.createElement('script');
        script.src = jsFile;
        
        // Add type="module" for dashboard module script
        if (jsFile.includes('dashboard/index.js')) {
            script.type = 'module';
        }
        script.setAttribute('data-page-script', 'true'); // Mark as page script for easy cleanup
        
        // Add script to the document
        document.body.appendChild(script);
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
        if (typeof LoginPage !== 'undefined') {
            LoginPage.init();
        } else {
            // Load the script dynamically
            const script = document.createElement('script');
            script.src = 'js/pages/auth/login.js';
            document.head.appendChild(script);
        }
    }
    
    initSignupForm() {
        // Initialize registration page functionality
        if (typeof RegisterPage !== 'undefined') {
            RegisterPage.init();
        } else {
            // Load the script dynamically
            const script = document.createElement('script');
            script.src = 'js/pages/auth/register.js';
            document.head.appendChild(script);
        }
    }
    
    /**
     * Load the navbar component for all pages to standardize layout
     */
    /**
     * Show loading animation in the overlay
     */
    showLoadingAnimation() {
        // Show the overlay
        this.transitionOverlay.classList.add('visible');
        
        // Get the loader element
        const loader = this.transitionOverlay.querySelector('.page-loader');
        if (loader) {
            loader.style.display = 'flex';
            loader.style.opacity = '1';
        }
    }
    
    /**
     * Hide loading animation
     */
    hideLoadingAnimation() {
        // Get the loader element
        const loader = this.transitionOverlay.querySelector('.page-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    }
    
    loadNavbarComponent() {
        // Skip navbar loading on dashboard pages
        if (window.location.pathname.startsWith('/dashboard')) {
            return;
        }
        
        // Always remove existing navbar to avoid duplicates or stale content
        const existingNavbar = document.querySelector('.navbar');
        if (existingNavbar) {
            existingNavbar.remove();
        }
        
        // Check for navbar placeholder
        let navbarPlaceholder = document.getElementById('navbar-placeholder');
        
        // If there's no placeholder for the navbar, create one at the top of app container
        if (!navbarPlaceholder) {
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
                
                // Make sure navbar is visible
                navbarPlaceholder.style.display = 'block';
            });
    }
}

// Create router instance when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.router = new Router();
});