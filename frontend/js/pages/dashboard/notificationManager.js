// Notification management
const NotificationManager = {
    dashboard: null,
    notificationElements: {
        icon: null, 
        count: null, 
        dropdown: null, 
        body: null, 
        emptyMessage: null
    },
    
    init(dashboardInstance) {
        this.dashboard = dashboardInstance;
    },
    
    // Set notification DOM elements
    setNotificationElements(elements) {
        this.notificationElements = elements;
    },
    
    // Update notifications with pending connection requests
    updateNotifications(pendingRequests) {
        const { count, body, emptyMessage } = this.notificationElements;
        if (!count || !body) return;
        
        const requestCount = pendingRequests ? pendingRequests.length : 0;
        count.textContent = requestCount;
        count.style.display = requestCount ? 'flex' : 'none';
        
        if (requestCount > 0 && this.dashboard && (this.dashboard.userRole === 'MENTOR' || this.dashboard.userRole === 'mentor')) {
            if (Notification && Notification.permission === "granted") {
                const notificationsShown = localStorage.getItem('mentorRequestsNotificationShown');
                if (!notificationsShown) {
                    new Notification('New Mentee Requests', {
                        body: `You have ${requestCount} pending mentee connection ${requestCount === 1 ? 'request' : 'requests'}`,
                        icon: 'images/notification-icon.png'
                    });
                    localStorage.setItem('mentorRequestsNotificationShown', 'true');
                }
            } else if (Notification && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
        
        this.renderNotificationItems(pendingRequests);
    },
    
    // Render notification items in dropdown
    renderNotificationItems(pendingRequests) {
        const { body, emptyMessage, dropdown } = this.notificationElements;
        if (!body || !emptyMessage) return;
        
        body.innerHTML = '';
        body.appendChild(emptyMessage);
        
        if (!pendingRequests?.length) {
            emptyMessage.style.display = 'block';
            return;
        }
        
        emptyMessage.style.display = 'none';
        const menteeRequests = new Map();
        
        pendingRequests.forEach(request => {
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
            
            if (dropdown) {
                dropdown.style.display = 'block';
            }
        }
    }
};

export default NotificationManager;