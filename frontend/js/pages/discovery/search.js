window.UserDiscoveryPage = window.UserDiscoveryPage || {
    /**
     * Initialize the discovery page
     */
    init() {
        console.log('Initializing UserDiscoveryPage...');
        // Reset state every time init is called
        this.filters = {
            searchTerm: '',
            category: 'all'
        };
        this.allMentors = [];
        this.currentUser = null;
        
        // Reset any search input fields
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Reset filter selections
        const filterItems = document.querySelectorAll('.filter-item');
        filterItems.forEach(item => {
            if (item.textContent.trim().toLowerCase() === 'all') {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Get current user from localStorage - using the correct key (userData) as set in signin page
        try {
            // Check for userData key first (used in the sign-in page)
            const userDataJson = localStorage.getItem('userData');
            if (userDataJson) {
                this.currentUser = JSON.parse(userDataJson);
                console.log('Current user loaded from userData:', this.currentUser.fullName);
            } else {
                // Fallback to check other possible keys
                const userJson = localStorage.getItem('currentUser');
                if (userJson) {
                    this.currentUser = JSON.parse(userJson);
                    console.log('Current user loaded from currentUser:', this.currentUser.fullName);
                }
            }
            
            if (this.currentUser) {
                console.log('User authenticated as:', this.currentUser.role);
            } else {
                console.log('No authenticated user found');
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
        
        // Always reload mentors from localStorage
        this.loadMentors();
        
        // Reattach event listeners
        this.attachEventListeners();
    },
    
    /**
     * Load mentors from localStorage
     */
    loadMentors() {
        try {
            // Get users from localStorage
            const usersJson = localStorage.getItem('users');
            const users = usersJson ? JSON.parse(usersJson) : [];
            
            // Filter only mentors
            this.allMentors = users.filter(user => user.role === 'MENTOR');
            console.log(`Loaded ${this.allMentors.length} mentors from localStorage`);
            
            // Initialize with all mentors
            this.renderResults(this.allMentors);
        } catch (error) {
            console.error('Error loading mentors:', error);
            this.allMentors = [];
            this.renderResults([]);
        }
    },
    
    /**
     * Attach event listeners to form elements
     */
    attachEventListeners() {
        // Search button click event
        const searchButton = document.querySelector('.search-input-group button');
        if (searchButton) {
            searchButton.addEventListener('click', () => this.handleSearch());
        }
        
        // Search input enter key event
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('keyup', (event) => {
                // Update search term on input change
                this.filters.searchTerm = event.target.value.trim().toLowerCase();
                
                // Trigger search on Enter key
                if (event.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }
        
        // Category filter click events
        const filterItems = document.querySelectorAll('.filter-item');
        filterItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all filters
                filterItems.forEach(fi => fi.classList.remove('active'));
                
                // Add active class to clicked filter
                item.classList.add('active');
                
                // Get category from filter text
                const filterText = item.textContent.trim();
                this.filters.category = filterText.toLowerCase();
                
                // Apply search with updated filter
                this.handleSearch();
            });
        });
    },
    
    /**
     * Handle search form submission
     */
    handleSearch() {
        console.log('Searching with filters:', this.filters);
        
        // Filter mentors based on search criteria
        let results = this.allMentors;
        
        // Apply search term filter if provided
        if (this.filters.searchTerm) {
            results = results.filter(mentor => {
                const searchTerm = this.filters.searchTerm.toLowerCase();
                
                // Search in name
                if (mentor.fullName.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                // Search in title/company
                if (mentor.title && mentor.title.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                if (mentor.company && mentor.company.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                // Search in skills
                if (mentor.skills && mentor.skills.some(skill => 
                    skill.toLowerCase().includes(searchTerm))) {
                    return true;
                }
                
                // Search in bio
                if (mentor.bio && mentor.bio.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                return false;
            });
        }
        
        // Apply category filter if not 'all'
        if (this.filters.category && this.filters.category !== 'all') {
            // Map UI categories to skills
            const categoryToSkills = {
                'web development': ['javascript', 'html', 'css', 'react', 'angular', 'vue', 'node.js', 'web', 'frontend', 'backend', 'php', 'ruby'],
                'mobile development': ['flutter', 'react native', 'ios', 'android', 'swift', 'kotlin', 'mobile', 'xamarin', 'ionic'],
                'data science': ['python', 'r', 'data analysis', 'statistics', 'sql', 'tableau', 'power bi', 'data visualization', 'pandas', 'numpy'],
                'machine learning': ['python', 'tensorflow', 'machine learning', 'deep learning', 'ai', 'neural networks', 'computer vision', 'nlp'],
                'software engineering': ['java', 'c++', 'c#', '.net', 'software architecture', 'microservices', 'design patterns', 'algorithms', 'data structures'],
                'ui/ux design': ['figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'user research', 'wireframing', 'prototyping', 'ui', 'ux', 'user interface', 'user experience', 'usability testing'],
                'cybersecurity': ['security', 'encryption', 'network security', 'penetration testing', 'ethical hacking', 'cyber', 'firewall', 'security audit', 'vulnerability assessment', 'owasp'],
                'cloud computing': ['aws', 'azure', 'gcp', 'google cloud', 'cloud', 'serverless', 'docker', 'kubernetes', 'iaas', 'paas', 'saas', 'cloud architecture'],
                'artificial intelligence': ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'nlp', 'natural language processing', 'computer vision', 'chatbots', 'ai ethics'],
                'devops': ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'github actions', 'terraform', 'ansible', 'puppet', 'chef', 'infrastructure as code', 'monitoring', 'devops'],
                'product management': ['product', 'product management', 'agile', 'scrum', 'jira', 'product roadmap', 'user stories', 'backlog management', 'product strategy', 'market research'],
                'qa testing': ['qa', 'testing', 'test automation', 'selenium', 'cypress', 'jest', 'unit testing', 'integration testing', 'tdd', 'bdd', 'quality assurance', 'manual testing'],
                'game development': ['unity', 'unreal engine', 'c#', 'c++', 'game development', 'game design', '3d modeling', 'animation', 'game physics', 'level design', 'game ai']
            };
            
            const relevantSkills = categoryToSkills[this.filters.category] || [];
            
            if (relevantSkills.length > 0) {
                results = results.filter(mentor => 
                    mentor.skills && mentor.skills.some(skill => 
                        relevantSkills.includes(skill.toLowerCase())
                    )
                );
            }
        }
        
        console.log(`Found ${results.length} matching mentors`);
        this.renderResults(results);
    },
    
    /**
     * Render search results
     */
    renderResults(results) {
        // Get the mentor grid container
        const mentorGrid = document.querySelector('.mentor-grid');
        if (!mentorGrid) {
            console.error('Mentor grid container not found');
            return;
        }
        
        // Clear previous results
        mentorGrid.innerHTML = '';
        
        // If no results, show a message
        if (results.length === 0) {
            mentorGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No mentors found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }
        
        // Get the template from the HTML
        const template = document.getElementById('mentor-card-template');
        if (!template) {
            console.error('Mentor card template not found');
            return;
        }
        
        // Render each mentor card using the template from search-mentor.html
        results.forEach(mentor => {
            // Clone the template content
            const mentorCard = template.content.cloneNode(true).firstElementChild;
            
            // Set mentor data
            const img = mentorCard.querySelector('.mentor-img');
            img.src = mentor.imageUrl || '../images/default-avatar.jpg';
            img.alt = mentor.fullName;
            
            mentorCard.querySelector('.mentor-name').textContent = mentor.fullName;
            
            // Format title and company
            const titleElement = mentorCard.querySelector('.mentor-title');
            const titleLine = [];
            if (mentor.title) titleLine.push(mentor.title);
            if (mentor.company) titleLine.push(mentor.company);
            if (titleLine.length > 0) {
                titleElement.innerHTML = titleLine.join('<br>');
            } else {
                titleElement.textContent = '';
            }
            
            // Add skills
            const skillsContainer = mentorCard.querySelector('.mentor-skills');
            if (mentor.skills && mentor.skills.length > 0) {
                mentor.skills.forEach(skill => {
                    const skillTag = document.createElement('span');
                    skillTag.className = 'skill-tag';
                    skillTag.textContent = skill;
                    skillsContainer.appendChild(skillTag);
                });
            }
            
            // Set statistics
            const statNumbers = mentorCard.querySelectorAll('.stat-number');
            statNumbers[0].textContent = mentor.experience || 0;
            statNumbers[1].textContent = '--'; // Mentees count placeholder
            statNumbers[2].textContent = '--'; // Rating placeholder
            
            // Set button data attributes
            const connectButton = mentorCard.querySelector('.btn-connect');
            const viewProfileButton = mentorCard.querySelector('.btn-view-profile');
            connectButton.setAttribute('data-mentor-id', mentor.id);
            viewProfileButton.setAttribute('data-mentor-id', mentor.id);
            
            // Append to mentor grid
            mentorGrid.appendChild(mentorCard);
        });
        
        // Attach event listeners to connect and view profile buttons
        this.attachConnectButtonListeners();
    },
    
    /**
     * Attach event listeners to connect buttons
     */
    attachConnectButtonListeners() {
        const connectButtons = document.querySelectorAll('.btn-connect');
        connectButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const mentorId = event.target.getAttribute('data-mentor-id');
                if (mentorId) {
                    // Always check localStorage directly to ensure fresh authentication status
                    let currentUser = null;
                    
                    // Check directly for userData key (which is used in the signin page)
                    try {
                        // First check for userData (the key used in signin.html)
                        const userDataJson = localStorage.getItem('userData');
                        if (userDataJson) {
                            currentUser = JSON.parse(userDataJson);
                            console.log('User authenticated from userData:', currentUser.fullName);
                            // Update the instance property
                            this.currentUser = currentUser;
                        } else {
                            // Log localStorage contents for debugging
                            console.log('Available localStorage keys:', Object.keys(localStorage));
                            console.warn('No userData found in localStorage');
                            
                            // Check for any authentication token
                            const authToken = localStorage.getItem('authToken');
                            if (authToken) {
                                console.log('Auth token exists but no user data found');
                            }
                        }
                    } catch (error) {
                        console.error('Error loading user from localStorage:', error);
                    }
                    
                    // Check if user is logged in - more thorough check
                    if (!currentUser || !currentUser.id) {
                        console.error('User not authenticated, redirecting to login');
                        this.showNotification('error', 'Login Required', 'Please login to connect with mentors');
                        // Redirect to login page with correct path
                        window.location.href = '/pages/signin.html';
                        return;
                    }
                    
                    // Check if the user is a mentee
                    if (currentUser.role !== 'MENTEE') {
                        this.showNotification('error', 'Action Not Allowed', 'Only mentees can send connection requests');
                        return;
                    }
                    
                    // Find the mentor in our data
                    const mentor = this.allMentors.find(m => m.id === mentorId);
                    if (!mentor) {
                        console.error('Mentor not found with ID:', mentorId);
                        return;
                    }
                    
                    // Send connection request directly instead of opening modal
                    console.log('Sending connection request to mentor:', mentor.fullName);
                    this.sendConnectionRequest(mentorId, 'I would like to connect with you as my mentor.', event.target);
                }
            });
        });
        
        // Add event listeners to view profile buttons
        const viewProfileButtons = document.querySelectorAll('.btn-view-profile');
        viewProfileButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const mentorId = event.target.getAttribute('data-mentor-id');
                if (mentorId) {
                    // Navigate to the mentor's profile page
                    window.location.href = `/profile.html?id=${mentorId}`;
                }
            });
        });
    },
    
    /**
     * Send a connection request directly
     * @param {string} mentorId - ID of the mentor to send request to
     * @param {string} message - Message to send with the request
     * @param {HTMLElement} buttonElement - The button that was clicked (for updating UI)
     */
    sendConnectionRequest(mentorId, message, buttonElement) {
        // Find the mentor in our data
        const mentor = this.allMentors.find(m => m.id === mentorId);
        if (!mentor) {
            console.error('Mentor not found with ID:', mentorId);
            return;
        }
        
        console.log('Processing connection request for mentor:', mentor.fullName);
        
        // Get existing connection requests from localStorage or create empty array
        let connectionRequests = [];
        try {
            const storedRequests = localStorage.getItem('connectionRequests');
            if (storedRequests) {
                connectionRequests = JSON.parse(storedRequests);
            }
        } catch (error) {
            console.error('Error parsing connection requests from localStorage:', error);
        }
        
        // Check if request already exists and is pending
        const existingRequest = connectionRequests.find(req => 
            req.menteeId === this.currentUser.id && 
            req.mentorId === mentorId &&
            req.status === 'pending'
        );
        
        if (existingRequest) {
            console.log('Pending request already exists for this mentor');
            this.showNotification('info', 'Already Requested', `You've already sent a request to ${mentor.fullName}`);
            return;
        }
        
        // Remove any rejected requests to allow creating a new one
        const existingRequestIndex = connectionRequests.findIndex(req => 
            req.menteeId === this.currentUser.id && 
            req.mentorId === mentorId
        );
        
        if (existingRequestIndex !== -1) {
            if (connectionRequests[existingRequestIndex].status === 'rejected') {
                // Remove the rejected request to allow creating a new one
                connectionRequests.splice(existingRequestIndex, 1);
            } else if (connectionRequests[existingRequestIndex].status === 'accepted') {
                // Already connected
                this.showNotification('info', 'Already Connected', `You're already connected with ${mentor.fullName}`);
                return;
            }
        }
        
        // Create a new request with complete mentee information
        const newRequest = {
            id: Date.now().toString(),
            menteeId: this.currentUser.id,
            mentorId: mentorId,
            menteeName: this.currentUser.fullName,
            mentorName: mentor.fullName,
            menteeImage: this.currentUser.imageUrl || 'images/profile-placeholder.jpg', // Add mentee image
            message: message,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        
        console.log('Created new connection request with complete mentee information:', newRequest);
        
        // Add to array and save to localStorage
        connectionRequests.push(newRequest);
        localStorage.setItem('connectionRequests', JSON.stringify(connectionRequests));
        
        // Also use connection service if available
        if (window.connectionService) {
            try {
                window.connectionService.sendConnectionRequest(
                    this.currentUser.id,
                    mentorId,
                    message
                );
                console.log('Connection request sent via connectionService');
            } catch (error) {
                console.error('Error sending request via connectionService:', error);
            }
        }
        
        // Update button state
        if (buttonElement) {
            buttonElement.textContent = 'Request Sent';
            buttonElement.disabled = true;
            buttonElement.classList.add('request-sent');
        }
        
        // Show success notification
        this.showNotification('success', 'Request Sent', `Your request has been sent to ${mentor.fullName}!`);
    },
    
    /**
     * Open the connection request modal (LEGACY)
     */
    openConnectionRequestModal(mentorId) {
        // Find the mentor's information
        const mentor = this.allMentors.find(m => m.id === mentorId);
        if (!mentor) {
            console.error('Mentor not found with ID:', mentorId);
            return;
        }
        
        // Create modal element
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content connection-request-modal';
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>Connect with ${mentor.fullName}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="mentor-preview">
                    <img src="${mentor.imageUrl || '../images/default-avatar.jpg'}" alt="${mentor.fullName}" class="mentor-img">
                    <div>
                        <h4>${mentor.fullName}</h4>
                        <p>${mentor.title || ''} ${mentor.company ? 'at ' + mentor.company : ''}</p>
                    </div>
                </div>
                <div class="form-group">
                    <label for="connection-message">Message</label>
                    <textarea id="connection-message" 
                      placeholder="Introduce yourself and explain why you'd like to connect with this mentor..." 
                      rows="5"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary cancel-request">Cancel</button>
                <button class="btn-primary send-request" data-mentor-id="${mentor.id}">Send Request</button>
            </div>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Add event listeners to modal buttons
        const closeButton = modalOverlay.querySelector('.close-modal');
        const cancelButton = modalOverlay.querySelector('.cancel-request');
        const sendButton = modalOverlay.querySelector('.send-request');
        
        // Close modal function
        const closeModal = () => {
            document.body.removeChild(modalOverlay);
        };
        
        // Close button event
        closeButton.addEventListener('click', closeModal);
        cancelButton.addEventListener('click', closeModal);
        
        // Send request button event
        // Store reference to this to preserve context
        const self = this;
        
        sendButton.addEventListener('click', function() {
            const message = modalOverlay.querySelector('#connection-message').value.trim();
            console.log('Send request button clicked for mentor:', mentor.fullName);
            
            if (!message) {
                alert('Please enter a message to the mentor');
                return;
            }
            
            // Debug the connection service availability
            console.log('Connection service available:', !!window.connectionService);
            console.log('Current user data:', self.currentUser);
            
            // Send connection request via connection service
            console.log('Attempting to send connection request to:', mentor.id);
            const success = window.connectionService ? window.connectionService.sendConnectionRequest(
                self.currentUser.id,
                mentor.id,
                message
            ) : false;
            
            console.log('Connection request result:', success ? 'SUCCESS' : 'FAILED');
            
            // Check localStorage manually to confirm if the request was stored
            try {
                const storedRequests = localStorage.getItem('connectionRequests');
                console.log('Current connectionRequests in localStorage:', storedRequests);
            } catch (error) {
                console.error('Error reading connectionRequests from localStorage:', error);
            }
            
            if (!success) {
                console.error('Connection request failed!');
                self.showNotification('error', 'Connection Failed', 'Unable to send connection request. Please try again later.');
            } else {
                console.log('Connection request succeeded!');
                // Show success notification
                self.showNotification(
                    'success',
                    'Request Sent Successfully! ✅',
                    `Your connection request to ${mentor.fullName} has been sent.`
                );
            }
            
            // Close the modal
            closeModal();
        });
    },
    
    /**
     * Show a notification message
     */
    showNotification(type, title, message) {
        console.log('Notification:', { type, title, message });
        
        // Use the showRequestFeedback function if available in the page
        if (typeof showRequestFeedback === 'function') {
            showRequestFeedback(type, message);
            return;
        }
        
        // Fallback implementation if showRequestFeedback is not available
        let feedbackEl = document.getElementById('request-feedback');
        if (!feedbackEl) {
            feedbackEl = document.createElement('div');
            feedbackEl.id = 'request-feedback';
            feedbackEl.style.position = 'fixed';
            feedbackEl.style.top = '20px';
            feedbackEl.style.right = '20px';
            feedbackEl.style.padding = '12px 20px';
            feedbackEl.style.borderRadius = '4px';
            feedbackEl.style.color = 'white';
            feedbackEl.style.fontWeight = 'bold';
            feedbackEl.style.zIndex = '9999';
            feedbackEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            document.body.appendChild(feedbackEl);
        }
        
        // Set feedback content
        feedbackEl.textContent = message;
        
        // Set color based on type
        if (type === 'success') {
            feedbackEl.style.backgroundColor = '#28a745';
        } else if (type === 'error') {
            feedbackEl.style.backgroundColor = '#dc3545';
        } else if (type === 'info') {
            feedbackEl.style.backgroundColor = '#17a2b8';
        }
        
        // Show the feedback
        feedbackEl.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            feedbackEl.style.display = 'none';
        }, 3000);
    }
};

// Make UserDiscoveryPage accessible in the global scope
if (typeof UserDiscoveryPage === 'undefined') {
    var UserDiscoveryPage = window.UserDiscoveryPage;
}
