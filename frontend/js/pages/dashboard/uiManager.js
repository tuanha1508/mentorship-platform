// UI management functionality
const UIManager = {
    dashboard: null,
    
    init(dashboardInstance) {
        this.dashboard = dashboardInstance;
        // Initialize event listeners for notifications and other UI elements
        this.initEventListeners();
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
    
    // Initialize event listeners
    initEventListeners() {
        console.log('Setting up event listeners...');
        
        // Initialize notification elements
        const notificationElements = {
            icon: document.getElementById('notification-icon'),
            count: document.getElementById('notification-count'),
            dropdown: document.getElementById('notification-dropdown'),
            body: document.getElementById('notification-body'),
            emptyMessage: document.getElementById('empty-notification')
        };
        
        // Set up notification dropdown toggle
        const { icon, dropdown } = notificationElements;
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
                    import('./connectionManager.js').then(module => {
                        const ConnectionManager = module.default;
                        ConnectionManager.handleConnectionAction(action, requestId);
                    });
                }
            }
        });
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.dashboard.handleLogout());
        }
        
        // Pass notification elements to notification manager
        import('./notificationManager.js').then(module => {
            const NotificationManager = module.default;
            NotificationManager.setNotificationElements(notificationElements);
        });
    }
};

export default UIManager;