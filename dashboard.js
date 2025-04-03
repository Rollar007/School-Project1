document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize user appointments if not exists
    if (!currentUser.appointments) {
        currentUser.appointments = {
            upcoming: [],
            completed: [],
            cancelled: []
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    // Display welcome message
    const welcomeBanner = document.querySelector('.welcome-banner h1');
    if (welcomeBanner) {
        welcomeBanner.textContent = `Welcome, ${currentUser.fullName || 'User'}!`;
    }
    
    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            const tabId = this.getAttribute('data-tab') + '-content';
            document.getElementById(tabId).classList.add('active');
            
            // Load content when tab is clicked
            if (this.getAttribute('data-tab') === 'browse') {
                loadArtisans();
            } else if (this.getAttribute('data-tab') === 'appointments') {
                renderAppointments();
            }
        });
    });
    
    // Card button functionality
    document.querySelector('.browse-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.tab[data-tab="browse"]').classList.add('active');
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById('browse-content').classList.add('active');
        loadArtisans();
    });
    
    document.querySelector('.profile-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.tab[data-tab="profiles"]').classList.add('active');
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById('profiles-content').classList.add('active');
    });
    
    document.querySelector('.appointments-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.tab[data-tab="appointments"]').classList.add('active');
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById('appointments-content').classList.add('active');
        renderAppointments();
    });
    
    // Load and display profile data
    loadProfileData();
    
    // Setup profile editing
    setupEditProfile();
    
    // Setup data backup
    setupDataBackup();
    
    // Logout functionality
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // Appointment tabs
    const appointmentTabs = document.querySelectorAll('.appointment-tab');
    appointmentTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            appointmentTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderAppointments(this.getAttribute('data-status'));
        });
    });
    
    // Search functionality for browse page
    document.getElementById('searchBtn')?.addEventListener('click', function() {
        performSearch();
    });
    
    // Recent activity
    setTimeout(() => {
        const activityList = document.querySelector('.activity-list');
        
        if (currentUser.userType === 'artisan') {
            activityList.innerHTML += `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <div class="activity-content">
                        <p>Complete your artisan profile to start receiving bookings</p>
                        <span class="activity-time">1 day ago</span>
                    </div>
                </div>
            `;
        } else {
            activityList.innerHTML += `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="activity-content">
                        <p>Browse artisans in your area to find the perfect match</p>
                        <span class="activity-time">1 day ago</span>
                    </div>
                </div>
            `;
        }
    }, 1000);

    // Profile functions
    function loadProfileData() {
        const profileAvatar = document.getElementById('profile-avatar');
        
        // Clear previous content
        profileAvatar.innerHTML = '';
        
        // Set profile photo or default
        if (currentUser.profilePhoto) {
            const img = document.createElement('img');
            img.src = currentUser.profilePhoto;
            img.alt = 'Profile Photo';
            profileAvatar.appendChild(img);
        } else {
            const icon = document.createElement('i');
            icon.className = 'fas fa-user-circle';
            profileAvatar.appendChild(icon);
        }
        
        // Populate profile view
        document.getElementById('profile-name').textContent = currentUser.businessName || currentUser.fullName;
        document.getElementById('profile-email').textContent = currentUser.email;
        document.getElementById('profile-type').textContent = currentUser.userType === 'artisan' ? 'Artisan' : 'Customer';
        document.getElementById('profile-region').textContent = currentUser.region || 'Not specified';
        
        if (currentUser.phone) {
            document.getElementById('profile-phone').textContent = currentUser.phone;
        } else {
            document.getElementById('profile-phone').textContent = 'Not provided';
        }

        if (currentUser.userType === 'artisan') {
            document.getElementById('profile-skills-container').style.display = 'flex';
            document.querySelector('.profile-btn').textContent = 'Manage Services';
            
            if (currentUser.skills && currentUser.skills.length > 0) {
                document.getElementById('profile-skills').textContent = currentUser.skills.join(', ');
            } else {
                document.getElementById('profile-skills').textContent = 'No skills added';
            }
        }
    }

    function setupEditProfile() {
        const editBtn = document.querySelector('.edit-profile-btn');
        
        editBtn.addEventListener('click', function() {
            // Create edit form HTML
            const formHTML = `
                <div class="edit-profile-form">
                    <h3>Edit Profile</h3>
                    <form id="profileEditForm">
                        <div class="form-group">
                            <label for="editProfilePhoto" class="file-upload-label">
                                <i class="fas fa-camera"></i> Change Profile Photo
                            </label>
                            <input type="file" id="editProfilePhoto" name="profilePhoto" accept="image/*">
                            <div class="photo-preview-container">
                                ${currentUser.profilePhoto ? 
                                    `<img src="${currentUser.profilePhoto}" id="editPhotoPreview" class="photo-preview" style="display: block;">` : 
                                    `<div id="editPhotoPreview" class="photo-preview"><i class="fas fa-user-circle"></i></div>`}
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" name="fullName" value="${currentUser.fullName || ''}" required>
                        </div>
                        
                        ${currentUser.userType === 'artisan' ? `
                        <div class="form-group">
                            <label>Business Name</label>
                            <input type="text" name="businessName" value="${currentUser.businessName || ''}">
                        </div>
                        ` : ''}
                        
                        <div class="form-group">
                            <label>Phone Number</label>
                            <input type="tel" name="phone" value="${currentUser.phone || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>Region</label>
                            <select name="region" required>
                                <option value="">Select your region</option>
                                ${getRegionsOptions(currentUser.region)}
                            </select>
                        </div>
                        
                        ${currentUser.userType === 'artisan' ? `
                        <div class="form-group">
                            <label>Skills (comma separated)</label>
                            <input type="text" name="skills" value="${currentUser.skills ? currentUser.skills.join(', ') : ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>Bio</label>
                            <textarea name="bio">${currentUser.bio || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Years of Experience</label>
                            <input type="number" name="experience" value="${currentUser.experience || ''}">
                        </div>
                        ` : ''}
                        
                        <div class="form-actions">
                            <button type="button" class="cancel-btn">Cancel</button>
                            <button type="submit" class="save-btn">Save Changes</button>
                        </div>
                    </form>
                </div>
            `;
            
            // Show modal with form
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    ${formHTML}
                </div>
            `;
            document.body.appendChild(modal);
            
            // Handle photo preview in edit form
            document.getElementById('editProfilePhoto')?.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                if (!file.type.match('image.*')) {
                    alert('Please select an image file (JPEG, PNG)');
                    this.value = '';
                    return;
                }
                
                if (file.size > 2 * 1024 * 1024) {
                    alert('Image size should be less than 2MB');
                    this.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(event) {
                    const previewContainer = document.getElementById('editPhotoPreview');
                    
                    if (previewContainer.tagName === 'IMG') {
                        previewContainer.src = event.target.result;
                    } else {
                        previewContainer.innerHTML = '';
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        img.className = 'photo-preview';
                        img.id = 'editPhotoPreview';
                        img.style.display = 'block';
                        previewContainer.appendChild(img);
                    }
                };
                reader.readAsDataURL(file);
            });
            
            // Handle form submission
            document.getElementById('profileEditForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const profilePhoto = formData.get('profilePhoto');
                
                // Add loading state
                const submitBtn = this.querySelector('.save-btn');
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';
                
                try {
                    // Create updates object
                    const updates = {
                        fullName: formData.get('fullName'),
                        phone: formData.get('phone'),
                        region: formData.get('region')
                    };
                    
                    // Process profile photo if changed
                    if (profilePhoto && profilePhoto.size > 0) {
                        updates.profilePhoto = await convertImageToBase64(profilePhoto);
                    }
                    
                    // Process artisan-specific fields
                    if (currentUser.userType === 'artisan') {
                        updates.businessName = formData.get('businessName') || '';
                        updates.skills = formData.get('skills').split(',').map(skill => skill.trim()).filter(skill => skill);
                        updates.bio = formData.get('bio') || '';
                        updates.experience = formData.get('experience') || '';
                    }
                    
                    // Update user data
                    const updatedUser = { ...currentUser, ...updates };
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    
                    // Update in users array
                    const users = JSON.parse(localStorage.getItem('users'));
                    const userIndex = users.findIndex(u => u.email === currentUser.email);
                    if (userIndex !== -1) {
                        users[userIndex] = updatedUser;
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                    
                    submitBtn.textContent = 'Saved!';
                    setTimeout(() => {
                        modal.remove();
                        loadProfileData();
                    }, 1000);
                    
                } catch (error) {
                    console.error('Error saving profile:', error);
                    submitBtn.textContent = 'Error! Try Again';
                    setTimeout(() => {
                        submitBtn.textContent = originalBtnText;
                        submitBtn.disabled = false;
                    }, 2000);
                }
            });
            
            // Handle cancel
            document.querySelector('.cancel-btn').addEventListener('click', function() {
                modal.remove();
            });
        });
    }

    function getRegionsOptions(selectedRegion) {
        const regions = [
            "Greater Accra", "Ashanti", "Western", "Central", "Eastern", 
            "Volta", "Northern", "Upper East", "Upper West", "Bono", 
            "Ahafo", "Bono East", "Oti", "Western North", "Savannah", "North East"
        ];
        
        return regions.map(region => 
            `<option value="${region}" ${selectedRegion === region ? 'selected' : ''}>${region}</option>`
        ).join('');
    }

// Update the loadArtisans function in dashboard.js
function loadArtisans() {
    const artisansGrid = document.querySelector('.artisans-grid');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const artisans = users.filter(user => user.userType === 'artisan');
    
    if (artisans.length === 0) {
        artisansGrid.innerHTML = '<p class="empty-state">No artisans found in the marketplace</p>';
        return;
    }
    
    artisansGrid.innerHTML = artisans.map(artisan => `
        <div class="glass-card" data-id="${artisan.email}">
            <div class="content">
                <div class="artisan-photo">
                    ${artisan.profilePhoto ? 
                        `<img src="${artisan.profilePhoto}" alt="${artisan.fullName}">` : 
                        `<i class="fas fa-user-circle"></i>`}
                </div>
                <div class="artisan-info">
                    <h3>${artisan.businessName || artisan.fullName}</h3>
                    <p class="artisan-skills">${artisan.skills?.join(', ') || 'No skills listed'}</p>
                    <p class="artisan-region">
                        <i class="fas fa-map-marker-alt"></i> ${artisan.region || 'Region not specified'}
                    </p>
                    ${artisan.averageRating ? `
                        <div class="artisan-rating">
                            ${Array(5).fill().map((_, i) => 
                                `<i class="fas fa-star ${i < Math.floor(artisan.averageRating) ? 'active' : ''}"></i>`
                            ).join('')}
                            <span>${artisan.averageRating} (${artisan.reviews?.length || 0})</span>
                        </div>
                    ` : '<div class="artisan-rating">No ratings yet</div>'}
                </div>
                <button class="view-profile-btn">View Profile</button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to view profile buttons
    document.querySelectorAll('.view-profile-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const artisanCard = this.closest('.glass-card');
            const artisanId = artisanCard.dataset.id;
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const artisan = users.find(u => u.email === artisanId && u.userType === 'artisan');
            
            if (artisan) {
                showArtisanProfile(artisan);
            }
        });
    });
}
// Add to dashboard.js
function setupAdvancedFilters() {
    const filterBtn = document.createElement('button');
    filterBtn.textContent = 'Advanced Filters';
    filterBtn.className = 'filter-toggle-btn';
    filterBtn.addEventListener('click', toggleAdvancedFilters);
    
    const searchFilters = document.querySelector('.search-filters');
    searchFilters.insertBefore(filterBtn, searchFilters.firstChild);
    
    const advancedFilters = document.createElement('div');
    advancedFilters.className = 'advanced-filters';
    advancedFilters.style.display = 'none';
    advancedFilters.innerHTML = `
        <div class="filter-group">
            <label>Experience Level</label>
            <select id="experienceFilter">
                <option value="">Any</option>
                <option value="1">1+ years</option>
                <option value="3">3+ years</option>
                <option value="5">5+ years</option>
                <option value="10">10+ years</option>
            </select>
        </div>
        <div class="filter-group">
            <label>Rating</label>
            <select id="ratingFilter">
                <option value="">Any</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="4.5">4.5+ stars</option>
            </select>
        </div>
        <div class="filter-group">
            <label>Availability</label>
            <select id="availabilityFilter">
                <option value="">Any</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="both">Both</option>
            </select>
        </div>
    `;
    
    searchFilters.appendChild(advancedFilters);
}

