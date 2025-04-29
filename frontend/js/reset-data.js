/**
 * Utility to reset localStorage data for testing
 */

window.resetLocalStorage = function() {
  // Save current user to preserve login session
  const authToken = localStorage.getItem('authToken');
  const currentUserData = localStorage.getItem('userData');
  
  // Clear all localStorage
  localStorage.clear();
  
  // Restore auth token and user data if they existed
  if (authToken) {
      localStorage.setItem('authToken', authToken);
  }
  
  if (currentUserData) {
      localStorage.setItem('userData', currentUserData);
  }
  
  // Reinitialize mock user data
  if (window.forceMockDataInitialization && typeof window.forceMockDataInitialization === 'function') {
    window.forceMockDataInitialization();
  } else if (window.initializeMockUsers && typeof window.initializeMockUsers === 'function') {
    window.initializeMockUsers();
  } else if (window.MockDataService && typeof window.MockDataService.initMockData === 'function') {
    window.MockDataService.initMockData();
  } else {
    // Try to load the mock-data.js script dynamically
    const script = document.createElement('script');
    script.src = '/js/mock-data.js';
    script.onload = function() {
      if (window.forceMockDataInitialization) {
        window.forceMockDataInitialization();
      }
    };
    document.head.appendChild(script);
  }
  
  // Show feedback
  alert('LocalStorage has been reset. The page will now reload in 1 second.');
  
  // Give a short delay to ensure initialization completes
  setTimeout(function() {
    // Reload the page
    window.location.reload();
  }, 1000);
};