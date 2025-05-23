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
        
        UserManager.init(this);
        UIManager.init(this);
        ProfileManager.init(this);
        ConnectionManager.init(this);
        NotificationManager.init(this);
        
        const userData = UserManager.loadUserData();
        
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
        
        // We'll now use a purely hash-based navigation system
        // Initialize NavigationManager which will handle loading the appropriate page
        // based on the URL hash or the user's role
        NavigationManager.init(this);
        
        // No need to manually load a page here - NavigationManager will handle it
        
        if (this.currentUser) {
            UIManager.updateWelcomeMessage(this.currentUser);
        }
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
        const mentorOnlyItems = document.querySelectorAll('.nav-item[data-role="mentor"]');
        const menteeOnlyItems = document.querySelectorAll('.nav-item[data-role="mentee"]');
        
        if (this.userRole === 'MENTOR' || this.userRole === 'mentor') {
            mentorOnlyItems.forEach(item => item.style.display = 'flex');
            menteeOnlyItems.forEach(item => item.style.display = 'none');
        } else if (this.userRole === 'MENTEE' || this.userRole === 'mentee') {
            mentorOnlyItems.forEach(item => item.style.display = 'none');
            menteeOnlyItems.forEach(item => item.style.display = 'flex');
        } else {
            mentorOnlyItems.forEach(item => item.style.display = 'flex');
            menteeOnlyItems.forEach(item => item.style.display = 'flex');
        }
        
        ConnectionManager.updateNotifications();
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

// Expose Dashboard and its components to the global scope
window.Dashboard = Dashboard;

// Expose NavigationManager to Dashboard for external access
Promise.all([
    import('./navigationManager.js')
]).then(([navModule]) => {
    Dashboard.NavigationManager = navModule.default;
    window.Dashboard.NavigationManager = navModule.default;
    console.log('NavigationManager exposed to window.Dashboard');
});

export default Dashboard;