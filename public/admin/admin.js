const API_URL = '/api';

// DOM Elements
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const addProductForm = document.getElementById('add-product-form');
const productList = document.getElementById('admin-product-list');
const logoutBtn = document.getElementById('logout-btn');

// Check Auth on Load
const token = localStorage.getItem('adminToken');
if (token) {
    showDashboard();
} else {
    showLogin();
}

function showLogin() {
    loginView.style.display = 'block';
    dashboardView.style.display = 'none';
}

function showDashboard() {
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    loadProducts();
}

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.token) {
            localStorage.setItem('adminToken', data.token);
            showDashboard();
        } else {
            alert('Login failed: ' + (data.message || 'Unknown error'));
        }
    } catch (err) {
        console.error(err);
        alert('Server error');
    }
});

// Logout Handler
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    showLogin();
});

// Load Products
async function loadProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        const data = await res.json();

        if (data.message === 'success') {
            renderAdminProducts(data.data);
        }
    } catch (err) {
        console.error(err);
    }
}

function renderAdminProducts(products) {
    productList.innerHTML = '';
    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-list-item';

        let imgDisplay = p.image ? `<img src="../uploads/${p.image}">` : '';

        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                ${imgDisplay}
                <div>
                    <strong>${p.name}</strong>
                    <div style="font-size: 0.8rem; color: #aaa;">$${p.price}</div>
                </div>
            </div>
            <button class="action-btn" onclick="deleteProduct(${p.id})">Delete</button>
        `;
        productList.appendChild(div);
    });
}

// Delete Product
window.deleteProduct = async (id) => {
    if (!confirm('Are you sure?')) return;

    try {
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': localStorage.getItem('adminToken') }
        });

        if (res.ok) {
            loadProducts();
        } else {
            alert('Failed to delete');
        }
    } catch (err) {
        console.error(err);
    }
};

// Add Product
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(addProductForm);

    try {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Authorization': localStorage.getItem('adminToken') },
            body: formData
        });

        if (res.ok) {
            addProductForm.reset();
            loadProducts();
            alert('Product added!');
        } else {
            const data = await res.json();
            alert('Error: ' + data.error);
        }
    } catch (err) {
        console.error(err);
    }
});