function toggleAdvancedFilters() {
    const advancedFilters = document.querySelector('.advanced-filters');
    advancedFilters.style.display = advancedFilters.style.display === 'none' ? 'grid' : 'none';
}

function performSearch() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const regionFilter = document.getElementById('regionFilter').value;
    const skillFilter = document.getElementById('skillFilter').value;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    let artisans = users.filter(user => user.userType === 'artisan');
    
    if (searchInput) {
        artisans = artisans.filter(artisan => {
            const name = (artisan.businessName || artisan.fullName).toLowerCase();
            return name.includes(searchInput);
        });
    }
    
    if (regionFilter && regionFilter !== "") {
        artisans = artisans.filter(artisan => artisan.region === regionFilter);
    }
    
    if (skillFilter && skillFilter !== "") {
        artisans = artisans.filter(artisan => 
            artisan.skills && artisan.skills.includes(skillFilter)
        );
    }
    
    const artisansGrid = document.querySelector('.artisans-grid');
    
    if (artisans.length === 0) {
        artisansGrid.innerHTML = '<p class="empty-state">No artisans match your search criteria</p>';
        return;
    }
    
    artisansGrid.innerHTML = artisans.map(artisan => `
        <div class="glass-card" data-id="${artisan.email}">
            <div class="content">
                <div class="artisan-photo">
                    ${artisan.profilePhoto ? 
                        `<img src="${artisan.profilePhoto}" alt="${artisan.fullName}">` : 
                        `<i class="fas fa-user-circle"></i>`}
                </div>
                <div class="artisan-info">
                    <h3>${artisan.businessName || artisan.fullName}</h3>
                    <p class="artisan-skills">${artisan.skills?.join(', ') || 'No skills listed'}</p>
                    <p class="artisan-region">
                        <i class="fas fa-map-marker-alt"></i> ${artisan.region || 'Region not specified'}
                    </p>
                    ${artisan.averageRating ? `
                        <div class="artisan-rating">
                            ${Array(5).fill().map((_, i) => 
                                `<i class="fas fa-star ${i < Math.floor(artisan.averageRating) ? 'active' : ''}"></i>`
                            ).join('')}
                            <span>${artisan.averageRating}</span>
                        </div>
                    ` : ''}
                </div>
                <button class="view-profile-btn">View Profile</button>
            </div>
        </div>
    `).join('');
    
    // Reattach event listeners to new buttons
    document.querySelectorAll('.view-profile-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const artisanCard = this.closest('.glass-card');
            const artisanId = artisanCard.dataset.id;
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const artisan = users.find(u => u.email === artisanId && u.userType === 'artisan');
            
            if (artisan) {
                showArtisanProfile(artisan);
            }
        });
    });
}

    function performSearch() {
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        const regionFilter = document.getElementById('regionFilter').value;
        const skillFilter = document.getElementById('skillFilter').value;
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        let artisans = users.filter(user => user.userType === 'artisan');
        
        // Name search (case insensitive, partial match)
        if (searchInput) {
            artisans = artisans.filter(artisan => {
                const name = (artisan.businessName || artisan.fullName).toLowerCase();
                return name.includes(searchInput);
            });
        }
        
        // Region filter (handle "All Regions" case)
        if (regionFilter && regionFilter !== "") {
            artisans = artisans.filter(artisan => artisan.region === regionFilter);
        }
        
        // Skill filter (handle "All Skills" case)
        if (skillFilter && skillFilter !== "") {
            artisans = artisans.filter(artisan => 
                artisan.skills && artisan.skills.includes(skillFilter)
            );
        }
        
        const artisansGrid = document.querySelector('.artisans-grid');
        
        if (artisans.length === 0) {
            artisansGrid.innerHTML = '<p class="empty-state">No artisans match your search criteria</p>';
            return;
        }
        
        artisansGrid.innerHTML = artisans.map(artisan => `
            <div class="artisan-card" data-id="${artisan.email}">
                <div class="artisan-photo">
                    ${artisan.profilePhoto ? 
                        `<img src="${artisan.profilePhoto}" alt="${artisan.fullName}">` : 
                        `<i class="fas fa-user-circle"></i>`}
                </div>
                <div class="artisan-info">
                    <h3>${artisan.businessName || artisan.fullName}</h3>
                    <p class="artisan-skills">${artisan.skills?.join(', ') || 'No skills listed'}</p>
                    <p class="artisan-region">
                        <i class="fas fa-map-marker-alt"></i> ${artisan.region || 'Region not specified'}
                    </p>
                </div>
                <button class="view-profile-btn">View Profile</button>
            </div>
        `).join('');
        
        // Reattach event listeners to new buttons
        document.querySelectorAll('.view-profile-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const artisanCard = this.closest('.artisan-card');
                const artisanId = artisanCard.dataset.id;
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const artisan = users.find(u => u.email === artisanId && u.userType === 'artisan');
                
                if (artisan) {
                    showArtisanProfile(artisan);
                }
            });
        });
    }

    function renderAppointments(status = 'upcoming') {
        const appointmentsList = document.querySelector('.appointments-list');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!currentUser.appointments || currentUser.appointments[status].length === 0) {
            appointmentsList.innerHTML = `<p class="empty-state">No ${status} appointments</p>`;
            return;
        }
        
        // Filter appointments based on user type
        let displayedAppointments = currentUser.appointments[status];
        
        if (currentUser.userType === 'artisan') {
            // For artisans, show appointments where they are the artisan
            displayedAppointments = displayedAppointments.filter(appt => appt.artisanId === currentUser.email);
        } else {
            // For customers, show appointments where they are the customer
            displayedAppointments = displayedAppointments.filter(appt => appt.customerId === currentUser.email);
        }
        
        if (displayedAppointments.length === 0) {
            appointmentsList.innerHTML = `<p class="empty-state">No ${status} appointments</p>`;
            return;
        }
        
        appointmentsList.innerHTML = displayedAppointments.map(appt => `
            <div class="appointment-item" data-id="${appt.id}">
                <div class="appointment-header">
                    <h4>${appt.service || 'General Service'}</h4>
                    <span class="appointment-status ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </div>
                <div class="appointment-details">
                    ${currentUser.userType === 'artisan' ? `
                        <p><i class="fas fa-user"></i> Customer: ${appt.customerName || 'Customer'}</p>
                    ` : `
                        <p><i class="fas fa-user"></i> Artisan: ${appt.artisanName || 'Artisan'}</p>
                    `}
                    <p><i class="fas fa-calendar-day"></i> ${appt.date || 'No date set'}</p>
                    <p><i class="fas fa-clock"></i> ${appt.time || 'No time set'}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${appt.location || 'Location not specified'}</p>
                    ${appt.notes ? `<p><i class="fas fa-sticky-note"></i> ${appt.notes}</p>` : ''}
                </div>
                ${status === 'upcoming' ? `
                <div class="appointment-actions">
                    ${currentUser.userType === 'artisan' ? `
                        <button class="complete-appt-btn">Mark Complete</button>
                    ` : `
                        <button class="reschedule-appt-btn">Reschedule</button>
                    `}
                    <button class="cancel-appt-btn">Cancel</button>
                </div>
                ` : ''}
            </div>
        `).join('');
        
        // Add event listeners for appointment actions
        document.querySelectorAll('.cancel-appt-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const appointmentId = this.closest('.appointment-item').dataset.id;
                if (confirm('Are you sure you want to cancel this appointment?')) {
                    cancelAppointment(appointmentId);
                }
            });
        });
        
        document.querySelectorAll('.reschedule-appt-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const appointmentId = this.closest('.appointment-item').dataset.id;
                rescheduleAppointment(appointmentId);
            });
        });
        
        document.querySelectorAll('.complete-appt-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const appointmentId = this.closest('.appointment-item').dataset.id;
                completeAppointment(appointmentId);
            });
        });
    }

    function cancelAppointment(appointmentId) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        const updatedUsers = users.map(user => {
            if (user.email === currentUser.email || 
                (currentUser.userType === 'customer' && user.email === currentUser.appointments.upcoming.find(a => a.id == appointmentId)?.artisanId) ||
                (currentUser.userType === 'artisan' && user.email === currentUser.appointments.upcoming.find(a => a.id == appointmentId)?.customerId)) {
                
                if (!user.appointments) {
                    user.appointments = {
                        upcoming: [],
                        completed: [],
                        cancelled: []
                    };
                }
                
                // Find and move the appointment to cancelled
                const appointmentIndex = user.appointments.upcoming.findIndex(a => a.id == appointmentId);
                if (appointmentIndex !== -1) {
                    const [appointment] = user.appointments.upcoming.splice(appointmentIndex, 1);
                    appointment.status = 'cancelled';
                    user.appointments.cancelled.push(appointment);
                }
            }
            return user;
        });
        
        // Update current user
        const updatedCurrentUser = updatedUsers.find(u => u.email === currentUser.email);
        localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
        
        // Update all users
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        renderAppointments('upcoming');
    }

    function completeAppointment(appointmentId) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        const updatedUsers = users.map(user => {
            if (user.email === currentUser.email || 
                user.email === currentUser.appointments.upcoming.find(a => a.id == appointmentId)?.customerId) {
                
                if (!user.appointments) {
                    user.appointments = {
                        upcoming: [],
                        completed: [],
                        cancelled: []
                    };
                }
                
                // Find and move the appointment to completed
                const appointmentIndex = user.appointments.upcoming.findIndex(a => a.id == appointmentId);
                if (appointmentIndex !== -1) {
                    const [appointment] = user.appointments.upcoming.splice(appointmentIndex, 1);
                    appointment.status = 'completed';
                    user.appointments.completed.push(appointment);
                }
            }
            return user;
        });
        
        // Update current user
        const updatedCurrentUser = updatedUsers.find(u => u.email === currentUser.email);
        localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
        
        // Update all users
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        renderAppointments('upcoming');
    }

    function rescheduleAppointment(appointmentId) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const appointment = currentUser.appointments.upcoming.find(a => a.id == appointmentId);
        
        if (appointment) {
            const artisanId = currentUser.userType === 'artisan' ? currentUser.email : appointment.artisanId;
            showBookingForm(artisanId, appointment);
        }
    }

    function showArtisanProfile(artisan) {
        const modalHTML = `
            <div class="modal">
                <div class="modal-content artisan-profile-view">
                    <div class="artisan-header">
                        <div class="artisan-photo-large">
                            ${artisan.profilePhoto ? 
                                `<img src="${artisan.profilePhoto}" alt="${artisan.fullName}">` : 
                                `<i class="fas fa-user-circle"></i>`}
                        </div>
                        <div class="artisan-main-info">
                            <h2>${artisan.businessName || artisan.fullName}</h2>
                            <p class="artisan-region">
                                <i class="fas fa-map-marker-alt"></i> ${artisan.region || 'Region not specified'}
                            </p>
                            <div class="rating-stars">
                                ${Array(5).fill().map((_, i) => 
                                    `<i class="fas fa-star ${i < 4 ? 'active' : ''}"></i>`
                                ).join('')}
                                <span class="review-count">(12 reviews)</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>About</h3>
                        <p>${artisan.bio || 'No bio provided.'}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Skills</h3>
                        <div class="skills-list">
                            ${artisan.skills?.map(skill => 
                                `<span class="skill-tag">${skill}</span>`
                            ).join('') || 'No skills listed'}
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Experience</h3>
                        <p>${artisan.experience ? `${artisan.experience} years` : 'Not specified'}</p>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="close-btn">Close</button>
                        <button class="book-btn">Book Appointment</button>
                    </div>
                </div>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        
        // Handle close button
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        // Handle book button
        modal.querySelector('.book-btn')?.addEventListener('click', () => {
            modal.remove();
            showBookingForm(artisan.email);
        });
    }

    function showBookingForm(artisanId, existingAppointment = null) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const artisan = users.find(u => u.email === artisanId && u.userType === 'artisan');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!artisan) return;
        
        const formHTML = `
            <div class="modal booking-modal">
                <div class="modal-content booking-content">
                    <div class="booking-header">
                        <h3>Book ${artisan.businessName || artisan.fullName}</h3>
                        <button class="close-btn"><i class="fas fa-times"></i></button>
                    </div>
                    
                    <form id="bookingForm" class="booking-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Service Needed</label>
                                <div class="input-with-icon">
                                    <i class="fas fa-tools"></i>
                                    <input type="text" name="service" value="${existingAppointment?.service || ''}" 
                                           placeholder="What service do you need?" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Date</label>
                                <div class="input-with-icon">
                                    <i class="fas fa-calendar-day"></i>
                                    <input type="date" name="date" value="${existingAppointment?.date || ''}" 
                                           min="${new Date().toISOString().split('T')[0]}" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Time</label>
                                <div class="input-with-icon">
                                    <i class="fas fa-clock"></i>
                                    <input type="time" name="time" value="${existingAppointment?.time || ''}" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group full-width">
                                <label class="form-label">Location/Address</label>
                                <div class="input-with-icon">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <input type="text" name="location" value="${existingAppointment?.location || ''}" 
                                           placeholder="Where should the service be performed?" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group full-width">
                                <label class="form-label">Additional Notes</label>
                                <div class="input-with-icon">
                                    <i class="fas fa-edit"></i>
                                    <textarea name="notes" placeholder="Any special requirements or details...">${existingAppointment?.notes || ''}</textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="cancel-btn">Cancel</button>
                            <button type="submit" class="save-btn">
                                <span>${existingAppointment ? 'Update Booking' : 'Confirm Booking'}</span>
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.innerHTML = formHTML;
        document.body.appendChild(modal);
        
        // Handle form submission (keep existing functionality)
        modal.querySelector('#bookingForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            
            const appointment = {
                id: existingAppointment?.id || Date.now(),
                customerId: currentUser.email,
                customerName: currentUser.fullName,
                artisanId: artisan.email,
                artisanName: artisan.businessName || artisan.fullName,
                service: formData.get('service'),
                date: formData.get('date'),
                time: formData.get('time'),
                location: formData.get('location'),
                notes: formData.get('notes'),
                status: 'upcoming',
                createdAt: new Date().toISOString()
            };
            
            // Update both customer and artisan records
            const updatedUsers = users.map(user => {
                if (user.email === currentUser.email || user.email === artisan.email) {
                    // Initialize appointments if not exists
                    if (!user.appointments) {
                        user.appointments = {
                            upcoming: [],
                            completed: [],
                            cancelled: []
                        };
                    }
                    
                    if (existingAppointment) {
                        // Update existing appointment
                        const index = user.appointments.upcoming.findIndex(a => a.id === appointment.id);
                        if (index !== -1) {
                            user.appointments.upcoming[index] = appointment;
                        }
                    } else {
                        // Add new appointment
                        user.appointments.upcoming.push(appointment);
                    }
                }
                return user;
            });
            
            // Update current user
            const updatedCurrentUser = updatedUsers.find(u => u.email === currentUser.email);
            localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
            
            // Update all users
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            
            modal.remove();
            alert(`Appointment ${existingAppointment ? 'updated' : 'booked'} successfully!`);
            
            // Refresh appointments view if on that tab
            if (document.querySelector('.tab[data-tab="appointments"]').classList.contains('active')) {
                renderAppointments();
            }
        });
        
        // Handle cancel
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    function setupDataBackup() {
        // Add backup/restore buttons to profile section
        const backupBtn = document.createElement('button');
        backupBtn.textContent = 'Backup Data';
        backupBtn.className = 'card-btn';
        backupBtn.style.marginTop = '1rem';
        backupBtn.addEventListener('click', exportData);
        
        const restoreBtn = document.createElement('button');
        restoreBtn.textContent = 'Restore Data';
        restoreBtn.className = 'card-btn';
        restoreBtn.style.marginTop = '0.5rem';
        restoreBtn.style.marginBottom = '1rem';
        restoreBtn.addEventListener('click', importData);
        
        const profileSection = document.querySelector('.profile-section');
        if (profileSection) {
            profileSection.appendChild(backupBtn);
            profileSection.appendChild(restoreBtn);
        }
    }

    function exportData() {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const data = {
            users: users,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportName = `artisanhub-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportName);
        linkElement.click();
    }

    function importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.users && Array.isArray(data.users)) {
                        if (confirm('This will overwrite your current data. Continue?')) {
                            localStorage.setItem('users', JSON.stringify(data.users));
                            alert('Data restored successfully!');
                            location.reload();
                        }
                    } else {
                        alert('Invalid backup file format');
                    }
                } catch (error) {
                    console.error('Error parsing backup file:', error);
                    alert('Error reading backup file');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    function convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Add this to the dashboard.js file (new functions and modifications)

// Add this function to show the review form
function showReviewForm(artisanId, appointmentId) {
    const modalHTML = `
        <div class="modal">
            <div class="modal-content">
                <h3>Rate Your Experience</h3>
                <form id="reviewForm">
                    <input type="hidden" name="artisanId" value="${artisanId}">
                    <input type="hidden" name="appointmentId" value="${appointmentId}">
                    
                    <div class="form-group">
                        <label>Rating</label>
                        <div class="rating-stars-input">
                            <i class="fas fa-star" data-rating="1"></i>
                            <i class="fas fa-star" data-rating="2"></i>
                            <i class="fas fa-star" data-rating="3"></i>
                            <i class="fas fa-star" data-rating="4"></i>
                            <i class="fas fa-star" data-rating="5"></i>
                            <input type="hidden" name="rating" id="ratingValue" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Review</label>
                        <textarea name="review" placeholder="Share your experience..." required></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="save-btn">Submit Review</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
    
    // Handle star rating selection
    const stars = modal.querySelectorAll('.rating-stars-input i');
    const ratingValue = modal.querySelector('#ratingValue');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            ratingValue.value = rating;
            
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });
    
    // Handle form submission
    modal.querySelector('#reviewForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        const review = {
            id: Date.now(),
            artisanId: formData.get('artisanId'),
            customerId: currentUser.email,
            customerName: currentUser.fullName,
            appointmentId: formData.get('appointmentId'),
            rating: parseInt(formData.get('rating')),
            review: formData.get('review'),
            date: new Date().toISOString()
        };
        
        // Save the review
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const updatedUsers = users.map(user => {
            if (user.email === review.artisanId) {
                if (!user.reviews) {
                    user.reviews = [];
                }
                user.reviews.push(review);
                
                // Update artisan's average rating
                if (user.reviews.length > 0) {
                    const totalRatings = user.reviews.reduce((sum, r) => sum + r.rating, 0);
                    user.averageRating = (totalRatings / user.reviews.length).toFixed(1);
                }
            }
            return user;
        });
        
        // Mark appointment as reviewed
        const updatedUsersWithReviewFlag = updatedUsers.map(user => {
            if (user.email === currentUser.email) {
                const appointment = user.appointments.completed.find(a => a.id == review.appointmentId);
                if (appointment) {
                    appointment.reviewed = true;
                }
            }
            return user;
        });
        
        // Update current user
        const updatedCurrentUser = updatedUsersWithReviewFlag.find(u => u.email === currentUser.email);
        localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
        
        // Update all users
        localStorage.setItem('users', JSON.stringify(updatedUsersWithReviewFlag));
        
        modal.remove();
        alert('Thank you for your review!');
        
        // Refresh appointments view if on that tab
        if (document.querySelector('.tab[data-tab="appointments"]').classList.contains('active')) {
            renderAppointments('completed');
        }
    });
    
    // Handle cancel
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
    });
}

