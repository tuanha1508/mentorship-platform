// Initialize the My Mentees page functionality
if (!window.Dashboard) window.Dashboard = {};

window.Dashboard.initMyMenteesPage = function() {
    // Get user data
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userId = userData.id;
    
    if (!userId) {
        return;
    }
    
    // Use fixed avatar URLs for guaranteed image loading
    const fixedAvatars = [
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
    ];
    
    // Simulate fetching mentees (replace with actual API call in production)
    setTimeout(() => {
        // Create mock mentee data with fixed avatars
        const mockMentees = createMockMentees(fixedAvatars);
        
        // Display mentees or show no mentees message
        if (mockMentees && mockMentees.length > 0) {
            displayMentees(mockMentees);
        } else {
            document.querySelector('.no-mentees-message').style.display = 'flex';
            document.getElementById('mentees-dashboard').style.display = 'none';
        }
    }, 500);
};

// Function to create mock mentee data
function createMockMentees(avatars = []) {
    // Fixed, guaranteed available fallback images
    const defaultAvatars = [
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
    ];
    
    return [
        {
            id: '1',
            name: 'Alex Johnson',
            profileImage: avatars[0] || defaultAvatars[0],
            goal: 'Frontend Development',
            progress: 45,
            skills: ['HTML', 'CSS', 'JavaScript'],
            interests: ['Web Design', 'UX/UI', 'Mobile Development'],
            email: 'alex.j@example.com',
            bio: 'Passionate about creating beautiful and functional interfaces.',
            startDate: '2023-03-15',
            nextMeeting: '2023-06-10T15:00:00'
        },
        {
            id: '2',
            name: 'Sarah Miller',
            profileImage: avatars[1] || defaultAvatars[1],
            goal: 'Full Stack Development',
            progress: 65,
            skills: ['JavaScript', 'React', 'Node.js'],
            interests: ['Web Development', 'Database Design', 'APIs'],
            email: 'sarah.m@example.com',
            bio: 'Looking to become a full stack developer with focus on MERN stack.',
            startDate: '2023-02-20',
            nextMeeting: '2023-06-12T13:30:00'
        },
        {
            id: '3',
            name: 'Michael Chen',
            profileImage: avatars[2] || defaultAvatars[2],
            goal: 'Data Science',
            progress: 30,
            skills: ['Python', 'SQL', 'Statistics'],
            interests: ['Machine Learning', 'Data Visualization', 'Big Data'],
            email: 'michael.c@example.com',
            bio: 'Aspiring data scientist with background in mathematics.',
            startDate: '2023-04-05',
            nextMeeting: '2023-06-08T10:00:00'
        }
    ];
}

