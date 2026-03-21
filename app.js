const supabaseUrl = "https://ipfarkclogesomyvzknv.supabase.co";
const supabaseKey = "sb_publishable_qirvbDjAUPFMCOR0orzixg_E784q5Hd";
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

let allProducts = [];
let cart = [];

// Format currency
const formatPrice = (price) => {
    const num = Number(price);
    if (isNaN(num) || !price || num === 0) {
        return '$ Consultar';
    }
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
};

// Fetch products from Supabase
const loadProducts = async () => {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Cargando repuestos...</p>';
    
    const { data, error } = await db
        .from("productos")
        .select("*")
        .eq("activo", true)
        .order("nombre");
        
    if (error) {
        console.error("Error fetching products:", error);
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Error cargando repuestos.</p>';
        return;
    }
    allProducts = data || [];
    renderProducts(allProducts);
};

// Render Products
const renderProducts = (productsToRender) => {
    const grid = document.getElementById('products-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    if(productsToRender.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#666;">No hay repuestos que coincidan con la búsqueda.</p>';
        return;
    }
    
    productsToRender.forEach(product => {
        const isInCart = cart.find(item => item.id === product.id);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-img" style="background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                <img src="${product.imagen}" alt="${product.nombre}" style="max-width:100%; max-height:100%; object-fit:contain;" loading="lazy" onerror="this.src='images/placeholder.jpg'">
            </div>
            <div class="card-body">
                <h3 class="card-title">${product.nombre}</h3>
                <p class="card-price">${formatPrice(product.precio)}</p>
                <button class="btn-add ${isInCart ? 'selected' : ''}" onclick="window.toggleCart(${product.id})">
                    ${isInCart ? 'Añadido ✓' : 'Agregar'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
};

// Render Cart Items Modal
const renderCartItems = () => {
    const list = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total-price');
    if (!list) return;
    
    list.innerHTML = '';
    let total = 0;
    let tienePrecios = false;
    
    if (cart.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888; font-weight:600; margin-top:2rem;">Tu carrito está vacío 🤔</p>';
    } else {
        cart.forEach(item => {
            const num = Number(item.precio);
            if (!isNaN(num) && num > 0) {
                total += num;
                tienePrecios = true;
            }
            
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="${item.imagen}" class="cart-item-img" onerror="this.src='images/placeholder.jpg'">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.nombre}</div>
                    <div class="cart-item-price">${formatPrice(item.precio)}</div>
                </div>
                <button class="btn-remove" onclick="window.removeFromCart(${item.id})" title="Eliminar">&times;</button>
            `;
            list.appendChild(div);
        });
    }
    
    if(totalEl) {
        totalEl.textContent = tienePrecios ? formatPrice(total) : '$ Consultar';
    }
};

window.removeFromCart = (productId) => {
    const index = cart.findIndex(item => item.id === productId);
    if(index > -1) {
        cart.splice(index, 1);
        updateUI();
    }
};

// Toggle Cart
window.toggleCart = (productId) => {
    const index = cart.findIndex(item => item.id === productId);
    if (index > -1) {
        cart.splice(index, 1);
    } else {
        const product = allProducts.find(p => p.id === productId);
        if(product) cart.push(product);
    }
    updateUI();
};

// Update UI
const updateUI = () => {
    const buttons = document.querySelectorAll('.btn-add');
    buttons.forEach(btn => {
        const idMatch = btn.getAttribute('onclick').match(/\d+/);
        if(idMatch) {
            const productId = parseInt(idMatch[0], 10);
            const isInCart = cart.find(item => item.id === productId);
            if(isInCart) {
                btn.classList.add('selected');
                btn.textContent = 'Añadido ✓';
            } else {
                btn.classList.remove('selected');
                btn.textContent = 'Agregar';
            }
        }
    });

    const waBadge = document.getElementById('btn-count');
    if(waBadge) {
        if (cart.length > 0) {
            waBadge.textContent = cart.length;
            waBadge.classList.remove('hidden');
        } else {
            waBadge.classList.add('hidden');
        }
    }
    
    const countSpans = document.querySelectorAll('.cart-count');
    countSpans.forEach(span => span.textContent = cart.length);
    
    renderCartItems();
};

// Search handling
const setupSearch = () => {
    const searchInput = document.getElementById('searchInput');
    if(!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        if(term === '') {
            renderProducts(allProducts);
        } else {
            const filtered = allProducts.filter(p => p.nombre.toLowerCase().includes(term));
            renderProducts(filtered);
        }
        updateUI(); // highlight cart items in filtered list
    });
};

// Checkout Logic
const sendWhatsApp = () => {
    const phoneNumber = "573008310294"; 
    let message = "";
    
    if (cart.length === 0) {
        message = "¡Hola! Estoy interesado en consultarte sobre repuestos para mi Kawasaki KLX 150.";
    } else {
        message = "¡Hola! Estoy interesado en los siguientes repuestos para mi moto KLX 150:\n\n";
        let total = 0;
        let tienePrecios = false;
        
        cart.forEach(item => {
            message += `- ${item.nombre} (${formatPrice(item.precio)})\n`;
            const num = Number(item.precio);
            if(!isNaN(num) && num > 0) {
                total += num;
                tienePrecios = true;
            }
        });
        
        if (tienePrecios) {
            message += `\n*Total aproximado: ${formatPrice(total)}*\n\n¿Tienen disponibilidad?`;
        } else {
            message += `\n¿Tienen disponibilidad y cuál sería el precio?`;
        }
    }
    
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(waUrl, '_blank');
};

document.getElementById('btn-checkout')?.addEventListener('click', sendWhatsApp);
document.getElementById('btn-checkout-cart')?.addEventListener('click', sendWhatsApp);

// Cart Drawer Events
document.getElementById('cart-icon')?.addEventListener('click', () => {
    document.getElementById('cart-sidebar')?.classList.add('active');
    document.getElementById('cart-overlay')?.classList.add('active');
});
document.getElementById('close-cart')?.addEventListener('click', () => {
    document.getElementById('cart-sidebar')?.classList.remove('active');
    document.getElementById('cart-overlay')?.classList.remove('active');
});
document.getElementById('cart-overlay')?.addEventListener('click', () => {
    document.getElementById('cart-sidebar')?.classList.remove('active');
    document.getElementById('cart-overlay')?.classList.remove('active');
});

// PWA Installation
let deferredPrompt;
const installPrompt = document.getElementById('install-prompt');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
        if(installPrompt) installPrompt.classList.remove('hidden');
    }, 2000);
});

if(document.getElementById('btn-install')) {
    document.getElementById('btn-install').addEventListener('click', async () => {
        if(installPrompt) installPrompt.classList.add('hidden');
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
        }
    });
}

if(document.getElementById('btn-close-install')) {
    document.getElementById('btn-close-install').addEventListener('click', () => {
        if(installPrompt) installPrompt.classList.add('hidden');
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    loadProducts();
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}
