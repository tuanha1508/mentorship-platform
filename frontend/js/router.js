/**
 * Simple router to handle navigation between pages
 * Manages displaying the correct page based on URL
 */

class Router {
    constructor() {
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
    
    handleRouteChange() {
        // Get current route (path)
        const path = window.location.pathname;
        console.log('Router handling route change for path:', path);
        
        // Find the route configuration
        const route = this.routes[path] || this.routes['/'];
        if (!route) {
            console.error('No route configuration found for', path, 'defaulting to home');
        }
        
        console.log('Using route config:', route);
        
        // Update page title
        document.title = route.title;
        
        // Update body class
        document.body.className = route.bodyClass;
        
        // First apply the fade-out transition to the current content
        this.appContainer.classList.add('slide-out');
        
        // After the transition completes, load the new content
        setTimeout(() => {
            // Update CSS and load page content
            this.updatePageCSS(route.css)
                .then(() => {
                    // Log loading of page
                    console.log('Loading page from:', route.page);
                    // Load and render the page content after CSS is loaded
                    this.loadPage(route.page, true); // Pass true to trigger the slide-in effect
                })
                .catch(error => {
                    console.error('Error in route change:', error);
                    this.loadPage(route.page, true);
                });
        }, 300); // Match this with the transition duration in CSS
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
                resolve();
                return;
            }
            
            // Create and add the new CSS link
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssFile;
            link.setAttribute('data-page-css', '');
            
            // Wait for the CSS to load before resolving
            link.onload = () => resolve();
            link.onerror = () => {
                console.error('Failed to load CSS:', cssFile);
                resolve(); // Still resolve to continue loading the page
            };
            
            document.head.appendChild(link);
        });
    }
    
    loadPage(pageUrl, applyTransition = false) {
        // Fetch the page HTML
        fetch(pageUrl)
            .then(response => response.text())
            .then(html => {
                // Remove any transition classes first
                this.appContainer.classList.remove('slide-out');
                
                // Render the HTML
                this.appContainer.innerHTML = html;
                
                // Apply slide-in transition if requested
                if (applyTransition) {
                    this.appContainer.classList.add('slide-in');
                    
                    // Remove the animation class after it completes
                    setTimeout(() => {
                        this.appContainer.classList.remove('slide-in');
                    }, 500); // Match this with the animation duration in CSS
                }
                
                // Initialize any scripts needed for the page
                this.initPageScripts();
            })
            .catch(error => {
                console.error('Error loading page:', error);
                this.appContainer.innerHTML = '<p>Error loading page. Please try again.</p>';
            });
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
}

// Create router instance when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.router = new Router();
});
