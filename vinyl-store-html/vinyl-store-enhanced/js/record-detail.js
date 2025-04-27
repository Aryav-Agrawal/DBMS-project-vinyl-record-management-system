let currentRecord = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get('id');
    
    if (!recordId) {
        window.location.href = 'records.html';
        return;
    }
    
    await loadRecordDetails(recordId);
    setupTabNavigation();
    setupReviewForm();
});

async function loadRecordDetails(recordId) {
    try {
        const record = await api.getRecord(recordId);
        currentRecord = record;
        
        // Update page title
        document.title = `${record.Title} by ${record.Artist} - Vinyl Store`;
        
        // Render record details
        const detailContainer = document.getElementById('record-detail');
        detailContainer.innerHTML = `
            <div class="record-hero">
                <div class="record-image">
                    <img src="${record.CoverImageURL || 'assets/images/default-album.png'}" alt="${record.Title}">
                </div>
                <div class="record-info">
                    <h1>${record.Title}</h1>
                    <h2>${record.Artist}</h2>
                    <div class="record-meta">
                        <span class="genre">${record.Genre}</span>
                        <span class="format">${record.Format}</span>
                        <span class="condition">${record.Condition}</span>
                    </div>
                    <div class="price-section">
                        <div class="price">${formatPrice(record.Price)}</div>
                        <div class="stock-status ${record.Stock > 0 ? 'in-stock' : 'out-of-stock'}">
                            ${record.Stock > 0 ? `${record.Stock} in stock` : 'Out of Stock'}
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button onclick="addToCart(${record.RecordID})" 
                                class="add-to-cart-button" 
                                ${record.Stock === 0 ? 'disabled' : ''}>
                            ${record.Stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button onclick="addToWishlist(${record.RecordID})" 
                                class="wishlist-button">
                            Add to Wishlist
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Populate tabs content
        document.getElementById('tracklist').innerHTML = `
            <div class="track-list">
                ${record.tracks.map(track => `
                    <div class="track-item">
                        <span class="track-number">${track.TrackNumber}</span>
                        <span class="track-title">${track.Title}</span>
                        <span class="track-duration">${track.Duration}</span>
                        <span class="track-side">Side ${track.Side}</span>
                    </div>
                `).join('')}
            </div>
        `;

        document.getElementById('description').innerHTML = `
            <div class="record-description">
                <p>${record.Description || 'No description available.'}</p>
                <div class="additional-info">
                    <h3>Label Information</h3>
                    <p>Label: ${record.Label}</p>
                    <p>Catalog Number: ${record.CatalogNumber}</p>
                    <p>Release Year: ${record.ReleaseYear}</p>
                </div>
            </div>
        `;

        document.getElementById('specs').innerHTML = `
            <div class="specifications">
                <div class="spec-item">
                    <span class="spec-label">Format:</span>
                    <span class="spec-value">${record.Format}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Speed:</span>
                    <span class="spec-value">${record.Speed} RPM</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Weight:</span>
                    <span class="spec-value">${record.Weight}g</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Condition:</span>
                    <span class="spec-value">${record.Condition}</span>
                </div>
            </div>
        `;

        await loadReviews(recordId);

    } catch (error) {
        console.error('Error loading record details:', error);
        showNotification('Error loading record details', 'error');
    }
}

async function loadReviews(recordId) {
    try {
        const reviews = await api.getRecordReviews(recordId);
        const reviewsContainer = document.querySelector('.reviews-list');
        const ratingSummary = document.querySelector('.rating-summary');

        if (reviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="no-reviews">
                    <p>No reviews yet. Be the first to review this record!</p>
                </div>
            `;
            return;
        }

        // Calculate average ratings
        const avgOverall = calculateAverageRating(reviews, 'Rating');
        const avgSound = calculateAverageRating(reviews, 'SoundQualityRating');
        const avgPackaging = calculateAverageRating(reviews, 'PackagingRating');

        ratingSummary.innerHTML = `
            <div class="rating-stat">
                <span class="rating-label">Overall</span>
                <div class="stars">${generateStars(avgOverall)}</div>
                <span class="rating-value">${avgOverall.toFixed(1)}</span>
            </div>
            <div class="rating-stat">
                <span class="rating-label">Sound Quality</span>
                <div class="stars">${generateStars(avgSound)}</div>
                <span class="rating-value">${avgSound.toFixed(1)}</span>
            </div>
            <div class="rating-stat">
                <span class="rating-label">Packaging</span>
                <div class="stars">${generateStars(avgPackaging)}</div>
                <span class="rating-value">${avgPackaging.toFixed(1)}</span>
            </div>
        `;

        reviewsContainer.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-meta">
                        <span class="reviewer-name">${review.Username}</span>
                        <span class="review-date">${new Date(review.ReviewDate).toLocaleDateString()}</span>
                    </div>
                    <div class="review-ratings">
                        <div class="stars">${generateStars(review.Rating)}</div>
                    </div>
                </div>
                <div class="review-content">
                    <p>${review.Comment}</p>
                </div>
                <div class="review-footer">
                    <div class="review-stats">
                        <span>Sound Quality: ${generateStars(review.SoundQualityRating)}</span>
                        <span>Packaging: ${generateStars(review.PackagingRating)}</span>
                    </div>
                    <div class="review-helpful">
                        <button onclick="markHelpful(${review.ReviewID}, true)">
                            <span>${review.Helpful}</span> Helpful
                        </button>
                        <button onclick="markHelpful(${review.ReviewID}, false)">
                            <span>${review.NotHelpful}</span> Not Helpful
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading reviews:', error);
        showNotification('Error loading reviews', 'error');
    }
}

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

