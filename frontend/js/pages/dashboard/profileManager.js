// Profile management functionality
import UserManager from './userManager.js';
import UIManager from './uiManager.js';

const getFormElement = () => {
  return document.getElementById('profile-form') || 
         document.querySelector('form.profile-form') || 
         document.querySelector('.profile-page form') || 
         document.querySelector('.card-body form');
};

const getElement = (id) => {
  return document.getElementById(id) || 
         document.querySelector(`[name="${id}"]`) || 
         document.querySelector(`#${id}`);
};

const setFieldValue = (id, value) => {
  const element = getElement(id);
  if (element) {
    try {
      element.value = value || '';
      const event = new Event('input', {bubbles: true});
      element.dispatchEvent(event);
    } catch (e) {}
  }
};

// Generic retry function
const retry = (fn, maxAttempts = 3, delay = 100) => {
  let attempts = 0;
  
  const attempt = () => {
    if (fn()) return true;
    
    attempts++;
    if (attempts < maxAttempts) {
      setTimeout(attempt, delay);
      return false;
    }
    return false;
  };
  
  return attempt();
};

const ProfileManager = {
  dashboard: null,
  
  init(dashboardInstance) {
    this.dashboard = dashboardInstance;
  },
  
  // Initialize profile page
  initProfilePage() {
    const profilePageByClass = document.querySelector('.profile-page');
    
    const setupProfileForm = () => {
      const profileForm = getFormElement();
      
      if (!profileForm) return false;
      
      const userData = UserManager.getUserData();
      
      if (!userData || Object.keys(userData).length === 0) {
        return false;
      }
      
      this.loadProfileData(userData);
      
      const firstName = getElement('firstName')?.value;
      const lastName = getElement('lastName')?.value;
      if (!firstName || !lastName) {
        this.loadProfileData(userData);
      }
      
      this.setupFormSubmission(profileForm);
      this.setupDeleteButton();
      
      return true;
    };
    
    retry(() => setupProfileForm(), 3, 200);
    
    this.setupSkillsInput();
    this.setupProfileImageUpload();
  },
  
  // Setup form submission handlers
  setupFormSubmission(profileForm) {
    const saveProfileFormData = (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      try {
        const formData = this.getProfileFormData();
        
        if (!formData || typeof formData !== 'object') {
          return false;
        }
        
        const beforeUpdate = localStorage.getItem('userData');
        const updateResult = UserManager.updateUserData(formData);
        const afterUpdate = localStorage.getItem('userData');
        
        if (updateResult) {
          UIManager.updateSidebarProfile(updateResult);
          
          const profileEvent = new CustomEvent('profile-updated', { detail: updateResult });
          document.dispatchEvent(profileEvent);
          
          window.location.reload();
        }
      } catch (formError) {}
      
      return false;
    };
    
    const submitButton = profileForm.querySelector('.btn-save');
    
    if (submitButton) {
      submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        saveProfileFormData(e);
        return false;
      });
    }
    
    profileForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveProfileFormData(e);
      return false;
    });
  },
  
  // Setup delete button handler
  setupDeleteButton() {
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => {
        const userData = UserManager.getUserData();
        const userId = userData.id;
        const profileForm = getFormElement();
        
        if (profileForm) {
          profileForm.style.transition = 'all 1.5s ease';
          profileForm.style.opacity = '0';
          profileForm.style.transform = 'translateY(20px)';
        }
        
        localStorage.removeItem('userData');
        localStorage.removeItem(`user_${userId}`);
        
        try {
          const usersJson = localStorage.getItem('users');
          if (usersJson) {
            const users = JSON.parse(usersJson);
            const updatedUsers = users.filter(user => user.id !== userId);
            localStorage.setItem('users', JSON.stringify(updatedUsers));
          }
        } catch (error) {}
        
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      });
    }
  },
  
  // Setup skills input handler
  setupSkillsInput() {
    const skillsInput = document.getElementById('skills-input');
    const skillsContainer = document.getElementById('skills-container');
    
    if (skillsInput && skillsContainer) {
      skillsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          
          const skill = skillsInput.value.trim();
          if (skill) {
            UIManager.addSkillTag(skill, skillsContainer);
            skillsInput.value = '';
          }
        }
      });
    }
  },
  
  // Setup profile image upload
  setupProfileImageUpload() {
    const uploadTrigger = document.getElementById('upload-trigger');
    const profileUpload = document.getElementById('profile-upload');
    const profilePreview = document.getElementById('profile-preview');
    
    if (uploadTrigger && profileUpload && profilePreview) {
      if (!profilePreview.src || profilePreview.src === 'undefined' || profilePreview.src === '') {
        profilePreview.src = '../images/profile-placeholder.jpg';
      }
      
      uploadTrigger.addEventListener('click', () => {
        profileUpload.click();
      });
      
      profileUpload.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            profilePreview.src = e.target.result;
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      });
    }
  },
  
  // Combined method that loads profile data into form
  loadProfileData(userData) {
    if (!userData) return;
    
    if (userData.fullName && (!userData.firstName || !userData.lastName)) {
      const nameParts = userData.fullName.split(' ');
      if (nameParts.length >= 2) {
        userData.firstName = userData.firstName || nameParts[0];
        userData.lastName = userData.lastName || nameParts.slice(1).join(' ');
      }
    }
    
    const fieldMappings = {
      'firstName': userData.firstName,
      'lastName': userData.lastName,
      'email': userData.email,
      'bio': userData.bio,
      'title': userData.title,
      'location': userData.location,
      'learning-goal': userData.goals,
      'availability': userData.availability,
      'session-preference': userData.sessionPreference,
      'linkedin': userData.linkedin,
      'github': userData.github,
      'portfolio': userData.portfolio
    };
    
    Object.entries(fieldMappings).forEach(([id, value]) => {
      setFieldValue(id, value);
    });
    
    const skillsContainer = document.getElementById('skills-container');
    if (skillsContainer && userData.skills && Array.isArray(userData.skills)) {
      skillsContainer.innerHTML = '';
      userData.skills.forEach(skill => {
        UIManager.addSkillTag(skill, skillsContainer);
      });
    }
    
    this.setInterests(userData.interests);
    
    const profilePreview = document.getElementById('profile-preview');
    if (profilePreview) {
      const imageSrc = userData.imageUrl || userData.profileImage || '../images/profile-placeholder.jpg';
      profilePreview.src = imageSrc;
    }
  },
  
  // Helper method for setting interests
  setInterests(interests) {
    if (!interests || !Array.isArray(interests)) return;
    
    const interestsDropdown = document.getElementById('interests');
    if (interestsDropdown) {
      Array.from(interestsDropdown.options).forEach(option => {
        option.selected = interests.includes(option.textContent.trim());
      });
    }
    
    const interestMap = {
      'Frontend Development': 'interest-web',
      'Web Development': 'interest-web',
      'Mobile Development': 'interest-mobile',
      'Data Science': 'interest-data',
      'Machine Learning': 'interest-ml',
      'UI/UX Design': 'interest-ui',
      'UX/UI': 'interest-ui',
      'Backend Development': 'interest-backend',
      'DevOps': 'interest-devops',
      'Cybersecurity': 'interest-security'
    };
    
    interests.forEach(interest => {
      const checkboxId = interestMap[interest];
      if (checkboxId) {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) checkbox.checked = true;
      }
    });
  },
  
  // Get profile form data
  getProfileFormData() {
    const currentUserData = UserManager.getUserData() || {};
    
    const firstName = getElement('firstName')?.value || '';
    const lastName = getElement('lastName')?.value || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    const skills = [];
    const skillTags = document.querySelectorAll('#skills-container .skill-tag');
    
    skillTags.forEach(tag => {
      const skillText = tag.textContent.replace('✕', '').replace('×', '').replace(/\s*remove-skill\s*/, '').trim();
      skills.push(skillText);
    });
    
    const interests = [];
    
    const interestsDropdown = document.getElementById('interests');
    if (interestsDropdown) {
      const selectedOptions = Array.from(interestsDropdown.selectedOptions);
      
      selectedOptions.forEach(option => {
        interests.push(option.textContent.trim());
      });
    }
    
    const interestCheckboxes = document.querySelectorAll('input[id^="interest-"]:checked');
    if (interestCheckboxes.length > 0) {
      const interestLabelMap = {
        'interest-web': 'Frontend Development',
        'interest-mobile': 'Mobile Development',
        'interest-data': 'Data Science',
        'interest-ml': 'Machine Learning',
        'interest-ui': 'UI/UX Design',
        'interest-backend': 'Backend Development',
        'interest-devops': 'DevOps',
        'interest-security': 'Cybersecurity'
      };
      
      interestCheckboxes.forEach(checkbox => {
        const interestValue = interestLabelMap[checkbox.id];
        if (interestValue && !interests.includes(interestValue)) {
          interests.push(interestValue);
        }
      });
    }
    
    const getFieldValue = (id) => getElement(id)?.value || '';
    
    const profilePreview = document.getElementById('profile-preview');
    const imageUrl = profilePreview?.src || '';
    
    const formData = {
      firstName,
      lastName,
      fullName,
      email: getFieldValue('email'),
      bio: getFieldValue('bio'),
      title: getFieldValue('title'),
      location: getFieldValue('location'),
      skills,
      interests,
      goals: getFieldValue('learning-goal'),
      availability: getFieldValue('availability'),
      sessionPreference: getFieldValue('session-preference'),
      linkedin: getFieldValue('linkedin'),
      github: getFieldValue('github'),
      portfolio: getFieldValue('portfolio'),
      profileImage: imageUrl,
      imageUrl,
      lastUpdated: new Date().toISOString(),
      
      id: currentUserData.id,
      role: currentUserData.role,
      profileComplete: true,
      createdAt: currentUserData.createdAt || new Date().toISOString(),
      hasMentor: currentUserData.hasMentor,
      mentorId: currentUserData.mentorId,
      mentorName: currentUserData.mentorName,
      education: currentUserData.education,
      experience: currentUserData.experience
    };
    
    const currentPassword = getFieldValue('current-password');
    if (currentPassword) {
      formData.currentPassword = currentPassword;
      formData.newPassword = getFieldValue('new-password');
      formData.confirmPassword = getFieldValue('confirm-password');
    }
    
    return formData;
  }
};

export default ProfileManager;