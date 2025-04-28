/**
 * Loads the navbar component into navbar placeholders
 */
document.addEventListener('DOMContentLoaded', function() {
    const navbarPlaceholders = document.querySelectorAll('#navbar-placeholder');
    
    if (navbarPlaceholders.length > 0) {
        // Load navbar content from the component file
        fetch('/components/navbar.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load navbar component');
                }
                return response.text();
            })
            .then(html => {
                // Insert the navbar content into all navbar placeholders
                navbarPlaceholders.forEach(placeholder => {
                    placeholder.innerHTML = html;
                    placeholder.style.display = 'block';
                });
            })
            .catch(error => {
                console.error('Error loading navbar component:', error);
            });
    }
});
