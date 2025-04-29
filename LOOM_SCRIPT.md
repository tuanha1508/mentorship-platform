# Loom Video Script - Mentorship Platform

## Introduction (30 seconds)
"Hello! Today I'll be walking you through my Mentorship Matching Platform project. This application connects mentors and mentees, allowing them to create profiles, find matches based on skills and interests, and establish mentorship relationships. I've built this using vanilla JavaScript, HTML, and CSS without any external frameworks as specified in the requirements."

## Codebase Structure (2 minutes)

### Frontend Organization
"Let me start by explaining the structure of my codebase. The project follows a modular architecture with clear separation of concerns:"

**Show file tree structure:**
"As you can see, the frontend folder contains:
- Components: Reusable UI elements like the navbar and modals
- CSS: Stylesheets organized by global styles and page-specific styles
- JavaScript: The core logic of the application"

**Explain key JavaScript files:**
- "app.js serves as the main entry point, initializing the application"
- "router.js handles client-side routing without page refreshes"
- "The pages directory contains page-specific logic, with dashboard being the most complex part"

### State Management
"For state management, I implemented a localStorage-based solution:
- User data, including profiles, connections, and assignments are stored in localStorage
- The userManager.js module provides a clean API for accessing and modifying user data
- Event listeners update the UI when data changes"

## Demo of Working Features (3-4 minutes)

### Authentication Flow
"Let me demonstrate the authentication flow:"
1. "Starting on the homepage, I'll click 'Find a Mentor' which directs to the login page"
2. "For new users, the registration form includes validation and role selection"
3. "After logging in, notice how the system redirects to the appropriate dashboard based on user role"

### Profile Management
"Next, I'll show the profile management functionality:"
1. "On the dashboard, I can navigate to the Profile section"
2. "The profile form includes fields for personal information, skills, interests, and availability"
3. "When saving changes, you'll see how the data persists even after page refresh"

### Mentor Discovery
"The mentor discovery feature allows mentees to find suitable mentors:"
1. "From the mentee dashboard, I can access the 'Find a Mentor' section"
2. "The search functionality includes filters for skills, experience level, and availability"
3. "Each mentor card displays relevant information and allows sending connection requests"

### Connection Management
"The connection system works as follows:"
1. "Mentors receive connection requests in their dashboard"
2. "They can accept or decline requests"
3. "Once connected, both mentor and mentee see the relationship in their respective dashboards"

## Key Technical Decisions (1-2 minutes)

### Custom Router Implementation
"I built a custom client-side router to handle navigation without external libraries. This provides a seamless single-page application experience while maintaining bookmarkable URLs and browser history support."

### Component Architecture
"The application follows a component-based architecture where each UI element is encapsulated with its own logic and styling. This promotes reusability and maintainability."

### Mock API Services
"Since this is primarily a frontend project, I implemented mock API services that simulate backend functionality. These services handle authentication, data persistence, and simulate network delays for a realistic experience."

### Responsive Design Approach
"The application is fully responsive, adapting to different screen sizes. I used CSS Grid and Flexbox for layouts, with strategic media queries to adjust the user interface based on viewport dimensions."

## Conclusion (30 seconds)
"In summary, this Mentorship Matching Platform provides a comprehensive solution for connecting mentors and mentees. It includes user authentication, profile management, mentor discovery, and connection handling—all built with vanilla JavaScript as specified in the requirements. Thank you for reviewing my project, and I look forward to your feedback!"