// Update the renderAppointments function to show review button for completed appointments
function renderAppointments(status = 'upcoming') {
    const appointmentsList = document.querySelector('.appointments-list');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser.appointments || currentUser.appointments[status].length === 0) {
        appointmentsList.innerHTML = `<p class="empty-state">No ${status} appointments</p>`;
        return;
    }
    
    let displayedAppointments = currentUser.appointments[status];
    
    if (currentUser.userType === 'artisan') {
        displayedAppointments = displayedAppointments.filter(appt => appt.artisanId === currentUser.email);
    } else {
        displayedAppointments = displayedAppointments.filter(appt => appt.customerId === currentUser.email);
    }
    
    if (displayedAppointments.length === 0) {
        appointmentsList.innerHTML = `<p class="empty-state">No ${status} appointments</p>`;
        return;
    }
    
    appointmentsList.innerHTML = displayedAppointments.map(appt => {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const artisan = users.find(u => u.email === appt.artisanId);
        const reviewButton = status === 'completed' && currentUser.userType === 'customer' && !appt.reviewed ? 
            `<button class="review-appt-btn">Leave Review</button>` : '';
        
        return `
            <div class="appointment-item" data-id="${appt.id}">
                <div class="appointment-header">
                    <h4>${appt.service || 'General Service'}</h4>
                    <span class="appointment-status ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </div>
                <div class="appointment-details">
                    ${currentUser.userType === 'artisan' ? `
                        <p><i class="fas fa-user"></i> Customer: ${appt.customerName || 'Customer'}</p>
                    ` : `
                        <p><i class="fas fa-user"></i> Artisan: ${appt.artisanName || 'Artisan'}</p>
                        ${artisan?.averageRating ? `
                            <p><i class="fas fa-star"></i> Rating: ${artisan.averageRating}/5 (${artisan.reviews?.length || 0} reviews)</p>
                        ` : ''}
                    `}
                    <p><i class="fas fa-calendar-day"></i> ${appt.date || 'No date set'}</p>
                    <p><i class="fas fa-clock"></i> ${appt.time || 'No time set'}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${appt.location || 'Location not specified'}</p>
                    ${appt.notes ? `<p><i class="fas fa-sticky-note"></i> ${appt.notes}</p>` : ''}
                </div>
                ${status === 'upcoming' ? `
                <div class="appointment-actions">
                    ${currentUser.userType === 'artisan' ? `
                        <button class="complete-appt-btn">Mark Complete</button>
                    ` : `
                        <button class="reschedule-appt-btn">Reschedule</button>
                    `}
                    <button class="cancel-appt-btn">Cancel</button>
                </div>
                ` : ''}
                ${status === 'completed' && currentUser.userType === 'customer' && !appt.reviewed ? `
                <div class="appointment-actions">
                    <button class="review-appt-btn">Leave Review</button>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    // Add event listeners for appointment actions
    document.querySelectorAll('.cancel-appt-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = this.closest('.appointment-item').dataset.id;
            if (confirm('Are you sure you want to cancel this appointment?')) {
                cancelAppointment(appointmentId);
            }
        });
    });
    
    document.querySelectorAll('.reschedule-appt-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = this.closest('.appointment-item').dataset.id;
            rescheduleAppointment(appointmentId);
        });
    });
    
    document.querySelectorAll('.complete-appt-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentId = this.closest('.appointment-item').dataset.id;
            completeAppointment(appointmentId);
        });
    });
    
    document.querySelectorAll('.review-appt-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appointmentItem = this.closest('.appointment-item');
            const appointmentId = appointmentItem.dataset.id;
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const appointment = currentUser.appointments.completed.find(a => a.id == appointmentId);
            
            if (appointment) {
                showReviewForm(appointment.artisanId, appointmentId);
            }
        });
    });
}

