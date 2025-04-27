import { fetchRecords } from './api.js';

// Global state
let currentUser = JSON.parse(localStorage.getItem('user'));
let cartItems = JSON.parse(localStorage.getItem('cart')) || [];

// Update UI based on auth state
function updateAuthUI() {
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const authLinks = document.querySelector('.auth-links');
    
    if (currentUser) {
        authLinks.innerHTML = `
            <div class="user-menu">
                <button class="user-menu-button">
                    ${currentUser.username}
                    <span class="arrow">▼</span>
                </button>
                <div class="user-menu-dropdown">
                    <a href="profile.html">Profile</a>
                    <a href="orders.html">Orders</a>
                    <a href="collection.html">Collection</a>
                    <a href="#" id="logout-button">Logout</a>
                </div>
            </div>
        `;
        
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
    }
}

// Auth event handlers
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await api.login({
            username: formData.get('username'),
            password: formData.get('password')
        });
        
        if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
            currentUser = response.user;
            showNotification('Login successful');
            window.location.href = 'index.html';
        }
    } catch (error) {
        showNotification('Invalid credentials', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    if (formData.get('password') !== formData.get('confirmPassword')) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    try {
        const response = await api.register({
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            address: formData.get('address'),
            newsletterSubscription: formData.get('newsletter') === 'on'
        });
        
        showNotification('Registration successful');
        window.location.href = 'login.html';
    } catch (error) {
        showNotification(error.message || 'Registration failed', 'error');
    }
}

async function handleLogout() {
    try {
        await api.logout();
        localStorage.removeItem('user');
        currentUser = null;
        showNotification('Logged out successfully');
        window.location.href = 'index.html';
    } catch (error) {
        showNotification('Error logging out', 'error');
    }
}

// Cart functions
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function addToCart(recordId, quantity = 1) {
    const existingItem = cartItems.find(item => item.recordId === recordId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cartItems.push({ recordId, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cartItems));
    updateCartCount();
    showNotification('Item added to cart');
}

// Notification system
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    }, 3000);
}

// Format currency
function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadFeaturedRecords();

    // Add hover effect to genre cards
    document.querySelectorAll('.genre-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.querySelector('h3').style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', () => {
            card.querySelector('h3').style.transform = 'translateY(0)';
        });
    });
});

// Handle Back to Top button
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Handle newsletter form submission
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        const button = newsletterForm.querySelector('button');
        const originalText = button.innerHTML;

        try {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
            button.disabled = true;
            emailInput.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Show success message
            newsletterForm.innerHTML = `
                <div class="success-message">
                    <i class="fas fa-check-circle"></i>
                    <p>Thank you for subscribing!</p>
                </div>
            `;
        } catch (error) {
            button.innerHTML = originalText;
            button.disabled = false;
            emailInput.disabled = false;
            alert('Failed to subscribe. Please try again.');
        }
    });
}

// Load featured records
async function loadFeaturedRecords() {
    const recordsGrid = document.getElementById('records-grid');
    if (!recordsGrid) return;

    try {
        let records = await fetchRecords();
        if (!records.length) {
            console.log('No records from API, using mock data');
            records = mockRecords;
        }

        recordsGrid.innerHTML = records.slice(0, 4).map((record, index) => `
            <div class="record-card" style="animation-delay: ${index * 0.1}s">
                <div class="record-image">
                    <img src="${record.CoverImageURL || `assets/images/${record.Genre?.toLowerCase()}.jpg`}" 
                         alt="${record.Title}"
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/300x300?text=${encodeURIComponent(record.Title)}'">
                    ${record.Stock < 5 ? '<span class="badge">Low Stock</span>' : ''}
                </div>
                <div class="record-info">
                    <h3 class="record-title">${record.Title}</h3>
                    <p class="record-artist">${record.Artist}</p>
                    <p class="record-price">$${record.Price?.toFixed(2) || '0.00'}</p>
                    <div class="record-actions">
                        <a href="record-detail.html?id=${record.RecordID}" class="btn btn-primary">View Details</a>
                        ${record.Stock > 0 ? `
                            <button onclick="addToCart(${record.RecordID})" class="btn btn-secondary">
                                Add to Cart
                            </button>
                        ` : '<button class="btn btn-secondary" disabled>Out of Stock</button>'}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading featured records:', error);
        // Use mock data as fallback
        recordsGrid.innerHTML = mockRecords.map((record, index) => `
            <div class="record-card" style="animation-delay: ${index * 0.1}s">
                <div class="record-image">
                    <img src="${record.CoverImageURL}" 
                         alt="${record.Title}"
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/300x300?text=${encodeURIComponent(record.Title)}'">
                    ${record.Stock < 5 ? '<span class="badge">Low Stock</span>' : ''}
                </div>
                <div class="record-info">
                    <h3 class="record-title">${record.Title}</h3>
                    <p class="record-artist">${record.Artist}</p>
                    <p class="record-price">$${record.Price.toFixed(2)}</p>
                    <div class="record-actions">
                        <a href="record-detail.html?id=${record.RecordID}" class="btn btn-primary">View Details</a>
                        ${record.Stock > 0 ? `
                            <button onclick="addToCart(${record.RecordID})" class="btn btn-secondary">
                                Add to Cart
                            </button>
                        ` : '<button class="btn btn-secondary" disabled>Out of Stock</button>'}
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Make addToCart globally available
window.addToCart = addToCart;

// Mock data for when backend is not available
const mockRecords = [
    {
        RecordID: 1,
        Title: "Dark Side of the Moon",
        Artist: "Pink Floyd",
        Genre: "Rock",
        Price: 29.99,
        Stock: 5,
        CoverImageURL: "assets/images/rock.jpg"
    },
    {
        RecordID: 2,
        Title: "Kind of Blue",
        Artist: "Miles Davis",
        Genre: "Jazz",
        Price: 24.99,
        Stock: 3,
        CoverImageURL: "assets/images/jazz.jpg"
    },
    {
        RecordID: 3,
        Title: "Symphony No. 5",
        Artist: "Beethoven",
        Genre: "Classical",
        Price: 19.99,
        Stock: 8,
        CoverImageURL: "assets/images/classical.jpg"
    },
    {
        RecordID: 4,
        Title: "Thriller",
        Artist: "Michael Jackson",
        Genre: "Pop",
        Price: 27.99,
        Stock: 2,
        CoverImageURL: "assets/images/pop.jpg"
    }
];