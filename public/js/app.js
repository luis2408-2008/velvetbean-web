// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active'); // Optional: transform hamburger to X
    });
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(18, 18, 18, 1)';
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    } else {
        navbar.style.background = 'rgba(18, 18, 18, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Cart Logic
const Cart = {
    key: 'velvet_cart',

    getItems() {
        return JSON.parse(localStorage.getItem(this.key)) || [];
    },

    addItem(product) {
        let items = this.getItems();
        let existing = items.find(i => i.id === product.id);

        if (existing) {
            existing.quantity += 1;
        } else {
            items.push({ ...product, quantity: 1 });
        }

        localStorage.setItem(this.key, JSON.stringify(items));
        this.updateBadge();
        alert('Product added to cart!');
    },

    removeItem(id) {
        let items = this.getItems();
        items = items.filter(i => i.id !== id);
        localStorage.setItem(this.key, JSON.stringify(items));
        this.updateBadge();
        return items; // Return for UI update
    },

    updateQuantity(id, change) {
        let items = this.getItems();
        let item = items.find(i => i.id === id);

        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                return this.removeItem(id);
            }
        }

        localStorage.setItem(this.key, JSON.stringify(items));
        this.updateBadge();
        return items;
    },

    clear() {
        localStorage.removeItem(this.key);
        this.updateBadge();
    },

    getTotal() {
        return this.getItems().reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    updateBadge() {
        const items = this.getItems();
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        const badge = document.getElementById('cart-badge');

        if (badge) {
            if (count > 0) {
                badge.style.display = 'block';
                badge.innerText = count;
            } else {
                badge.style.display = 'none';
            }
        }
    }
};

// Init Badge
document.addEventListener('DOMContentLoaded', () => {
    Cart.updateBadge();
});
