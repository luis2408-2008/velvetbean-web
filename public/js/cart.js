document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

function renderCart() {
    const container = document.getElementById('cart-content');
    const items = Cart.getItems();

    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center">
                <h3>Your cart is empty</h3>
                <a href="menu.html" class="btn btn-primary" style="margin-top: 2rem;">Browse Menu</a>
            </div>
        `;
        return;
    }

    let html = `
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
    `;

    items.forEach(item => {
        let imageSrc = item.image.startsWith('http') ? item.image : `uploads/${item.image}`;

        html += `
            <tr>
                <td style="display: flex; align-items: center; gap: 1rem;">
                    <img src="${imageSrc}" class="cart-item-image" alt="${item.name}">
                    <span>${item.name}</span>
                </td>
                <td>$${item.price.toFixed(2)}</td>
                <td>
                    <div class="quantity-controls">
                        <button onclick="updateQty(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQty(${item.id}, 1)">+</button>
                    </div>
                </td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
                <td>
                    <button onclick="removeItem(${item.id})" style="background:none; border:none; color: #d9534f; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    const total = Cart.getTotal();

    html += `
            </tbody>
        </table>
        
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 2rem;">
            <div style="font-size: 1.5rem; color: var(--color-primary); font-weight: bold;">
                Total: $${total.toFixed(2)}
            </div>
            <a href="checkout.html" class="btn btn-primary">Proceed to Checkout</a>
        </div>
    `;

    container.innerHTML = html;
}

window.updateQty = (id, change) => {
    Cart.updateQuantity(id, change);
    renderCart();
};

window.removeItem = (id) => {
    Cart.removeItem(id);
    renderCart();
};
