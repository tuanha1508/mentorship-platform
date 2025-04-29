// Connection and mentorship functionality
import UserManager from './userManager.js';
import UIManager from './uiManager.js';
import NotificationManager from './notificationManager.js';

const ConnectionManager = {
    dashboard: null,
    pendingConnectionRequests: [],
    
    init(dashboardInstance) {
        this.dashboard = dashboardInstance;
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
    
    // Handle new connection requests
    onNewConnectionRequest(request) {
        console.log('New connection request received:', request);
        if (!this.pendingConnectionRequests.some(req => req.id === request.id)) {
            this.pendingConnectionRequests.push(request);
            
            // Save the updated requests to localStorage
            try {
                localStorage.setItem('connectionRequests', JSON.stringify(this.pendingConnectionRequests));
                console.log('Connection requests saved to localStorage');
            } catch (error) {
                console.error('Error saving connection requests to localStorage:', error);
            }
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
    
    // Update connection requests count
    updateConnectionRequestsCount() {
        this.updateNotifications();
    },
    
    // Update notification UI
    updateNotifications() {
        // Update notifications using the imported NotificationManager
        NotificationManager.updateNotifications(this.pendingConnectionRequests);
        
        // Also update connection requests count in nav
        const countBadge = document.querySelector('.nav-item[data-page="connection-requests"] .badge');
        if (countBadge) {
            const count = this.pendingConnectionRequests.length;
            countBadge.textContent = count;
            countBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    },
    
    // Render connection requests
    renderConnectionRequests() {
        const requestsContainer = document.querySelector('.connection-requests-page .requests-container');
        if (!requestsContainer) {
            console.error('Connection requests container not found');
            return;
        }
        
        requestsContainer.innerHTML = '';
        
        if (this.pendingConnectionRequests.length === 0) {
            requestsContainer.innerHTML = '<div class="empty-state">No pending connection requests</div>';
            return;
        }
        
        this.pendingConnectionRequests.forEach(request => {
            const requestItem = document.createElement('div');
            requestItem.className = 'connection-request-card';
            requestItem.dataset.requestId = request.id;
            
            const requestTime = new Date(request.timestamp || Date.now());
            const timeString = requestTime.toLocaleString();
            
            requestItem.innerHTML = `
                <div class="connection-card-header">
                    <img src="${request.menteeImage || '../images/profile-placeholder.jpg'}" 
                         alt="${request.menteeName || 'Anonymous'}" class="connection-img">
                    <div class="connection-details">
                        <h4>${request.menteeName || 'Anonymous'}</h4>
                        <div class="connection-time">${timeString}</div>
                    </div>
                </div>
                <div class="connection-message">
                    ${request.message || 'I would like to connect with you as my mentor.'}
                </div>
                <div class="connection-actions">
                    <button class="connection-action-btn accept" data-action="accept">Accept</button>
                    <button class="connection-action-btn decline" data-action="reject">Decline</button>
                </div>
            `;
            
            requestsContainer.appendChild(requestItem);
        });
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
            UIManager.showFeedback('error', 'Request not found');
            return false;
        }
        
        const request = this.pendingConnectionRequests[index];
        
        if (request.source === 'direct_request') {
            const userData = UserManager.getUserData();
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
                            UserManager.updateUserData({
                                hasMentees: true,
                                mentees: [...(userData.mentees || []), {
                                    id: request.menteeId || request.id,
                                    name: request.menteeName
                                }]
                            });
                            this.dashboard.hasMentees = true;
                            
                            // Update mentee data
                            if (request.menteeName) {
                                UserManager.updateMenteeData(request.menteeName, mentorName, mentorId);
                            }
                            
                            this.pendingConnectionRequests.splice(index, 1);
                            this.updateNotifications();
                            UIManager.showFeedback('success', `You accepted ${request.menteeName}'s request`);
                            return true;
                        }
                    }
                } catch (error) {}
            }
        }
        
        if (window.connectionService) {
            const success = window.connectionService.respondToConnectionRequest(requestId, true);
            if (!success) {
                UIManager.showFeedback('error', 'Failed to accept request. Please try again later.');
                return false;
            }
            
            try {
                const userData = UserManager.getUserData();
                const mentorName = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                const mentorId = userData.id;
                
                // Update mentor data
                UserManager.updateUserData({
                    hasMentees: true,
                    mentees: [...(userData.mentees || []), {
                        id: request.menteeId || request.id,
                        name: request.menteeName
                    }]
                });
                this.dashboard.hasMentees = true;
                
                // Update mentee data to show My Mentor
                if (request.menteeId && request.menteeName) {
                    UserManager.updateMenteeData(request.menteeName, mentorName, mentorId);
                }
            } catch (error) {}
            
            this.pendingConnectionRequests.splice(index, 1);
            this.updateNotifications();
            UIManager.showFeedback('success', 'Request accepted');
            return true;
        } else {
            UIManager.showFeedback('error', 'Connection service unavailable');
            return false;
        }
    },
    
    // Reject connection request
    rejectConnectionRequest(requestId) {
        const index = this.pendingConnectionRequests.findIndex(req => req.id === requestId);
        if (index === -1) {
            UIManager.showFeedback('error', 'Request not found');
            return false;
        }
        
        const request = this.pendingConnectionRequests[index];
        
        this.pendingConnectionRequests[index].status = 'rejected';
        
        setTimeout(() => {
            this.pendingConnectionRequests.splice(index, 1);
            this.updateNotifications();
        }, 2000);
        
        UIManager.showFeedback('info', `You declined ${request.menteeName || 'the mentee'}'s request`);
        return true;
    }
};

export default ConnectionManager;