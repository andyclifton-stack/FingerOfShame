const menuItems = {
    drinks: [
        { id: 'd1', name: 'Biscoff Milkshake', icon: '🥛' },
        { id: 'd2', name: 'Vanilla Milkshake', icon: '🥤' },
        { id: 'd3', name: 'Squash (Blackcurrant)', icon: '🧃' },
        { id: 'd4', name: 'Pink Drink', icon: '🌸' }
    ],
    popsicles: [
        { id: 'p1', name: 'Blackcurrant Popsicle', icon: '🍇' },
        { id: 'p2', name: 'Strawberry Popsicle', icon: '🍓' },
        { id: 'p3', name: 'Milky Popsicle', icon: '🍦' }
    ],
    cakepops: [
        { id: 'c1', name: 'Sprinkles Cake Pop', icon: '🍭' },
        { id: 'c2', name: 'Pink Cake Pop', icon: '🎀' },
        { id: 'c3', name: 'White Cake Pop', icon: '☁️' }
    ],
    snacks: [
        { id: 's1', name: 'Gold Bar', icon: '🍫' },
        { id: 's2', name: 'Carmals Wafer', icon: '🧇' },
        { id: 's3', name: 'Rice Krispie Treat Bar', icon: '✨' },
        { id: 's4', name: 'Crisps', icon: '🥔' }
    ]
};

// State
let cart = {};
let currentRating = 0;
const phoneNumber = ""; // Let the user type the group or select the contact in WhatsApp explicitly, so we just use wa.me/?text=

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountElem = document.getElementById('cart-count');
const cartSummary = document.getElementById('cart-summary');
const sendOrderBtn = document.getElementById('send-order-btn');
const stars = document.querySelectorAll('#star-rating span');
const reviewText = document.getElementById('review-text');
const sendReviewBtn = document.getElementById('send-review-btn');

// Initialize Menu
function renderMenu() {
    for (const [category, items] of Object.entries(menuItems)) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'menu-category';

        let icon = '✨';
        if (category === 'drinks') icon = '🥤';
        if (category === 'popsicles') icon = '🍦';
        if (category === 'cakepops') icon = '🍭';
        if (category === 'snacks') icon = '🍪';

        const title = document.createElement('h3');
        title.className = 'category-title';
        title.innerHTML = `${icon} ${category.replace('cakepops', 'Cake Pops')}`;
        categoryDiv.appendChild(title);

        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'category-items';

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'menu-item';
            itemDiv.innerHTML = `
                <span class="item-icon">${item.icon}</span>
                <div class="item-name">${item.name}</div>
                <button class="add-btn" onclick="addToCart('${item.id}', '${item.name}')">Add to Order</button>
            `;
            itemsGrid.appendChild(itemDiv);
        });

        categoryDiv.appendChild(itemsGrid);
        menuGrid.appendChild(categoryDiv);
    }
}

// Cart functionality
window.addToCart = function (id, name) {
    if (cart[id]) {
        cart[id].qty += 1;
    } else {
        cart[id] = { name: name, qty: 1 };
    }
    updateCartUI();
};

window.removeFromCart = function (id) {
    if (cart[id]) {
        cart[id].qty -= 1;
        if (cart[id].qty <= 0) {
            delete cart[id];
        }
        updateCartUI();
    }
};

function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let totalItems = 0;
    const cartKeys = Object.keys(cart);

    if (cartKeys.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Your cart is empty. Add some yummy treats!</p>';
        cartSummary.classList.add('hide');
        cartCountElem.textContent = '0';
        return;
    }

    cartSummary.classList.remove('hide');

    cartKeys.forEach(id => {
        const item = cart[id];
        totalItems += item.qty;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.innerHTML = `
            <div class="cart-item-info">${item.name}</div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="removeFromCart('${id}')">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="addToCart('${id}', '${item.name}')">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    });

    cartCountElem.textContent = totalItems;
}

// Order Generation
sendOrderBtn.addEventListener('click', () => {
    let orderText = "🌸 *NEW ORDER FOR ALI BUCKS!* 🌸\n\n";

    Object.values(cart).forEach(item => {
        orderText += `👉 ${item.qty}x ${item.name}\n`;
    });

    orderText += "\n✨ _Can't wait for my yummy treats!_ ✨";

    const encodedText = encodeURIComponent(orderText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
});

// Review Functionality
stars.forEach(star => {
    star.addEventListener('click', () => {
        currentRating = parseInt(star.getAttribute('data-value'));
        updateStars();
    });
});

function updateStars() {
    stars.forEach(star => {
        const val = parseInt(star.getAttribute('data-value'));
        if (val <= currentRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

sendReviewBtn.addEventListener('click', () => {
    if (currentRating === 0) {
        alert("Please select a star rating first! ⭐");
        return;
    }

    const reviewStr = reviewText.value.trim();
    let starStr = '⭐'.repeat(currentRating);

    let message = `🌟 *NEW REVIEW FOR ALI BUCKS!* 🌟\n\n`;
    message += `Rating: ${starStr}\n`;

    if (reviewStr) {
        message += `Review: "${reviewStr}"\n`;
    }

    message += `\n💖 _Best cafe ever!_ 💖`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
});

// Init
renderMenu();
