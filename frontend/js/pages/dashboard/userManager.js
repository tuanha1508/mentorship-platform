// User data management
import ConnectionManager from './connectionManager.js';

const UserManager = {
    dashboard: null,
    currentUser: null,
    
    init(dashboardInstance) {
        this.dashboard = dashboardInstance;
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
            if (updates.hasMentor !== undefined) this.dashboard.hasMentor = updates.hasMentor;
            if (updates.hasMentees !== undefined) this.dashboard.hasMentees = updates.hasMentees;
            this.dashboard.updateMenuVisibility();
        }
    },
    
    // Get user data from localStorage
    getUserData() {
        try {
            const userDataRaw = localStorage.getItem('userData');
            const userData = JSON.parse(userDataRaw || '{}');
            
            // Check if user data has name information, if not try to find it
            if (userData && userData.id && (!userData.firstName && !userData.fullName)) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key === 'userData' || key === 'authToken' || 
                        key === 'connectionRequests' || key === 'users' ||
                        key === 'mentorRequestsNotificationShown') continue;
                    
                    try {
                        const storedData = JSON.parse(localStorage.getItem(key) || '{}');
                        if (storedData.id === userData.id) {
                            if (storedData.firstName || storedData.lastName || storedData.fullName) {
                                if (storedData.firstName) userData.firstName = storedData.firstName;
                                if (storedData.lastName) userData.lastName = storedData.lastName;
                                if (storedData.fullName) userData.fullName = storedData.fullName;
                                localStorage.setItem('userData', JSON.stringify(userData));
                                break;
                            }
                        }
                    } catch (e) {}
                }
                
                // If still can't find name and user is a mentor with mentees
                if (!userData.firstName && !userData.fullName && 
                    userData.role && userData.role.toUpperCase() === 'MENTOR' &&
                    userData.hasMentees && userData.mentees && userData.mentees.length > 0) {
                    
                    // Try to find mentor entry by name
                    const mentorsInStorage = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (!key || key === 'userData' || key === 'authToken' || 
                            key === 'connectionRequests' || key === 'users' ||
                            key === 'mentorRequestsNotificationShown') continue;
                        
                        // If this key looks like a name, check if it's our mentor
                        if (key.includes(' ') || /^[A-Z]/.test(key)) {
                            try {
                                const mentorData = JSON.parse(localStorage.getItem(key) || '{}');
                                if (mentorData.id === userData.id) {
                                    mentorsInStorage.push({
                                        name: key,
                                        data: mentorData
                                    });
                                }
                            } catch (e) {}
                        }
                    }
                    
                    if (mentorsInStorage.length > 0) {
                        // Use the first matched mentor's name
                        const mentorName = mentorsInStorage[0].name;
                        const nameParts = mentorName.split(' ');
                        
                        userData.fullName = mentorName;
                        userData.firstName = nameParts[0];
                        userData.lastName = nameParts.slice(1).join(' ');
                        
                        // Update userData in localStorage
                        localStorage.setItem('userData', JSON.stringify(userData));
                    }
                }
            }
            
            // Deep clone the data to avoid reference issues
            this.currentUser = JSON.parse(JSON.stringify(userData));
            return this.currentUser;
        } catch (error) {
            return null;
        }
    },
    
    // Update user data in localStorage
    updateUserData(updates) {
        try {
            // Get fresh data from localStorage
            const userData = this.getUserData();
            
            // Preserve critical fields that should never be overwritten unless explicitly in updates
            const criticalFields = ['id', 'role', 'profileComplete', 'createdAt', 'hasMentor', 'mentorId', 'mentorName', 'education', 'experience'];
            
            // Create a new object with updates as the base
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
            
            // Store the updated data
            localStorage.setItem('userData', JSON.stringify(updatedData));
            
            // Update currentUser with the new data
            this.currentUser = updatedData;
            
            // Update the users array in localStorage if it exists
            try {
                const usersJson = localStorage.getItem('users');
                if (usersJson) {
                    const users = JSON.parse(usersJson);
                    // Find the user by ID
                    const userIndex = users.findIndex(user => user.id === updatedData.id);
                    
                    if (userIndex !== -1) {
                        // Update the user's information
                        users[userIndex] = { ...users[userIndex], ...updatedData };
                    } else {
                        // Add the user to the users array if they don't exist yet
                        users.push(updatedData);
                    }
                    // Save the updated users array back to localStorage
                    localStorage.setItem('users', JSON.stringify(users));
                }
            } catch (e) {}
            
            // Always update sidebar profile after any user data update
            import('./uiManager.js').then(module => {
                const UIManager = module.default;
                UIManager.updateSidebarProfile(updatedData);
                UIManager.updateWelcomeMessage(updatedData);
            });
            
            return updatedData;
        } catch (error) {
            import('./uiManager.js').then(module => {
                const UIManager = module.default;
                UIManager.showFeedback('error', 'Failed to save profile data');
            });
            return null;
        }
    },
    
    // Load user data from localStorage
    loadUserData() {
        try {
            const userData = this.getUserData();
            if (Object.keys(userData).length) {
                this.currentUser = userData;
                this.dashboard.userRole = this.currentUser.role;
                this.dashboard.hasMentor = Boolean(this.currentUser.hasMentor);
                this.dashboard.hasMentees = Boolean(this.currentUser.hasMentees);
                
                // Import and use other managers
                Promise.all([
                    import('./uiManager.js'),
                    import('./connectionManager.js')
                ]).then(([uiModule, connectionModule]) => {
                    const UIManager = uiModule.default;
                    const ConnectionManager = connectionModule.default;
                    
                    // Immediately update the sidebar profile
                    UIManager.updateSidebarProfile(this.currentUser);
                    UIManager.updateWelcomeMessage(this.currentUser);
                    
                    this.dashboard.updateMenuVisibility();
                    ConnectionManager.loadConnectionRequestsFromLocalStorage();
                    
                    if ((this.dashboard.userRole === 'MENTOR' || this.dashboard.userRole === 'mentor') && window.connectionService) {
                        window.connectionService.setHandlers({
                            onNewConnectionRequest: (data) => ConnectionManager.onNewConnectionRequest(data.request),
                            onConnectionResponseConfirmed: (data) => ConnectionManager.onConnectionResponseConfirmed(data.request)
                        });
                        
                        window.connectionService.checkPendingRequestsForMentor(this.currentUser.id);
                    }
                });
                
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
            this.dashboard.userRole = this.currentUser.role;
            this.dashboard.hasMentor = false;
            this.dashboard.hasMentees = this.dashboard.userRole === 'MENTOR';
            
            import('./uiManager.js').then(module => {
                const UIManager = module.default;
                UIManager.updateSidebarProfile(this.currentUser);
                UIManager.updateWelcomeMessage(this.currentUser);
            });
            
            this.dashboard.updateMenuVisibility();
            
            localStorage.setItem('userData', JSON.stringify(this.currentUser));
            
            import('./connectionManager.js').then(module => {
                const ConnectionManager = module.default;
                ConnectionManager.loadConnectionRequestsFromLocalStorage();
            });
        } catch (error) {
            // Error handling removed
        }
        
        this.dashboard.updateMenuVisibility();
        return this.currentUser;
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
                this.dashboard.hasMentor = true;
                this.dashboard.updateMenuVisibility();
                
                // If on search mentor page, switch to my mentor page
                if (this.dashboard.currentPage === 'search-mentor') {
                    import('./navigationManager.js').then(module => {
                        const NavigationManager = module.default;
                        NavigationManager.loadDashboardPage('my-mentor');
                        const myMentorNavItem = document.querySelector('.nav-item[data-page="my-mentor"]');
                        if (myMentorNavItem) {
                            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                            myMentorNavItem.classList.add('active');
                        }
                    });
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
        } catch (error) {
            // Error handling removed
        }
    }
};

export default UserManager;