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
    
    // Initialize dashboard
    init() {
        if (this.initialized) return;
        this.initialized = true;
        
        this.initEventListeners();
        this.setupSidebarNav();
        this.loadUserData();
        this.syncMentorshipStatus();
        
        if (window.connectionService) {
            window.connectionService.setHandlers({
                onNewConnectionRequest: data => this.onNewConnectionRequest(data.request),
                onConnectionResponseConfirmed: data => this.onConnectionResponseConfirmed(data.request),
                onConnectionRequestSent: () => {}
            });
            this.loadConnectionRequestsFromLocalStorage();
        }
        
        this.loadDashboardPage('main-dashboard');
    },
    
    // Get user data from localStorage
    getUserData() {
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            return userData;
        } catch (error) {
            return {};
        }
    },
    
    // Update user data in localStorage
    updateUserData(updates) {
        try {
            const userData = this.getUserData();
            const updatedData = {...userData, ...updates};
            localStorage.setItem('userData', JSON.stringify(updatedData));
            return updatedData;
        } catch (error) {
            return null;
        }
    },
    
    // Sync mentorship status with connection requests
    syncMentorshipStatus() {
        if (this.userRole !== 'MENTEE' && this.userRole !== 'mentee') return;
        
        try {
            const userData = this.getUserData();
            const userId = userData.id;
            if (!userId) return;
            
            const connectionRequestsJson = localStorage.getItem('connectionRequests');
            if (!connectionRequestsJson) return;
            
            const connectionRequests = JSON.parse(connectionRequestsJson);
            const acceptedRequest = connectionRequests.find(req => 
                req.menteeId === userId && req.status === 'accepted'
            );
            
            if (acceptedRequest) {
                this.updateUserData({
                    hasMentor: true,
                    mentorId: acceptedRequest.mentorId,
                    mentorName: acceptedRequest.mentorName
                });
                
                this.hasMentor = true;
                this.currentUser = this.getUserData();
                this.updateMenuVisibility();
            }
        } catch (error) {}
    },
    
    // Initialize event listeners
    initEventListeners() {
        this.notificationElements = {
            icon: document.getElementById('notification-icon'),
            count: document.getElementById('notification-count'),
            dropdown: document.getElementById('notification-dropdown'),
            body: document.getElementById('notification-body'),
            emptyMessage: document.getElementById('empty-notification')
        };
        
        const { icon, dropdown } = this.notificationElements;
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
                    this.handleConnectionAction(action, requestId);
                }
            }
        });
        
        document.querySelectorAll('.dashboard-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action) {
                    this.handleDashboardAction(action, e.target);
                }
            });
        });
    },
    
    // Handle dashboard actions
    handleDashboardAction(action, element) {
        switch(action) {
            case 'view-profile':
            case 'message':
            default:
                // Implementation for specific actions
        }
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
                            
                            this.updateUserData({
                                hasMentees: true,
                                mentees: [...(userData.mentees || []), {
                                    id: request.menteeId || request.id,
                                    name: request.menteeName
                                }]
                            });
                            
                            // Update mentee data
                            const menteeName = request.menteeName;
                            if (menteeName) {
                                this.updateMenteeData(menteeName, mentorName, userData.id);
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
                this.updateUserData({
                    hasMentees: true,
                    mentees: [...(userData.mentees || []), {
                        id: request.menteeId || request.id,
                        name: request.menteeName
                    }]
                });
                this.hasMentees = true;
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
            const menteeData = JSON.parse(localStorage.getItem(menteeName) || '{}');
            if (menteeData) {
                menteeData.hasMentor = true;
                menteeData.mentorId = mentorId;
                menteeData.mentorName = mentorName;
                localStorage.setItem(menteeName, JSON.stringify(menteeData));
            }
            
            // Update other storage entries
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key === 'userData' || key === 'authToken' || key === 'connectionRequests') continue;
                
                try {
                    const storedData = JSON.parse(localStorage.getItem(key) || '{}');
                    const fullName = storedData.fullName || `${storedData.firstName || ''} ${storedData.lastName || ''}`.trim();
                    
                    if (fullName === menteeName) {
                        storedData.hasMentor = true;
                        storedData.mentorId = mentorId;
                        storedData.mentorName = mentorName;
                        localStorage.setItem(key, JSON.stringify(storedData));
                        break;
                    }
                } catch (e) {}
            }
            
            const menteeUserData = this.getUserData();
            const menteeFullName = menteeUserData.fullName || `${menteeUserData.firstName || ''} ${menteeUserData.lastName || ''}`.trim();
            
            if (menteeFullName === menteeName) {
                this.updateUserData({
                    hasMentor: true,
                    mentorId: mentorId,
                    mentorName: mentorName
                });
            }
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
        
        if (request.source === 'direct_request') {
            const userData = this.getUserData();
            const mentorName = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            
            if (mentorName) {
                try {
                    const mentorData = JSON.parse(localStorage.getItem(mentorName) || '{}');
                    if (mentorData.requests && Array.isArray(mentorData.requests)) {
                        const menteeRequestIndex = mentorData.requests.findIndex(req => 
                            req.menteeName === request.menteeName && req.status === 'pending'
                        );
                        
                        if (menteeRequestIndex !== -1) {
                            mentorData.requests[menteeRequestIndex].status = 'rejected';
                            localStorage.setItem(mentorName, JSON.stringify(mentorData));
                            
                            this.pendingConnectionRequests[index].status = 'rejected';
                            setTimeout(() => {
                                this.pendingConnectionRequests.splice(index, 1);
                                this.updateNotifications();
                            }, 2000);
                            
                            this.showFeedback('info', `You declined ${request.menteeName}'s request`);
                            return true;
                        }
                    }
                } catch (error) {}
            }
        }
        
        if (window.connectionService) {
            const success = window.connectionService.respondToConnectionRequest(requestId, false);
            
            if (success) {
                this.pendingConnectionRequests[index].status = 'rejected';
                
                setTimeout(() => {
                    this.pendingConnectionRequests.splice(index, 1);
                    this.updateNotifications();
                }, 2000);
                
                this.showFeedback('info', 'Request declined');
                return true;
            } else {
                this.showFeedback('error', 'Failed to decline request');
                return false;
            }
        } else {
            this.showFeedback('error', 'Connection service unavailable');
            return false;
        }
    },
    
    // Handle new connection requests
    onNewConnectionRequest(request) {
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
        const index = this.pendingConnectionRequests.findIndex(req => req.id === request.id);
        if (index !== -1) {
            this.pendingConnectionRequests.splice(index, 1);
        }
        
        this.updateNotifications();
    },
    
    // Handle connection request responses
    onConnectionRequestResponse(request) {
        if (request.status === 'accepted') {
            try {
                this.updateUserData({
                    hasMentor: true,
                    mentorId: request.mentorId || request.id,
                    mentorName: request.mentorName || ''
                });
                
                this.currentUser = this.getUserData();
                this.hasMentor = true;
                this.updateMenuVisibility();
                
                if (this.currentPage === 'search-mentor') {
                    this.loadDashboardPage('my-mentor');
                    
                    const myMentorNavItem = document.querySelector('.nav-item[data-page="my-mentor"]');
                    if (myMentorNavItem) {
                        document.querySelectorAll('.nav-item').forEach(item => {
                            item.classList.remove('active');
                        });
                        myMentorNavItem.classList.add('active');
                    }
                }
                
                this.showFeedback('success', 'Connection accepted! Refreshing page...');
                setTimeout(() => window.location.reload(), 1500);
                return;
            } catch (error) {}
        }
        
        const message = request.status === 'accepted' ? 
            'Your mentor has accepted your connection request!' : 
            'Your connection request was not accepted at this time.';
        
        this.showFeedback(request.status === 'accepted' ? 'success' : 'info', message);
    },
    
    // Show feedback message
    showFeedback(type, message) {
        let feedbackEl = document.getElementById('dashboard-feedback');
        if (!feedbackEl) {
            feedbackEl = document.createElement('div');
            feedbackEl.id = 'dashboard-feedback';
            document.body.appendChild(feedbackEl);
        }
        
        feedbackEl.className = `feedback ${type}`;
        feedbackEl.textContent = message;
        feedbackEl.style.display = 'block';
        
        setTimeout(() => feedbackEl.style.display = 'none', 3000);
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
    
    // Load connection requests from localStorage
    loadConnectionRequestsFromLocalStorage() {
        try {
            const userData = this.getUserData();
            if (!userData || !userData.id) return;
            
            this.pendingConnectionRequests = [];
            const processedMenteeRequests = new Map();
            
            let users = [];
            try {
                const usersJson = localStorage.getItem('users');
                users = usersJson ? JSON.parse(usersJson) : [];
            } catch (e) {}
            
            if (window.connectionService && typeof window.connectionService.loadUserConnectionRequests === 'function') {
                const relevantRequests = window.connectionService.loadUserConnectionRequests(userData.id, userData.role);
                
                if (userData.role === 'MENTOR' || userData.role === 'mentor') {
                    const servicePendingRequests = relevantRequests.filter(req => req.status === 'pending') || [];
                    
                    servicePendingRequests.forEach(req => {
                        const mentee = users.find(user => user.id === req.menteeId);
                        if (mentee) {
                            req.menteeName = mentee.fullName;
                            req.menteeImage = mentee.imageUrl;
                        }
                        
                        if (req.menteeId) {
                            processedMenteeRequests.set(req.menteeId, req);
                        }
                    });
                    
                    this.pendingConnectionRequests = [...servicePendingRequests];
                } else {
                    this.pendingConnectionRequests = relevantRequests || [];
                }
            }
            
            if (userData.role === 'MENTOR' || userData.role === 'mentor') {
                const mentorName = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                if (mentorName) {
                    const mentorData = localStorage.getItem(mentorName);
                    if (mentorData) {
                        try {
                            const parsedData = JSON.parse(mentorData);
                            if (parsedData.requests && Array.isArray(parsedData.requests)) {
                                const pendingNamedRequests = parsedData.requests.filter(req => req.status === 'pending');
                                
                                pendingNamedRequests.forEach(req => {
                                    if (req.menteeName && !processedMenteeRequests.has(req.menteeName)) {
                                        const formattedRequest = {
                                            id: `name_req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                                            mentorId: userData.id,
                                            mentorName: mentorName,
                                            menteeId: req.menteeName,
                                            menteeName: req.menteeName,
                                            message: 'I would like to connect with you as my mentor.',
                                            status: 'pending',
                                            timestamp: req.timestamp || new Date().toISOString(),
                                            source: 'direct_request'
                                        };
                                        
                                        processedMenteeRequests.set(req.menteeName, formattedRequest);
                                        this.pendingConnectionRequests.push(formattedRequest);
                                    }
                                });
                            }
                        } catch (parseError) {}
                    }
                }
            }
        } catch (error) {}
    },
    
    // Load user data from localStorage
    loadUserData() {
        try {
            const userData = this.getUserData();
            if (Object.keys(userData).length) {
                this.currentUser = userData;
                this.userRole = this.currentUser.role;
                this.hasMentor = Boolean(this.currentUser.hasMentor);
                this.hasMentees = Boolean(this.currentUser.hasMentees);
                
                this.updateSidebarProfile(this.currentUser);
                this.updateMenuVisibility();
                this.loadConnectionRequestsFromLocalStorage();
                
                if ((this.userRole === 'MENTOR' || this.userRole === 'mentor') && window.connectionService) {
                    window.connectionService.setHandlers({
                        onNewConnectionRequest: (data) => this.onNewConnectionRequest(data.request),
                        onConnectionResponseConfirmed: (data) => this.onConnectionResponseConfirmed(data.request)
                    });
                    
                    window.connectionService.checkPendingRequestsForMentor(this.currentUser.id);
                }
                
                return;
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
            
            localStorage.setItem('userData', JSON.stringify(this.currentUser));
            this.loadConnectionRequestsFromLocalStorage();
        } catch (error) {}
        
        this.updateMenuVisibility();
    },
    
    // Update sidebar profile
    updateSidebarProfile(user) {
        const profileImage = document.getElementById('sidebar-profile-image');
        const userName = document.getElementById('sidebar-user-name');
        const userRole = document.getElementById('sidebar-user-role');
        
        if (profileImage) profileImage.src = user.profileImage;
        if (userName) userName.textContent = `${user.firstName} ${user.lastName}`;
        if (userRole) userRole.textContent = user.role === 'mentor' ? 'Mentor' : 'Mentee';
    },
    
    // Update menu visibility based on role
    updateMenuVisibility() {
        const menteeElements = document.querySelectorAll('.mentee-element');
        const mentorElements = document.querySelectorAll('.mentor-element');
        const mentorAssignedElements = document.querySelectorAll('.mentor-assigned');
        const noMentorElements = document.querySelectorAll('.no-mentor');
        const connectionRequestsItem = document.querySelector('.nav-item[data-page="connection-requests"]');
        const searchMentorItem = document.querySelector('.nav-item[data-page="search-mentor"]');
        const myMentorItem = document.querySelector('.nav-item[data-page="my-mentor"]');
        
        menteeElements.forEach(el => el.style.display = this.userRole === 'mentee' ? '' : 'none');
        mentorElements.forEach(el => el.style.display = this.userRole === 'mentor' ? '' : 'none');
        
        if (this.userRole === 'mentee') {
            mentorAssignedElements.forEach(el => el.style.display = this.hasMentor ? '' : 'none');
            noMentorElements.forEach(el => el.style.display = this.hasMentor ? 'none' : '');
            
            if (connectionRequestsItem) connectionRequestsItem.style.display = 'none';
            if (searchMentorItem) searchMentorItem.style.display = this.hasMentor ? 'none' : '';
            
            if (myMentorItem) {
                myMentorItem.style.display = this.hasMentor ? '' : 'none';
                
                if (this.hasMentor && this.currentPage === 'search-mentor') {
                    this.loadDashboardPage('my-mentor');
                    
                    if (myMentorItem) {
                        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                        myMentorItem.classList.add('active');
                    }
                }
            }
        } else if (this.userRole === 'mentor') {
            if (connectionRequestsItem) {
                connectionRequestsItem.style.display = '';
                this.updateConnectionRequestsCount();
            }
        }
    },
    
    // Set up sidebar navigation
    setupSidebarNav() {
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                const page = item.getAttribute('data-page');
                if (page) {
                    document.querySelectorAll('.nav-item').forEach(navItem => navItem.classList.remove('active'));
                    item.classList.add('active');
                    this.loadDashboardPage(page);
                }
            });
        });
        
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
    },
    
    // Load dashboard page content
    loadDashboardPage(page) {
        if (page === this.lastLoadedPage) return;
        
        this.currentPage = page;
        this.lastLoadedPage = page;
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = this.getPageTitle(page);
        }
        
        const contentContainer = document.getElementById('dashboard-page-content');
        if (!contentContainer) return;
        
        contentContainer.innerHTML = '<div class="loading-spinner"></div>';
        
        fetch(`pages/dashboard/${page}.html`)
            .then(response => {
                if (!response.ok) throw new Error('Page not found');
                return response.text();
            })
            .then(html => {
                contentContainer.innerHTML = html;
                this.initPageContent(page);
            })
            .catch(error => {
                contentContainer.innerHTML = `
                    <div class="error-message">
                        <h3>Error Loading Page</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            });
    },
    
    // Get page title
    getPageTitle(page) {
        const titles = {
            'main-dashboard': 'Dashboard',
            'my-mentor': 'My Mentor',
            'search-mentor': 'Find a Mentor',
            'chat': 'Messages',
            'profile': 'Edit Profile',
            'my-mentees': 'My Mentees',
            'assignments': 'Assignments',
            'connection-requests': 'Connection Requests'
        };
        
        return titles[page] || 'Dashboard';
    },
    
    // Initialize page-specific content
    initPageContent(page) {
        const initFunctions = {
            'main-dashboard': this.initMainDashboard,
            'my-mentor': this.initMyMentorPage,
            'search-mentor': this.initSearchMentorPage,
            'chat': this.initChatPage,
            'profile': this.initProfilePage,
            'my-mentees': this.initMyMenteesPage,
            'assignments': this.initAssignmentsPage,
            'connection-requests': this.initConnectionRequestsPage
        };
        
        if (initFunctions[page]) {
            initFunctions[page].call(this);
        }
    },
    
    // Initialize main dashboard
    initMainDashboard() {},
    
    // Initialize my mentor page
    initMyMentorPage() {
        const scheduleButton = document.getElementById('schedule-meeting');
        if (scheduleButton) {
            scheduleButton.addEventListener('click', () => {
                alert('Schedule meeting functionality will be implemented here');
            });
        }
        
        const messageButton = document.getElementById('send-message');
        if (messageButton) {
            messageButton.addEventListener('click', () => {
                this.loadDashboardPage('chat');
                
                const chatNavItem = document.querySelector('.nav-item[data-page="chat"]');
                if (chatNavItem) {
                    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                    chatNavItem.classList.add('active');
                }
            });
        }
    },
    
    // Initialize search mentor page
    initSearchMentorPage() {
        this.loadSearchScript();
    },
    
    // Load search script
    loadSearchScript() {
        const existingScript = document.querySelector('script[src="../js/pages/discovery/search.js"]');
        if (existingScript) existingScript.remove();
        
        const script = document.createElement('script');
        script.src = '../js/pages/discovery/search.js';
        script.onload = () => {
            setTimeout(() => {
                if (typeof UserDiscoveryPage !== 'undefined') {
                    UserDiscoveryPage.init();
                }
            }, 200);
        };
        
        document.body.appendChild(script);
    },
    
    // Apply filters to search
    applyMentorFilters() {
        if (typeof UserDiscoveryPage !== 'undefined') {
            UserDiscoveryPage.handleSearch();
        }
    },
    
    // Initialize chat page
    initChatPage() {
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.chat-item').forEach(chat => chat.classList.remove('active'));
                item.classList.add('active');
            });
        });
        
        const messageInput = document.querySelector('.message-input');
        const sendButton = document.querySelector('.send-button');
        
        if (messageInput && sendButton) {
            sendButton.addEventListener('click', () => {
                this.sendMessage(messageInput.value);
            });
            
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage(messageInput.value);
                }
            });
        }
    },
    
    // Send chat message
    sendMessage(message) {
        if (!message.trim()) return;
        
        const chatMessages = document.querySelector('.chat-messages');
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message sent';
        
        const now = new Date();
        const time = now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${message}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        document.querySelector('.message-input').value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    },
    
    // Initialize profile page
    initProfilePage() {
        const profileUpload = document.getElementById('profile-upload');
        const uploadTrigger = document.getElementById('upload-trigger');
        const profilePreview = document.getElementById('profile-preview');
        
        if (uploadTrigger && profileUpload && profilePreview) {
            uploadTrigger.addEventListener('click', () => profileUpload.click());
            
            profileUpload.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => profilePreview.src = e.target.result;
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
        }
        
        const skillsInput = document.getElementById('skills-input');
        const skillsContainer = document.getElementById('skills-container');
        
        if (skillsInput && skillsContainer) {
            skillsInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const skill = skillsInput.value.trim();
                    
                    if (skill) {
                        const skillTag = document.createElement('span');
                        skillTag.className = 'skill-tag';
                        skillTag.innerHTML = `${skill} <i class="fas fa-times remove-skill"></i>`;
                        
                        skillTag.querySelector('.remove-skill').addEventListener('click', () => 
                            skillTag.remove()
                        );
                        
                        skillsContainer.appendChild(skillTag);
                        skillsInput.value = '';
                    }
                }
            });
            
            document.querySelectorAll('.remove-skill').forEach(removeIcon => {
                removeIcon.addEventListener('click', () => removeIcon.parentElement.remove());
            });
        }
        
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Profile updated successfully!');
            });
        }
    },
    
    // Update connection requests count
    updateConnectionRequestsCount() {
        const requestCount = this.pendingConnectionRequests?.length || 0;
        const countBadge = document.querySelector('.nav-item[data-page="connection-requests"] .badge');
        if (countBadge) {
            countBadge.textContent = requestCount;
            countBadge.style.display = requestCount > 0 ? 'inline-block' : 'none';
        }
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