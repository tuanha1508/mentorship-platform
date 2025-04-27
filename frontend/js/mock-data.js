/**
 * Mock User Data
 * Initializes sample user data for the mentorship platform
 */

// Initialize mock users if they don't already exist
function initializeMockUsers() {
  console.log('Checking if mock data needs to be initialized...');
  
  // Check if users already exist in localStorage
  let existingUsers = [];
  try {
    const usersJson = localStorage.getItem('users');
    existingUsers = usersJson ? JSON.parse(usersJson) : [];
    console.log(`Found ${existingUsers.length} existing users in localStorage`);
  } catch (e) {
    console.error('Error parsing users from localStorage:', e);
    // Reset users if there's a parsing error
    localStorage.removeItem('users');
    existingUsers = [];
  }
  
  // Only create mock data if there are no users yet
  if (existingUsers.length === 0) {
    console.log('No users found, initializing mock user data...');
    
    const mockUsers = [
      // Mentors
      {
        id: '1001',
        fullName: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        password: 'password123',
        role: 'MENTOR',
        profileComplete: true,
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 8,
        company: 'TechCorp Inc.',
        title: 'Senior Frontend Developer',
        bio: 'Frontend specialist with 8 years of experience building enterprise web applications. I enjoy helping junior developers improve their coding practices and career growth.',
        availability: ['Monday evenings', 'Wednesday afternoons'],
        imageUrl: 'https://randomuser.me/api/portraits/women/32.jpg',
        createdAt: '2024-12-15T14:22:34.123Z'
      },
      {
        id: '1002',
        fullName: 'Michael Chen',
        email: 'michael.chen@example.com',
        password: 'password123',
        role: 'MENTOR',
        profileComplete: true,
        skills: ['Python', 'Machine Learning', 'Data Analysis'],
        experience: 6,
        company: 'DataSense AI',
        title: 'Data Scientist',
        bio: 'Passionate about applying machine learning to solve real-world problems. I specialize in NLP and computer vision applications.',
        availability: ['Tuesday evenings', 'Saturday mornings'],
        imageUrl: 'https://randomuser.me/api/portraits/men/44.jpg',
        createdAt: '2024-12-18T09:15:22.543Z'
      },
      {
        id: '1003',
        fullName: 'Elena Rodriguez',
        email: 'elena.rod@example.com',
        password: 'password123',
        role: 'MENTOR',
        profileComplete: true,
        skills: ['UX/UI Design', 'Figma', 'User Research'],
        experience: 7,
        company: 'DesignWorks Studio',
        title: 'Senior UX Designer',
        bio: 'Design leader who believes in creating user-centered products. I help junior designers understand the intersection of design and business needs.',
        availability: ['Thursday evenings', 'Friday afternoons'],
        imageUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
        createdAt: '2024-12-20T16:45:12.987Z'
      },
      {
        id: '1004',
        fullName: 'James Wilson',
        email: 'james.wilson@example.com',
        password: 'password123',
        role: 'MENTOR',
        profileComplete: true,
        skills: ['DevOps', 'AWS', 'Docker', 'Kubernetes'],
        experience: 9,
        company: 'CloudScale Solutions',
        title: 'DevOps Engineer',
        bio: 'Infrastructure and cloud specialist with a background in software development. I help teams implement CI/CD and cloud-native architectures.',
        availability: ['Monday afternoons', 'Sunday evenings'],
        imageUrl: 'https://randomuser.me/api/portraits/men/22.jpg',
        createdAt: '2025-01-05T11:32:45.765Z'
      },
      {
        id: '1005',
        fullName: 'Priya Patel',
        email: 'priya.patel@example.com',
        password: 'password123',
        role: 'MENTOR',
        profileComplete: true,
        skills: ['Product Management', 'Agile', 'Market Research'],
        experience: 10,
        company: 'ProductHub',
        title: 'Senior Product Manager',
        bio: 'Experienced product leader who has launched multiple successful products. I enjoy helping aspiring product managers navigate their career path.',
        availability: ['Wednesday evenings', 'Saturday afternoons'],
        imageUrl: 'https://randomuser.me/api/portraits/women/54.jpg',
        createdAt: '2024-12-28T13:22:18.432Z'
      },
      
      // Mentees
      {
        id: '2001',
        fullName: 'Alex Turner',
        email: 'alex.t@example.com',
        password: 'password123',
        role: 'MENTEE',
        profileComplete: true,
        skills: ['JavaScript', 'HTML/CSS', 'React Basics'],
        experience: 1,
        education: 'Computer Science Bootcamp Graduate',
        interests: ['Frontend Development', 'Web Accessibility', 'UX/UI'],
        goals: 'Secure a full-time position as a frontend developer and improve my React skills',
        bio: 'Recent bootcamp graduate eager to break into the tech industry. Looking for guidance on best practices and career development.',
        imageUrl: 'https://randomuser.me/api/portraits/men/76.jpg',
        createdAt: '2025-01-10T08:45:22.321Z'
      },
      {
        id: '2002',
        fullName: 'Maya Johnson',
        email: 'maya.j@example.com',
        password: 'password123',
        role: 'MENTEE',
        profileComplete: true,
        skills: ['Python Basics', 'SQL', 'Data Visualization'],
        experience: 0,
        education: 'Bachelor\'s in Statistics',
        interests: ['Data Science', 'Machine Learning', 'Big Data'],
        goals: 'Transition from statistical analysis to data science and machine learning',
        bio: 'Recent statistics graduate looking to build practical skills in data science and machine learning technologies.',
        imageUrl: 'https://randomuser.me/api/portraits/women/23.jpg',
        createdAt: '2025-01-12T14:56:32.876Z'
      },
      {
        id: '2003',
        fullName: 'David Kim',
        email: 'david.kim@example.com',
        password: 'password123',
        role: 'MENTEE',
        profileComplete: true,
        skills: ['Sketch', 'Photoshop', 'Basic UX Principles'],
        experience: 2,
        education: 'Self-taught Designer',
        interests: ['UX/UI Design', 'Mobile App Design', 'Design Systems'],
        goals: 'Improve my portfolio and land a role at a design-focused tech company',
        bio: 'Self-taught designer with a passion for creating intuitive user interfaces. Looking for mentorship to take my skills to the next level.',
        imageUrl: 'https://randomuser.me/api/portraits/men/29.jpg',
        createdAt: '2025-01-05T17:23:45.432Z'
      },
      {
        id: '2004',
        fullName: 'Taylor Reid',
        email: 'taylor.reid@example.com',
        password: 'password123',
        role: 'MENTEE',
        profileComplete: true,
        skills: ['Basic Cloud Concepts', 'Linux', 'Networking'],
        experience: 1,
        education: 'Associate\'s in Computer Networking',
        interests: ['DevOps', 'Cloud Infrastructure', 'Automation'],
        goals: 'Become a DevOps engineer and learn cloud architecture patterns',
        bio: 'IT professional looking to transition into DevOps. Seeking guidance on modern cloud technologies and automation practices.',
        imageUrl: 'https://randomuser.me/api/portraits/women/41.jpg',
        createdAt: '2025-01-08T09:12:54.123Z'
      },
      {
        id: '2005',
        fullName: 'Jordan Santos',
        email: 'jordan.santos@example.com',
        password: 'password123',
        role: 'MENTEE',
        profileComplete: true,
        skills: ['Market Analysis', 'Business Strategy', 'Communication'],
        experience: 3,
        education: 'MBA Student',
        interests: ['Product Management', 'Startups', 'Digital Transformation'],
        goals: 'Transition from marketing to product management in the tech industry',
        bio: 'Marketing professional with an MBA seeking to pivot into product management. Looking for mentorship on technical product skills and industry knowledge.',
        imageUrl: 'https://randomuser.me/api/portraits/men/57.jpg',
        createdAt: '2024-12-30T11:34:22.765Z'
      }
    ];
    
    try {
      // Store in localStorage
      const usersJson = JSON.stringify(mockUsers);
      localStorage.setItem('users', usersJson);
      console.log('Mock user data initialized with 10 users (5 mentors, 5 mentees)');
      console.log('Sample login - Email: sarah.johnson@example.com, Password: password123');
      
      // Check if data was properly stored
      const storedData = localStorage.getItem('users');
      const parsedData = JSON.parse(storedData);
      if (parsedData && parsedData.length === 10) {
        console.log('Mock data successfully verified in localStorage');
      } else {
        console.error('Mock data may not have been properly stored');
      }
      
      return true;
    } catch (e) {
      console.error('Error storing mock data in localStorage:', e);
      return false;
    }
  } else {
    console.log('Users already exist in localStorage, skipping mock data initialization');
    console.log('Sample login credentials - Email: sarah.johnson@example.com, Password: password123');
    return false;
  }
}

// Create a function to force mock data initialization (clearing existing users)
function forceMockDataInitialization() {
  localStorage.removeItem('users');
  return initializeMockUsers();
}

// Run initialization when the script loads
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    initializeMockUsers();
    // Log a sample user for convenience
    console.log('You can log in with: sarah.johnson@example.com / password123');
  }, 500); // Small delay to ensure DOM is ready
});

// Export for use in other modules if needed
window.initializeMockUsers = initializeMockUsers;
window.forceMockDataInitialization = forceMockDataInitialization;

// Also run on script load (not just DOMContentLoaded) to catch early page loads
initializeMockUsers();
