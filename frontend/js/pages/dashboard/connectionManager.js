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
        const requests = JSON.parse(localStorage.getItem('connectionRequests') || '[]');
        const userData = UserManager.getUserData();
        if (userData && userData.role && userData.role.toLowerCase() === 'mentor') {
            const mentorId = userData.id || userData.userId;
            this.pendingConnectionRequests = requests.filter(request => 
                request.mentorId === mentorId && 
                request.status !== 'accepted' && 
                request.status !== 'rejected');
        } else {
            this.pendingConnectionRequests = [];
        }
        this.updateNotifications();
    },
    
    // Handle new connection request
    onNewConnectionRequest(request) {
        let allRequests = JSON.parse(localStorage.getItem('connectionRequests') || '[]');
        
        if (!allRequests.some(req => req.id === request.id)) {
            allRequests.push(request);
            localStorage.setItem('connectionRequests', JSON.stringify(allRequests));
        }
        
        const userData = UserManager.getUserData();
        if (userData?.role?.toLowerCase() === 'mentor') {
            const mentorId = userData.id || userData.userId;
            if (request.mentorId === mentorId && !this.pendingConnectionRequests.some(req => req.id === request.id)) {
                this.pendingConnectionRequests.push(request);
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
        const index = this.pendingConnectionRequests.findIndex(req => req.id === request.id);
        if (index !== -1) {
            this.pendingConnectionRequests.splice(index, 1);
        }
        
        this.updateNotifications();
    },
    
    // Update notification UI
    updateNotifications() {
        NotificationManager.updateNotifications(this.pendingConnectionRequests);
        
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
        if (!requestsContainer) return;
        
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
        if (index === -1) return false;
        
        const request = this.pendingConnectionRequests[index];
        
        const allRequests = JSON.parse(localStorage.getItem('connectionRequests') || '[]');
        const requestIndex = allRequests.findIndex(req => req.id === requestId);
        if (requestIndex !== -1) {
            allRequests[requestIndex].status = 'accepted';
            localStorage.setItem('connectionRequests', JSON.stringify(allRequests));
        }
        
        if (request.source === 'direct_request') {
            const userData = UserManager.getUserData();
            const mentorName = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            const mentorId = userData.id;
            
            if (mentorName) {
                const mentorData = JSON.parse(localStorage.getItem(mentorName) || '{}');
                if (mentorData.requests?.some(req => req.menteeName === request.menteeName && req.status === 'pending')) {
                    const menteeRequestIndex = mentorData.requests.findIndex(req => 
                        req.menteeName === request.menteeName && req.status === 'pending'
                    );
                    
                    mentorData.requests[menteeRequestIndex].status = 'accepted';
                    localStorage.setItem(mentorName, JSON.stringify(mentorData));
                    
                    const updatedUserData = {
                        ...userData,
                        hasMentees: true,
                        mentees: [...(userData.mentees || []), {
                            id: request.menteeId || request.id,
                            name: request.menteeName
                        }]
                    };
                    UserManager.updateUserData(updatedUserData);
                    this.dashboard.hasMentees = true;
                    
                    if (request.menteeName) {
                        UserManager.updateMenteeData(request.menteeName, mentorName, mentorId);
                    }
                    
                    this.pendingConnectionRequests.splice(index, 1);
                    this.updateNotifications();
                    return true;
                }
            }
        }
        
        if (window.connectionService) {
            const success = window.connectionService.respondToConnectionRequest(requestId, true);
            if (!success) return false;
            
            const userData = UserManager.getUserData();
            const mentorName = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            const mentorId = userData.id;
            
            const updatedUserData = {
                ...userData,
                hasMentees: true,
                mentees: [...(userData.mentees || []), {
                    id: request.menteeId || request.id,
                    name: request.menteeName
                }]
            };
            UserManager.updateUserData(updatedUserData);
            this.dashboard.hasMentees = true;
            
            if (request.menteeId && request.menteeName) {
                UserManager.updateMenteeData(request.menteeName, mentorName, mentorId);
            }
            
            this.pendingConnectionRequests.splice(index, 1);
            this.updateNotifications();
            return true;
        }
        
        return false;
    },
    
    // Reject connection request
    rejectConnectionRequest(requestId) {
        const index = this.pendingConnectionRequests.findIndex(req => req.id === requestId);
        if (index === -1) return false;
        
        this.pendingConnectionRequests[index].status = 'rejected';
        
        const allRequests = JSON.parse(localStorage.getItem('connectionRequests') || '[]');
        const requestIndex = allRequests.findIndex(req => req.id === requestId);
        if (requestIndex !== -1) {
            allRequests[requestIndex].status = 'rejected';
            localStorage.setItem('connectionRequests', JSON.stringify(allRequests));
        }
        
        setTimeout(() => {
            this.pendingConnectionRequests.splice(index, 1);
            this.updateNotifications();
        }, 2000);
        
        return true;
    }
};

export default ConnectionManager;