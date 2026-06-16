const supabaseUrl = "https://ipfarkclogesomyvzknv.supabase.co";
const supabaseKey = "sb_publishable_qirvbDjAUPFMCOR0orzixg_E784q5Hd";
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

let adminProducts = [];

const formatPrice = (price) => {
    const num = Number(price);
    if (isNaN(num) || !price || num === 0) return '$ Consultar';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
};

// Helper to get product image with safe fallback SVG
const getProductImage = (imgUrl) => {
    if (!imgUrl || imgUrl.trim() === '' || imgUrl === 'images/placeholder.jpg') {
        return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23bbb' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' style='background-color:%23f3f3f3;'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
    }
    return imgUrl;
};


const loadAdminProducts = async () => {
    const tbody = document.getElementById('adminProductsList');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando repuestos...</td></tr>';
    
    const { data, error } = await db
        .from("productos")
        .select("*")
        .order("nombre");
        
    if (error) {
        console.error("Error fetching products:", error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;">Error cargando repuestos: ${error.message}</td></tr>`;
        return;
    }
    
    adminProducts = data || [];
    renderAdminProducts();
};

const renderAdminProducts = () => {
    const tbody = document.getElementById('adminProductsList');
    tbody.innerHTML = '';
    
    if (adminProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay productos guardados.</td></tr>';
        return;
    }
    
    adminProducts.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${getProductImage(product.imagen)}" alt="img" class="prod-img" onerror="this.onerror=null; this.src='images/logo.png';"></td>
            <td>${product.nombre}</td>
            <td>${formatPrice(product.precio)}</td>
            <td>
                <span style="padding: 0.3rem 0.6rem; border-radius: 1rem; background: ${product.activo ? '#d4edda' : '#f8d7da'}; color: ${product.activo ? '#155724' : '#721c24'}; font-size: 0.85rem; font-weight: bold;">
                    ${product.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="action-btns">
                <button class="btn-edit" onclick="editProduct(${product.id})">Editar</button>
                <button class="btn-delete" onclick="deleteProduct(${product.id})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.resetForm = () => {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('btnGuardar').textContent = 'Guardar Producto';
    document.getElementById('btnCancelar').style.display = 'none';
};

window.editProduct = (id) => {
    const product = adminProducts.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('productId').value = product.id;
    document.getElementById('nombre').value = product.nombre;
    document.getElementById('precio').value = product.precio || '';
    document.getElementById('imagenUrl').value = product.imagen || '';
    document.getElementById('activo').value = product.activo ? 'true' : 'false';
    
    document.getElementById('btnGuardar').textContent = 'Actualizar Producto';
    document.getElementById('btnCancelar').style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) return;
    
    const btn = document.querySelector(`button[onclick="deleteProduct(${id})"]`);
    if(btn) btn.textContent = '...';

    const { error } = await db
        .from("productos")
        .delete()
        .eq('id', id);
        
    if (error) {
        alert('Error eliminando producto: ' + error.message);
        if(btn) btn.textContent = 'Eliminar';
    } else {
        // alert('Producto eliminado correctamente.');
        loadAdminProducts();
    }
};

const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    // Attempting to upload to a 'productos' bucket
    const { data, error } = await db.storage
        .from('productos')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });
        
    if (error) {
        throw error;
    }
    
    const { data: publicUrlData } = db.storage
        .from('productos')
        .getPublicUrl(filePath);
        
    return publicUrlData.publicUrl;
};

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('productId').value;
    const nombre = document.getElementById('nombre').value;
    const precio = document.getElementById('precio').value || null;
    let imagen = document.getElementById('imagenUrl').value;
    const activo = document.getElementById('activo').value === 'true';
    
    const fileInput = document.getElementById('imagenFile');
    const btnGuardar = document.getElementById('btnGuardar');
    
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';
    
    try {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            try {
                imagen = await uploadImage(file);
            } catch (uploadObjError) {
                alert('No se pudo subir la imagen al bucket "productos" de Supabase. Es probable que el storage no esté configurado, la política RLS no lo permita, o el bucket deba ser público. Puedes usar una URL directa de la imagen en su lugar.\\n\\nDetalle del error: ' + uploadObjError.message);
                btnGuardar.disabled = false;
                btnGuardar.textContent = id ? 'Actualizar Producto' : 'Guardar Producto';
                return;
            }
        }
        
        if (!imagen) {
            imagen = '';
        }
        
        const payload = { nombre, precio, imagen, activo };
        
        if (id) {
            const { error } = await db
                .from("productos")
                .update(payload)
                .eq('id', id);
                
            if (error) throw error;
        } else {
            const { error } = await db
                .from("productos")
                .insert([payload]);
                
            if (error) throw error;
        }
        
        resetForm();
        loadAdminProducts();
        
    } catch (err) {
        console.error(err);
        alert('Ocurrió un error guardando el producto: ' + err.message);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = id ? 'Actualizar Producto' : 'Guardar Producto';
    }
});

// LOGIC DE AUTENTICACION CON SUPABASE

const loginContainer = document.getElementById('loginContainer');
const adminMain = document.getElementById('adminMain');
const btnLogout = document.getElementById('btnLogout');

const checkSession = async () => {
    const { data: { session } } = await db.auth.getSession();
    if (session) {
        loginContainer.style.display = 'none';
        adminMain.style.display = 'block';
        btnLogout.style.display = 'block';
        loadAdminProducts();
    } else {
        loginContainer.style.display = 'block';
        adminMain.style.display = 'none';
        btnLogout.style.display = 'none';
    }
};

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('btnLoginBtn');
    
    btn.disabled = true;
    btn.textContent = 'Verificando...';
    
    const { data, error } = await db.auth.signInWithPassword({
        email: email,
        password: password,
    });
    
    btn.disabled = false;
    btn.textContent = 'Ingresar al Panel';
    
    if (error) {
        alert('Error al iniciar sesión: Credeciales incorrectas o usuario no existe.');
    } else {
        checkSession();
    }
});

btnLogout.addEventListener('click', async () => {
    await db.auth.signOut();
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    checkSession();
});

document.addEventListener('DOMContentLoaded', checkSession);
