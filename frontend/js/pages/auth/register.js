/**
 * Registration page component
 * Handles user registration functionality
 */

const RegisterPage = {
    /**
     * Initialize the registration page
     */
    init() {
        console.log('Initializing registration page');
        // Use a slight delay to ensure DOM is loaded
        setTimeout(() => {
            this.form = document.getElementById('signup-form');
            if (this.form) {
                console.log('Signup form found, attaching event listeners');
                this.attachEventListeners();
            } else {
                console.error('Signup form not found after delay');
                // Try again with a longer delay as a fallback
                setTimeout(() => {
                    this.form = document.getElementById('signup-form');
                    if (this.form) {
                        console.log('Signup form found on second attempt');
                        this.attachEventListeners();
                    } else {
                        console.error('Signup form still not found, initialization failed');
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
        
        // Validate full name
        if (!formData.fullName || formData.fullName.trim().length < 2) {
            errors.fullName = 'Full name must be at least 2 characters';
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        // Validate password
        if (!formData.password || formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        
        // Check if email already exists in localStorage
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const emailExists = existingUsers.some(user => user.email === formData.email);
        if (emailExists) {
            errors.email = 'Email already registered. Please use a different email or sign in';
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
            const input = this.form.querySelector(`#${field.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
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
     * Get hardcoded mock users and any registered users
     * @returns {Array} - Array of all users
     */
    getAllUsers() {
        // First, check if LoginPage has the mock users function
        if (window.LoginPage && typeof window.LoginPage.getMockUsers === 'function') {
            return window.LoginPage.getMockUsers();
        }
        
        // If not, use our own copy of mock data
        const mockUsers = [
            // Just a sample hardcoded user in case LoginPage isn't available
            {
                id: '1001',
                fullName: 'Sarah Johnson',
                email: 'sarah@example.com',
                password: 'password123',
                role: 'MENTOR'
            }
        ];
        
        return mockUsers;
    },
    
    /**
     * Check if email already exists among users
     * @param {String} email - Email to check
     * @returns {Boolean} - Whether email exists
     */
    emailExists(email) {
        const allUsers = this.getAllUsers();
        
        // Also check localStorage for any newly registered users
        try {
            const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
            if (localUsers.length > 0) {
                allUsers.push(...localUsers);
            }
        } catch (e) {
            console.error('Error checking local users:', e);
        }
        
        return allUsers.some(user => user.email === email);
    },
    
    /**
     * Mock API for user registration
     * @param {Object} userData - User data to register
     * @returns {Promise} - Promise resolving to API response
     */
    mockRegisterAPI(userData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Check if email already exists
                if (this.emailExists(userData.email)) {
                    return reject({
                        success: false,
                        message: 'Email already registered',
                        errors: { email: 'This email is already registered. Please use a different email or sign in.' }
                    });
                }
                
                // Get existing users or initialize empty array
                let users = [];
                try {
                    users = JSON.parse(localStorage.getItem('users') || '[]');
                } catch (e) {
                    console.error('Error parsing users:', e);
                    users = [];
                }
                
                // Create a new user object (excluding password for response)
                const newUser = {
                    id: Date.now().toString(),
                    fullName: userData.fullName,
                    email: userData.email,
                    role: userData.role,
                    password: userData.password, // In a real app, this would be hashed
                    profileComplete: false,
                    createdAt: new Date().toISOString()
                };
                
                // Add user to the array
                users.push(newUser);
                
                // Save to localStorage
                try {
                    localStorage.setItem('users', JSON.stringify(users));
                    console.log('New user saved to localStorage');
                } catch (e) {
                    console.error('Error saving to localStorage:', e);
                }
                
                // Create a response object (excluding password)
                const responseUser = { ...newUser };
                delete responseUser.password;
                
                resolve({
                    success: true,
                    message: 'Registration successful',
                    user: responseUser
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
            fullName: this.form.querySelector('#full-name').value.trim(),
            email: this.form.querySelector('#email').value.trim(),
            password: this.form.querySelector('#password').value,
            role: this.form.querySelector('input[name="role"]:checked').value
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
            submitButton.textContent = 'Creating account...';
            submitButton.disabled = true;
            
            // Call mock API
            const result = await this.mockRegisterAPI(formData);
            
            // Handle success
            if (result.success) {
                // Show success message
                alert('Account created successfully! You can now sign in.');
                
                // Redirect to sign in page
                window.router.navigateTo('/signin');
            }
        } catch (error) {
            // Handle error
            console.error('Registration error:', error);
            alert('An error occurred during registration. Please try again.');
            
            // Reset button
            const submitButton = this.form.querySelector('button[type="submit"]');
            submitButton.textContent = 'Sign up';
            submitButton.disabled = false;
        }
    }
};

// Make RegisterPage available globally and support initialization when script is loaded
window.RegisterPage = RegisterPage;

// Auto-initialize when loaded on signup page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Register script loaded, checking if we are on signup page');
    if (window.location.pathname === '/signup') {
        console.log('On signup page, initializing RegisterPage');
        RegisterPage.init();
    }
});