// Update the showArtisanProfile function to show reviews
function showArtisanProfile(artisan) {
    const modalHTML = `
        <div class="modal">
            <div class="modal-content artisan-profile-view">
                <div class="artisan-header">
                    <div class="artisan-photo-large">
                        ${artisan.profilePhoto ? 
                            `<img src="${artisan.profilePhoto}" alt="${artisan.fullName}">` : 
                            `<i class="fas fa-user-circle"></i>`}
                    </div>
                    <div class="artisan-main-info">
                        <h2>${artisan.businessName || artisan.fullName}</h2>
                        <p class="artisan-region">
                            <i class="fas fa-map-marker-alt"></i> ${artisan.region || 'Region not specified'}
                        </p>
                        <div class="rating-stars">
                            ${Array(5).fill().map((_, i) => 
                                `<i class="fas fa-star ${i < Math.floor(artisan.averageRating || 0) ? 'active' : ''}"></i>`
                            ).join('')}
                            <span class="review-count">(${artisan.reviews?.length || 0} reviews)</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>About</h3>
                    <p>${artisan.bio || 'No bio provided.'}</p>
                </div>
                
                <div class="detail-section">
                    <h3>Skills</h3>
                    <div class="skills-list">
                        ${artisan.skills?.map(skill => 
                            `<span class="skill-tag">${skill}</span>`
                        ).join('') || 'No skills listed'}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Experience</h3>
                    <p>${artisan.experience ? `${artisan.experience} years` : 'Not specified'}</p>
                </div>
                
                ${artisan.reviews?.length > 0 ? `
                <div class="detail-section">
                    <h3>Customer Reviews</h3>
                    <div class="reviews-list">
                        ${artisan.reviews.slice(0, 3).map(review => `
                            <div class="review-item">
                                <div class="review-header">
                                    <div class="review-rating">
                                        ${Array(5).fill().map((_, i) => 
                                            `<i class="fas fa-star ${i < review.rating ? 'active' : ''}"></i>`
                                        ).join('')}
                                    </div>
                                    <div class="review-meta">
                                        <span class="review-author">${review.customerName}</span>
                                        <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div class="review-content">
                                    <p>${review.review}</p>
                                </div>
                            </div>
                        `).join('')}
                        ${artisan.reviews.length > 3 ? 
                            `<button class="view-all-reviews-btn">View all ${artisan.reviews.length} reviews</button>` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div class="modal-actions">
                    <button class="close-btn">Close</button>
                    <button class="book-btn">Book Appointment</button>
                </div>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
    
    // Handle close button
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    // Handle book button
    modal.querySelector('.book-btn')?.addEventListener('click', () => {
        modal.remove();
        showBookingForm(artisan.email);
    });
    
    // Handle view all reviews button if it exists
    modal.querySelector('.view-all-reviews-btn')?.addEventListener('click', () => {
        modal.remove();
        showAllReviews(artisan);
    });
}

// Add this new function to show all reviews
function showAllReviews(artisan) {
    const modalHTML = `
        <div class="modal">
            <div class="modal-content">
                <h2>All Reviews for ${artisan.businessName || artisan.fullName}</h2>
                <div class="reviews-list">
                    ${artisan.reviews.map(review => `
                        <div class="review-item">
                            <div class="review-header">
                                <div class="review-rating">
                                    ${Array(5).fill().map((_, i) => 
                                        `<i class="fas fa-star ${i < review.rating ? 'active' : ''}"></i>`
                                    ).join('')}
                                </div>
                                <div class="review-meta">
                                    <span class="review-author">${review.customerName}</span>
                                    <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div class="review-content">
                                <p>${review.review}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-actions">
                    <button class="close-btn">Back to Profile</button>
                </div>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
    
    // Handle close button
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.remove();
        showArtisanProfile(artisan);
    });
}
});