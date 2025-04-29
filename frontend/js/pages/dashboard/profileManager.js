// Profile management functionality
import UserManager from './userManager.js';
import UIManager from './uiManager.js';

const ProfileManager = {
    dashboard: null,
    
    init(dashboardInstance) {
        this.dashboard = dashboardInstance;
    },
    
    // Initialize profile page
    initProfilePage() {
        console.log('Initializing profile page...');
        
        // Log the entire dashboard content structure to diagnose any issues
        console.log('Dashboard page content at init:', document.getElementById('dashboard-page-content') ? 'Exists' : 'Missing');
        
        // Check for profile-page elements
        const profilePageByClass = document.querySelector('.profile-page');
        console.log('Profile page by class:', profilePageByClass ? 'Found' : 'Missing');
        
        // Define a function to find the form and set up handlers
        const findAndSetupForm = () => {
            console.log('Looking for profile form...');
            
            // Try multiple selectors to find the form
            let profileForm = document.getElementById('profile-form');
            if (!profileForm) {
                console.log('Profile form not found by ID, trying alternative selectors');
                profileForm = document.querySelector('form.profile-form') || 
                             document.querySelector('.profile-page form') || 
                             document.querySelector('.card-body form');
                console.log('Form by alternative selector:', profileForm ? 'Found' : 'Missing');
            }
            
            if (!profileForm) {
                console.log('Profile form not found by any selector');
                return false;
            }
            
            console.log('Profile form found, initializing components...', profileForm);
            
            // Get profile data - force a fresh copy from localStorage
            const userData = UserManager.getUserData();
            console.log('User data loaded for profile:', userData);
            
            // Verify we have the expected data structure
            if (!userData || Object.keys(userData).length === 0) {
                console.error('User data is empty or missing - cannot load profile');
                UIManager.showFeedback('error', 'Could not load your profile data. Please try refreshing the page.');
                return false;
            }
            
            // Log form fields to verify they exist
            ['firstName', 'lastName', 'email', 'bio'].forEach(id => {
                const field = document.getElementById(id);
                console.log(`Field ${id}:`, field ? 'Found' : 'Missing');
            });
            
            // Parse fullName into firstName and lastName if needed
            if (userData.fullName && (!userData.firstName || !userData.lastName)) {
                const nameParts = userData.fullName.split(' ');
                if (nameParts.length >= 2) {
                    userData.firstName = userData.firstName || nameParts[0];
                    userData.lastName = userData.lastName || nameParts.slice(1).join(' ');
                    console.log('Split fullName into:', { firstName: userData.firstName, lastName: userData.lastName });
                }
            }
            
            // Immediately try to populate some fields directly
            const firstNameField = document.getElementById('firstName');
            const lastNameField = document.getElementById('lastName');
            
            if (firstNameField && userData.firstName) {
                firstNameField.value = userData.firstName;
                console.log('Set firstName directly:', firstNameField.value);
            }
            
            if (lastNameField && userData.lastName) {
                lastNameField.value = userData.lastName;
                console.log('Set lastName directly:', lastNameField.value);
            }
            
            // Load all profile data into the form
            this.loadProfileData(userData);
            
            // Check if the form was populated correctly
            const firstName = document.getElementById('firstName')?.value;
            const lastName = document.getElementById('lastName')?.value;
            if (!firstName || !lastName) {
                console.warn('Form fields may not have been populated correctly, trying alternative method');
                this.populateProfileFormDirectly(userData);
            }
            
            // CRITICAL FIX: Set up form submission handler AFTER finding the form
            console.log('Setting up form submission handlers');
            
            // Define the save handler function
            const saveProfileFormData = (event) => {
                // Prevent the default form submission
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log('Form submission event intercepted:', event.type);
                }
                
                console.log('Save profile function called');
                
                try {
                    // Debug form state before getting form data
                    console.log('Form fields before collection:');
                    const fieldIds = ['firstName', 'lastName', 'email', 'bio', 'title', 'location', 'learning-goal'];
                    fieldIds.forEach(id => {
                        const field = document.getElementById(id);
                        console.log(`Field ${id}:`, {
                            exists: !!field,
                            value: field?.value
                        });
                    });
                    
                    // Get form data from all fields
                    const formData = this.getProfileFormData();
                    console.log('Form data collected for save:', formData);
                    
                    // Make sure we have the expected structure
                    if (!formData || typeof formData !== 'object') {
                        console.error('Invalid form data structure:', formData);
                        UIManager.showFeedback('error', 'Error collecting form data. Please try again.');
                        return false;
                    }
                    
                    // Verify localStorage before update
                    const beforeUpdate = localStorage.getItem('userData');
                    console.log('Profile data BEFORE update:', beforeUpdate);
                    
                    // Save the form data
                    const updateResult = UserManager.updateUserData(formData);
                    console.log('Profile update result:', updateResult);
                    
                    // Verify localStorage after update
                    const afterUpdate = localStorage.getItem('userData');
                    console.log('Profile data AFTER update:', afterUpdate);
                    console.log('Is data different after update?', beforeUpdate !== afterUpdate);
                    
                    // Show feedback message if update was successful
                    if (updateResult) {
                        UIManager.showFeedback('success', 'Profile updated successfully!');
                        
                        // Force sidebar profile update
                        UIManager.updateSidebarProfile(updateResult);
                        
                        // Force UI refresh
                        const profileEvent = new CustomEvent('profile-updated', { detail: updateResult });
                        document.dispatchEvent(profileEvent);
                    } else {
                        console.error('Failed to update user data');
                        UIManager.showFeedback('error', 'Failed to update profile. Please try again.');
                    }
                } catch (formError) {
                    console.error('Error in form submission:', formError);
                    console.error('Error details:', formError.message, formError.stack);
                    UIManager.showFeedback('error', 'Unexpected error during form submission. Please try again.');
                }
                
                // Return false to prevent form submission
                return false;
            };
            
            // Find the save button
            const submitButton = profileForm.querySelector('.btn-save');
            console.log('Submit button found:', !!submitButton);
            
            // Attach the handler in multiple ways to ensure it works
            if (submitButton) {
                console.log('Adding click event to submit button');
                
                // Use addEventListener instead of onclick to avoid overwriting existing handlers
                submitButton.addEventListener('click', (e) => {
                    console.log('Submit button clicked');
                    e.preventDefault();
                    saveProfileFormData(e);
                    return false;
                });
                
                // Also set onclick as a fallback
                submitButton.onclick = (e) => {
                    e.preventDefault();
                    saveProfileFormData(e);
                    console.log('Save button clicked directly');
                    return false;
                };
            }
            
            // Set up confirm delete button for CSS-based modal
            const confirmDeleteBtn = document.getElementById('confirm-delete');
            
            if (confirmDeleteBtn) {
                console.log('Delete profile confirmation button found');
                
                confirmDeleteBtn.addEventListener('click', () => {
                    console.log('Delete profile confirmed');
                    
                    // Get current user data for reference
                    const userData = UserManager.getUserData();
                    const userId = userData.id;
                    
                    // Create a visual fade-out effect for the form
                    profileForm.style.transition = 'all 1.5s ease';
                    profileForm.style.opacity = '0';
                    profileForm.style.transform = 'translateY(20px)';
                    
                    // Clear user data from localStorage
                    localStorage.removeItem('userData');
                    localStorage.removeItem(`user_${userId}`);
                    
                    // Also remove user from the users array if it exists
                    try {
                        const usersJson = localStorage.getItem('users');
                        if (usersJson) {
                            const users = JSON.parse(usersJson);
                            const updatedUsers = users.filter(user => user.id !== userId);
                            localStorage.setItem('users', JSON.stringify(updatedUsers));
                            console.log('User removed from users array in localStorage');
                        }
                    } catch (error) {
                        console.error('Error removing user from users array:', error);
                    }
                    
                    // Show success notification
                    UIManager.showFeedback('success', 'Profile deleted successfully. Redirecting to login...');
                    
                    // Redirect to sign-in page after a delay
                    setTimeout(() => {
                        window.location.href = '/signin';
                    }, 2000);
                });
            }
            
            // Set form submission handlers
            profileForm.addEventListener('submit', function(e) {
                console.log('Form submit event triggered');
                e.preventDefault();
                saveProfileFormData(e);
                return false;
            });
            
            console.log('Profile form submission handlers attached successfully');
            
            return true;
        };
        
        // Try to find form and set up handlers immediately
        if (!findAndSetupForm()) {
            // If not found, try again with a short delay
            setTimeout(() => {
                if (!findAndSetupForm()) {
                    // Try one more time with a longer delay
                    setTimeout(findAndSetupForm, 500);
                }
            }, 100);
        }
        
        // Handle skills input
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
        } else {
            console.warn('Skills input or container not found');
        }
        
        // Add a helper method to directly populate the form as a fallback
        this.populateProfileFormDirectly = (userData) => {
            console.log('Using direct form population method');
            try {
                // Try to populate form fields directly
                const fields = {
                    'firstName': userData.firstName || (userData.fullName ? userData.fullName.split(' ')[0] : ''),
                    'lastName': userData.lastName || (userData.fullName ? userData.fullName.split(' ').slice(1).join(' ') : ''),
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
                
                // Set each field directly
                Object.entries(fields).forEach(([id, value]) => {
                    const element = document.getElementById(id);
                    if (element && value) {
                        element.value = value;
                        console.log(`Directly set ${id} = ${value}`);
                    }
                });
                
                // Handle skills
                if (skillsContainer && userData.skills && Array.isArray(userData.skills)) {
                    skillsContainer.innerHTML = '';
                    userData.skills.forEach(skill => {
                        UIManager.addSkillTag(skill, skillsContainer);
                    });
                }
                
                // Handle interests checkboxes
                if (userData.interests && Array.isArray(userData.interests)) {
                    userData.interests.forEach(interest => {
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
                        
                        const checkboxId = interestMap[interest];
                        if (checkboxId) {
                            const checkbox = document.getElementById(checkboxId);
                            if (checkbox) checkbox.checked = true;
                        }
                    });
                }
            } catch (error) {
                console.error('Error in direct form population:', error);
            }
        };
        
        // Handle profile image upload
        const uploadTrigger = document.getElementById('upload-trigger');
        const profileUpload = document.getElementById('profile-upload');
        const profilePreview = document.getElementById('profile-preview');
        
        console.log('Profile image elements:', { 
            uploadTrigger: !!uploadTrigger, 
            profileUpload: !!profileUpload, 
            profilePreview: !!profilePreview,
            previewSrc: profilePreview?.src 
        });
        
        if (uploadTrigger && profileUpload && profilePreview) {
            // Make sure profile preview has a default image if none set
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
                        console.log('Updated profile image preview:', profilePreview.src.substring(0, 50) + '...');
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
        } else {
            console.error('One or more profile image elements not found');
        }
    },
    
    // Load profile data into the form
    loadProfileData(userData) {
        console.log('Loading profile data into form:', userData);
        
        // Add debugging to help identify issues with form loading
        let formElement = document.getElementById('profile-form');
        if (!formElement) {
            // Try by class selector
            formElement = document.querySelector('form.profile-form');
            console.log('Found form by class selector:', !!formElement);
        }
        
        if (!formElement) {
            console.error('Profile form element not found when loading data!');
            return;
        }
        
        console.log('Form found, setting field values...');
        const contentDiv = document.getElementById('dashboard-page-content');
        if (contentDiv) {
            console.log('DOM structure at load time:', contentDiv.innerHTML.substring(0, 200));
        } else {
            console.error('dashboard-page-content element not found');
        }
        
        // Make sure fullName is parsed into firstName and lastName if needed
        if (userData.fullName && (!userData.firstName || !userData.lastName)) {
            const nameParts = userData.fullName.split(' ');
            if (nameParts.length >= 2) {
                userData.firstName = userData.firstName || nameParts[0];
                userData.lastName = userData.lastName || nameParts.slice(1).join(' ');
                console.log('Split fullName into parts in loadProfileData');
            }
        }
        
        // Force a new form reference to ensure we have latest DOM state
        const freshForm = document.getElementById('profile-form') || document.querySelector('form.profile-form');
        if (freshForm !== formElement) {
            console.log('Form reference updated to fresh instance');
            formElement = freshForm;
        }
        
        // Directly set values on elements rather than using setFieldValue to avoid any issues
        const setDirectValue = (id, value) => {
            // Try multiple methods to set the value
            // 1. Try by ID
            let element = document.getElementById(id);
            
            // 2. Try by name
            if (!element) {
                element = document.querySelector(`[name="${id}"]`);
            }
            
            // 3. Try by selector with ID
            if (!element) {
                element = document.querySelector(`#${id}`);
            }
            
            if (element) {
                try {
                    element.value = value || '';
                    // Force update
                    const event = new Event('input', {bubbles: true});
                    element.dispatchEvent(event);
                    console.log(`Direct set field ${id} = ${value}`);
                } catch (e) {
                    console.error(`Error setting value for ${id}:`, e);
                }
            } else {
                console.error(`Element not found by any method: ${id}`);
                // Log all input elements to help diagnose
                const allInputs = document.querySelectorAll('input, textarea, select');
                console.log(`Available form elements (${allInputs.length}):`, 
                    Array.from(allInputs).map(input => input.id || input.name || 'unnamed'));
            }
        };
        
        // Set name fields
        setDirectValue('firstName', userData.firstName);
        setDirectValue('lastName', userData.lastName);
        
        // Set main profile info
        setDirectValue('email', userData.email);
        setDirectValue('bio', userData.bio);
        setDirectValue('title', userData.title);
        setDirectValue('location', userData.location);
        
        // Set profile image if it exists
        const profilePreview = document.getElementById('profile-preview');
        if (profilePreview) {
            const imageSrc = userData.imageUrl || userData.profileImage || '../images/profile-placeholder.jpg';
            profilePreview.src = imageSrc;
            console.log('Set profile image:', imageSrc);
        } else {
            console.error('Profile preview element not found');
        }
        
        // Set skills
        const skillsContainer = document.getElementById('skills-container');
        if (skillsContainer) {
            // Clear existing skills
            skillsContainer.innerHTML = '';
            
            // Add skills from user data
            if (userData.skills && Array.isArray(userData.skills)) {
                console.log('Loading skills:', userData.skills);
                userData.skills.forEach(skill => {
                    UIManager.addSkillTag(skill, skillsContainer);
                });
            } else {
                console.log('No skills found in user data or not an array:', userData.skills);
            }
        } else {
            console.error('Skills container not found');
        }
        
        // Set interests in dropdown
        if (userData.interests && Array.isArray(userData.interests)) {
            console.log('Loading interests:', userData.interests);
            
            const interestsDropdown = document.getElementById('interests');
            if (interestsDropdown) {
                // Clear all selections first
                Array.from(interestsDropdown.options).forEach(option => {
                    option.selected = false;
                });
                
                // Select options that match user interests
                userData.interests.forEach(interest => {
                    Array.from(interestsDropdown.options).forEach(option => {
                        if (option.textContent.trim() === interest.trim()) {
                            option.selected = true;
                            console.log(`Interest option selected for: ${interest}`);
                        }
                    });
                });
            } else {
                console.error('Interests dropdown not found');
            }
        } else {
            console.log('No interests found in user data or not an array:', userData.interests);
        }
        
        // Set other profile fields
        setDirectValue('learning-goal', userData.goals);
        setDirectValue('availability', userData.availability);
        setDirectValue('session-preference', userData.sessionPreference);
        
        // Set social links
        setDirectValue('linkedin', userData.linkedin);
        setDirectValue('github', userData.github);
        setDirectValue('portfolio', userData.portfolio);
        
        // Log success and all field values for verification
        console.log('All profile data loaded into form');
        
        // Verify field values were set correctly
        ['firstName', 'lastName', 'email', 'bio', 'title', 'location'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                console.log(`Field verification - ${fieldId}: ${field.value}`);
            }
        });
    },
    
    // Get all profile form data
    getProfileFormData() {
        const currentUserData = UserManager.getUserData() || {};
        console.log('Getting profile form data with current user data:', currentUserData);
        
        // Get name fields and log detailed debugging info
        const firstNameField = document.getElementById('firstName');
        const lastNameField = document.getElementById('lastName');
        
        // Debug log for form fields
        console.log('Name field elements found?', { 
            firstNameField: !!firstNameField, 
            firstNameValue: firstNameField?.value,
            lastNameField: !!lastNameField,
            lastNameValue: lastNameField?.value
        });
        
        // Always use the form field values directly, not cached values
        const firstName = firstNameField?.value || '';
        const lastName = lastNameField?.value || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        console.log('Name fields extracted:', { firstName, lastName, fullName });
        
        // Get all skills
        const skills = [];
        const skillTags = document.querySelectorAll('#skills-container .skill-tag');
        console.log('Found skill tags:', skillTags.length);
        
        skillTags.forEach(tag => {
            // Remove the 'x' icon from skill text
            const skillText = tag.textContent.replace('✕', '').replace('×', '').replace(/\s*remove-skill\s*/, '').trim();
            skills.push(skillText);
        });
        
        // Get all selected interests from dropdown
        const interests = [];
        const interestsDropdown = document.getElementById('interests');
        console.log('Found interests dropdown:', interestsDropdown ? 'Yes' : 'No');
        
        if (interestsDropdown) {
            const selectedOptions = Array.from(interestsDropdown.selectedOptions);
            console.log('Found selected interests:', selectedOptions.length);
            
            selectedOptions.forEach(option => {
                interests.push(option.textContent.trim());
            });
        }
        
        // Get form input values with detailed logging
        function getFieldValue(id) {
            const field = document.getElementById(id);
            const value = field?.value || '';
            console.log(`Field '${id}' value:`, value);
            return value;
        }
        
        // Get profile image
        const profilePreview = document.getElementById('profile-preview');
        const imageUrl = profilePreview?.src || '';
        console.log('Profile image URL:', imageUrl);
        
        // Create data object with new form values
        const formData = {
            // Core profile data
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
            profileImage: imageUrl, // Added profileImage field to match what's used in other places
            imageUrl, // Keep both fields for compatibility
            lastUpdated: new Date().toISOString(),
            
            // Preserve critical fields
            id: currentUserData.id,
            role: currentUserData.role,
            profileComplete: true, // Mark profile as complete
            createdAt: currentUserData.createdAt || new Date().toISOString(),
            hasMentor: currentUserData.hasMentor,
            mentorId: currentUserData.mentorId,
            mentorName: currentUserData.mentorName,
            education: currentUserData.education,
            experience: currentUserData.experience
        };
        
        // Handle password fields if provided
        const currentPassword = getFieldValue('current-password');
        if (currentPassword) {
            formData.currentPassword = currentPassword;
            formData.newPassword = getFieldValue('new-password');
            formData.confirmPassword = getFieldValue('confirm-password');
        }
        
        console.log('Form data collected:', formData);
        return formData;
    }
};

export default ProfileManager;