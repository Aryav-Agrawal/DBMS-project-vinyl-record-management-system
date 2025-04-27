// API Service Module
const API_URL = 'http://localhost:8000/api';

// Records API
export const fetchRecords = async (options = {}) => {
    try {
        const { page = 1, perPage = 12, genre, condition } = options;
        let url = `${API_URL}/records?page=${page}&per_page=${perPage}`;
        
        if (genre) url += `&genre=${encodeURIComponent(genre)}`;
        if (condition) url += `&condition=${encodeURIComponent(condition)}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        return {
            records: data.records || [],
            pagination: data.pagination || {
                total: 0,
                pages: 0,
                current_page: 1,
                per_page: perPage,
                has_next: false,
                has_prev: false
            }
        };
    } catch (error) {
        console.error('Error fetching records:', error);
        throw error;
    }
};

export const fetchRecordDetails = async (id) => {
    try {
        const response = await fetch(`${API_URL}/records/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Record not found');
            }
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching record details:', error);
        throw error;
    }
};

// Auth API
export const login = async (credentials) => {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials),
            credentials: 'include'
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        return data;
    } catch (error) {
        console.error('Error during login:', error);
        throw error;
    }
};

export const register = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        return data;
    } catch (error) {
        console.error('Error during registration:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Logout failed');
        }
        return data;
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
};

// Cart functions
export const getCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    return cart.map(item => ({
        recordId: item.recordId || item,
        quantity: item.quantity || 1
    }));
};

export const addToCart = (recordId, quantity = 1) => {
    const cart = getCart();
    const existingItem = cart.find(item => item.recordId === recordId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ recordId, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    return cart;
};

export const removeFromCart = (recordId) => {
    let cart = getCart();
    cart = cart.filter(item => item.recordId !== recordId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    return cart;
};

export const updateCartQuantity = (recordId, quantity) => {
    const cart = getCart();
    const item = cart.find(item => item.recordId === recordId);
    if (item) {
        item.quantity = Math.max(1, parseInt(quantity));
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    }
    return cart;
};

export const clearCart = () => {
    localStorage.removeItem('cart');
    updateCartCount();
};

export const updateCartCount = () => {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const cart = getCart();
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = count;
    }
};

// Initialize cart count when api.js is loaded
document.addEventListener('DOMContentLoaded', updateCartCount);