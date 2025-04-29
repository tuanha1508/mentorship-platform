# Mentorship Matching Platform

A web application that connects mentors and mentees for effective mentorship relationships. This platform allows users to create profiles, specify skills and interests, find matching mentors/mentees, and establish meaningful mentorship connections.

## 🌟 Features

- **User Authentication**: Secure registration, login, and logout functionality
- **Profile Management**: Create and customize detailed profiles as mentor or mentee
- **Dashboard Interface**: Role-specific dashboards for mentors and mentees
- **Mentor Discovery**: Search and filter mentors based on skills and interests
- **Connection System**: Send, receive, and manage mentorship connection requests
- **Assignments**: Create and track assignments between mentors and mentees
- **Responsive Design**: Fully responsive UI that works on all device sizes

## 🚀 Live Demo

[Live Demo Link](https://your-deployed-app-url.com)

## 🛠️ Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: LocalStorage for data persistence
- **Responsive Design**: CSS Flexbox and Grid
- **Mock API**: JavaScript modules for simulating backend functionality

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/your-username/mentorship-platform.git
   cd mentorship-platform
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   node server.js
   ```

4. Open your browser and navigate to `http://localhost:3000`

## 🧭 Project Structure

```
mentorship-platform/
├── frontend/
│   ├── components/       # Reusable UI components
│   ├── css/              # Stylesheets
│   ├── js/
│   │   ├── api/          # API mock services
│   │   ├── pages/        # Page-specific JavaScript
│   │   ├── components/   # Component JavaScript
│   │   ├── services/     # Utility services
│   │   ├── app.js        # Main application logic
│   │   └── router.js     # Client-side routing
│   ├── images/           # Images and icons
│   └── index.html        # Main entry point
├── package.json
└── server.js             # Simple static file server
```

## 🔒 User Roles

- **Mentors**: Can view mentee requests, manage their mentees, create assignments, and update their profiles
- **Mentees**: Can search for mentors, send connection requests, view assigned tasks, and update their profiles

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is [MIT](LICENSE) licensed.
