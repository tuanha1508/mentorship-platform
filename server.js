const express = require('express');
const path = require('path');
const history = require('connect-history-api-fallback');

const app = express();
const PORT = process.env.PORT || 3000;

// Use connect-history-api-fallback middleware to handle SPA routing
app.use(history());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// All routes will be handled by the SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop the server`);
});