// Display mentees in the UI
function displayMentees(mentees) {
    document.querySelector('.no-mentees-message').style.display = 'none';
    document.getElementById('mentees-dashboard').style.display = 'flex';
    
    const menteesList = document.getElementById('mentees-list');
    menteesList.innerHTML = '';
    
    // Create list items for each mentee
    mentees.forEach(mentee => {
        const listItem = document.createElement('li');
        listItem.className = 'mentee-list-item';
        listItem.setAttribute('data-mentee-id', mentee.id);
        
        // Format progress to be displayed
        const progress = mentee.progress || 0;
        
        listItem.innerHTML = `
            <div class="mentee-list-avatar">
                <img src="${mentee.profileImage}" alt="${mentee.name}">
                <div class="mentee-progress-indicator" style="--progress: ${progress}%"></div>
            </div>
            <div class="mentee-list-info">
                <h3>${mentee.name}</h3>
                <p>${mentee.goal || 'No goal specified'}</p>
            </div>
            <div class="mentee-list-action">
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
        
        // Add click event to show mentee details
        listItem.addEventListener('click', function() {
            // Mark this item as active and remove active class from others
            document.querySelectorAll('.mentee-list-item').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
            
            // Show mentee details
            showMenteeDetails(mentee);
        });
        
        menteesList.appendChild(listItem);
    });
    
    // Automatically select the first mentee
    if (mentees.length > 0) {
        const firstMenteeItem = document.querySelector('.mentee-list-item');
        if (firstMenteeItem) {
            firstMenteeItem.click();
        }
    }
};

// Show detailed information about a selected mentee
window.showMenteeDetails = function(mentee) {
    const detailsPlaceholder = document.querySelector('.mentee-details-placeholder');
    const detailsContent = document.getElementById('mentee-details-content');
    
    // Hide placeholder and show content
    detailsPlaceholder.style.display = 'none';
    detailsContent.style.display = 'block';
    
    // Format meeting date if exists
    let nextMeetingDisplay = 'Not scheduled';
    if (mentee.nextMeeting) {
        const meetingDate = new Date(mentee.nextMeeting);
        nextMeetingDisplay = meetingDate.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Format skills and interests as tags
    const skillsHtml = (mentee.skills || []).map(skill => `<span class="tag">${skill}</span>`).join('');
    const interestsHtml = (mentee.interests || []).map(interest => `<span class="tag">${interest}</span>`).join('');
    
    // Calculate mentorship duration
    let durationText = 'Not started';
    if (mentee.startDate) {
        const startDate = new Date(mentee.startDate);
        const now = new Date();
        const diffTime = Math.abs(now - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) {
            durationText = `${diffDays} days`;
        } else {
            const diffMonths = Math.floor(diffDays / 30);
            durationText = `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
        }
    }
    
    // Update the details content
    detailsContent.innerHTML = `
        <div class="mentee-profile-header">
            <div class="mentee-profile-image">
                <img src="${mentee.profileImage}" alt="${mentee.name}">
            </div>
            <div class="mentee-profile-info">
                <h2>${mentee.name}</h2>
                <p class="mentee-email"><i class="fas fa-envelope"></i> ${mentee.email || 'No email provided'}</p>
                <div class="mentee-goal-display">
                    <span>Goal:</span> ${mentee.goal || 'No goal specified'}
                </div>
            </div>
        </div>
        
        <div class="mentee-progress-section">
            <h3>Progress</h3>
            <div class="progress-bar">
                <div class="progress" style="width: ${mentee.progress || 0}%; --progress-width: ${mentee.progress || 0}%"></div>
            </div>
            <p>${mentee.progress || 0}% Complete</p>
        </div>
        
        <div class="mentee-details-grid">
            <div class="mentee-detail-card">
                <h3><i class="fas fa-info-circle"></i> Bio</h3>
                <p>${mentee.bio || 'No bio provided'}</p>
            </div>
            
            <div class="mentee-detail-card">
                <h3><i class="fas fa-calendar-alt"></i> Mentorship</h3>
                <div class="mentee-detail-row">
                    <span>Started:</span> 
                    <span>${mentee.startDate ? new Date(mentee.startDate).toLocaleDateString() : 'Not started'}</span>
                </div>
                <div class="mentee-detail-row">
                    <span>Duration:</span> 
                    <span>${durationText}</span>
                </div>
                <div class="mentee-detail-row">
                    <span>Next Meeting:</span> 
                    <span>${nextMeetingDisplay}</span>
                </div>
            </div>
            
            <div class="mentee-detail-card skills-section">
                <h3><i class="fas fa-cogs"></i> Skills</h3>
                <div class="tags-container">
                    ${skillsHtml || '<p>No skills listed</p>'}
                </div>
            </div>
            
            <div class="mentee-detail-card interests-section">
                <h3><i class="fas fa-star"></i> Interests</h3>
                <div class="tags-container">
                    ${interestsHtml || '<p>No interests listed</p>'}
                </div>
            </div>
        </div>
        
        <div class="mentee-actions">
            <button class="btn btn-primary" onclick="scheduleMeeting('${mentee.id}')"><i class="fas fa-calendar-plus"></i> Schedule Meeting</button>
            <button class="btn btn-secondary" onclick="startChat('${mentee.id}')"><i class="fas fa-comments"></i> Start Chat</button>
        </div>
    `;
};

// Helper functions for actions
window.scheduleMeeting = function(menteeId) {
    // Implement scheduling functionality
    alert('Meeting scheduling will be implemented soon!');
};

window.startChat = function(menteeId) {
    // Redirect to chat with this mentee
    window.location.hash = '#chat';
    localStorage.setItem('activeChat', menteeId);
};

// Ensure functions are available on the Dashboard object
window.Dashboard.displayMentees = displayMentees;
window.displayMentees = displayMentees;