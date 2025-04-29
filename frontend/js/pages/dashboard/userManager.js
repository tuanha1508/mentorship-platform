// User data management
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
            import('./uiManager.js').then(module => {
                const UIManager = module.default;
                UIManager.updateSidebarProfile(updatedData);
                
                // Update welcome message with the user's name
                UIManager.updateWelcomeMessage(updatedData);
            });
            
            console.log('Profile data updated successfully:', updatedData);
            return updatedData;
        } catch (error) {
            console.error('Error updating user data:', error);
            console.error('Error details:', error.message, error.stack);
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
            console.log('Loading user data from localStorage:', userData);
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
                    
                    // Update welcome message with the user's name
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
            console.error('Error loading user data:', error);
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
            console.error('Error updating mentee data:', error);
        }
    }
};

export default UserManager;