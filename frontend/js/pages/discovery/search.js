window.UserDiscoveryPage = window.UserDiscoveryPage || {
    /**
     * Initialize the discovery page
     */
    init() {
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
        
        // Get current user from localStorage
        try {
            const userDataJson = localStorage.getItem('userData');
            if (userDataJson) {
                this.currentUser = JSON.parse(userDataJson);
            } else {
                const userJson = localStorage.getItem('currentUser');
                if (userJson) {
                    this.currentUser = JSON.parse(userJson);
                }
            }
        } catch (error) {
            // Error handling silenced
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
            
            // Initialize with all mentors
            this.renderResults(this.allMentors);
        } catch (error) {
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
        
        this.renderResults(results);
    },
    
    /**
     * Render search results
     */
    renderResults(results) {
        // Get the mentor grid container
        const mentorGrid = document.querySelector('.mentor-grid');
        if (!mentorGrid) {
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
                    
                    try {
                        const userDataJson = localStorage.getItem('userData');
                        if (userDataJson) {
                            currentUser = JSON.parse(userDataJson);
                            this.currentUser = currentUser;
                        }
                    } catch (error) {
                        // Error handling silenced
                    }
                    
                    // Check if user is logged in
                    if (!currentUser || !currentUser.id) {
                        window.location.href = '/pages/signin.html';
                        return;
                    }
                    
                    // Check if the user is a mentee
                    if (currentUser.role !== 'MENTEE') {
                        return;
                    }
                    
                    // Find the mentor in our data
                    const mentor = this.allMentors.find(m => m.id === mentorId);
                    if (!mentor) {
                        return;
                    }
                    
                    // Send connection request directly
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
     */
    sendConnectionRequest(mentorId, message, buttonElement) {
        // Find the mentor in our data
        const mentor = this.allMentors.find(m => m.id === mentorId);
        if (!mentor) {
            return;
        }
        
        // Get existing connection requests from localStorage or create empty array
        let connectionRequests = [];
        try {
            const storedRequests = localStorage.getItem('connectionRequests');
            if (storedRequests) {
                connectionRequests = JSON.parse(storedRequests);
            }
        } catch (error) {
            // Error handling silenced
        }
        
        // Check if request already exists and is pending
        const existingRequest = connectionRequests.find(req => 
            req.menteeId === this.currentUser.id && 
            req.mentorId === mentorId &&
            req.status === 'pending'
        );
        
        if (existingRequest) {
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
            menteeImage: this.currentUser.imageUrl || 'images/profile-placeholder.jpg',
            message: message,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        
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
            } catch (error) {
                // Error handling silenced
            }
        }
        
        // Update button state
        if (buttonElement) {
            buttonElement.textContent = 'Request Sent';
            buttonElement.disabled = true;
            buttonElement.classList.add('request-sent');
        }
    }
};

// Make UserDiscoveryPage accessible in the global scope
if (typeof UserDiscoveryPage === 'undefined') {
    var UserDiscoveryPage = window.UserDiscoveryPage;
}