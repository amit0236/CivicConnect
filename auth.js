// auth.js - Authentication Logic (FINAL UPDATED)

// Initialize storage
function initializeStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }

    if (!localStorage.getItem('adminAccount')) {
        const adminAccount = {
            email: 'admin@civicconnect.com',
            password: 'admin@123',
            name: 'System Administrator'
        };
        localStorage.setItem('adminAccount', JSON.stringify(adminAccount));
    }

    if (!localStorage.getItem('civicIssues')) {
        localStorage.setItem('civicIssues', JSON.stringify([]));
    }
}

// Email Validation (IMPORTANT FIX)
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;   // Proper email regex
    return re.test(email);
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const icon = notification.querySelector('.notification-icon');
    const messageEl = notification.querySelector('.notification-message');

    icon.className = 'notification-icon';
    if (type === 'success') {
        icon.classList.add('fas', 'fa-check-circle');
        notification.className = 'notification success';
    } else {
        icon.classList.add('fas', 'fa-exclamation-circle');
        notification.className = 'notification error';
    }

    messageEl.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Show loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

// Toggle password visibility
function setupPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

// Switch between auth cards
function switchAuthCard(cardId) {
    document.querySelectorAll('.auth-card').forEach(card => card.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));

    document.getElementById(cardId).classList.add('active');

    const navTab = document.querySelector(`.nav-tab[data-target="${cardId}"]`);
    if (navTab) navTab.classList.add('active');
}

// Handle User Login
function handleUserLogin(event) {
    event.preventDefault();

    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;

    if (!isValidEmail(email)) {
        showNotification("Invalid email format.", "error");
        return;
    }

    showLoading();

    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify({
                email: user.email,
                name: user.name,
                role: 'user'
            }));
            showNotification('Login successful. Redirecting...');
            window.location.href = 'user-dashboard.html';
        } else {
            showNotification('Incorrect email or password.', 'error');
            hideLoading();
        }
    }, 800);
}

// Handle User Signup
function handleUserSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!isValidEmail(email)) {
        showNotification("Please enter a valid email address.", "error");
        return;
    }

    showLoading();

    setTimeout(() => {
        let users = JSON.parse(localStorage.getItem('users')) || [];

        if (users.some(u => u.email === email)) {
            showNotification('Email already registered.', 'error');
            hideLoading();
            return;
        }

        const newUser = {
            name,
            email,
            password,
            joined: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        localStorage.setItem('currentUser', JSON.stringify({
            email: newUser.email,
            name: newUser.name,
            role: 'user'
        }));

        showNotification('Account created successfully! Redirecting...');
        setTimeout(() => window.location.href = 'user-dashboard.html', 1000);

    }, 800);
}

// Handle Admin Login
function handleAdminLogin(event) {
    event.preventDefault();

    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (!isValidEmail(email)) {
        showNotification("Invalid admin email format.", "error");
        return;
    }

    showLoading();

    setTimeout(() => {
        const adminAccount = JSON.parse(localStorage.getItem('adminAccount'));

        if (email === adminAccount.email && password === adminAccount.password) {
            localStorage.setItem('currentUser', JSON.stringify({
                email: adminAccount.email,
                name: adminAccount.name,
                role: 'admin'
            }));

            showNotification('Admin login successful. Redirecting...');
            window.location.href = 'admin-dashboard.html';
        } else {
            showNotification('Wrong admin credentials.', 'error');
            hideLoading();
        }
    }, 800);
}

// Global logout function
window.logout = function() {
    showLoading();
    setTimeout(() => {
        localStorage.removeItem('currentUser');
        showNotification('Logged out successfully');
        setTimeout(() => window.location.href = 'index.html', 600);
    }, 600);
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();
    setupPasswordToggle();

    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            switchAuthCard(this.dataset.target);
        });
    });

    document.getElementById('showUserSignup').addEventListener('click', e => {
        e.preventDefault(); switchAuthCard('userSignupCard');
    });

    document.getElementById('showUserLogin').addEventListener('click', e => {
        e.preventDefault(); switchAuthCard('userLoginCard');
    });

    document.getElementById('showUserLoginFromSignup').addEventListener('click', e => {
        e.preventDefault(); switchAuthCard('userLoginCard');
    });

    document.getElementById('userLoginForm').addEventListener('submit', handleUserLogin);
    document.getElementById('userSignupForm').addEventListener('submit', handleUserSignup);
    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
});
