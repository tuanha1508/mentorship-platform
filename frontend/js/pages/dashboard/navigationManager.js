// Navigation and page loading
const NavigationManager = {
    dashboard: null,
    
    init(dashboardInstance) {
        this.dashboard = dashboardInstance;
        this.setupSidebarNav();
    },
    
    // Setup sidebar navigation
    setupSidebarNav() {
        console.log('Setting up sidebar navigation...');
        
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
                    console.log(`Nav item clicked: ${pageName}`);
                    this.loadDashboardPage(pageName);
                }
            });
        });
    },
    
    // Load dashboard page
    loadDashboardPage(pageName) {
        console.log(`Loading dashboard page: ${pageName}`);
        
        const originalPageName = pageName;
        
        if (pageName === 'main-dashboard') {
            const userRole = this.dashboard.userRole?.toLowerCase();
            const roleDashboard = userRole === 'mentor' ? 'mentor-dashboard' : 'mentee-dashboard';
            console.log(`Redirecting main-dashboard to ${roleDashboard}`);
            pageName = roleDashboard;
            this.dashboard.currentPage = pageName;
        }
        
        const dashboardContent = document.getElementById('dashboard-page-content');
        if (dashboardContent) {
            console.log('Clearing dashboard content and showing loading spinner');
            dashboardContent.innerHTML = '<div class="loading-spinner"></div>';
        }
        
        document.querySelectorAll('.dashboard-page, [class$="-page"]').forEach(page => {
            page.classList.remove('active');
        });
        
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
            document.querySelector(`.nav-item[data-page="main-dashboard"]`)?.classList.add('active');
        } else {
            document.querySelector(`.nav-item[data-page="${pageName}"]`)?.classList.add('active');
        }
        
        this.dashboard.currentPage = pageName;
        this.dashboard.lastLoadedPage = pageName;
    },
    
    // Load role-specific dashboard (mentor/mentee)
    loadRoleDashboard(pageName, dashboardContent) {
        console.log(`Loading role dashboard: ${pageName}`);
        
        const roleDashboardPage = document.createElement('div');
        roleDashboardPage.id = `${pageName}-page`;
        roleDashboardPage.className = `dashboard-page ${pageName}-page active`;
        
        dashboardContent.innerHTML = '';
        dashboardContent.appendChild(roleDashboardPage);
        
        console.log(`Fetching content for ${pageName}`);
        fetch(`../pages/dashboard/${pageName}.html`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                roleDashboardPage.innerHTML = html;
                console.log(`${pageName} content loaded successfully`);
                
                this.updateWelcomeMessage();
            })
            .catch(error => {
                console.error(`Failed to load ${pageName} content:`, error);
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
        console.log('Loading profile page');
        
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
                console.log('Profile page content loaded successfully');
                
                import('./profileManager.js').then(module => {
                    const ProfileManager = module.default;
                    ProfileManager.initProfilePage();
                });
            })
            .catch(error => {
                console.error('Failed to load profile page content:', error);
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
        console.log('Loading search mentor page');
        
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
                console.log('Search mentor page content loaded successfully');
                this.initSearchMentorPage();
            })
            .catch(error => {
                console.error('Failed to load search mentor page content:', error);
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
        console.log('Loading connection requests page');
        
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
        console.log('Loading my mentees page');
        
        const menteesPage = document.createElement('div');
        menteesPage.id = 'my-mentees-page';
        menteesPage.className = 'dashboard-page my-mentees-page active';
        
        menteesPage.innerHTML = `
            <h2>My Mentees</h2>
            <div class="mentees-container">
                <div class="loading-spinner"></div>
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
                console.log('My mentees page content loaded successfully');
                this.initMyMenteesPage();
            })
            .catch(error => {
                console.error('Failed to load my mentees page content:', error);
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
        console.log('Loading assignments page');
        
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
                console.log('Assignments page content loaded successfully');
                this.initAssignmentsPage();
            })
            .catch(error => {
                console.error('Failed to load assignments page content:', error);
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
        console.log(`Loading generic page: ${pageName}`);
        
        let targetPage = document.getElementById(`${pageName}-page`);
        if (!targetPage) {
            targetPage = document.querySelector(`.${pageName}-page`);
            console.log(`Found ${pageName} page by class:`, !!targetPage);
        }
        
        if (targetPage) {
            const freshPage = targetPage.cloneNode(true);
            freshPage.classList.add('active');
            
            dashboardContent.innerHTML = '';
            dashboardContent.appendChild(freshPage);
            
            console.log(`Activated ${pageName} page`);
            
            this.initPageContent(pageName);
        } else {
            console.error(`Target page for ${pageName} not found by ID or class`);
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
                console.log('Updating welcome message with user data');
                setTimeout(() => UIManager.updateWelcomeMessage(userData), 100);
            }
        });
    },
    
    // Initialize search mentor page
    initSearchMentorPage() {
        console.log('Initializing search mentor page');
        
        const existingScript = document.querySelector('script[src="../js/pages/discovery/search.js"]');
        if (existingScript) {
            console.log('Removing existing search script');
            existingScript.remove();
        }
        
        console.log('Creating new search script element');
        const script = document.createElement('script');
        script.src = '../js/pages/discovery/search.js';
        
        script.onerror = (error) => {
            console.error('Error loading search script:', error);
            import('./uiManager.js').then(module => {
                const UIManager = module.default;
                UIManager.showFeedback('error', 'Failed to load search functionality. Please try refreshing the page.');
            });
        };
        
        script.onload = () => {
            console.log('Search script loaded successfully');
            setTimeout(() => {
                if (window.UserDiscoveryPage) {
                    console.log('Initializing UserDiscoveryPage');
                    window.UserDiscoveryPage.init();
                } else {
                    console.error('UserDiscoveryPage not found after script load');
                    import('./uiManager.js').then(module => {
                        const UIManager = module.default;
                        UIManager.showFeedback('error', 'Search functionality is unavailable. Please try refreshing the page.');
                    });
                }
            }, 100);
        };
        
        document.body.appendChild(script);
        console.log('Search script added to document');
    },
    
    // Initialize my mentees page
    initMyMenteesPage() {
        console.log('Initializing my mentees page');
    },
    
    // Initialize assignments page
    initAssignmentsPage() {
        console.log('Initializing assignments page');
    },
    
    // Load my mentor page
    loadMyMentorPage(dashboardContent) {
        console.log('Loading my mentor page');
        
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
                console.log('My mentor page loaded successfully');
                
                this.initMyMentorPage();
            })
            .catch(error => {
                console.error('Error loading my mentor page:', error);
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
        console.log('Initializing my mentor page');
        import('./userManager.js').then(userModule => {
            const UserManager = userModule.default;
            const userData = UserManager.getUserData();
            
            if (userData && userData.mentor) {
                const mentorData = userData.mentor;
                
                document.getElementById('mentor-name').textContent = mentorData.name || 'Mentor Name';
                document.getElementById('mentor-title').textContent = mentorData.title || 'Mentor Title';
            } else {
                console.log('No mentor data available for this user');
            }
        });
    },
    
    // Initialize specific page content
    initPageContent(pageName) {
        console.log(`Initializing page content for: ${pageName}`);
        
        if (pageName === 'profile') {
            import('./profileManager.js').then(module => {
                const ProfileManager = module.default;
                ProfileManager.initProfilePage();
            });
        } else if (pageName === 'my-mentees') {
            this.initMyMenteesPage();
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
        } else {
            console.error('UserDiscoveryPage not available for filtering');
        }
    }
};

export default NavigationManager;