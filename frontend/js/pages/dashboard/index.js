// Main Dashboard Controller
import UserManager from './userManager.js';
import UIManager from './uiManager.js';
import NavigationManager from './navigationManager.js';
import ProfileManager from './profileManager.js';
import ConnectionManager from './connectionManager.js';
import NotificationManager from './notificationManager.js';

const Dashboard = {
    userRole: null,
    hasMentor: false,
    hasMentees: false,
    currentPage: 'main-dashboard',
    initialized: false,
    lastLoadedPage: null,
    
    // Initialize dashboard
    init() {
        if (this.initialized) return;
        this.initialized = true;
        
        console.log('Initializing Dashboard...');
        
        // Initialize all managers
        UserManager.init(this);
        UIManager.init(this);
        NavigationManager.init(this);
        ProfileManager.init(this);
        ConnectionManager.init(this);
        NotificationManager.init(this);
        
        // Load user data first as it's critical
        const userData = UserManager.loadUserData();
        
        // Make sure sidebar profile is updated with user data
        if (userData) {
            UIManager.updateSidebarProfile(userData);
        }
        
        this.syncMentorshipStatus();
        
        if (window.connectionService) {
            window.connectionService.setHandlers({
                onNewConnectionRequest: data => ConnectionManager.onNewConnectionRequest(data.request),
                onConnectionResponseConfirmed: data => ConnectionManager.onConnectionResponseConfirmed(data.request),
                onConnectionRequestSent: () => {}
            });
            ConnectionManager.loadConnectionRequestsFromLocalStorage();
        }
        
        // Ensure we can access the user profile data properly before loading the dashboard
        setTimeout(() => {
            console.log('Delayed dashboard page load to ensure data is ready');
            NavigationManager.loadDashboardPage('main-dashboard');
            
            // Make sure welcome message is updated after dashboard loads
            if (this.currentUser) {
                setTimeout(() => UIManager.updateWelcomeMessage(this.currentUser), 300);
            }
        }, 100);
    },
    
    // Sync mentorship status from user data
    syncMentorshipStatus() {
        const userData = UserManager.getUserData();
        if (userData) {
            this.userRole = userData.role || null;
            this.hasMentor = !!userData.hasMentor;
            this.hasMentees = !!(userData.mentees && userData.mentees.length > 0);
        }
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
        ConnectionManager.updateConnectionRequestsCount();
    },
    
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

// Expose Dashboard to window object for backward compatibility with non-module code
window.Dashboard = Dashboard;

export default Dashboard;