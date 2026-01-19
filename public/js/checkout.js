document.addEventListener('DOMContentLoaded', () => {
    const items = Cart.getItems();
    if (items.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    renderSummary(items);
});

function renderSummary(items) {
    const container = document.getElementById('summary-items');
    let html = '';

    items.forEach(item => {
        html += `
            <div class="summary-row">
                <span>${item.name} x ${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `;
    });

    container.innerHTML = html;
    document.getElementById('summary-total').innerText = '$' + Cart.getTotal().toFixed(2);
}

const form = document.getElementById('checkout-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button');
    submitBtn.innerText = 'Processing...';
    submitBtn.disabled = true;

    const orderData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        items: Cart.getItems(),
        total: Cart.getTotal()
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok) { // Should check response.ok or custom success flag
            // Success
            Cart.clear();
            document.getElementById('confirmed-email').innerText = orderData.email;

            if (result.previewUrl) {
                document.getElementById('email-preview-link').innerHTML = `(Demo: <a href="${result.previewUrl}" target="_blank" style="color:#aaa;">View Email</a>)`;
            }

            document.getElementById('success-overlay').style.display = 'flex';
        } else {
            alert('Error processing order: ' + result.error);
            submitBtn.innerText = 'Finalize Order';
            submitBtn.disabled = false;
        }

    } catch (error) {
        console.error(error);
        alert('Network error. Please try again.');
        submitBtn.innerText = 'Finalize Order';
        submitBtn.disabled = false;
    }
});
