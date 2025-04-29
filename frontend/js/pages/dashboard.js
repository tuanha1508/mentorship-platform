const Dashboard = {
    userRole: null,
    hasMentor: false,
    hasMentees: false,
    currentPage: 'main-dashboard',
    pendingConnectionRequests: [],
    initialized: false,
    lastLoadedPage: null,
    notificationElements: {
        icon: null, count: null, dropdown: null, body: null, emptyMessage: null
    },
    
    // Helper function to update user data across all localStorage entries
    updateUserDataAcrossStorage(userId, updates) {
        // First update in userData if this is the current user
        const mainUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (mainUserData.id === userId) {
            Object.assign(mainUserData, updates);
            localStorage.setItem('userData', JSON.stringify(mainUserData));
        }
        
        // Look through all localStorage entries for this user
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // Skip non-user entries
            if (key === 'authToken' || key === 'connectionRequests' || 
                key === 'mentorRequestsNotificationShown' || key === 'users') continue;
            
            try {
                const storedData = JSON.parse(localStorage.getItem(key) || '{}');
                if (storedData.id === userId) {
                    Object.assign(storedData, updates);
                    localStorage.setItem(key, JSON.stringify(storedData));
                }
            } catch (e) {}
        }
        
        // If this is the current user, update the Dashboard properties
        if (this.currentUser && this.currentUser.id === userId) {
            Object.assign(this.currentUser, updates);
            if (updates.hasMentor !== undefined) this.hasMentor = updates.hasMentor;
            if (updates.hasMentees !== undefined) this.hasMentees = updates.hasMentees;
            this.updateMenuVisibility();
        }
    },
    
    // Initialize event listeners
    initEventListeners() {
        console.log('Setting up event listeners...');
        
        // Initialize notification elements
        this.notificationElements = {
            icon: document.getElementById('notification-icon'),
            count: document.getElementById('notification-count'),
            dropdown: document.getElementById('notification-dropdown'),
            body: document.getElementById('notification-body'),
            emptyMessage: document.getElementById('empty-notification')
        };
        
        // Set up notification dropdown toggle
        const { icon, dropdown } = this.notificationElements;
        if (icon) {
            icon.addEventListener('click', () => {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!icon.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
        }
        
        // Handle connection action buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.connection-action-btn');
            if (button) {
                const action = button.dataset.action;
                const requestId = button.closest('.connection-request-item')?.dataset.requestId;
                
                if (requestId && action) {
                    this.handleConnectionAction(action, requestId);
                }
            }
        });
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Note: Profile form submission is now handled in initProfilePage to avoid duplicates
        // and ensure proper form handling with detailed error handling and feedback
    },
    
    // Setup sidebar navigation
    setupSidebarNav() {
        console.log('Setting up sidebar navigation...');
        
        // Add click handlers to all nav items
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const pageName = item.getAttribute('data-page');
                if (pageName) {
                    this.loadDashboardPage(pageName);
                }
            });
        });
    },
    
    // Initialize search mentor page
    initSearchMentorPage() {
        console.log('Initializing search mentor page');
        this.loadSearchScript();
    },
    
    // Load search script
    loadSearchScript() {
        // Remove existing script if present to avoid duplicates
        const existingScript = document.querySelector('script[src="../js/pages/discovery/search.js"]');
        if (existingScript) {
            console.log('Removing existing search script');
            existingScript.remove();
        }
        
        // Create and load the script
        console.log('Creating new search script element');
        const script = document.createElement('script');
        script.src = '../js/pages/discovery/search.js';
        
        // Set up error handling
        script.onerror = (error) => {
            console.error('Error loading search script:', error);
            this.showFeedback('error', 'Failed to load search functionality. Please try refreshing the page.');
        };
        
        // Initialize after script loads
        script.onload = () => {
            console.log('Search script loaded successfully');
            // Short delay to ensure script is fully processed
            setTimeout(() => {
                if (window.UserDiscoveryPage) {
                    console.log('Initializing UserDiscoveryPage');
                    window.UserDiscoveryPage.init();
                } else {
                    console.error('UserDiscoveryPage not found after script load');
                    this.showFeedback('error', 'Search functionality is unavailable. Please try refreshing the page.');
                }
            }, 100);
        };
        
        // Add script to document
        document.body.appendChild(script);
        console.log('Search script added to document');
    },
    
    // Apply filters to search
    applyMentorFilters() {
        if (window.UserDiscoveryPage) {
            window.UserDiscoveryPage.handleSearch();
        } else {
            console.error('UserDiscoveryPage not available for filtering');
        }
    },
    
    // Load dashboard page
    loadDashboardPage(pageName) {
        if (this.currentPage === pageName) return;
        
        console.log(`Loading dashboard page: ${pageName}`);
        this.currentPage = pageName;
        
        // Hide all pages
        document.querySelectorAll('.dashboard-page, [class$="-page"]').forEach(page => {
            page.classList.remove('active');
        });
        
        // Special case for profile: we need to check for the existing content in the dashboard
        const dashboardContent = document.getElementById('dashboard-page-content');
        
        // Try to find the page by ID first, then by class if ID not found
        let targetPage = document.getElementById(`${pageName}-page`);
        if (!targetPage) {
            targetPage = document.querySelector(`.${pageName}-page`);
            console.log(`Found ${pageName} page by class:`, !!targetPage);
        }
        
        if (targetPage) {
            targetPage.classList.add('active');
            console.log(`Activated ${pageName} page`);
            
            // Check if the page content needs to be loaded via AJAX
            if (!targetPage.hasChildNodes() || targetPage.children.length === 0) {
                console.log(`${pageName} page appears empty, may need to load content`);
                // You could add content loading logic here if needed
            }
            
            // Initialize specific page content if needed
            if (pageName === 'profile' && this.lastLoadedPage !== 'profile') {
                this.initProfilePage();
            } else if (pageName === 'my-mentees' && this.lastLoadedPage !== 'my-mentees') {
                this.initMyMenteesPage();
            } else if (pageName === 'assignments' && this.lastLoadedPage !== 'assignments') {
                this.initAssignmentsPage();
            } else if (pageName === 'connection-requests' && this.lastLoadedPage !== 'connection-requests') {
                this.initConnectionRequestsPage();
            }
            
            // Always update the welcome message when loading any dashboard page
            if (this.currentUser) {
                // Short delay to ensure DOM is fully loaded
                setTimeout(() => this.updateWelcomeMessage(this.currentUser), 100);
            }
            
            this.lastLoadedPage = pageName;
        } else if (pageName === 'profile' && dashboardContent) {
            // Special case: profile is already loaded into the dashboard content
            console.log('Profile page not found by ID/class but already shown in dashboard content');
            
            // Initialize profile content
            this.initProfilePage();
            this.lastLoadedPage = pageName;
        } else if (pageName === 'search-mentor') {
            // Dynamically create the search-mentor page if it doesn't exist
            console.log('Creating search-mentor page dynamically');
            const searchMentorPage = document.createElement('div');
            searchMentorPage.id = 'search-mentor-page';
            searchMentorPage.className = 'dashboard-page search-mentor-page';
            
            // Create the page content
            searchMentorPage.innerHTML = `
                <h2>Find a Mentor</h2>
                <div class="search-container">
                    <input type="text" id="mentor-search" placeholder="Search by name, skills, or interests...">
                    <button id="search-btn" class="btn btn-primary">Search</button>
                </div>
                <div class="filter-container">
                    <select id="skill-filter">
                        <option value="">Filter by skill</option>
                    </select>
                </div>
                <div id="mentors-list" class="mentors-grid"></div>
            `;
            
            // Add the page to the dashboard content area
            dashboardContent.appendChild(searchMentorPage);
            
            // Make it active
            searchMentorPage.classList.add('active');
            
            // Initialize the search mentor functionality
            this.initSearchMentorPage();
            this.lastLoadedPage = pageName;
        } else {
            console.error(`Target page for ${pageName} not found by ID or class`);
        }
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.nav-item[data-page="${pageName}"]`)?.classList.add('active');
    },
    
    // Sync mentorship status from user data
    syncMentorshipStatus() {
        const userData = this.getUserData();
        if (userData) {
            this.userRole = userData.role || null;
            this.hasMentor = !!userData.hasMentor;
            this.hasMentees = !!(userData.mentees && userData.mentees.length > 0);
        }
    },
    
    // Load connection requests from localStorage
    loadConnectionRequestsFromLocalStorage() {
        try {
            const requests = JSON.parse(localStorage.getItem('connectionRequests') || '[]');
            this.pendingConnectionRequests = requests;
            this.updateConnectionRequestsCount();
        } catch (error) {
            console.error('Error loading connection requests:', error);
        }
    },
    
    // Show feedback message to the user
    showFeedback(type, message) {
        console.log(`Feedback: ${type} - ${message}`);
        
        // Create feedback element if it doesn't exist
        let feedbackElement = document.getElementById('feedback-message');
        if (!feedbackElement) {
            feedbackElement = document.createElement('div');
            feedbackElement.id = 'feedback-message';
            document.body.appendChild(feedbackElement);
        }
        
        // Set appropriate class based on type
        feedbackElement.className = `feedback-message ${type}`;
        feedbackElement.textContent = message;
        feedbackElement.style.display = 'block';
        
        // Auto-hide the message after 3 seconds
        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 3000);
    },
    
    // Initialize dashboard
    init() {
        if (this.initialized) return;
        this.initialized = true;
        
        console.log('Initializing Dashboard...');
        
        this.initEventListeners();
        this.setupSidebarNav();
        
        // Load user data first as it's critical
        const userData = this.loadUserData();
        
        // Make sure sidebar profile is updated with user data
        if (userData) {
            this.updateSidebarProfile(userData);
        }
        
        this.syncMentorshipStatus();
        
        if (window.connectionService) {
            window.connectionService.setHandlers({
                onNewConnectionRequest: data => this.onNewConnectionRequest(data.request),
                onConnectionResponseConfirmed: data => this.onConnectionResponseConfirmed(data.request),
                onConnectionRequestSent: () => {}
            });
            this.loadConnectionRequestsFromLocalStorage();
        }
        
        // Ensure we can access the user profile data properly before loading the dashboard
        setTimeout(() => {
            console.log('Delayed dashboard page load to ensure data is ready');
            this.loadDashboardPage('main-dashboard');
            
            // Make sure welcome message is updated after dashboard loads
            if (this.currentUser) {
                setTimeout(() => this.updateWelcomeMessage(this.currentUser), 300);
            }
        }, 100);
    },
    
    // Get user data from localStorage
    getUserData() {
        try {
            // Always get fresh data from localStorage and never use cache
            const userDataRaw = localStorage.getItem('userData');
            console.log('Raw userData from localStorage:', userDataRaw);
            const userData = JSON.parse(userDataRaw || '{}');
            console.log('Parsed userData:', userData);
            
            // Deep clone the data to avoid reference issues
            this.currentUser = JSON.parse(JSON.stringify(userData));
            return this.currentUser;
        } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
            return null;
        }
    },
    
    // Update user data in localStorage
    updateUserData(updates) {
        try {
            console.log('updateUserData called with:', updates);
            
            // Get fresh data from localStorage
            const userData = this.getUserData();
            console.log('Current userData before update:', userData);
            
            // Log any differences between current user data and updates
            console.log('Changes detected in form submission:');
            Object.keys(updates).forEach(key => {
                if (JSON.stringify(updates[key]) !== JSON.stringify(userData[key])) {
                    console.log(`Field '${key}' changed:`, {
                        from: userData[key],
                        to: updates[key]
                    });
                }
            });
            
            // Preserve critical fields that should never be overwritten unless explicitly in updates
            const criticalFields = ['id', 'role', 'profileComplete', 'createdAt', 'hasMentor', 'mentorId', 'mentorName', 'education', 'experience'];
            
            // Create a new object with updates as the base (important change!)
            // This prioritizes the form data over the stored data
            const updatedData = {...updates};
            
            // Ensure critical fields are preserved
            criticalFields.forEach(field => {
                if (userData[field] && !updates[field]) {
                    updatedData[field] = userData[field];
                }
            });
            
            // Make sure firstName, lastName, and fullName are in sync
            if (updates.firstName || updates.lastName) {
                const first = updates.firstName || '';
                const last = updates.lastName || '';
                updatedData.firstName = first;
                updatedData.lastName = last;
                updatedData.fullName = `${first} ${last}`.trim();
            } else if (updates.fullName) {
                const nameParts = updates.fullName.split(' ');
                if (nameParts.length > 0) {
                    updatedData.firstName = nameParts[0];
                    updatedData.lastName = nameParts.slice(1).join(' ');
                }
            }
            
            // Merge the data and store in localStorage
            console.log('Merged data to be saved:', updatedData);
            
            // Store the updated data
            const dataToStore = JSON.stringify(updatedData);
            localStorage.setItem('userData', dataToStore);
            console.log('Saving to localStorage:', dataToStore);
            
            // Verify the data is stored correctly
            const verifyData = localStorage.getItem('userData');
            console.log('Verification - data in localStorage after save:', verifyData);
            const parsedVerifyData = JSON.parse(verifyData);
            console.log('Parsed saved data:', parsedVerifyData);
            
            // Update currentUser with the new data
            this.currentUser = updatedData;
            
            // Always update sidebar profile after any user data update
            this.updateSidebarProfile(updatedData);
            
            // Update welcome message with the user's name
            this.updateWelcomeMessage(updatedData);
            
            console.log('Profile data updated successfully:', updatedData);
            return updatedData;
        } catch (error) {
            console.error('Error updating user data:', error);
            console.error('Error details:', error.message, error.stack);
            this.showFeedback('error', 'Failed to save profile data');
            return null;
        }
    },
    
    // Load user data from localStorage
    loadUserData() {
        try {
            const userData = this.getUserData();
            console.log('Loading user data from localStorage:', userData);
            if (Object.keys(userData).length) {
                this.currentUser = userData;
                this.userRole = this.currentUser.role;
                this.hasMentor = Boolean(this.currentUser.hasMentor);
                this.hasMentees = Boolean(this.currentUser.hasMentees);
                
                // Immediately update the sidebar profile
                this.updateSidebarProfile(this.currentUser);
                
                // Update welcome message with the user's name
                this.updateWelcomeMessage(this.currentUser);
                
                this.updateMenuVisibility();
                this.loadConnectionRequestsFromLocalStorage();
                
                if ((this.userRole === 'MENTOR' || this.userRole === 'mentor') && window.connectionService) {
                    window.connectionService.setHandlers({
                        onNewConnectionRequest: (data) => this.onNewConnectionRequest(data.request),
                        onConnectionResponseConfirmed: (data) => this.onConnectionResponseConfirmed(data.request)
                    });
                    
                    window.connectionService.checkPendingRequestsForMentor(this.currentUser.id);
                }
                
                return userData;
            }
            
            // Default user data if none exists
            this.currentUser = {
                id: 'user123',
                fullName: 'John Doe',
                role: 'MENTOR',
                email: 'john.doe@example.com',
                title: 'Senior Developer',
                company: 'Tech Co',
                bio: 'Experienced developer with a passion for mentoring',
                imageUrl: '../images/avatar-1.jpg',
                categories: ['Programming', 'Career Development'],
                skills: ['JavaScript', 'React', 'Node.js', 'Career Planning'],
                availability: ['Monday', 'Wednesday', 'Friday']
            };
            this.userRole = this.currentUser.role;
            this.hasMentor = false;
            this.hasMentees = this.userRole === 'MENTOR';
            
            this.updateSidebarProfile(this.currentUser);
            this.updateMenuVisibility();
            
            // Update welcome message with the user's name
            this.updateWelcomeMessage(this.currentUser);
            
            localStorage.setItem('userData', JSON.stringify(this.currentUser));
            this.loadConnectionRequestsFromLocalStorage();
        } catch (error) {}
        
        this.updateMenuVisibility();
    },
    
    // Update sidebar profile
    updateSidebarProfile(user) {
        console.log('Updating sidebar profile with user data:', user);
        
        // Update profile image
        const sidebarProfileImage = document.querySelector('.sidebar-profile-image');
        if (sidebarProfileImage && user.imageUrl) {
            sidebarProfileImage.src = user.imageUrl;
        } else if (sidebarProfileImage) {
            sidebarProfileImage.src = '../images/avatar-placeholder.jpg';
        }
        
        // Update profile name
        const sidebarProfileName = document.querySelector('.sidebar-profile-name');
        if (sidebarProfileName) {
            sidebarProfileName.textContent = user.fullName || 'User';
        }
        
        // Update profile title
        const sidebarProfileTitle = document.querySelector('.sidebar-profile-title');
        if (sidebarProfileTitle) {
            sidebarProfileTitle.textContent = user.title || 'Platform User';
        }
        
        // Update profile role badge
        const roleBadge = document.querySelector('.role-badge');
        if (roleBadge) {
            roleBadge.textContent = user.role === 'MENTOR' ? 'Mentor' : 'Mentee';
            roleBadge.className = 'role-badge ' + (user.role === 'MENTOR' ? 'mentor' : 'mentee');
        }
        
        // Update mini profile info in the dropdown
        const miniProfileName = document.querySelector('.mini-profile-name');
        if (miniProfileName) {
            miniProfileName.textContent = user.fullName || 'User';
        }
        
        const miniProfileEmail = document.querySelector('.mini-profile-email');
        if (miniProfileEmail) {
            miniProfileEmail.textContent = user.email || '';
        }
    },
    
    // Update the welcome message with user's name
    updateWelcomeMessage(user) {
        if (!user) return;
        
        console.log('Updating welcome message for user:', user.fullName || user.firstName || 'Unknown');
        
        // Try to find the welcome element - search more broadly in case it's in a different container
        const welcomeNameElements = document.querySelectorAll('#user-name');
        
        if (welcomeNameElements.length === 0) {
            console.log('Welcome name element not found, will try again later');
            // Element might not be loaded yet, try again after a short delay
            setTimeout(() => this.updateWelcomeMessage(user), 300);
            return;
        }
        
        // Use first name if available, otherwise use full name or default to 'User'
        const displayName = user.firstName || (user.fullName ? user.fullName.split(' ')[0] : 'User');
        console.log('Setting welcome name to:', displayName);
        
        // Update all instances of the welcome message that might exist
        welcomeNameElements.forEach(element => {
            element.textContent = displayName;
        });
    },
    
    // Update menu visibility based on user role
    updateMenuVisibility() {
        console.log('Updating menu visibility for role:', this.userRole);
        
        // Get all role-specific menu items
        const mentorOnlyItems = document.querySelectorAll('.nav-item[data-role="mentor"]');
        const menteeOnlyItems = document.querySelectorAll('.nav-item[data-role="mentee"]');
        
        // Show/hide based on role
        if (this.userRole === 'MENTOR' || this.userRole === 'mentor') {
            mentorOnlyItems.forEach(item => item.style.display = 'flex');
            menteeOnlyItems.forEach(item => item.style.display = 'none');
        } else if (this.userRole === 'MENTEE' || this.userRole === 'mentee') {
            mentorOnlyItems.forEach(item => item.style.display = 'none');
            menteeOnlyItems.forEach(item => item.style.display = 'flex');
        } else {
            // If role is not set, show all items
            mentorOnlyItems.forEach(item => item.style.display = 'flex');
            menteeOnlyItems.forEach(item => item.style.display = 'flex');
        }
        
        // Update connection requests badge
        this.updateConnectionRequestsCount();
    },
    
    // Initialize profile page - FIXED VERSION
    initProfilePage() {
        console.log('Initializing profile page...');
        
        // Log the entire dashboard content structure to diagnose any issues
        console.log('Dashboard page content at init:', document.getElementById('dashboard-page-content') ? 'Exists' : 'Missing');
        
        // Check for profile-page elements
        const profilePageByClass = document.querySelector('.profile-page');
        console.log('Profile page by class:', profilePageByClass ? 'Found' : 'Missing');
        
        // Define a function to find the form and set up handlers
        const findAndSetupForm = () => {
            console.log('Looking for profile form...');
            
            // Try multiple selectors to find the form
            let profileForm = document.getElementById('profile-form');
            if (!profileForm) {
                console.log('Profile form not found by ID, trying alternative selectors');
                profileForm = document.querySelector('form.profile-form') || 
                             document.querySelector('.profile-page form') || 
                             document.querySelector('.card-body form');
                console.log('Form by alternative selector:', profileForm ? 'Found' : 'Missing');
            }
            
            if (!profileForm) {
                console.log('Profile form not found by any selector');
                return false;
            }
            
            console.log('Profile form found, initializing components...', profileForm);
            
            // Get profile data - force a fresh copy from localStorage
            const userData = this.getUserData();
            console.log('User data loaded for profile:', userData);
            
            // Verify we have the expected data structure
            if (!userData || Object.keys(userData).length === 0) {
                console.error('User data is empty or missing - cannot load profile');
                this.showFeedback('error', 'Could not load your profile data. Please try refreshing the page.');
                return false;
            }
            
            // Log form fields to verify they exist
            ['firstName', 'lastName', 'email', 'bio'].forEach(id => {
                const field = document.getElementById(id);
                console.log(`Field ${id}:`, field ? 'Found' : 'Missing');
            });
            
            // Parse fullName into firstName and lastName if needed
            if (userData.fullName && (!userData.firstName || !userData.lastName)) {
                const nameParts = userData.fullName.split(' ');
                if (nameParts.length >= 2) {
                    userData.firstName = userData.firstName || nameParts[0];
                    userData.lastName = userData.lastName || nameParts.slice(1).join(' ');
                    console.log('Split fullName into:', { firstName: userData.firstName, lastName: userData.lastName });
                }
            }
            
            // Immediately try to populate some fields directly
            const firstNameField = document.getElementById('firstName');
            const lastNameField = document.getElementById('lastName');
            
            if (firstNameField && userData.firstName) {
                firstNameField.value = userData.firstName;
                console.log('Set firstName directly:', firstNameField.value);
            }
            
            if (lastNameField && userData.lastName) {
                lastNameField.value = userData.lastName;
                console.log('Set lastName directly:', lastNameField.value);
            }
            
            // Load all profile data into the form
            this.loadProfileData(userData);
            
            // Check if the form was populated correctly
            const firstName = document.getElementById('firstName')?.value;
            const lastName = document.getElementById('lastName')?.value;
            if (!firstName || !lastName) {
                console.warn('Form fields may not have been populated correctly, trying alternative method');
                this.populateProfileFormDirectly(userData);
            }
            
            // CRITICAL FIX: Set up form submission handler AFTER finding the form
            console.log('Setting up form submission handlers');
            
            // Define the save handler function
            const saveProfileFormData = (event) => {
                // Prevent the default form submission
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('Form submission event intercepted:', event.type);
                }
                
                console.log('Save profile function called');
                
                try {
                    // Debug form state before getting form data
                    console.log('Form fields before collection:');
                    const fieldIds = ['firstName', 'lastName', 'email', 'bio', 'title', 'location', 'learning-goal'];
                    fieldIds.forEach(id => {
                        const field = document.getElementById(id);
                        console.log(`Field ${id}:`, {
                            exists: !!field,
                            value: field?.value
                        });
                    });
                    
                    // Get form data from all fields
                    const formData = this.getProfileFormData();
                    console.log('Form data collected for save:', formData);
                    
                    // Make sure we have the expected structure
                    if (!formData || typeof formData !== 'object') {
                        console.error('Invalid form data structure:', formData);
                        this.showFeedback('error', 'Error collecting form data. Please try again.');
                        return false;
                    }
                    
                    // Verify localStorage before update
                    const beforeUpdate = localStorage.getItem('userData');
                    console.log('Profile data BEFORE update:', beforeUpdate);
                    
                    // Save the form data
                    const updateResult = this.updateUserData(formData);
                    console.log('Profile update result:', updateResult);
                    
                    // Verify localStorage after update
                    const afterUpdate = localStorage.getItem('userData');
                    console.log('Profile data AFTER update:', afterUpdate);
                    console.log('Is data different after update?', beforeUpdate !== afterUpdate);
                    
                    // Show feedback message if update was successful
                    if (updateResult) {
                        this.showFeedback('success', 'Profile updated successfully!');
                        
                        // Force sidebar profile update
                        this.updateSidebarProfile(updateResult);
                        
                        // Force UI refresh
                        const profileEvent = new CustomEvent('profile-updated', { detail: updateResult });
                        document.dispatchEvent(profileEvent);
                    } else {
                        console.error('Failed to update user data');
                        this.showFeedback('error', 'Failed to update profile. Please try again.');
                    }
                } catch (formError) {
                    console.error('Error in form submission:', formError);
                    console.error('Error details:', formError.message, formError.stack);
                    this.showFeedback('error', 'Unexpected error during form submission. Please try again.');
                }
                
                // Return false to prevent form submission
                return false;
            };
            
            // Find the save button
            const submitButton = profileForm.querySelector('.btn-save');
            console.log('Submit button found:', !!submitButton);
            
            // Attach the handler in multiple ways to ensure it works
            if (submitButton) {
                console.log('Adding click event to submit button');
                
                // Use addEventListener instead of onclick to avoid overwriting existing handlers
                submitButton.addEventListener('click', (e) => {
                    console.log('Submit button clicked');
                    e.preventDefault();
                    saveProfileFormData(e);
                    return false;
                });
                
                // Also set onclick as a fallback
                submitButton.onclick = function(e) {
                    console.log('Submit button clicked via onclick');
                    e.preventDefault();
                    saveProfileFormData(e);
                    return false;
                };
            }
            
            // Set form submission handlers
            profileForm.addEventListener('submit', function(e) {
                console.log('Form submit event triggered');
                e.preventDefault();
                saveProfileFormData(e);
                return false;
            });
            
            // Add test/debug save button (uncomment if needed)
            /*
            const testButton = document.createElement('button');
            testButton.textContent = 'Debug Save';
            testButton.style.cssText = 'position:fixed; bottom:10px; right:10px; z-index:9999; padding:10px; background:red; color:white;';
            testButton.onclick = (e) => {
                e.preventDefault();
                console.log('Debug save button clicked');
                saveProfileFormData(e);
                return false;
            };
            document.body.appendChild(testButton);
            */
            
            console.log('Profile form submission handlers attached successfully');
            
            return true;
        };
        
        // Try to find form and set up handlers immediately
        if (!findAndSetupForm()) {
            // If not found, try again with a short delay
            setTimeout(() => {
                if (!findAndSetupForm()) {
                    // Try one more time with a longer delay
                    setTimeout(findAndSetupForm, 500);
                }
            }, 100);
        }
        
        // Handle skills input
        const skillsInput = document.getElementById('skills-input');
        const skillsContainer = document.getElementById('skills-container');
        
        if (skillsInput && skillsContainer) {
            skillsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    
                    const skill = skillsInput.value.trim();
                    if (skill) {
                        this.addSkillTag(skill, skillsContainer);
                        skillsInput.value = '';
                    }
                }
            });
        } else {
            console.warn('Skills input or container not found');
        }
        
        // Add a helper method to directly populate the form as a fallback
        this.populateProfileFormDirectly = (userData) => {
            console.log('Using direct form population method');
            try {
                // Try to populate form fields directly
                const fields = {
                    'firstName': userData.firstName || (userData.fullName ? userData.fullName.split(' ')[0] : ''),
                    'lastName': userData.lastName || (userData.fullName ? userData.fullName.split(' ').slice(1).join(' ') : ''),
                    'email': userData.email,
                    'bio': userData.bio,
                    'title': userData.title,
                    'location': userData.location,
                    'learning-goal': userData.goals,
                    'availability': userData.availability,
                    'session-preference': userData.sessionPreference,
                    'linkedin': userData.linkedin,
                    'github': userData.github,
                    'portfolio': userData.portfolio
                };
                
                // Set each field directly
                Object.entries(fields).forEach(([id, value]) => {
                    const element = document.getElementById(id);
                    if (element && value) {
                        element.value = value;
                        console.log(`Directly set ${id} = ${value}`);
                    }
                });
                
                // Handle skills
                if (skillsContainer && userData.skills && Array.isArray(userData.skills)) {
                    skillsContainer.innerHTML = '';
                    userData.skills.forEach(skill => {
                        this.addSkillTag(skill, skillsContainer);
                    });
                }
                
                // Handle interests checkboxes
                if (userData.interests && Array.isArray(userData.interests)) {
                    userData.interests.forEach(interest => {
                        const interestMap = {
                            'Frontend Development': 'interest-web',
                            'Web Development': 'interest-web',
                            'Mobile Development': 'interest-mobile',
                            'Data Science': 'interest-data',
                            'Machine Learning': 'interest-ml',
                            'UI/UX Design': 'interest-ui',
                            'UX/UI': 'interest-ui',
                            'Backend Development': 'interest-backend',
                            'DevOps': 'interest-devops',
                            'Cybersecurity': 'interest-security'
                        };
                        
                        const checkboxId = interestMap[interest];
                        if (checkboxId) {
                            const checkbox = document.getElementById(checkboxId);
                            if (checkbox) checkbox.checked = true;
                        }
                    });
                }
            } catch (error) {
                console.error('Error in direct form population:', error);
            }
        };
        
        // Handle profile image upload
        const uploadTrigger = document.getElementById('upload-trigger');
        const profileUpload = document.getElementById('profile-upload');
        const profilePreview = document.getElementById('profile-preview');
        
        console.log('Profile image elements:', { 
            uploadTrigger: !!uploadTrigger, 
            profileUpload: !!profileUpload, 
            profilePreview: !!profilePreview,
            previewSrc: profilePreview?.src 
        });
        
        if (uploadTrigger && profileUpload && profilePreview) {
            // Make sure profile preview has a default image if none set
            if (!profilePreview.src || profilePreview.src === 'undefined' || profilePreview.src === '') {
                profilePreview.src = '../images/profile-placeholder.jpg';
            }
            
            uploadTrigger.addEventListener('click', () => {
                profileUpload.click();
            });
            
            profileUpload.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        profilePreview.src = e.target.result;
                        console.log('Updated profile image preview:', profilePreview.src.substring(0, 50) + '...');
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
        } else {
            console.error('One or more profile image elements not found');
        }
    },
    
    // Add a skill tag to the container
    addSkillTag(skill, container) {
        const skillTag = document.createElement('span');
        skillTag.className = 'skill-tag';
        skillTag.innerHTML = `${skill} <i class="fas fa-times remove-skill"></i>`;
        
        skillTag.querySelector('.remove-skill').addEventListener('click', () => 
            skillTag.remove()
        );
        
        container.appendChild(skillTag);
    },
    
    // Load profile data into the form
    loadProfileData(userData) {
        console.log('Loading profile data into form:', userData);
        
        // Add debugging to help identify issues with form loading
        let formElement = document.getElementById('profile-form');
        if (!formElement) {
            // Try by class selector
            formElement = document.querySelector('form.profile-form');
            console.log('Found form by class selector:', !!formElement);
        }
        
        if (!formElement) {
            console.error('Profile form element not found when loading data!');
            return;
        }
        
        console.log('Form found, setting field values...');
        const contentDiv = document.getElementById('dashboard-page-content');
        if (contentDiv) {
            console.log('DOM structure at load time:', contentDiv.innerHTML.substring(0, 200));
        } else {
            console.error('dashboard-page-content element not found');
        }
        
        // Make sure fullName is parsed into firstName and lastName if needed
        if (userData.fullName && (!userData.firstName || !userData.lastName)) {
            const nameParts = userData.fullName.split(' ');
            if (nameParts.length >= 2) {
                userData.firstName = userData.firstName || nameParts[0];
                userData.lastName = userData.lastName || nameParts.slice(1).join(' ');
                console.log('Split fullName into parts in loadProfileData');
            }
        }
        
        // Force a new form reference to ensure we have latest DOM state
        const freshForm = document.getElementById('profile-form') || document.querySelector('form.profile-form');
        if (freshForm !== formElement) {
            console.log('Form reference updated to fresh instance');
            formElement = freshForm;
        }
        
        // Directly set values on elements rather than using setFieldValue to avoid any issues
        const setDirectValue = (id, value) => {
            // Try multiple methods to set the value
            // 1. Try by ID
            let element = document.getElementById(id);
            
            // 2. Try by name
            if (!element) {
                element = document.querySelector(`[name="${id}"]`);
            }
            
            // 3. Try by selector with ID
            if (!element) {
                element = document.querySelector(`#${id}`);
            }
            
            if (element) {
                try {
                    element.value = value || '';
                    // Force update
                    const event = new Event('input', {bubbles: true});
                    element.dispatchEvent(event);
                    console.log(`Direct set field ${id} = ${value}`);
                } catch (e) {
                    console.error(`Error setting value for ${id}:`, e);
                }
            } else {
                console.error(`Element not found by any method: ${id}`);
                // Log all input elements to help diagnose
                const allInputs = document.querySelectorAll('input, textarea, select');
                console.log(`Available form elements (${allInputs.length}):`, 
                    Array.from(allInputs).map(input => input.id || input.name || 'unnamed'));
            }
        };
        
        // Set name fields
        setDirectValue('firstName', userData.firstName);
        setDirectValue('lastName', userData.lastName);
        
        // Set main profile info
        setDirectValue('email', userData.email);
        setDirectValue('bio', userData.bio);
        setDirectValue('title', userData.title);
        setDirectValue('location', userData.location);
        
        // Set profile image if it exists
        const profilePreview = document.getElementById('profile-preview');
        if (profilePreview) {
            const imageSrc = userData.imageUrl || userData.profileImage || '../images/profile-placeholder.jpg';
            profilePreview.src = imageSrc;
            console.log('Set profile image:', imageSrc);
        } else {
            console.error('Profile preview element not found');
        }
        
        // Set skills
        const skillsContainer = document.getElementById('skills-container');
        if (skillsContainer) {
            // Clear existing skills
            skillsContainer.innerHTML = '';
            
            // Add skills from user data
            if (userData.skills && Array.isArray(userData.skills)) {
                console.log('Loading skills:', userData.skills);
                userData.skills.forEach(skill => {
                    this.addSkillTag(skill, skillsContainer);
                });
            } else {
                console.log('No skills found in user data or not an array:', userData.skills);
            }
        } else {
            console.error('Skills container not found');
        }
        
        // Set interests
        if (userData.interests && Array.isArray(userData.interests)) {
            console.log('Loading interests:', userData.interests);
            // Uncheck all interest checkboxes first
            document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Check the boxes that match user interests
            userData.interests.forEach(interest => {
                // Need to find checkbox input that has a label with this text
                document.querySelectorAll('.checkbox-item label').forEach(label => {
                    if (label.textContent.trim() === interest.trim()) {
                        const checkbox = document.getElementById(label.getAttribute('for'));
                        if (checkbox) {
                            checkbox.checked = true;
                            console.log(`Interest checkbox set for: ${interest}`);
                        }
                    }
                });
            });
        } else {
            console.log('No interests found in user data or not an array:', userData.interests);
        }
        
        // Set other profile fields
        setDirectValue('learning-goal', userData.goals);
        setDirectValue('availability', userData.availability);
        setDirectValue('session-preference', userData.sessionPreference);
        
        // Set social links
        setDirectValue('linkedin', userData.linkedin);
        setDirectValue('github', userData.github);
        setDirectValue('portfolio', userData.portfolio);
        
        // Log success and all field values for verification
        console.log('All profile data loaded into form');
        
        // Verify field values were set correctly
        ['firstName', 'lastName', 'email', 'bio', 'title', 'location'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                console.log(`Field verification - ${fieldId}: ${field.value}`);
            }
        });
    },
    
    // Helper to set field value safely
    setFieldValue(id, value) {
        // Try to find the field by ID first
        let field = document.getElementById(id);
        
        // If not found, try to find by name attribute
        if (!field) {
            field = document.querySelector(`[name="${id}"]`);
        }
        
        // If still not found, try to find by class that contains the ID
        if (!field) {
            field = document.querySelector(`.${id}`);
        }
        
        // Try to find input field with placeholder containing the field name
        if (!field) {
            const cleanId = id.replace(/-/g, ' ');
            field = Array.from(document.querySelectorAll('input, textarea, select'))
                .find(el => (el.placeholder && el.placeholder.toLowerCase().includes(cleanId.toLowerCase())));
        }
        
        if (field) {
            // Set value and trigger change event to ensure UI updates
            field.value = value;
            
            // Force a re-render by triggering native input/change events
            const event = new Event('input', { bubbles: true });
            field.dispatchEvent(event);
            
            // For select elements, also trigger change event
            if (field.tagName === 'SELECT') {
                const changeEvent = new Event('change', { bubbles: true });
                field.dispatchEvent(changeEvent);
            }
            
            console.log(`Field found and value set: ${id} = ${value}`);
        } else {
            console.warn(`Field not found: ${id} with value ${value}`);
            // Log all available form input IDs to help diagnose the issue
            const allInputs = Array.from(document.querySelectorAll('input, textarea, select'));
            console.log('Available form fields:', allInputs.map(input => ({ 
                id: input.id, 
                name: input.name, 
                placeholder: input.placeholder 
            })));
        }
    },
    
    // Get all profile form data
    getProfileFormData() {
        const currentUserData = this.getUserData() || {};
        console.log('Getting profile form data with current user data:', currentUserData);
        
        // Get name fields and log detailed debugging info
        const firstNameField = document.getElementById('firstName');
        const lastNameField = document.getElementById('lastName');
        
        // Debug log for form fields
        console.log('Name field elements found?', { 
            firstNameField: !!firstNameField, 
            firstNameValue: firstNameField?.value,
            lastNameField: !!lastNameField,
            lastNameValue: lastNameField?.value
        });
        
        // Always use the form field values directly, not cached values
        const firstName = firstNameField?.value || '';
        const lastName = lastNameField?.value || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        console.log('Name fields extracted:', { firstName, lastName, fullName });
        
        // Get all skills
        const skills = [];
        const skillTags = document.querySelectorAll('#skills-container .skill-tag');
        console.log('Found skill tags:', skillTags.length);
        
        skillTags.forEach(tag => {
            // Remove the 'x' icon from skill text
            const skillText = tag.textContent.replace('✕', '').replace('×', '').replace(/\s*remove-skill\s*/, '').trim();
            skills.push(skillText);
        });
        
        // Get all checked interests
        const interests = [];
        const checkedInterests = document.querySelectorAll('.checkbox-item input[type="checkbox"]:checked');
        console.log('Found checked interests:', checkedInterests.length);
        
        checkedInterests.forEach(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`);
            if (label) {
                interests.push(label.textContent.trim());
            }
        });
        
        // Get form input values with detailed logging
        function getFieldValue(id) {
            const field = document.getElementById(id);
            const value = field?.value || '';
            console.log(`Field '${id}' value:`, value);
            return value;
        }
        
        // Get profile image
        const profilePreview = document.getElementById('profile-preview');
        const imageUrl = profilePreview?.src || '';
        console.log('Profile image URL:', imageUrl);
        
        // Create data object with new form values
        const formData = {
            // Core profile data
            firstName,
            lastName,
            fullName,
            email: getFieldValue('email'),
            bio: getFieldValue('bio'),
            title: getFieldValue('title'),
            location: getFieldValue('location'),
            skills,
            interests,
            goals: getFieldValue('learning-goal'),
            availability: getFieldValue('availability'),
            sessionPreference: getFieldValue('session-preference'),
            linkedin: getFieldValue('linkedin'),
            github: getFieldValue('github'),
            portfolio: getFieldValue('portfolio'),
            profileImage: imageUrl, // Added profileImage field to match what's used in other places
            imageUrl, // Keep both fields for compatibility
            lastUpdated: new Date().toISOString(),
            
            // Preserve critical fields
            id: currentUserData.id,
            role: currentUserData.role,
            profileComplete: true, // Mark profile as complete
            createdAt: currentUserData.createdAt || new Date().toISOString(),
            hasMentor: currentUserData.hasMentor,
            mentorId: currentUserData.mentorId,
            mentorName: currentUserData.mentorName,
            education: currentUserData.education,
            experience: currentUserData.experience
        };
        
        // Handle password fields if provided
        const currentPassword = getFieldValue('current-password');
        if (currentPassword) {
            formData.currentPassword = currentPassword;
            formData.newPassword = getFieldValue('new-password');
            formData.confirmPassword = getFieldValue('confirm-password');
        }
        
        console.log('Form data collected:', formData);
        return formData;
    },
    
    // Handle new connection requests
    onNewConnectionRequest(request) {
        console.log('New connection request received:', request);
        if (!this.pendingConnectionRequests.some(req => req.id === request.id)) {
            this.pendingConnectionRequests.push(request);
        }
        
        this.updateNotifications();
        
        if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification("New Connection Request", {
                body: `A mentee wants to connect with you`,
                icon: "images/notification-icon.png"
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    },
    
    // Handle connection response confirmation
    onConnectionResponseConfirmed(request) {
        console.log('Connection response confirmed:', request);
        const index = this.pendingConnectionRequests.findIndex(req => req.id === request.id);
        if (index !== -1) {
            this.pendingConnectionRequests.splice(index, 1);
        }
        
        this.updateNotifications();
    },
    
    // Update notification UI
    updateNotifications() {
        if (!this.notificationElements.count || !this.notificationElements.body) return;
        
        const count = this.pendingConnectionRequests.length;
        this.notificationElements.count.textContent = count;
        this.notificationElements.count.style.display = count ? 'flex' : 'none';
        
        if (count > 0 && this.userRole === 'MENTOR') {
            if (Notification && Notification.permission === "granted") {
                const notificationsShown = localStorage.getItem('mentorRequestsNotificationShown');
                if (!notificationsShown) {
                    new Notification('New Mentee Requests', {
                        body: `You have ${count} pending mentee connection ${count === 1 ? 'request' : 'requests'}`,
                        icon: 'images/notification-icon.png'
                    });
                    localStorage.setItem('mentorRequestsNotificationShown', 'true');
                }
            } else if (Notification && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
        
        this.renderNotificationItems();
        
        // Also update connection requests count in nav
        const countBadge = document.querySelector('.nav-item[data-page="connection-requests"] .badge');
        if (countBadge) {
            countBadge.textContent = count;
            countBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    },
    
    // Render notification items
    renderNotificationItems() {
        const { body, emptyMessage } = this.notificationElements;
        if (!body || !emptyMessage) return;
        
        body.innerHTML = '';
        body.appendChild(emptyMessage);
        
        if (!this.pendingConnectionRequests?.length) {
            emptyMessage.style.display = 'block';
            return;
        }
        
        emptyMessage.style.display = 'none';
        const menteeRequests = new Map();
        
        this.pendingConnectionRequests.forEach(request => {
            const menteeName = request.menteeName || 'Anonymous';
            const existingRequest = menteeRequests.get(menteeName);
            
            if (!existingRequest || 
                (existingRequest.menteeName === 'Anonymous' && request.menteeName) || 
                (request.menteeImage && !existingRequest.menteeImage)) {
                menteeRequests.set(menteeName, request);
            }
        });
        
        if (menteeRequests.size > 0) {
            menteeRequests.forEach(request => {
                const requestItem = document.createElement('div');
                requestItem.className = 'connection-request-item';
                requestItem.dataset.requestId = request.id;
                
                const requestTime = new Date(request.timestamp || Date.now());
                const timeString = requestTime.toLocaleString();
                
                requestItem.innerHTML = `
                    <div class="connection-request-info">
                        <img src="${request.menteeImage || '../images/profile-placeholder.jpg'}" 
                             alt="${request.menteeName || 'Anonymous'}" class="connection-request-img">
                        <div class="connection-request-details">
                            <div class="connection-request-name">${request.menteeName || 'Anonymous'}</div>
                            <div class="connection-request-time">${timeString}</div>
                        </div>
                    </div>
                    <div class="connection-request-message">
                        ${request.message || 'I would like to connect with you as my mentor.'}
                    </div>
                    <div class="connection-request-actions">
                        <button class="connection-action-btn accept" data-action="accept">Accept</button>
                        <button class="connection-action-btn decline" data-action="reject">Decline</button>
                    </div>
                `;
                
                body.appendChild(requestItem);
            });
            
            if (this.notificationElements.dropdown) {
                this.notificationElements.dropdown.style.display = 'block';
            }
        }
    },
    
    // Update connection requests count
    updateConnectionRequestsCount() {
        this.updateNotifications();
    },
    
    // Handle connection request actions
    handleConnectionAction(action, requestId) {
        if (action === 'accept') {
            this.acceptConnectionRequest(requestId);
        } else if (action === 'reject') {
            this.rejectConnectionRequest(requestId);
        }
    },
    
    // Accept connection request
    acceptConnectionRequest(requestId) {
        const index = this.pendingConnectionRequests.findIndex(req => req.id === requestId);
        if (index === -1) {
            this.showFeedback('error', 'Request not found');
            return false;
        }
        
        const request = this.pendingConnectionRequests[index];
        
        if (request.source === 'direct_request') {
            const userData = this.getUserData();
            const mentorName = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            const mentorId = userData.id;
            
            if (mentorName) {
                try {
                    const mentorData = JSON.parse(localStorage.getItem(mentorName) || '{}');
                    if (mentorData.requests && Array.isArray(mentorData.requests)) {
                        const menteeRequestIndex = mentorData.requests.findIndex(req => 
                            req.menteeName === request.menteeName && req.status === 'pending'
                        );
                        
                        if (menteeRequestIndex !== -1) {
                            mentorData.requests[menteeRequestIndex].status = 'accepted';
                            localStorage.setItem(mentorName, JSON.stringify(mentorData));
                            
                            // Update mentor data
                            this.updateUserData({
                                hasMentees: true,
                                mentees: [...(userData.mentees || []), {
                                    id: request.menteeId || request.id,
                                    name: request.menteeName
                                }]
                            });
                            this.hasMentees = true;
                            
                            // Update mentee data
                            if (request.menteeName) {
                                this.updateMenteeData(request.menteeName, mentorName, mentorId);
                            }
                            
                            this.pendingConnectionRequests.splice(index, 1);
                            this.updateNotifications();
                            this.showFeedback('success', `You accepted ${request.menteeName}'s request`);
                            return true;
                        }
                    }
                } catch (error) {}
            }
        }
        
        if (window.connectionService) {
            const success = window.connectionService.respondToConnectionRequest(requestId, true);
            if (!success) {
                this.showFeedback('error', 'Failed to accept request. Please try again later.');
                return false;
            }
            
            try {
                const userData = this.getUserData();
                const mentorName = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                const mentorId = userData.id;
                
                // Update mentor data
                this.updateUserData({
                    hasMentees: true,
                    mentees: [...(userData.mentees || []), {
                        id: request.menteeId || request.id,
                        name: request.menteeName
                    }]
                });
                this.hasMentees = true;
                
                // Update mentee data to show My Mentor
                if (request.menteeId && request.menteeName) {
                    this.updateMenteeData(request.menteeName, mentorName, mentorId);
                }
            } catch (error) {}
            
            this.pendingConnectionRequests.splice(index, 1);
            this.updateNotifications();
            this.showFeedback('success', 'Request accepted');
            return true;
        } else {
            this.showFeedback('error', 'Connection service unavailable');
            return false;
        }
    },
    
    // Update mentee data after connection acceptance
    updateMenteeData(menteeName, mentorName, mentorId) {
        try {
            // Look through all localStorage entries for this mentee
            let menteeUpdated = false;
            
            // First check for exact mentee name in localStorage
            try {
                const menteeData = JSON.parse(localStorage.getItem(menteeName) || '{}');
                if (menteeData) {
                    menteeData.hasMentor = true;
                    menteeData.mentorId = mentorId;
                    menteeData.mentorName = mentorName;
                    localStorage.setItem(menteeName, JSON.stringify(menteeData));
                    menteeUpdated = true;
                }
            } catch (e) {}
            
            // Look for the mentee in all localStorage entries
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key === 'userData' || key === 'authToken' || 
                    key === 'connectionRequests' || key === 'users' ||
                    key === 'mentorRequestsNotificationShown') continue;
                
                try {
                    const storedData = JSON.parse(localStorage.getItem(key) || '{}');
                    const fullName = storedData.fullName || `${storedData.firstName || ''} ${storedData.lastName || ''}`.trim();
                    
                    if (fullName === menteeName) {
                        storedData.hasMentor = true;
                        storedData.mentorId = mentorId;
                        storedData.mentorName = mentorName;
                        localStorage.setItem(key, JSON.stringify(storedData));
                        menteeUpdated = true;
                    }
                } catch (e) {}
            }
            
            // Update in userData if this is the current user
            const userData = this.getUserData();
            const userFullName = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            
            if (userFullName === menteeName) {
                this.updateUserData({
                    hasMentor: true,
                    mentorId: mentorId,
                    mentorName: mentorName
                });
                
                // Refresh UI immediately if this is the current user
                this.hasMentor = true;
                this.updateMenuVisibility();
                
                // If on search mentor page, switch to my mentor page
                if (this.currentPage === 'search-mentor') {
                    this.loadDashboardPage('my-mentor');
                    const myMentorNavItem = document.querySelector('.nav-item[data-page="my-mentor"]');
                    if (myMentorNavItem) {
                        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                        myMentorNavItem.classList.add('active');
                    }
                }
            }
            
            // Also update the users array if it exists
            try {
                const usersJson = localStorage.getItem('users');
                if (usersJson) {
                    const users = JSON.parse(usersJson);
                    const menteeIndex = users.findIndex(user => {
                        const userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
                        return userName === menteeName;
                    });
                    
                    if (menteeIndex !== -1) {
                        users[menteeIndex].hasMentor = true;
                        users[menteeIndex].mentorId = mentorId;
                        users[menteeIndex].mentorName = mentorName;
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                }
            } catch (e) {}
        } catch (error) {}
    },
    // Reject connection request
    rejectConnectionRequest(requestId) {
        const index = this.pendingConnectionRequests.findIndex(req => req.id === requestId);
        if (index === -1) {
            this.showFeedback('error', 'Request not found');
            return false;
        }
        
        const request = this.pendingConnectionRequests[index];
        
        this.pendingConnectionRequests[index].status = 'rejected';
        
        setTimeout(() => {
            this.pendingConnectionRequests.splice(index, 1);
            this.updateNotifications();
        }, 2000);
        
        this.showFeedback('info', `You declined ${request.menteeName || 'the mentee'}'s request`);
        return true;
    },
    
    // Initialize my mentees page
    initMyMenteesPage() {},
    
    // Initialize assignments page
    initAssignmentsPage() {},
    
    // Initialize connection requests page
    initConnectionRequestsPage() {},
    
    // Handle user logout
    handleLogout() {
        localStorage.removeItem('authToken');
        window.location.href = '/';
    }
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (!Dashboard.initialized && document.querySelector('.dashboard-container')) {
        Dashboard.init();
    }
});