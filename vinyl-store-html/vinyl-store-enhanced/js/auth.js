document.addEventListener('DOMContentLoaded', () => {
    // Password visibility toggle
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Update icon (assuming you have both eye.svg and eye-off.svg)
            const img = this.querySelector('img');
            img.src = type === 'password' ? 'assets/icons/eye.svg' : 'assets/icons/eye-off.svg';
        });
    });

    // Password strength validation
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        const requirements = {
            length: (str) => str.length >= 8,
            letter: (str) => /[A-Za-z]/.test(str),
            number: (str) => /\d/.test(str)
        };

        passwordInput.addEventListener('input', function() {
            const password = this.value;
            
            // Update requirement indicators
            Object.keys(requirements).forEach(req => {
                const li = document.querySelector(`[data-requirement="${req}"]`);
                if (li) {
                    li.classList.toggle('valid', requirements[req](password));
                }
            });
        });
    }

    // Form submissions
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = {
                    username: e.target.email.value,
                    password: e.target.password.value
                };

                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData),
                    credentials: 'include'
                });

                const data = await response.json();

                if (response.ok) {
                    showNotification('Login successful!', 'success');
                    // Store user info in localStorage if remember me is checked
                    if (e.target.remember.checked) {
                        localStorage.setItem('userEmail', formData.username);
                    }
                    // Redirect to home page after successful login
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                } else {
                    showNotification(data.error || 'Login failed. Please try again.', 'error');
                }
            } catch (error) {
                showNotification('An error occurred. Please try again.', 'error');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (e.target.password.value !== e.target['confirm-password'].value) {
                showNotification('Passwords do not match!', 'error');
                return;
            }

            try {
                const formData = {
                    username: e.target.email.value,
                    email: e.target.email.value,
                    password: e.target.password.value,
                    firstName: e.target.name.value.split(' ')[0],
                    lastName: e.target.name.value.split(' ').slice(1).join(' ')
                };

                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    showNotification('Registration successful! Please login.', 'success');
                    // Redirect to login page after successful registration
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 1500);
                } else {
                    showNotification(data.error || 'Registration failed. Please try again.', 'error');
                }
            } catch (error) {
                showNotification('An error occurred. Please try again.', 'error');
            }
        });
    }

    // Password reset modal
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const passwordResetModal = document.getElementById('password-reset-modal');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const cancelResetBtn = document.getElementById('cancel-reset');

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            passwordResetModal.classList.remove('hidden');
        });
    }

    if (cancelResetBtn) {
        cancelResetBtn.addEventListener('click', () => {
            passwordResetModal.classList.add('hidden');
        });
    }

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const email = e.target.email.value;
                const response = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    showNotification('Password reset link sent to your email!', 'success');
                    passwordResetModal.classList.add('hidden');
                } else {
                    showNotification(data.error || 'Failed to send reset link. Please try again.', 'error');
                }
            } catch (error) {
                showNotification('An error occurred. Please try again.', 'error');
            }
        });
    }

    // Show notification function
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.getElementById('notification-container').appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Handle social login buttons
    document.querySelectorAll('.social-button').forEach(button => {
        button.addEventListener('click', async () => {
            const provider = button.classList.contains('google') ? 'google' : 'facebook';
            try {
                window.location.href = `/api/auth/${provider}`;
            } catch (error) {
                showNotification(`${provider} login failed. Please try again.`, 'error');
            }
        });
    });
});