/**
 * API Client for handling communication with the backend
 * This would connect to a server with PostgreSQL database
 */

const API = {
    // Base API URL - would be replaced with actual API endpoint
    baseURL: 'https://api.mentorshipplatform.com/api/v1',
    
    // JWT token for authentication
    getAuthToken() {
        return localStorage.getItem('authToken');
    },
    
    setAuthToken(token) {
        localStorage.setItem('authToken', token);
    },
    
    clearAuthToken() {
        localStorage.removeItem('authToken');
    },
    
    /**
     * Makes a fetch request to the API
     */
    async request(endpoint, options = {}) {
        // Prepare request URL
        const url = `${this.baseURL}${endpoint}`;
        
        // Default request options
        const defaultOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                // Add authentication token if available
                ...this.getAuthToken() ? { 'Authorization': `Bearer ${this.getAuthToken()}` } : {},
                ...options.headers || {}
            }
        };
        
        // Add body for non-GET requests if data is provided
        if (options.data && defaultOptions.method !== 'GET') {
            defaultOptions.body = JSON.stringify(options.data);
        }
        
        // Add query params for GET requests
        if (options.data && defaultOptions.method === 'GET') {
            const queryParams = new URLSearchParams();
            Object.entries(options.data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(item => queryParams.append(`${key}[]`, item));
                    } else {
                        queryParams.append(key, value);
                    }
                }
            });
            const queryString = queryParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }
        
        // For demo purposes, log the request
        console.log(`API Request: ${defaultOptions.method} ${url}`);
        if (options.data) {
            console.log('Request Data:', options.data);
        }
        
        try {
            // Make the actual fetch request
            const response = await fetch(url, defaultOptions);
            const data = await response.json();
            
            // Handle error responses
            if (!response.ok) {
                console.error(`API Error (${endpoint}):`, data);
                return {
                    success: false,
                    error: data.message || 'An error occurred',
                    statusCode: response.status,
                    data: null
                };
            }
            
            // Return successful response
            return {
                success: true,
                data: data.data || data,
                message: data.message || 'Operation completed successfully',
                statusCode: response.status
            };
        } catch (error) {
            console.error(`API Request Failed (${endpoint}):`, error);
            return {
                success: false,
                error: error.message || 'Network error occurred',
                data: null
            };
        }
    },
    
    // Helper to get current logged in user (from JWT token)
    getCurrentUser() {
        const token = this.getAuthToken();
        if (!token) return null;
        
        try {
            // In a real implementation, we would decode the JWT token
            // For demo, we'll assume we can get user info from the API
            return null; // Would be replaced with actual user data from token or API call
        } catch (e) {
            console.error('Error getting current user:', e);
            return null;
        }
    },
    
    /**
     * Authentication endpoints
     */
    auth: {
        register: async (userData) => {
            try {
                // Validate required fields
                if (!userData.email || !userData.password || !userData.fullName || !userData.role) {
                    return {
                        success: false,
                        error: 'Missing required fields'
                    };
                }
                
                // Call the registration endpoint
                const response = await API.request('/auth/register', {
                    method: 'POST',
                    data: userData
                });
                
                // If registration was successful, store the token
                if (response.success && response.data.token) {
                    API.setAuthToken(response.data.token);
                }
                
                return response;
            } catch (error) {
                console.error('Registration error:', error);
                return {
                    success: false,
                    error: 'Registration failed: ' + error.message
                };
            }
        },
        
        login: async (credentials) => {
            try {
                // Validate credentials
                if (!credentials.email || !credentials.password) {
                    return {
                        success: false,
                        error: 'Email and password are required'
                    };
                }
                
                // Call the login endpoint
                const response = await API.request('/auth/login', {
                    method: 'POST',
                    data: credentials
                });
                
                // If login was successful, store the token
                if (response.success && response.data.token) {
                    API.setAuthToken(response.data.token);
                }
                
                return response;
            } catch (error) {
                console.error('Login error:', error);
                return {
                    success: false,
                    error: 'Login failed: ' + error.message
                };
            }
        },
        
        logout: async () => {
            try {
                // Call the logout endpoint
                const response = await API.request('/auth/logout', {
                    method: 'POST'
                });
                
                // Clear the token regardless of the response
                API.clearAuthToken();
                
                return response;
            } catch (error) {
                console.error('Logout error:', error);
                
                // Clear the token even if there's an error
                API.clearAuthToken();
                
                return {
                    success: false,
                    error: 'Logout failed: ' + error.message
                };
            }
        },
        
        // Get the current user from the server
        getCurrentUser: async () => {
            // Check if we have a token
            if (!API.getAuthToken()) {
                return {
                    success: false,
                    error: 'Not authenticated'
                };
            }
            
            try {
                // Call the current user endpoint
                return await API.request('/auth/me', {
                    method: 'GET'
                });
            } catch (error) {
                console.error('Get current user error:', error);
                return {
                    success: false,
                    error: 'Failed to get current user: ' + error.message
                };
            }
        }
    },
    
    /**
     * Profile endpoints
     */
    profile: {
        get: async (userId) => {
            try {
                // If no userId provided, get current user's profile
                if (!userId) {
                    // We need to be authenticated to get our own profile
                    if (!API.getAuthToken()) {
                        return {
                            success: false,
                            error: 'User not authenticated'
                        };
                    }
                    
                    // Get the current user's profile
                    return await API.request('/profile', {
                        method: 'GET'
                    });
                }
                
                // Get a specific user's profile by ID
                return await API.request(`/users/${userId}`, {
                    method: 'GET'
                });
            } catch (error) {
                console.error('Get profile error:', error);
                return {
                    success: false,
                    error: 'Failed to retrieve profile: ' + error.message
                };
            }
        },
        
        update: async (profileData) => {
            try {
                // Check if we're authenticated
                if (!API.getAuthToken()) {
                    return {
                        success: false,
                        error: 'User not authenticated'
                    };
                }
                
                // Update the profile via the API
                return await API.request('/profile', {
                    method: 'PUT',
                    data: profileData
                });
            } catch (error) {
                console.error('Update profile error:', error);
                return {
                    success: false,
                    error: 'Failed to update profile: ' + error.message
                };
            }
        },
        
        delete: async () => {
            try {
                // Check if we're authenticated
                if (!API.getAuthToken()) {
                    return {
                        success: false,
                        error: 'User not authenticated'
                    };
                }
                
                // Delete the account via the API
                const response = await API.request('/profile', {
                    method: 'DELETE'
                });
                
                // If deletion was successful, clear the auth token
                if (response.success) {
                    API.clearAuthToken();
                }
                
                return response;
            } catch (error) {
                console.error('Delete profile error:', error);
                return {
                    success: false,
                    error: 'Failed to delete account: ' + error.message
                };
            }
        }
    },
    
    /**
     * User discovery endpoints
     */
    users: {
        search: async (filters) => {
            try {
                // Check if we're authenticated
                if (!API.getAuthToken()) {
                    return {
                        success: false,
                        error: 'User not authenticated'
                    };
                }
                
                // Send a search query to the API with filters as query parameters
                return await API.request('/users/search', {
                    method: 'GET',
                    data: filters // This will be converted to query parameters
                });
            } catch (error) {
                console.error('Search users error:', error);
                return {
                    success: false,
                    error: 'Failed to search users: ' + error.message
                };
            }
        },
        
        getById: async (userId) => {
            try {
                if (!userId) {
                    return {
                        success: false,
                        error: 'User ID is required'
                    };
                }
                
                // Check if we're authenticated
                if (!API.getAuthToken()) {
                    return {
                        success: false,
                        error: 'User not authenticated'
                    };
                }
                
                // Get the user from the API
                return await API.request(`/users/${userId}`, {
                    method: 'GET'
                });
            } catch (error) {
                console.error('Get user error:', error);
                return {
                    success: false,
                    error: 'Failed to retrieve user: ' + error.message
                };
            }
        }
    },
    
    /**
     * Connection requests endpoints
     */
    connections: {
        sendRequest: async (recipientId) => {
            try {
                // Check if we're authenticated
                if (!API.getAuthToken()) {
                    return {
                        success: false,
                        error: 'User not authenticated'
                    };
                }
                
                if (!recipientId) {
                    return {
                        success: false,
                        error: 'Recipient ID is required'
                    };
                }
                
                // Send the connection request to the API
                return await API.request('/connections/requests', {
                    method: 'POST',
                    data: {
                        recipientId
                    }
                });
            } catch (error) {
                console.error('Send connection request error:', error);
                return {
                    success: false,
                    error: 'Failed to send connection request: ' + error.message
                };
            }
        },
        
        acceptRequest: async (requestId) => {
            try {
                // Check if we're authenticated
                if (!API.getAuthToken()) {
                    return {
                        success: false,
                        error: 'User not authenticated'
                    };
                }
                
                if (!requestId) {
                    return {
                        success: false,
                        error: 'Request ID is required'
                    };
                }
                
                // Accept the connection request via the API
                return await API.request(`/connections/requests/${requestId}/accept`, {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Accept connection request error:', error);
                return {
                    success: false,
                    error: 'Failed to accept connection request: ' + error.message
                };
            }
        },
        
        declineRequest: async (requestId) => {
            try {
                // Check if we're authenticated
                if (!API.getAuthToken()) {
                    return {
                        success: false,
                        error: 'User not authenticated'
                    };
                }
                
                if (!requestId) {
                    return {
                        success: false,
                        error: 'Request ID is required'
                    };
                }
                
                // Decline the connection request via the API
                return await API.request(`/connections/requests/${requestId}/decline`, {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Decline connection request error:', error);
                return {
                    success: false,
                    error: 'Failed to decline connection request: ' + error.message
                };
            }
        },
        
        listConnections: async () => {
            try {
                // Check if we're authenticated
                if (!API.getAuthToken()) {
                    return {
                        success: false,
                        error: 'User not authenticated'
                    };
                }
                
                // Get the user's connections from the API
                return await API.request('/connections', {
                    method: 'GET'
                });
            } catch (error) {
                console.error('List connections error:', error);
                return {
                    success: false,
                    error: 'Failed to list connections: ' + error.message
                };
            }
        },
        
        listRequests: async () => {
            try {
                // Check if we're authenticated
                if (!API.getAuthToken()) {
                    return {
                        success: false,
                        error: 'User not authenticated'
                    };
                }
                
                // Get the connection requests from the API
                return await API.request('/connections/requests', {
                    method: 'GET'
                });
            } catch (error) {
                console.error('List requests error:', error);
                return {
                    success: false,
                    error: 'Failed to list connection requests: ' + error.message
                };
            }
        }
    }
};
