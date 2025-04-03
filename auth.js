document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.auth-container');
    const showSignUp = document.getElementById('showSignUp');
    const showSignIn = document.querySelector('.sign-up .auth-footer a');
    const registrationForm = document.getElementById('registrationForm');
    const loginForm = document.getElementById('loginForm');
    const userTypeRadios = document.querySelectorAll('input[name="userType"]');
    const artisanFields = document.getElementById('artisanFields');
    const signUpForm = document.querySelector('.sign-up');
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    const profilePhotoPreview = document.getElementById('profilePhotoPreview');
    const defaultPhotoPreview = document.getElementById('defaultPhotoPreview');

    // Enable scrolling for sign-up form
    signUpForm.style.overflowY = 'auto';

    // Toggle between sign-in and sign-up
    showSignUp.addEventListener('click', (e) => {
        e.preventDefault();
        container.classList.add('active');
    });

    if (showSignIn) {
        showSignIn.addEventListener('click', (e) => {
            e.preventDefault();
            container.classList.remove('active');
        });
    }

    // Show/hide artisan fields
    userTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            artisanFields.style.display = e.target.value === 'artisan' ? 'block' : 'none';
            
            if (e.target.value === 'artisan') {
                setTimeout(() => {
                    signUpForm.scrollTop = signUpForm.scrollHeight;
                }, 100);
            }
        });
    });

    // Profile photo preview with validation
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file type
            if (!file.type.match('image.*')) {
                alert('Please select an image file (JPEG, PNG)');
                this.value = ''; // Clear the invalid file
                return;
            }
            
            // Validate file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size should be less than 2MB');
                this.value = ''; // Clear the oversized file
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                defaultPhotoPreview.style.display = 'none';
                profilePhotoPreview.src = event.target.result;
                profilePhotoPreview.style.display = 'block';
                profilePhotoPreview.onerror = function() {
                    // If image fails to load
                    defaultPhotoPreview.style.display = 'block';
                    profilePhotoPreview.style.display = 'none';
                    profilePhotoInput.value = ''; // Clear the invalid file
                    alert('The selected image could not be loaded. Please try another image.');
                };
            };
            reader.readAsDataURL(file);
        });
    }

    // Password validation feedback
    const passwordInput = document.querySelector('input[name="password"]');
    const passwordFeedback = document.createElement('div');
    passwordFeedback.style.fontSize = '0.8rem';
    passwordFeedback.style.marginTop = '5px';
    passwordInput.parentNode.insertBefore(passwordFeedback, passwordInput.nextSibling);

    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const hasMinLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[@$!%*?&]/.test(password);
        
        let feedback = [];
        if (!hasMinLength) feedback.push('at least 8 characters');
        if (!hasUpperCase) feedback.push('one uppercase letter');
        if (!hasLowerCase) feedback.push('one lowercase letter');
        if (!hasNumber) feedback.push('one number');
        if (!hasSpecialChar) feedback.push('one special character (@$!%*?&)');
        
        if (feedback.length > 0) {
            passwordFeedback.textContent = 'Password needs: ' + feedback.join(', ');
            passwordFeedback.style.color = '#e74c3c';
        } else {
            passwordFeedback.textContent = 'Password strength: Strong';
            passwordFeedback.style.color = '#2da0a8';
        }
    });

    // Form validation
    function validatePassword(password) {
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return re.test(password);
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Registration form submission
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(registrationForm);
        const profilePhoto = formData.get('profilePhoto');
        
        // Add loading state
        const submitBtn = registrationForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        try {
            // Create user object
            const user = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                password: simpleHash(formData.get('password')),
                userType: formData.get('userType'),
                phone: '',
                address: '',
                region: formData.get('region'),
                registrationDate: new Date().toISOString()
            };

            // Handle profile photo if provided
            if (profilePhoto && profilePhoto.size > 0) {
                try {
                    user.profilePhoto = await convertImageToBase64(profilePhoto);
                } catch (error) {
                    console.error('Error processing profile photo:', error);
                    alert('Error processing profile photo. Please try another image.');
                    throw error;
                }
            }

            // Add artisan-specific fields
            if (user.userType === 'artisan') {
                const skills = Array.from(formData.getAll('skills'));
                if (skills.length === 0) {
                    alert('Please select at least one skill');
                    throw new Error('No skills selected');
                }
                if (skills.length > 3) {
                    alert('Maximum of 3 skills allowed');
                    throw new Error('Too many skills');
                }
                
                user.businessName = formData.get('businessName') || '';
                user.skills = skills;
                user.bio = '';
                user.experience = '';
            }

            // Validate form
            if (formData.get('password') !== formData.get('confirmPassword')) {
                alert('Passwords do not match!');
                throw new Error('Password mismatch');
            }
            
            if (!validatePassword(formData.get('password'))) {
                alert('Password must be at least 8 characters with uppercase, lowercase, number and special character');
                throw new Error('Invalid password');
            }
            
            if (!validateEmail(formData.get('email'))) {
                alert('Please enter a valid email address');
                throw new Error('Invalid email');
            }

            // Store user data
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            if (users.some(u => u.email === user.email)) {
                alert('Email already registered!');
                throw new Error('Email exists');
            }
            
            users.push(user);
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            submitBtn.textContent = 'Success! Redirecting...';
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error('Registration failed:', error);
            submitBtn.textContent = 'Error! Try Again';
            setTimeout(() => {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }, 2000);
        }
    });

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = simpleHash(formData.get('password'));
        
        // Add loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                submitBtn.textContent = 'Success! Redirecting...';
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                alert('Invalid email or password');
                throw new Error('Invalid credentials');
            }
        } catch (error) {
            console.error('Login failed:', error);
            submitBtn.textContent = 'Error! Try Again';
            setTimeout(() => {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }, 2000);
        }
    });

    // Helper functions
    function convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
    }

    // Initialize form
    artisanFields.style.display = 'none';
});