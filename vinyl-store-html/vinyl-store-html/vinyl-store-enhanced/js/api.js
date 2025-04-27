// API Service Module
const API_URL = 'http://localhost:5000/api';

export const fetchRecords = async () => {
    try {
        const response = await fetch(`${API_URL}/records`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching records:', error);
        throw error;
    }
};

export const fetchRecordDetails = async (id) => {
    try {
        const response = await fetch(`${API_URL}/records/${id}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching record details:', error);
        throw error;
    }
};

export const fetchGenres = async () => {
    try {
        const records = await fetchRecords();
        return [...new Set(records.map(record => record.Genre))].filter(Boolean);
    } catch (error) {
        console.error('Error fetching genres:', error);
        return [];
    }
};

// Cart functions
export const getCart = () => {
    return JSON.parse(localStorage.getItem('cart')) || [];
};

export const addToCart = (recordId) => {
    const cart = getCart();
    cart.push(recordId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    return cart;
};

export const removeFromCart = (recordId) => {
    const cart = getCart();
    const index = cart.indexOf(recordId);
    if (index > -1) {
        cart.splice(index, 1);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    return cart;
};

export const clearCart = () => {
    localStorage.removeItem('cart');
    updateCartCount();
};

export const updateCartCount = () => {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const count = getCart().length;
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'flex' : 'none';
    }
};

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', updateCartCount);