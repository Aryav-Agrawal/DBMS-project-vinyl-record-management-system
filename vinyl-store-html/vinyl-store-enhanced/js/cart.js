import { fetchRecordDetails, getCart, removeFromCart, clearCart, updateCartCount, updateCartQuantity } from './api.js';

// Load cart items
const loadCartItems = async () => {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    const cart = getCart();
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <a href="records.html" class="btn btn-primary">Browse Records</a>
            </div>
        `;
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }

    try {
        // Show loading state
        cartItemsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading your cart...</div>';
        
        // Fetch record details for items in cart
        const records = await Promise.all(cart.map(item => fetchRecordDetails(item.recordId)));
        let subtotal = 0;

        // Display cart items
        cartItemsContainer.innerHTML = '';
        records.forEach((record, index) => {
            const cartItem = cart.find(item => item.recordId === record.RecordID);
            if (!cartItem) return;

            const itemTotal = record.Price * cartItem.quantity;
            subtotal += itemTotal;
            
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.style.animationDelay = `${index * 0.1}s`;
            cartItemElement.innerHTML = `
                <div class="cart-item-image">
                    <img src="${record.CoverImageURL || 'assets/images/default-album.png'}" alt="${record.Title}">
                </div>
                <div class="cart-item-details">
                    <div>
                        <h3 class="cart-item-title">${record.Title}</h3>
                        <p class="cart-item-artist">${record.Artist}</p>
                        <p class="cart-item-price">$${(record.Price * cartItem.quantity).toFixed(2)}</p>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-selector">
                            <button onclick="window.updateQuantity(${record.RecordID}, ${cartItem.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" value="${cartItem.quantity}" min="1" max="${record.Stock}" 
                                onchange="window.updateQuantity(${record.RecordID}, this.value)">
                            <button onclick="window.updateQuantity(${record.RecordID}, ${cartItem.quantity + 1})" 
                                ${cartItem.quantity >= record.Stock ? 'disabled' : ''}>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-item" onclick="window.removeFromCart(${record.RecordID})">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });

        // Update summary
        const shipping = 5.99;
        const total = subtotal + shipping;
        
        if (cartSummary) {
            cartSummary.style.display = 'block';
            document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
            document.getElementById('cartShipping').textContent = `$${shipping.toFixed(2)}`;
            document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
            
            const checkoutBtn = document.getElementById('checkoutBtn');
            if (checkoutBtn) {
                checkoutBtn.disabled = subtotal === 0;
            }
        }

    } catch (error) {
        console.error('Error loading cart items:', error);
        cartItemsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading cart items. Please try again later.</p>
                <button onclick="window.location.reload()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }
};

// Make functions available to window for event handlers
window.updateQuantity = async (recordId, newQuantity) => {
    newQuantity = parseInt(newQuantity);
    if (isNaN(newQuantity) || newQuantity < 1) return;
    
    const record = await fetchRecordDetails(recordId);
    if (newQuantity > record.Stock) {
        showNotification(`Only ${record.Stock} items available`, 'error');
        newQuantity = record.Stock;
    }
    
    updateCartQuantity(recordId, newQuantity);
    await loadCartItems();
    showNotification('Cart updated successfully');
};

window.removeFromCart = async (recordId) => {
    const cartItem = document.querySelector(`[onclick*="${recordId}"]`).closest('.cart-item');
    cartItem.classList.add('removing');
    
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for animation
    removeFromCart(recordId);
    await loadCartItems();
    showNotification('Item removed from cart');
};

// Show notification when cart is updated
const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <p>${message}</p>
    `;
    
    const container = document.getElementById('notification-container');
    if (container) {
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
};

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', loadCartItems);