function setupReviewForm() {
    const writeReviewButton = document.getElementById('write-review');
    const reviewForm = document.getElementById('review-form');
    const cancelButton = document.getElementById('cancel-review');
    const submitForm = document.getElementById('submit-review-form');

    writeReviewButton?.addEventListener('click', () => {
        if (!currentUser) {
            showNotification('Please login to write a review', 'error');
            window.location.href = 'login.html';
            return;
        }
        reviewForm.classList.remove('hidden');
    });

    cancelButton?.addEventListener('click', () => {
        reviewForm.classList.add('hidden');
        submitForm.reset();
    });

    submitForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        try {
            await api.addReview(currentRecord.RecordID, {
                rating: parseInt(formData.get('rating')),
                soundQualityRating: parseInt(formData.get('soundQualityRating')),
                packagingRating: parseInt(formData.get('packagingRating')),
                comment: formData.get('comment')
            });

            showNotification('Review submitted successfully');
            reviewForm.classList.add('hidden');
            submitForm.reset();
            await loadReviews(currentRecord.RecordID);

        } catch (error) {
            console.error('Error submitting review:', error);
            showNotification('Error submitting review', 'error');
        }
    });
}

function calculateAverageRating(reviews, ratingField) {
    const validRatings = reviews.filter(review => review[ratingField] != null);
    if (validRatings.length === 0) return 0;
    
    const sum = validRatings.reduce((acc, review) => acc + review[ratingField], 0);
    return sum / validRatings.length;
}

function generateStars(rating) {
    const fullStar = '★';
    const emptyStar = '☆';
    const roundedRating = Math.round(rating);
    
    return `
        ${fullStar.repeat(roundedRating)}${emptyStar.repeat(5 - roundedRating)}
    `;
}

async function markHelpful(reviewId, isHelpful) {
    if (!currentUser) {
        showNotification('Please login to mark reviews as helpful', 'error');
        return;
    }

    try {
        await api.markReviewHelpful(reviewId, isHelpful);
        await loadReviews(currentRecord.RecordID);
    } catch (error) {
        console.error('Error marking review as helpful:', error);
        showNotification('Error updating review', 'error');
    }
}