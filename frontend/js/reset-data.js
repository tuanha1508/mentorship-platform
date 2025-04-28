/**
 * Utility to reset localStorage data for testing
 */

window.resetLocalStorage = function() {
  // Clear all localStorage
  localStorage.clear();
  
  // Reinitialize mock data - try different methods
  if (window.forceMockDataInitialization && typeof window.forceMockDataInitialization === 'function') {
    window.forceMockDataInitialization();
    console.log('Mock data reinitialized using forceMockDataInitialization.');
  } else if (window.initializeMockUsers && typeof window.initializeMockUsers === 'function') {
    window.initializeMockUsers();
    console.log('Mock data reinitialized using initializeMockUsers.');
  } else if (window.MockDataService && typeof window.MockDataService.initMockData === 'function') {
    window.MockDataService.initMockData();
    console.log('Mock data reinitialized using MockDataService.');
  } else {
    console.warn('No mock data initialization method found. Loading mock-data.js script...');
    
    // Try to load the mock-data.js script dynamically
    const script = document.createElement('script');
    script.src = '/js/mock-data.js';
    script.onload = function() {
      console.log('mock-data.js loaded, initializing data...');
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
