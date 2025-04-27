import { fetchRecords, fetchRecordDetails, fetchGenres, addToCart, updateCartCount } from './api.js';

// DOM Elements
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mainNav = document.querySelector('.main-nav');
const backToTopBtn = document.getElementById('backToTop');
const loadingOverlay = document.getElementById('loadingOverlay');

// Mobile Menu Toggle
if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        mobileMenuBtn.innerHTML = mainNav.classList.contains('active') ? 
            '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
}

// Back to Top Button
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
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

// Header Scroll Effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('.main-header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Loading Overlay
if (loadingOverlay) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, 500);
    });
}

// Home Page Features
if (document.getElementById('featuredRecords')) {
    const loadFeaturedRecords = async () => {
        try {
            const records = await fetchRecords();
            const featuredContainer = document.getElementById('featuredRecords');
            
            featuredContainer.innerHTML = '';
            
            records.slice(0, 3).forEach((record, index) => {
                const recordElement = document.createElement('div');
                recordElement.className = `record-card fade-in delay-${index}`;
                recordElement.innerHTML = `
                    <div class="record-image" style="background-image: url('https://via.placeholder.com/300x300?text=${encodeURIComponent(record.Title)}')">
                        ${record.Condition === 'New' ? '<span class="record-badge">New</span>' : ''}
                    </div>
                    <div class="record-info">
                        <h3 class="record-title">${record.Title}</h3>
                        <p class="record-artist">${record.Artist}</p>
                        <p class="record-price">$${record.Price}</p>
                        <div class="record-actions">
                            <a href="record-detail.html?id=${record.RecordID}" class="btn btn-primary">Details</a>
                            <button class="btn btn-secondary" onclick="addToCart(${record.RecordID})">Add to Cart</button>
                        </div>
                    </div>
                `;
                featuredContainer.appendChild(recordElement);
            });
        } catch (error) {
            console.error('Error loading featured records:', error);
        }
    };
    
    loadFeaturedRecords();
}

// Browse Records Page
if (document.getElementById('allRecords')) {
    const loadAllRecords = async () => {
        try {
            const [records, genres] = await Promise.all([
                fetchRecords(),
                fetchGenres()
            ]);
            
            const recordsContainer = document.getElementById('allRecords');
            const genreFilter = document.getElementById('genreFilter');
            
            // Populate genre filter
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre;
                option.textContent = genre;
                genreFilter.appendChild(option);
            });
            
            // Display records
            recordsContainer.innerHTML = '';
            records.forEach((record, index) => {
                const recordElement = document.createElement('div');
                recordElement.className = `record-card fade-in delay-${index % 3}`;
                recordElement.innerHTML = `
                    <div class="record-image" style="background-image: url('https://via.placeholder.com/300x300?text=${encodeURIComponent(record.Title)}')">
                        ${record.Condition === 'New' ? '<span class="record-badge">New</span>' : ''}
                    </div>
                    <div class="record-info">
                        <h3 class="record-title">${record.Title}</h3>
                        <p class="record-artist">${record.Artist}</p>
                        <p class="record-genre">${record.Genre}</p>
                        <p class="record-price">$${record.Price}</p>
                        <div class="record-actions">
                            <a href="record-detail.html?id=${record.RecordID}" class="btn btn-primary">Details</a>
                            <button class="btn btn-secondary" onclick="addToCart(${record.RecordID})">Add to Cart</button>
                        </div>
                    </div>
                `;
                recordsContainer.appendChild(recordElement);
            });
            
            // Filter functionality
            document.getElementById('searchInput').addEventListener('input', filterRecords);
            document.getElementById('genreFilter').addEventListener('change', filterRecords);
            
            function filterRecords() {
                const searchTerm = document.getElementById('searchInput').value.toLowerCase();
                const selectedGenre = document.getElementById('genreFilter').value.toLowerCase();
                
                document.querySelectorAll('.record-card').forEach(card => {
                    const title = card.querySelector('.record-title').textContent.toLowerCase();
                    const artist = card.querySelector('.record-artist').textContent.toLowerCase();
                    const genre = card.querySelector('.record-genre').textContent.toLowerCase();
                    
                    const matchesSearch = title.includes(searchTerm) || artist.includes(searchTerm);
                    const matchesGenre = !selectedGenre || genre.includes(selectedGenre);
                    
                    card.style.display = matchesSearch && matchesGenre ? 'block' : 'none';
                });
            }
        } catch (error) {
            console.error('Error loading all records:', error);
        }
    };
    
    loadAllRecords();
}

// Record Detail Page
if (document.getElementById('recordDetail')) {
    const loadRecordDetails = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const recordId = urlParams.get('id');
        
        if (recordId) {
            try {
                const record = await fetchRecordDetails(recordId);
                const recordDetail = document.getElementById('recordDetail');
                
                recordDetail.innerHTML = `
                    <div class="record-detail-container">
                        <div class="record-detail-image">
                            <div class="image-placeholder" style="background-image: url('https://via.placeholder.com/500x500?text=${encodeURIComponent(record.Title)}')"></div>
                        </div>
                        <div class="record-detail-info">
                            <h2>${record.Title}</h2>
                            <h3>${record.Artist}</h3>
                            <div class="detail-meta">
                                <p><strong>Genre:</strong> ${record.Genre}</p>
                                <p><strong>Release Year:</strong> ${record.ReleaseYear}</p>
                                <p><strong>Condition:</strong> ${record.Condition}</p>
                                <p><strong>Price:</strong> $${record.Price}</p>
                                <p><strong>In Stock:</strong> ${record.Stock > 0 ? 
                                    `<span class="in-stock">${record.Stock} available</span>` : 
                                    '<span class="out-of-stock">Out of stock</span>'}</p>
                            </div>
                            <p class="record-description">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                            <div class="detail-actions">
                                <button class="btn btn-primary" onclick="addToCart(${record.RecordID})" ${record.Stock <= 0 ? 'disabled' : ''}>
                                    ${record.Stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                                <button class="btn btn-secondary">
                                    <i class="far fa-heart"></i> Add to Wishlist
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Error loading record details:', error);
                document.getElementById('recordDetail').innerHTML = `
                    <div class="error-message">
                        <h2>Record not found</h2>
                        <p>We couldn't find the record you're looking for.</p>
                        <a href="records.html" class="btn btn-primary">Browse Records</a>
                    </div>
                `;
            }
        }
    };
    
    loadRecordDetails();
}

// Newsletter Form
if (document.getElementById('newsletterForm')) {
    document.getElementById('newsletterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input').value;
        
        // In a real app, you would send this to your backend
        console.log('Subscribed email:', email);
        
        // Show success message
        const form = e.target;
        form.innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <p>Thank you for subscribing!</p>
            </div>
        `;
    });
}

// Make addToCart available globally
window.addToCart = addToCart;