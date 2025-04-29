# File-by-File Walkthrough Guide for Loom Video

This guide provides detailed talking points for key files in your codebase when recording your Loom video. Use it to ensure you explain the most important aspects of each file's functionality.

## 1. Frontend Structure Overview

### index.html
**Key Talking Points:**
- Entry point of the application
- Loads core stylesheets and scripts
- Contains the main app container where content is dynamically rendered
- Demonstrate the simple, clean HTML structure that serves as a foundation

### app.js
**Key Talking Points:**
- Main application initialization
- Explain the App class and its role as the central coordinator
- Show how it sets up global event handlers and checks authentication state
- Highlight how it updates UI elements based on authentication state

### router.js
**Key Talking Points:**
- Client-side routing implementation without external libraries
- Show how routes are defined and mapped to HTML/CSS files
- Explain the page transition animations
- Describe how it handles authentication requirements for protected routes
- Demonstrate how it preloads CSS for performance optimization

## 2. Core Features Implementation

### js/pages/dashboard/index.js
**Key Talking Points:**
- Main dashboard controller that coordinates different dashboard components
- Initializes user-specific dashboard based on role (mentor/mentee)
- Shows how modular imports are used to load specific functionality
- Explain the event system that coordinates between dashboard components

### js/pages/dashboard/navigationManager.js
**Key Talking Points:**
- Handles dashboard navigation between different sections
- Shows the implementation of the sidebar navigation system
- Explain how it loads different content based on user roles
- Point out the use of dynamic imports for code-splitting and performance

### js/pages/dashboard/profileManager.js
**Key Talking Points:**
- Form handling for user profiles
- Data validation implementation
- Explain how it saves and retrieves profile information from localStorage
- Show how it handles different profile fields based on user role

### js/pages/dashboard/userManager.js
**Key Talking Points:**
- Central data management for user information
- Explain the user data structure and how it's persisted
- Show how other components access user data through this manager
- Highlight any methods for updating user information

## 3. Mentor-Mentee Connection Features

### js/pages/dashboard/connectionManager.js
**Key Talking Points:**
- Implementation of the connection request system
- Show how connection requests are sent, received, and managed
- Explain the status tracking for different connection states
- Demonstrate the UI updates when connection states change

### js/pages/userDiscovery.js
**Key Talking Points:**
- Mentor discovery implementation
- Explain the search and filter functionality
- Show how mentor cards are generated and displayed
- Highlight the matching algorithm that connects mentors and mentees

## 4. UI Components

### css/global.css
**Key Talking Points:**
- Global styling variables (colors, fonts, spacing)
- Responsive design approach
- Utility classes for common styling patterns
- Accessibility considerations in the design

### css/dashboard.css
**Key Talking Points:**
- Layout structure for the dashboard
- Responsive adaptations for different screen sizes
- Component-specific styling
- Transition and animation implementations

### components/navbar.html
**Key Talking Points:**
- Reusable navigation component
- Dynamic rendering based on authentication state
- Mobile responsiveness with hamburger menu
- Active state indicators for current page

## 5. Mock Data and Services

### js/mock-data.js
**Key Talking Points:**
- Generation of realistic mock data for testing
- User profiles, skills, and connection data structures
- Explain how this simulates a backend database
- Show the diversity of mock data to test various scenarios

### js/api/apiService.js
**Key Talking Points:**
- Mock API implementation to simulate backend
- Show how it handles requests and responses
- Explain the artificial delays to simulate network latency
- Error handling and response formatting

## 6. Server Implementation

### server.js
**Key Talking Points:**
- Simple Node.js server for serving static files
- Explanation of why a server is needed even for a frontend project
- How it handles different routes
- Deployment configuration settings

## Talking Tips for Each File:

1. Start with a one-sentence overview of the file's purpose
2. Highlight 2-3 key sections of code that demonstrate core functionality
3. Explain how this file interacts with other parts of the application
4. Mention any challenges you faced and how you solved them in this particular file
5. If appropriate, point out code that could be improved or expanded in future iterations
