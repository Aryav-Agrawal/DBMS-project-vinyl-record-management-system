import { fetchRecords, addToCart } from './api.js';

// State management for filters and pagination
let currentFilters = {
    genres: [],
    conditions: [],
    formats: [],
    priceRange: {
        min: null,
        max: null
    }
};

let currentSort = 'title-asc';
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadRecords();
});

async function loadRecords() {
    const recordsGrid = document.getElementById('records-grid');
    recordsGrid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const response = await fetchRecords({
            page: currentPage,
            perPage: 12,
            genre: currentFilters.genres.length === 1 ? currentFilters.genres[0] : undefined,
            condition: currentFilters.conditions.length === 1 ? currentFilters.conditions[0] : undefined
        });

        if (!response.records || response.records.length === 0) {
            recordsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <h2>No records found</h2>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            `;
            return;
        }

        // Apply client-side filtering
        let filteredRecords = response.records.filter(record => {
            // Genre filter (client-side for multiple genres)
            if (currentFilters.genres.length > 0 && !currentFilters.genres.includes(record.Genre)) {
                return false;
            }
            
            // Condition filter (client-side for multiple conditions)
            if (currentFilters.conditions.length > 0 && !currentFilters.conditions.includes(record.Condition)) {
                return false;
            }
            
            // Format filter
            if (currentFilters.formats.length > 0 && !currentFilters.formats.includes(record.Format)) {
                return false;
            }
            
            // Price range filter
            if (currentFilters.priceRange.min && record.Price < currentFilters.priceRange.min) {
                return false;
            }
            if (currentFilters.priceRange.max && record.Price > currentFilters.priceRange.max) {
                return false;
            }
            
            // Search query
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                return record.Title.toLowerCase().includes(searchLower) ||
                       record.Artist.toLowerCase().includes(searchLower) ||
                       (record.CatalogNumber && record.CatalogNumber.toLowerCase().includes(searchLower));
            }
            
            return true;
        });

        // Sort records
        filteredRecords.sort((a, b) => {
            switch (currentSort) {
                case 'title-asc':
                    return a.Title.localeCompare(b.Title);
                case 'title-desc':
                    return b.Title.localeCompare(a.Title);
                case 'price-asc':
                    return a.Price - b.Price;
                case 'price-desc':
                    return b.Price - a.Price;
                case 'newest':
                    return b.ReleaseYear - a.ReleaseYear;
                default:
                    return 0;
            }
        });

        // Update pagination info
        totalPages = response.pagination.pages;

        // Clear grid and add records
        recordsGrid.innerHTML = '';
        filteredRecords.forEach(record => {
            const recordCard = createRecordCard(record);
            recordsGrid.appendChild(recordCard);
        });

        // Update pagination UI
        updatePagination();

    } catch (error) {
        console.error('Error loading records:', error);
        recordsGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Error loading records</h2>
                <p>Unable to connect to the server. Please try again later.</p>
                <button onclick="window.location.reload()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }
}

function createRecordCard(record) {
    const card = document.createElement('div');
    card.className = 'record-card';
    
    card.innerHTML = `
        <div class="record-image">
            <img src="${record.CoverImageURL || `assets/images/${record.Genre?.toLowerCase()}.jpg`}" 
                 alt="${record.Title}"
                 onerror="this.onerror=null;this.src='https://via.placeholder.com/300x300?text=${encodeURIComponent(record.Title)}'">
            ${record.Stock < 5 ? '<span class="badge">Low Stock</span>' : ''}
            ${record.Condition === 'New' ? '<span class="badge new">New</span>' : ''}
        </div>
        <div class="record-info">
            <h3 class="record-title">${record.Title}</h3>
            <p class="record-artist">${record.Artist}</p>
            <p class="record-genre">${record.Genre}</p>
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
    `;
    
    return card;
}

function updatePagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    if (prevButton) prevButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage === totalPages;
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            currentPage = 1;
            loadRecords();
        });
    }

    // Filter checkboxes
    document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateFilters();
            currentPage = 1;
            loadRecords();
        });
    });

    // Price range
    const applyPriceButton = document.getElementById('apply-price');
    if (applyPriceButton) {
        applyPriceButton.addEventListener('click', () => {
            const minPrice = document.getElementById('min-price').value;
            const maxPrice = document.getElementById('max-price').value;
            
            currentFilters.priceRange.min = minPrice ? parseFloat(minPrice) : null;
            currentFilters.priceRange.max = maxPrice ? parseFloat(maxPrice) : null;
            
            currentPage = 1;
            loadRecords();
        });
    }

    // Clear filters
    const clearFiltersButton = document.getElementById('clear-filters');
    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', () => {
            clearFilters();
            loadRecords();
        });
    }

    // Pagination
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadRecords();
            }
        });

        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadRecords();
            }
        });
    }
}

function updateFilters() {
    currentFilters.genres = Array.from(
        document.querySelectorAll('.filter-options input[name="genre"]:checked')
    ).map(cb => cb.value);

    currentFilters.conditions = Array.from(
        document.querySelectorAll('.filter-options input[name="condition"]:checked')
    ).map(cb => cb.value);

    currentFilters.formats = Array.from(
        document.querySelectorAll('.filter-options input[name="format"]:checked')
    ).map(cb => cb.value);
}

function clearFilters() {
    // Clear checkboxes
    document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Clear price range
    const minPrice = document.getElementById('min-price');
    const maxPrice = document.getElementById('max-price');
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';

    // Reset filter state
    currentFilters = {
        genres: [],
        conditions: [],
        formats: [],
        priceRange: {
            min: null,
            max: null
        }
    };
    searchQuery = '';
    currentPage = 1;
}

// Make addToCart available globally
window.addToCart = addToCart;