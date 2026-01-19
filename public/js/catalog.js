document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});

async function fetchProducts() {
    const container = document.getElementById('menu-container');
    const loading = document.getElementById('loading');

    try {
        const response = await fetch('/api/products');
        const data = await response.json();

        if (data.message === 'success') {
            loading.style.display = 'none';
            renderProducts(data.data, container);
        } else {
            loading.innerText = 'Error loading menu.';
        }
    } catch (error) {
        console.error('Error:', error);
        loading.innerText = 'Failed to connect to server.';
    }
}

function renderProducts(products, container) {
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p class="text-center">No products found.</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        // Handle Image Path (Check if external or local upload)
        // For this demo, we assume all images are in uploads/ or absolute URLs.
        // If image does not exist, use a placeholder style.
        let imageSrc = `uploads/${product.image}`;
        if (product.image.startsWith('http')) {
            imageSrc = product.image;
        }

        card.innerHTML = `
            <div class="product-image" style="background-image: url('${imageSrc}');"></div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p style="font-size: 0.9rem; color: #aaa; margin-bottom: 0.5rem;">${product.description || ''}</p>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="btn btn-primary" style="margin-top: 10px; width: 100%; padding: 8px;" onclick='addToCart(${JSON.stringify(product)})'>
                    Add to Cart
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function addToCart(product) {
    Cart.addItem(product);
}
