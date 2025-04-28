/**
 * Login page component
 * Handles user login functionality
 */

const LoginPage = {
    /**
     * Initialize the login page
     */
    init() {
        console.log('Initializing login page');
        // Use a slight delay to ensure DOM is loaded
        setTimeout(() => {
            this.form = document.getElementById('signin-form');
            if (this.form) {
                console.log('Signin form found, attaching event listeners');
                this.attachEventListeners();
            } else {
                console.error('Signin form not found after delay');
                // Try again with a longer delay as a fallback
                setTimeout(() => {
                    this.form = document.getElementById('signin-form');
                    if (this.form) {
                        console.log('Signin form found on second attempt');
                        this.attachEventListeners();
                    } else {
                        console.error('Signin form still not found, initialization failed');
                    }
                }, 500);
            }
        }, 100);
    },
    
    /**
     * Attach event listeners to form elements
     */
    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    },
    
    /**
     * Validate form inputs
     * @param {Object} formData - The form data to validate
     * @returns {Object} - Validation result {isValid, errors}
     */
    validateForm(formData) {
        const errors = {};
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        // Validate password
        if (!formData.password || formData.password.length < 1) {
            errors.password = 'Password is required';
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },
    
    /**
     * Display form validation errors
     * @param {Object} errors - Object containing field errors
     */
    displayErrors(errors) {
        // Clear previous error messages
        const errorElements = this.form.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());
        
        // Reset form fields styling
        this.form.querySelectorAll('.form-control').forEach(field => {
            field.classList.remove('is-invalid');
        });
        
        // Display new error messages
        Object.keys(errors).forEach(field => {
            const input = this.form.querySelector(`#${field}`);
            if (input) {
                input.classList.add('is-invalid');
                
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = errors[field];
                input.parentNode.appendChild(errorMessage);
            }
        });
    },
    
    /**
     * Get mock users from localStorage
     * Uses the users stored by mock-data.js
     */
    getMockUsers() {
        try {
            const usersJson = localStorage.getItem('users');
            const users = usersJson ? JSON.parse(usersJson) : [];
            console.log(`Using ${users.length} mock users from localStorage`);
            return users;
        } catch (e) {
            console.error('Error getting users from localStorage:', e);
            return [];
        }
    },
    
    /**
     * Mock API for user login
     * @param {Object} credentials - User login credentials
     * @returns {Promise} - Promise resolving to API response
     */
    mockLoginAPI(credentials) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log('Attempting login with:', credentials.email);
                
                // Get users from localStorage
                const users = this.getMockUsers();
                console.log(`Using ${users.length} mock users from localStorage`);
                
                // Get user by email
                const user = users.find(u => u.email === credentials.email);
                
                console.log('User found:', user ? 'Yes' : 'No');
                if (!user) {
                    return reject({
                        success: false,
                        message: 'User not found',
                        errors: { email: 'User with this email does not exist' }
                    });
                }
                
                // Check password (in a real app, would compare hashed passwords)
                console.log('Password match:', user.password === credentials.password ? 'Yes' : 'No');
                if (user.password !== credentials.password) {
                    return reject({
                        success: false,
                        message: 'Invalid password',
                        errors: { password: 'Incorrect password' }
                    });
                }
                
                // Create session token
                const sessionToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
                
                // Store session in localStorage
                const session = {
                    token: sessionToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
                };
                localStorage.setItem('currentSession', JSON.stringify(session));
                
                // Create user object without password
                const loggedInUser = { ...user };
                delete loggedInUser.password;
                
                resolve({
                    success: true,
                    message: 'Login successful',
                    user: loggedInUser,
                    token: sessionToken
                });
            }, 500); // Simulate network delay
        });
    },
    
    /**
     * Handle form submission
     * @param {Event} event - The form submission event
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        // Get form data
        const formData = {
            email: this.form.querySelector('#email').value.trim(),
            password: this.form.querySelector('#password').value
        };
        
        // Validate form data
        const validation = this.validateForm(formData);
        
        if (!validation.isValid) {
            this.displayErrors(validation.errors);
            return;
        }
        
        try {
            // Show loading state
            const submitButton = this.form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Signing in...';
            submitButton.disabled = true;
            
            // Call mock API
            const result = await this.mockLoginAPI(formData);
            
            // Handle success
            if (result.success) {
                console.log('Login successful:', result.user);
                
                // Store user data in localStorage for dashboard
                localStorage.setItem('userData', JSON.stringify(result.user));
                localStorage.setItem('authToken', result.token);
                
                // Redirect to dashboard after successful login
                window.router.navigateTo('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // Display specific error messages if available
            if (error.errors) {
                this.displayErrors(error.errors);
            } else {
                // Generic error message
                alert('An error occurred during sign in. Please try again.');
            }
            
            // Reset button
            const submitButton = this.form.querySelector('button[type="submit"]');
            submitButton.textContent = 'Login';
            submitButton.disabled = false;
        }
    }
};

// Make LoginPage available globally and support initialization when script is loaded
window.LoginPage = LoginPage;

// Auto-initialize when loaded on signin page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login script loaded, checking if we are on signin page');
    if (window.location.pathname === '/signin') {
        console.log('On signin page, initializing LoginPage');
        LoginPage.init();
    }
});
