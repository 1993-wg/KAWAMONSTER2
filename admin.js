const supabaseUrl = "https://ipfarkclogesomyvzknv.supabase.co";
const supabaseKey = "sb_publishable_qirvbDjAUPFMCOR0orzixg_E784q5Hd";
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

let adminProducts = [];

/* ===== FORMATTERS ===== */
const formatPrice = (price) => {
    const num = Number(price);
    if (isNaN(num) || !price || num === 0) return '$ Consultar';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
};

const getProductImage = (imgUrl) => {
    if (!imgUrl || imgUrl.trim() === '' || imgUrl === 'images/placeholder.jpg') {
        return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23556' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' style='background:%231e2230;'><rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
    }
    return imgUrl;
};

/* ===== TOAST ===== */
const showToast = (msg, type = 'info') => {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${msg}`;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => el.style.opacity = '0', 3000);
    setTimeout(() => el.remove(), 3500);
};

/* ===== STATS ===== */
const updateStats = (products) => {
    const total     = products.length;
    const activos   = products.filter(p => p.activo).length;
    const inactivos = total - activos;
    const consultar = products.filter(p => !p.precio || Number(p.precio) === 0).length;

    document.getElementById('statTotal').textContent     = total;
    document.getElementById('statActivos').textContent   = activos;
    document.getElementById('statInactivos').textContent = inactivos;
    document.getElementById('statConsultar').textContent = consultar;
    document.getElementById('productCount').textContent  = `${total} producto${total !== 1 ? 's' : ''}`;
};

/* ===== LOAD PRODUCTS ===== */
const loadAdminProducts = async () => {
    const tbody = document.getElementById('adminProductsList');
    tbody.innerHTML = `
        <tr>
            <td colspan="5">
                <div class="empty-state">
                    <div class="empty-icon">⏳</div>
                    <p>Cargando productos...</p>
                </div>
            </td>
        </tr>`;

    const { data, error } = await db
        .from("productos")
        .select("*")
        .order("nombre");

    if (error) {
        console.error("Error fetching products:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-icon">⚠️</div>
                        <p style="color:var(--danger);">Error cargando productos: ${error.message}</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    adminProducts = data || [];
    updateStats(adminProducts);
    renderAdminProducts();
};

/* ===== RENDER TABLE ===== */
const renderAdminProducts = () => {
    const tbody = document.getElementById('adminProductsList');
    tbody.innerHTML = '';

    if (adminProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <p>No hay productos en el catálogo todavía.</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    adminProducts.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="${getProductImage(product.imagen)}" alt="${product.nombre}"
                     class="prod-img" onerror="this.onerror=null; this.src='images/logo.png';">
            </td>
            <td class="prod-name">${product.nombre}</td>
            <td class="prod-price">${formatPrice(product.precio)}</td>
            <td>
                <span class="status-badge ${product.activo ? 'active' : 'inactive'}">
                    <span class="status-dot"></span>
                    ${product.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-info" onclick="editProduct(${product.id})">✏️ Editar</button>
                    <button class="btn btn-danger" onclick="deleteProduct(${product.id})">🗑️ Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

/* ===== RESET FORM ===== */
window.resetForm = () => {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('formTitle').textContent = 'Agregar Nuevo Producto';
    document.getElementById('btnGuardar').innerHTML = '<span>💾</span> Guardar Producto';
    document.getElementById('btnCancelar').style.display = 'none';
    document.getElementById('editingBanner').style.display = 'none';
};

/* ===== EDIT PRODUCT ===== */
window.editProduct = (id) => {
    const product = adminProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('productId').value    = product.id;
    document.getElementById('nombre').value       = product.nombre;
    document.getElementById('precio').value       = product.precio || '';
    document.getElementById('imagenUrl').value    = product.imagen || '';
    document.getElementById('activo').value       = product.activo ? 'true' : 'false';

    document.getElementById('formTitle').textContent          = 'Editando Producto';
    document.getElementById('btnGuardar').innerHTML           = '<span>💾</span> Actualizar Producto';
    document.getElementById('btnCancelar').style.display      = 'block';
    document.getElementById('editingBanner').style.display    = 'flex';

    // Scroll to form
    document.querySelector('.section-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ===== DELETE PRODUCT ===== */
window.deleteProduct = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) return;

    const btn = document.querySelector(`button[onclick="deleteProduct(${id})"]`);
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳'; }

    const { error } = await db.from("productos").delete().eq('id', id);

    if (error) {
        showToast('Error al eliminar el producto: ' + error.message, 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '🗑️ Eliminar'; }
    } else {
        showToast('Producto eliminado correctamente.', 'success');
        loadAdminProducts();
    }
};

/* ===== UPLOAD IMAGE ===== */
const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

    const { data, error } = await db.storage
        .from('productos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: publicUrlData } = db.storage.from('productos').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
};

/* ===== SAVE PRODUCT FORM ===== */
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id        = document.getElementById('productId').value;
    const nombre    = document.getElementById('nombre').value.trim();
    const precio    = document.getElementById('precio').value || null;
    let   imagen    = document.getElementById('imagenUrl').value.trim();
    const activo    = document.getElementById('activo').value === 'true';
    const fileInput = document.getElementById('imagenFile');
    const btnGuardar = document.getElementById('btnGuardar');

    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<span>⏳</span> Guardando...';

    try {
        if (fileInput.files.length > 0) {
            try {
                imagen = await uploadImage(fileInput.files[0]);
            } catch (uploadErr) {
                showToast('No se pudo subir la imagen. Verifica el bucket de Supabase.', 'error');
                console.error(uploadErr);
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = id ? '<span>💾</span> Actualizar Producto' : '<span>💾</span> Guardar Producto';
                return;
            }
        }

        if (!imagen) imagen = '';

        const payload = { nombre, precio, imagen, activo };

        if (id) {
            const { error } = await db.from("productos").update(payload).eq('id', id);
            if (error) throw error;
            showToast('Producto actualizado correctamente.', 'success');
        } else {
            const { error } = await db.from("productos").insert([payload]);
            if (error) throw error;
            showToast('Producto agregado al catálogo.', 'success');
        }

        resetForm();
        loadAdminProducts();

    } catch (err) {
        console.error(err);
        showToast('Error al guardar: ' + err.message, 'error');
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = id ? '<span>💾</span> Actualizar Producto' : '<span>💾</span> Guardar Producto';
    }
});

/* ===== AUTH LOCAL ===== */
const ADMIN_USER = 'Admin';
const ADMIN_PASS = '1216';

const loginOverlay = document.getElementById('loginOverlay');
const appLayout    = document.getElementById('appLayout');
const btnLogout    = document.getElementById('btnLogout');

const showApp = () => {
    loginOverlay.style.display = 'none';
    appLayout.style.display    = 'flex';
    btnLogout.style.display    = 'block';

    document.getElementById('userEmail').textContent  = ADMIN_USER;
    document.getElementById('userAvatar').textContent  = 'A';

    loadAdminProducts();
};

const showLogin = () => {
    loginOverlay.style.display = 'flex';
    appLayout.style.display    = 'none';
    btnLogout.style.display    = 'none';
};

const checkSession = () => {
    sessionStorage.getItem('kawa_admin_auth') === 'true' ? showApp() : showLogin();
};

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user     = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn      = document.getElementById('btnLoginBtn');

    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Verificando...';

    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '<span>🔐</span> Ingresar al Panel';

        if (user === ADMIN_USER && password === ADMIN_PASS) {
            sessionStorage.setItem('kawa_admin_auth', 'true');
            showApp();
            showToast('Bienvenido, ' + ADMIN_USER + '!', 'success');
        } else {
            showToast('Usuario o contraseña incorrectos.', 'error');
        }
    }, 500);
});

btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('kawa_admin_auth');
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPassword').value = '';
    showLogin();
    showToast('Sesión cerrada correctamente.', 'info');
});

document.addEventListener('DOMContentLoaded', checkSession);

