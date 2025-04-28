// Connection Service using localStorage
window.connectionService = (function() {
  let handlers = {};
  
  // Service API
  return {
    sendConnectionRequest,
    respondToConnectionRequest,
    setHandlers: h => { Object.assign(handlers, h); },
    checkPendingRequestsForMentor,
    loadUserConnectionRequests
  };

  // Send connection request
  function sendConnectionRequest(menteeId, mentorId) {
    if (!menteeId || !mentorId) return false;
    
    try {
      let requests = [];
      const stored = localStorage.getItem('connectionRequests');
      
      if (stored) {
        requests = JSON.parse(stored);
        // Check for pending or accepted requests only
        const existing = requests.find(req => 
          req.menteeId === menteeId && 
          req.mentorId === mentorId && 
          req.status === 'pending'
        );
        
        if (existing && handlers.onConnectionRequestSent) {
          handlers.onConnectionRequestSent({success: true, request: existing});
          return true;
        }
        
        // Remove any rejected requests to allow creating a new one
        const requestIndex = requests.findIndex(req => 
          req.menteeId === menteeId && 
          req.mentorId === mentorId
        );
        
        if (requestIndex !== -1) {
          if (requests[requestIndex].status === 'rejected') {
            // Remove the rejected request to allow creating a new one
            requests.splice(requestIndex, 1);
          } else if (requests[requestIndex].status === 'accepted') {
            // Already connected, just return
            if (handlers.onConnectionRequestSent) {
              handlers.onConnectionRequestSent({success: true, request: requests[requestIndex]});
            }
            return true;
          }
        }
      }
      
      // Create new request
      const newRequest = {
        id: `req_${Date.now()}`,
        menteeId,
        mentorId,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      
      requests.push(newRequest);
      localStorage.setItem('connectionRequests', JSON.stringify(requests));
      
      if (handlers.onConnectionRequestSent) {
        handlers.onConnectionRequestSent({success: true, request: newRequest});
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Respond to connection request
  function respondToConnectionRequest(requestId, accept) {
    try {
      const stored = localStorage.getItem('connectionRequests');
      if (!stored) return false;
      
      const requests = JSON.parse(stored);
      const idx = requests.findIndex(req => req.id === requestId);
      
      if (idx === -1) return false;
      
      requests[idx].status = accept ? 'accepted' : 'rejected';
      localStorage.setItem('connectionRequests', JSON.stringify(requests));
      
      if (handlers.onConnectionResponseConfirmed) {
        handlers.onConnectionResponseConfirmed({
          success: true, 
          request: requests[idx]
        });
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check pending requests for mentor
  function checkPendingRequestsForMentor(mentorId) {
    if (!mentorId) return [];
    
    try {
      const stored = localStorage.getItem('connectionRequests');
      if (!stored) return [];
      
      const requests = JSON.parse(stored);
      const pending = requests.filter(req => 
        req.mentorId === mentorId && req.status === 'pending'
      );
      
      if (handlers.onNewConnectionRequest && pending.length > 0) {
        pending.forEach(request => {
          handlers.onNewConnectionRequest({success: true, request});
        });
      }
      
      return pending;
    } catch (error) {
      return [];
    }
  }

  // Load user connection requests
  function loadUserConnectionRequests(userId, role) {
    if (!userId) return [];
    
    try {
      const stored = localStorage.getItem('connectionRequests');
      if (!stored) return [];
      
      const requests = JSON.parse(stored);
      
      if (role === 'MENTOR') {
        return requests.filter(req => req.mentorId === userId);
      } else if (role === 'MENTEE') {
        return requests.filter(req => req.menteeId === userId);
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }
})();