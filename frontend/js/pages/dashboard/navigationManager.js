// Navigation and page loading
const NavigationManager = {
    dashboard: null,
    
    init(dashboardInstance) {
        this.dashboard = dashboardInstance;
        this.setupSidebarNav();
        
        // Set up hash change listener to handle page navigation
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            if (hash && hash !== 'undefined') {
                console.log('Hash changed to:', hash);
                this.loadDashboardPage(hash);
            }
        });
        
        // Load the initial page based on hash
        const initialHash = window.location.hash.substring(1);
        if (initialHash && initialHash !== 'undefined') {
            console.log('Initial hash detected:', initialHash);
            this.loadDashboardPage(initialHash);
        } else {
            // If no hash is present, use role-specific dashboard
            const defaultPage = this.dashboard.userRole?.toLowerCase() === 'mentor' ? 'mentor-dashboard' : 'mentee-dashboard';
            console.log('No hash, loading default page:', defaultPage);
            window.location.hash = defaultPage;
        }
    },
    
    // Setup sidebar navigation
    setupSidebarNav() {
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        navItems.forEach(item => {
            const clone = item.cloneNode(true);
            if (item.parentNode) {
                item.parentNode.replaceChild(clone, item);
            }
        });
        
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                const pageName = item.getAttribute('data-page');
                if (pageName) {
                    this.loadDashboardPage(pageName);
                }
            });
        });
    },
    
    // Load dashboard page
    loadDashboardPage(pageName) {
        console.log('Loading dashboard page:', pageName);
        const originalPageName = pageName;
        
        // Handle modal pages specially
        if (pageName === 'delete-modal' || pageName?.endsWith('-modal')) {
            console.log('Modal detected, not loading as a page:', pageName);
            // For modals, we don't need to load a page, just update the navigation
            this.updateActiveNavItem(pageName);
            return;
        }
        
        if (pageName === 'main-dashboard') {
            const userRole = this.dashboard.userRole?.toLowerCase();
            const roleDashboard = userRole === 'mentor' ? 'mentor-dashboard' : 'mentee-dashboard';
            pageName = roleDashboard;
            this.dashboard.currentPage = pageName;
        }
        
        // Update page title in header
        this.updatePageTitle(pageName);
        
        // Get the dashboard content container
        const dashboardContent = document.getElementById('dashboard-page-content');
        if (!dashboardContent) {
            console.error('Dashboard content container not found');
            return;
        }
        
        // Clear any existing content to prevent duplicates
        dashboardContent.innerHTML = '';
        
        // Add loading spinner
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        dashboardContent.appendChild(loadingSpinner);
        
        // Remove active class from all pages
        document.querySelectorAll('.dashboard-page, [class$="-page"]').forEach(page => {
            page.classList.remove('active');
        });
        
        // Update navigation menu - highlight the correct item
        this.updateActiveNavItem(originalPageName === 'main-dashboard' ? originalPageName : pageName);
        
        if (pageName === 'mentor-dashboard' || pageName === 'mentee-dashboard') {
            this.loadRoleDashboard(pageName, dashboardContent);
        } else if (pageName === 'profile') {
            this.loadProfilePage(dashboardContent);
        } else if (pageName === 'search-mentor') {
            this.loadSearchMentorPage(dashboardContent);
        } else if (pageName === 'connection-requests') {
            this.loadConnectionRequestsPage(dashboardContent);
        } else if (pageName === 'my-mentees') {
            this.loadMyMenteesPage(dashboardContent);
        } else if (pageName === 'assignments') {
            this.loadAssignmentsPage(dashboardContent);
        } else if (pageName === 'my-mentor') {
            this.loadMyMentorPage(dashboardContent);
        } else {
            this.loadGenericPage(pageName, dashboardContent);
        }
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (originalPageName === 'main-dashboard') {
            // Get the user role to determine which dashboard nav item to activate
            const userRole = this.dashboard.userRole?.toLowerCase();
            
            if (userRole === 'mentor') {
                document.querySelector(`.mentor-element .nav-item[data-page="main-dashboard"]`)?.classList.add('active');
            } else if (userRole === 'mentee') {
                document.querySelector(`.mentee-element .nav-item[data-page="main-dashboard"]`)?.classList.add('active');
            } else {
                document.querySelector(`.nav-item[data-page="main-dashboard"]`)?.classList.add('active');
            }
        } else {
            document.querySelector(`.nav-item[data-page="${pageName}"]`)?.classList.add('active');
        }
        
        this.dashboard.currentPage = pageName;
        this.dashboard.lastLoadedPage = pageName;
        
        // Save current page to localStorage
        localStorage.setItem('currentDashboardPage', pageName);
        
        // Update URL hash to match current page (without triggering another navigation)
        const currentHash = window.location.hash.substring(1);
        if (currentHash !== pageName) {
            history.pushState(null, '', `#${pageName}`);
        }
        
        // Update the active navigation item
        this.updateActiveNavItem(pageName);
    },
    
    // Load role-specific dashboard (mentor/mentee)
    loadRoleDashboard(pageName, dashboardContent) {
        console.log('Loading role dashboard:', pageName);
        
        // First, ensure the dashboard content is clear
        dashboardContent.innerHTML = '';
        
        // Create container for the dashboard page
        const roleDashboardPage = document.createElement('div');
        roleDashboardPage.id = `${pageName}-page`;
        roleDashboardPage.className = `dashboard-page ${pageName}-page active`;
        dashboardContent.appendChild(roleDashboardPage);
        
        // Add temporary loading spinner
        roleDashboardPage.innerHTML = '<div class="loading-spinner"></div>';
        
        // Fetch the page content
        fetch(`../pages/dashboard/${pageName}.html`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // Replace the content
                roleDashboardPage.innerHTML = html;
                this.updateWelcomeMessage();
            })
            .catch(error => {
                roleDashboardPage.innerHTML = `
                    <div class="error-message">
                        Failed to load dashboard content: ${error.message}
                        <button class="retry-btn" onclick="window.Dashboard.NavigationManager.loadDashboardPage('${pageName}')">
                            Retry
                        </button>
                    </div>`;
            });
    },
    
    // Load profile page
    loadProfilePage(dashboardContent) {
        const profilePage = document.createElement('div');
        profilePage.id = 'profile-page';
        profilePage.className = 'dashboard-page profile-page active';
        
        dashboardContent.innerHTML = '';
        dashboardContent.appendChild(profilePage);
        
        fetch('../pages/dashboard/profile.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                profilePage.innerHTML = html;
                
                import('./profileManager.js').then(module => {
                    const ProfileManager = module.default;
                    ProfileManager.initProfilePage();
                });
            })
            .catch(error => {
                profilePage.innerHTML = `
                    <div class="error-message">
                        Failed to load profile content: ${error.message}
                        <button class="retry-btn" onclick="window.Dashboard.NavigationManager.loadDashboardPage('profile')">
                            Retry
                        </button>
                    </div>`;
            });
    },
    
    // Load search mentor page
    loadSearchMentorPage(dashboardContent) {
        const searchMentorPage = document.createElement('div');
        searchMentorPage.id = 'search-mentor-page';
        searchMentorPage.className = 'dashboard-page search-mentor-page active';
        
        dashboardContent.innerHTML = '';
        dashboardContent.appendChild(searchMentorPage);
        
        fetch('../pages/dashboard/search-mentor.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                searchMentorPage.innerHTML = html;
                this.initSearchMentorPage();
            })
            .catch(error => {
                searchMentorPage.innerHTML = `
                    <div class="error-message">
                        Failed to load search mentor content: ${error.message}
                        <button class="retry-btn" onclick="window.Dashboard.NavigationManager.loadDashboardPage('search-mentor')">
                            Retry
                        </button>
                    </div>`;
            });
    },
    
    // Load connection requests page
    loadConnectionRequestsPage(dashboardContent) {
        const requestsPage = document.createElement('div');
        requestsPage.id = 'connection-requests-page';
        requestsPage.className = 'dashboard-page connection-requests-page active';
        
        requestsPage.innerHTML = `
            <h2>Connection Requests</h2>
            <div class="requests-container">
                <div class="loading-spinner"></div>
            </div>
        `;
        
        dashboardContent.innerHTML = '';
        dashboardContent.appendChild(requestsPage);
        
        import('./connectionManager.js').then(module => {
            const ConnectionManager = module.default;
            ConnectionManager.renderConnectionRequests();
        });
    },
    
    // Load my mentees page
    loadMyMenteesPage(dashboardContent) {
        // Create a container for the mentees page
        const menteesPage = document.createElement('div');
        menteesPage.className = 'dashboard-section mentees-page';
        menteesPage.innerHTML = `
            <div class="section-header">
                <h2><i class="fas fa-users"></i> My Mentees</h2>
                <p>View and manage your mentorship relationships.</p>
            </div>
        `;
        
        dashboardContent.innerHTML = '';
        dashboardContent.appendChild(menteesPage);
        
        fetch('../pages/dashboard/my-mentees.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                menteesPage.innerHTML = html;
                this.initMyMenteesPage();
            })
            .catch(error => {
                menteesPage.innerHTML = `
                    <div class="error-message">
                        Failed to load mentees content: ${error.message}
                        <button class="retry-btn" onclick="window.Dashboard.NavigationManager.loadDashboardPage('my-mentees')">
                            Retry
                        </button>
                    </div>`;
            });
    },
    
    // Load assignments page
    loadAssignmentsPage(dashboardContent) {
        const assignmentsPage = document.createElement('div');
        assignmentsPage.id = 'assignments-page';
        assignmentsPage.className = 'dashboard-page assignments-page active';
        
        assignmentsPage.innerHTML = `
            <h2>Assignments</h2>
            <div class="assignments-container">
                <div class="loading-spinner"></div>
            </div>
        `;
        
        dashboardContent.innerHTML = '';
        dashboardContent.appendChild(assignmentsPage);
        
        fetch('../pages/dashboard/assignments.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                assignmentsPage.innerHTML = html;
                this.initAssignmentsPage();
            })
            .catch(error => {
                assignmentsPage.innerHTML = `
                    <div class="error-message">
                        Failed to load assignments content: ${error.message}
                        <button class="retry-btn" onclick="window.Dashboard.NavigationManager.loadDashboardPage('assignments')">
                            Retry
                        </button>
                    </div>`;
            });
    },
    
    // Load generic page (for other page types)
    loadGenericPage(pageName, dashboardContent) {
        // Skip loading for modal pages to prevent "Page not found" errors
        if (pageName === 'delete-modal' || pageName?.endsWith('-modal')) {
            // Modals should be handled by their own code, not through page loading
            dashboardContent.innerHTML = '';
            return;
        }
        
        let targetPage = document.getElementById(`${pageName}-page`);
        if (!targetPage) {
            targetPage = document.querySelector(`.${pageName}-page`);
        }
        
        if (targetPage) {
            const freshPage = targetPage.cloneNode(true);
            freshPage.classList.add('active');
            
            dashboardContent.innerHTML = '';
            dashboardContent.appendChild(freshPage);
            
            this.initPageContent(pageName);
        } else {
            dashboardContent.innerHTML = `
                <div class="error-message">
                    Page "${pageName}" not found.
                    <button class="retry-btn" onclick="window.Dashboard.NavigationManager.loadDashboardPage('main-dashboard')">
                        Return to Dashboard
                    </button>
                </div>`;
        }
    },
    
    // Update welcome message
    updateWelcomeMessage() {
        Promise.all([
            import('./userManager.js'),
            import('./uiManager.js')
        ]).then(([userModule, uiModule]) => {
            const UserManager = userModule.default;
            const UIManager = uiModule.default;
            
            const userData = UserManager.getUserData();
            if (userData) {
                setTimeout(() => UIManager.updateWelcomeMessage(userData), 100);
            }
        });
    },
    
    // Initialize search mentor page
    initSearchMentorPage() {
        const existingScript = document.querySelector('script[src="../js/pages/discovery/search.js"]');
        if (existingScript) {
            existingScript.remove();
        }
        
        const script = document.createElement('script');
        script.src = '../js/pages/discovery/search.js';
        
        script.onerror = (error) => {
            import('./uiManager.js').then(module => {
                const UIManager = module.default;
                UIManager.showFeedback('error', 'Failed to load search functionality. Please try refreshing the page.');
            });
        };
        
        script.onload = () => {
            setTimeout(() => {
                if (window.UserDiscoveryPage) {
                    window.UserDiscoveryPage.init();
                } else {
                    import('./uiManager.js').then(module => {
                        const UIManager = module.default;
                        UIManager.showFeedback('error', 'Search functionality is unavailable. Please try refreshing the page.');
                    });
                }
            }, 100);
        };
        
        document.body.appendChild(script);
    },
    
    // Update page title in header based on current page
    updatePageTitle(pageName) {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            // Convert page name to a more readable format
            let title;
            switch(pageName) {
                case 'main-dashboard':
                    title = 'Dashboard';
                    break;
                case 'mentor-dashboard':
                    title = 'Mentor Dashboard';
                    break;
                case 'mentee-dashboard':
                    title = 'Mentee Dashboard';
                    break;
                case 'search-mentor':
                    title = 'Find Your Mentor';
                    break;
                case 'my-mentor':
                    title = 'My Mentor';
                    break;
                case 'my-mentees':
                    title = 'My Mentees';
                    break;
                case 'profile':
                    title = 'Profile';
                    break;
                case 'assignments':
                    title = 'Assignments';
                    break;
                case 'connection-requests':
                    title = 'Connection Requests';
                    break;
                default:
                    // Capitalize and add spaces between words for better readability
                    title = pageName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            pageTitle.textContent = title;
        }
    },
    
    // Initialize my mentees page with direct implementation
    initMyMenteesPage() {
        // Get user data
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userId = userData.id;
        
        if (!userId) {
            return;
        }
        
        // Use fixed avatar URLs for guaranteed image loading
        const fixedAvatars = [
            'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
        ];
        
        // Simulate fetching mentees (replace with actual API call in production)
        setTimeout(() => {
            // Create mock mentee data with fixed avatars
            const mockMentees = this.createMockMentees(fixedAvatars);
            
            // Display mentees or show no mentees message
            if (mockMentees && mockMentees.length > 0) {
                this.displayMentees(mockMentees);
            } else {
                document.querySelector('.no-mentees-message').style.display = 'flex';
                document.getElementById('mentees-dashboard').style.display = 'none';
            }
        }, 500);
    },
    
    // Create mock mentee data for testing
    createMockMentees(avatars = []) {
        // Fixed, guaranteed available fallback images
        const defaultAvatars = [
            'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
        ];
        
        return [
            {
                id: '1',
                name: 'Alex Johnson',
                profileImage: avatars[0] || defaultAvatars[0],
                goal: 'Frontend Development',
                progress: 45,
                skills: ['HTML', 'CSS', 'JavaScript'],
                interests: ['Web Design', 'UX/UI', 'Mobile Development'],
                email: 'alex.j@example.com',
                bio: 'Passionate about creating beautiful and functional interfaces.',
                startDate: '2023-03-15',
                nextMeeting: '2023-06-10T15:00:00'
            },
            {
                id: '2',
                name: 'Sarah Miller',
                profileImage: avatars[1] || defaultAvatars[1],
                goal: 'Full Stack Development',
                progress: 65,
                skills: ['JavaScript', 'React', 'Node.js'],
                interests: ['Web Development', 'Database Design', 'APIs'],
                email: 'sarah.m@example.com',
                bio: 'Looking to become a full stack developer with focus on MERN stack.',
                startDate: '2023-02-20',
                nextMeeting: '2023-06-12T13:30:00'
            },
            {
                id: '3',
                name: 'Michael Chen',
                profileImage: avatars[2] || defaultAvatars[2],
                goal: 'Data Science',
                progress: 30,
                skills: ['Python', 'SQL', 'Statistics'],
                interests: ['Machine Learning', 'Data Visualization', 'Big Data'],
                email: 'michael.c@example.com',
                bio: 'Aspiring data scientist with background in mathematics.',
                startDate: '2023-04-05',
                nextMeeting: '2023-06-08T10:00:00'
            }
        ];
    },
    
    // Display mentees in the UI
    displayMentees(mentees) {
        document.querySelector('.no-mentees-message').style.display = 'none';
        document.getElementById('mentees-dashboard').style.display = 'flex';
        
        const menteesList = document.getElementById('mentees-list');
        menteesList.innerHTML = '';
        
        // Create list items for each mentee
        mentees.forEach(mentee => {
            const menteeItem = document.createElement('li');
            menteeItem.className = 'mentee-item';
            menteeItem.dataset.menteeId = mentee.id;
            
            // Calculate next meeting display text
            let nextMeetingText = 'No meeting scheduled';
            if (mentee.nextMeeting) {
                const meetingDate = new Date(mentee.nextMeeting);
                const now = new Date();
                
                // Format date and time for display
                const dateOptions = { month: 'short', day: 'numeric' };
                const timeOptions = { hour: '2-digit', minute: '2-digit' };
                const dateStr = meetingDate.toLocaleDateString(undefined, dateOptions);
                const timeStr = meetingDate.toLocaleTimeString(undefined, timeOptions);
                
                nextMeetingText = `${dateStr} at ${timeStr}`;
            }
            
            menteeItem.innerHTML = `
                <div class="mentee-preview-image">
                    <img src="${mentee.profileImage}" alt="${mentee.name}">
                </div>
                <div class="mentee-preview-info">
                    <h3>${mentee.name}</h3>
                    <p class="mentee-goal">${mentee.goal || 'No goal specified'}</p>
                    <div class="mentee-progress">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${mentee.progress || 0}%"></div>
                        </div>
                        <span>${mentee.progress || 0}%</span>
                    </div>
                    <p class="next-meeting">
                        <i class="fas fa-calendar-alt"></i> ${nextMeetingText}
                    </p>
                </div>
            `;
            
            // Add click event to show mentee details
            menteeItem.addEventListener('click', () => {
                // Remove selected class from all mentee items
                document.querySelectorAll('.mentee-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Add selected class to the clicked item
                menteeItem.classList.add('selected');
                
                // Show detailed information for the selected mentee
                this.showMenteeDetails(mentee);
            });
            
            menteesList.appendChild(menteeItem);
        });
        
        // Automatically select the first mentee if available
        if (mentees.length > 0) {
            const firstMenteeItem = menteesList.querySelector('.mentee-item');
            if (firstMenteeItem) {
                firstMenteeItem.classList.add('selected');
                this.showMenteeDetails(mentees[0]);
            }
        }
    },
    
    // Show detailed information about a selected mentee
    showMenteeDetails(mentee) {
        const detailsPlaceholder = document.querySelector('.mentee-details-placeholder');
        const detailsContent = document.getElementById('mentee-details-content');
        
        // Hide placeholder and show details content
        if (detailsPlaceholder) detailsPlaceholder.style.display = 'none';
        if (detailsContent) detailsContent.style.display = 'block';
        
        // Generate HTML for skills tags
        let skillsHtml = '';
        if (mentee.skills && mentee.skills.length > 0) {
            skillsHtml = mentee.skills.map(skill => `<span class="tag">${skill}</span>`).join('');
        }
        
        // Generate HTML for interests tags
        let interestsHtml = '';
        if (mentee.interests && mentee.interests.length > 0) {
            interestsHtml = mentee.interests.map(interest => `<span class="tag">${interest}</span>`).join('');
        }
        
        // Format next meeting date/time
        let nextMeetingDisplay = 'Not scheduled';
        if (mentee.nextMeeting) {
            const nextMeeting = new Date(mentee.nextMeeting);
            const dateOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
            const timeOptions = { hour: '2-digit', minute: '2-digit' };
            
            nextMeetingDisplay = `${nextMeeting.toLocaleDateString(undefined, dateOptions)} at ${nextMeeting.toLocaleTimeString(undefined, timeOptions)}`;
        }
        
        // Calculate mentorship duration
        let durationText = 'Not started';
        if (mentee.startDate) {
            const startDate = new Date(mentee.startDate);
            const now = new Date();
            const diffTime = Math.abs(now - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 30) {
                durationText = `${diffDays} days`;
            } else {
                const diffMonths = Math.floor(diffDays / 30);
                durationText = `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
            }
        }
        
        // Update the details content
        detailsContent.innerHTML = `
            <div class="mentee-profile-header">
                <div class="mentee-profile-image">
                    <img src="${mentee.profileImage}" alt="${mentee.name}">
                </div>
                <div class="mentee-profile-info">
                    <h2>${mentee.name}</h2>
                    <p class="mentee-email"><i class="fas fa-envelope"></i> ${mentee.email || 'No email provided'}</p>
                    <div class="mentee-goal-display">
                        <span>Goal:</span> ${mentee.goal || 'No goal specified'}
                    </div>
                </div>
            </div>
            
            <div class="mentee-progress-section">
                <h3>Progress</h3>
                <div class="progress-bar">
                    <div class="progress" style="width: ${mentee.progress || 0}%; --progress-width: ${mentee.progress || 0}%"></div>
                </div>
                <p>${mentee.progress || 0}% Complete</p>
            </div>
            
            <div class="mentee-details-grid">
                <div class="mentee-detail-card">
                    <h3><i class="fas fa-info-circle"></i> Bio</h3>
                    <p>${mentee.bio || 'No bio provided'}</p>
                </div>
                
                <div class="mentee-detail-card">
                    <h3><i class="fas fa-calendar-alt"></i> Mentorship</h3>
                    <div class="mentee-detail-row">
                        <span>Started:</span> 
                        <span>${mentee.startDate ? new Date(mentee.startDate).toLocaleDateString() : 'Not started'}</span>
                    </div>
                    <div class="mentee-detail-row">
                        <span>Duration:</span> 
                        <span>${durationText}</span>
                    </div>
                    <div class="mentee-detail-row">
                        <span>Next Meeting:</span> 
                        <span>${nextMeetingDisplay}</span>
                    </div>
                </div>
                
                <div class="mentee-detail-card skills-section">
                    <h3><i class="fas fa-cogs"></i> Skills</h3>
                    <div class="tags-container">
                        ${skillsHtml || '<p>No skills listed</p>'}
                    </div>
                </div>
                
                <div class="mentee-detail-card interests-section">
                    <h3><i class="fas fa-star"></i> Interests</h3>
                    <div class="tags-container">
                        ${interestsHtml || '<p>No interests listed</p>'}
                    </div>
                </div>
            </div>
            
            <div class="mentee-actions">
                <button class="btn btn-primary" onclick="NavigationManager.scheduleMeeting('${mentee.id}')"><i class="fas fa-calendar-plus"></i> Schedule Meeting</button>
                <button class="btn btn-secondary" onclick="NavigationManager.startChat('${mentee.id}')"><i class="fas fa-comments"></i> Start Chat</button>
            </div>
        `;
    },
    
    // Helper functions for mentee actions
    scheduleMeeting(menteeId) {
        alert('Meeting scheduling will be implemented soon!');
    },
    
    startChat(menteeId) {
        window.location.hash = '#chat';
        localStorage.setItem('activeChat', menteeId);
    },
    
    // Initialize assignments page
    initAssignmentsPage() {
        // Implementation will be added later
    },
    
    // Load my mentor page
    loadMyMentorPage(dashboardContent) {
        dashboardContent.innerHTML = '<div class="loading-spinner"></div>';
        
        fetch('../pages/dashboard/my-mentor.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                dashboardContent.innerHTML = html;
                this.initMyMentorPage();
            })
            .catch(error => {
                dashboardContent.innerHTML = `
                    <div class="error-message">
                        Failed to load My Mentor page. Please try again.
                        <button class="retry-btn" onclick="window.Dashboard.NavigationManager.loadDashboardPage('main-dashboard')">
                            Return to Dashboard
                        </button>
                    </div>`;
            });
    },
    
    // Initialize my mentor page
    initMyMentorPage() {
        import('./userManager.js').then(userModule => {
            const UserManager = userModule.default;
            const userData = UserManager.getUserData();
            
            if (userData && userData.mentor) {
                const mentorData = userData.mentor;
                
                document.getElementById('mentor-name').textContent = mentorData.name || 'Mentor Name';
                document.getElementById('mentor-title').textContent = mentorData.title || 'Mentor Title';
            }
        });
    },
    
    // Initialize specific page content
    initPageContent(pageName) {
        if (pageName === 'profile') {
            import('./profileManager.js').then(module => {
                const ProfileManager = module.default;
                ProfileManager.initProfilePage();
            });
        } else if (pageName === 'my-mentees') {
            if (typeof window.Dashboard.initMyMenteesPage === 'function') {
                window.Dashboard.initMyMenteesPage();
            } else {
                this.initMyMenteesPage();
            }
        } else if (pageName === 'my-mentor') {
            this.initMyMentorPage();
        } else if (pageName === 'assignments') {
            this.initAssignmentsPage();
        } else if (pageName === 'connection-requests') {
            import('./connectionManager.js').then(module => {
                const ConnectionManager = module.default;
                ConnectionManager.renderConnectionRequests();
            });
        }
        
        this.updateWelcomeMessage();
    },
    
    // Apply filters to search
    applyMentorFilters() {
        if (window.UserDiscoveryPage) {
            window.UserDiscoveryPage.handleSearch();
        }
    },
    
    // Update active navigation item in sidebar
    updateActiveNavItem(pageName) {
        console.log('Updating active nav item for page:', pageName);
        
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Skip updating active nav item for modal pages
        if (pageName === 'delete-modal' || pageName?.endsWith('-modal')) {
            // Modal dialogs don't need navigation highlighting
            return;
        }
        
        // Special handling for main-dashboard to handle role-specific dashboard items
        if (pageName === 'main-dashboard' || pageName === 'mentor-dashboard' || pageName === 'mentee-dashboard') {
            // Get the user role to determine which dashboard nav item to activate
            const userRole = this.dashboard.userRole?.toLowerCase();
            
            // Find the correct dashboard link based on role
            let dashboardSelector = '.nav-item[data-page="main-dashboard"]';
            if (userRole === 'mentor') {
                dashboardSelector = '.mentor-element .nav-item[data-page="main-dashboard"]';
            } else if (userRole === 'mentee') {
                dashboardSelector = '.mentee-element .nav-item[data-page="main-dashboard"]';
            }
            
            // Add active class to the dashboard link
            const dashboardLink = document.querySelector(dashboardSelector);
            if (dashboardLink) {
                dashboardLink.classList.add('active');
            }
        } else {
            // For other pages, simply find by data-page attribute
            const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
            if (navItem) {
                navItem.classList.add('active');
            } else {
                console.warn(`No navigation item found for page: ${pageName}`);
            }
        }
    }
};

export default NavigationManager;