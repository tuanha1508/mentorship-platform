const express = require('express');
const path = require('path');
const history = require('connect-history-api-fallback');

const app = express();

const PORT = process.env.PORT || 3000;



// Storage for connection requests
// We'll use both in-memory array for the current session
// and localStorage for persistence across server restarts
let connectionRequests = [];

// Load existing connection requests from localStorage if available
let storedRequests;
try {
  const fs = require('fs');
  if (fs.existsSync('./localStorage.json')) {
    const localStorage = JSON.parse(fs.readFileSync('./localStorage.json', 'utf8'));
    storedRequests = localStorage.connectionRequests || [];
    connectionRequests = storedRequests;
    console.log(`Loaded ${connectionRequests.length} existing connection requests from localStorage`);
  }
} catch (error) {
  console.error('Error loading connection requests from localStorage:', error);
  connectionRequests = [];
}

// Special route for dashboard to avoid showing .html extension and bypass SPA handling
app.get('/dashboard*', (req, res) => {
  // Send the dashboard HTML directly - this bypasses the SPA router
  res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html'));
});

// Apply SPA history API fallback middleware AFTER the dashboard route
// This ensures the dashboard route is handled first and not rewritten
app.use(history({
  // Exclude the dashboard route from history API fallback
  rewrites: [
    { 
      // Don't rewrite dashboard URLs to index.html
      from: /^\/dashboard.*$/, 
      to: function(context) {
        return '/dashboard.html';
      }
    }
  ]
}));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// All other routes will be handled by the SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});



/**
 * Helper function to persist connection requests to localStorage
 */
function persistConnectionRequests() {
  try {
    const fs = require('fs');
    // Read existing localStorage or create new one
    let localStorage = {};
    if (fs.existsSync('./localStorage.json')) {
      localStorage = JSON.parse(fs.readFileSync('./localStorage.json', 'utf8'));
    }
    
    // Update connection requests
    localStorage.connectionRequests = connectionRequests;
    
    // Write back to file
    fs.writeFileSync('./localStorage.json', JSON.stringify(localStorage, null, 2));
    console.log('Connection requests persisted to localStorage');
  } catch (error) {
    console.error('Error persisting connection requests to localStorage:', error);
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop the server`);
});

// Global error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit the process in production, but log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production, but log the error
});
