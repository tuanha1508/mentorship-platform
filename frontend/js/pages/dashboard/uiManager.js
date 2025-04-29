// UI management functionality
const UIManager = {
    dashboard: null,
    
    init(dashboardInstance) {
        this.dashboard = dashboardInstance;
        this.initEventListeners();
    },
    
    // Update sidebar profile
    updateSidebarProfile(user) {
        // Update profile image
        const sidebarProfileImage = document.querySelector('.sidebar-profile-image');
        if (sidebarProfileImage && user.imageUrl) {
            sidebarProfileImage.src = user.imageUrl;
        } else if (sidebarProfileImage) {
            const gender = Math.random() > 0.5 ? 'men' : 'women';
            const randomId = Math.floor(Math.random() * 70) + 1;
            sidebarProfileImage.src = `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`;
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
        
        const welcomeNameElements = document.querySelectorAll('#user-name');
        
        if (welcomeNameElements.length === 0) {
            return;
        }
        
        const displayName = user.firstName || (user.fullName ? user.fullName.split(' ')[0] : 'User');
        
        welcomeNameElements.forEach(element => {
            element.textContent = displayName;
        });
    },
    
    // Helper to set field value safely
    setFieldValue(id, value) {
        let field = document.getElementById(id);
        
        if (!field) {
            field = document.querySelector(`[name="${id}"]`);
        }
        
        if (!field) {
            field = document.querySelector(`.${id}`);
        }
        
        if (!field) {
            const cleanId = id.replace(/-/g, ' ');
            field = Array.from(document.querySelectorAll('input, textarea, select'))
                .find(el => (el.placeholder && el.placeholder.toLowerCase().includes(cleanId.toLowerCase())));
        }
        
        if (field) {
            field.value = value;
            
            const event = new Event('input', { bubbles: true });
            field.dispatchEvent(event);
            
            if (field.tagName === 'SELECT') {
                const changeEvent = new Event('change', { bubbles: true });
                field.dispatchEvent(changeEvent);
            }
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
        const notificationElements = {
            icon: document.getElementById('notification-icon'),
            count: document.getElementById('notification-count'),
            dropdown: document.getElementById('notification-dropdown'),
            body: document.getElementById('notification-body'),
            emptyMessage: document.getElementById('empty-notification')
        };
        
        const { icon, dropdown } = notificationElements;
        if (icon) {
            icon.addEventListener('click', () => {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            });
            
            document.addEventListener('click', (e) => {
                if (!icon.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
        }
        
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
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.dashboard.handleLogout());
        }
        
        import('./notificationManager.js').then(module => {
            const NotificationManager = module.default;
            NotificationManager.setNotificationElements(notificationElements);
        });
    }
};

export default UIManager;