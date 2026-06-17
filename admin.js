const supabaseUrl = "https://ipfarkclogesomyvzknv.supabase.co";
const supabaseKey = "sb_publishable_qirvbDjAUPFMCOR0orzixg_E784q5Hd";
let db = null;
try {
    db = window.supabase.createClient(supabaseUrl, supabaseKey);
} catch (e) {
    console.warn('Supabase no pudo inicializarse:', e);
}

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
    if (!db) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-icon">⚠️</div>
                        <p style="color:var(--danger);">Supabase no está conectado.</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

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

    const searchInput = document.getElementById('txtSearch');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filteredProducts = adminProducts.filter(product => 
        product.nombre.toLowerCase().includes(query)
    );

    if (filteredProducts.length === 0) {
        const message = adminProducts.length === 0 
            ? 'No hay productos en el catálogo todavía.' 
            : 'No se encontraron productos que coincidan con la búsqueda.';
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <p>${message}</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    filteredProducts.forEach(product => {
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
    updateIAStatusIndicator();
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

/* ===== API KEYS SETUP & MODAL ===== */
window.openGeminiModal = () => {
    const modal = document.getElementById('geminiModal');
    const inputGemini = document.getElementById('geminiApiKey');
    if (modal) {
        if (inputGemini) inputGemini.value = localStorage.getItem('gemini_api_key') || '';
        modal.style.display = 'flex';
    }
};

window.closeGeminiModal = () => {
    const modal = document.getElementById('geminiModal');
    if (modal) modal.style.display = 'none';
};

window.saveApiKeys = () => {
    const geminiKey = document.getElementById('geminiApiKey').value.trim();
    
    if (geminiKey) {
        localStorage.setItem('gemini_api_key', geminiKey);
    } else {
        localStorage.removeItem('gemini_api_key');
    }
    
    showToast('Clave de API de Gemini guardada correctamente.', 'success');
    updateIAStatusIndicator();
    closeGeminiModal();
};

const updateIAStatusIndicator = () => {
    const hasKey = !!localStorage.getItem('gemini_api_key');
    const indicator = document.getElementById('iaStatusText');
    const btn = document.getElementById('btnIAConfigTopbar');
    
    if (indicator && btn) {
        if (hasKey) {
            indicator.textContent = 'IA: Activa';
            btn.style.color = '#00e676';
            btn.style.borderColor = 'rgba(0, 230, 118, 0.3)';
            btn.style.background = 'rgba(0, 230, 118, 0.08)';
        } else {
            indicator.textContent = 'IA: Inactiva';
            btn.style.color = '#b070ff';
            btn.style.borderColor = 'rgba(112, 0, 255, 0.3)';
            btn.style.background = 'rgba(112, 0, 255, 0.08)';
        }
    }
};

/* ===== GEMINI API REST CALLER ===== */
const callGeminiAPI = async (prompt, systemInstruction = '', plainText = false, imageObj = null) => {
    const key = localStorage.getItem('gemini_api_key');
    if (!key) {
        openGeminiModal();
        throw new Error('API Key de Gemini no configurada.');
    }

    // Inyectar el conocimiento de la Gema en la instrucción del sistema
    const guidelines = localStorage.getItem('gema_guidelines') || '';
    const filesJSON = localStorage.getItem('gema_knowledge_files') || '[]';
    const files = JSON.parse(filesJSON);
    
    let knowledgeText = '';
    if (guidelines) {
        knowledgeText += `Lineamientos de Marca y Estilo:\n${guidelines}\n\n`;
    }
    
    files.forEach(f => {
        if (f.type === 'text') {
            knowledgeText += `Contenido del archivo de referencia (${f.name}):\n${f.content}\n\n`;
        }
    });

    if (knowledgeText) {
        systemInstruction = `Instrucciones del Negocio y Conocimiento:\n${knowledgeText}\n` + systemInstruction;
    }

    // Lista de modelos a intentar en secuencia en caso de alta demanda o fallos transitorios
    const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-flash'];
    let lastError = null;

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            
            const parts = [{ text: prompt }];
            if (imageObj && imageObj.mimeType && imageObj.data) {
                parts.push({
                    inlineData: {
                        mimeType: imageObj.mimeType,
                        data: imageObj.data
                    }
                });
            }

            const requestBody = {
                contents: [
                    {
                        parts: parts
                    }
                ]
            };

            if (systemInstruction) {
                requestBody.systemInstruction = {
                    parts: [
                        { text: systemInstruction }
                    ]
                };
            }

            requestBody.generationConfig = {
                responseMimeType: plainText ? "text/plain" : "application/json"
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.error?.message || response.statusText;
                
                // Si es un error de sobrecarga (503), tasa límite (429) o error de servidor (500), probamos con el siguiente modelo
                if (response.status === 503 || response.status === 429 || response.status === 500) {
                    console.warn(`Modelo ${model} no disponible (Status ${response.status}). Probando fallback...`);
                    lastError = new Error(`Error de Gemini (${model}): ${errMsg}`);
                    continue; 
                }
                throw new Error(`Error de Gemini (${model}): ${errMsg}`);
            }

            const result = await response.json();
            const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!responseText) {
                throw new Error('No se recibió respuesta válida de la IA.');
            }
            console.log(`Respuesta de IA exitosa usando el modelo: ${model}`);
            return responseText;
        } catch (err) {
            console.error(`Error de conexión o de API con ${model}:`, err);
            lastError = err;
            continue; 
        }
    }

    throw lastError || new Error('Todos los modelos de Gemini se encuentran sobrecargados. Por favor, intenta de nuevo en unos momentos.');
};

/* ===== AI OPTIMIZE PRODUCT IN FORM ===== */
window.optimizeProductWithIA = async () => {
    const nombreInput = document.getElementById('nombre');
    const precioInput = document.getElementById('precio');
    const btn = document.getElementById('btnIAOptimize');
    const originalText = btn.innerHTML;

    const nombre = nombreInput.value.trim();
    if (!nombre) {
        showToast('Escribe un nombre básico primero para poder optimizarlo.', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span>';

    try {
        const prompt = `El usuario ha ingresado el siguiente nombre de repuesto o accesorio de moto: "${nombre}". Por favor, optimízalo para un catálogo profesional y sugiere un precio aproximado en pesos colombianos (COP) en base al mercado actual.`;
        const systemInstruction = `Debes responder estrictamente con un objeto JSON que tenga el siguiente esquema: {"nombreOptimizado": "Nombre Profesional del Producto", "precioSugerido": 12000}. No agregues explicaciones, markdown, ni texto extra fuera del JSON. El precioSugerido debe ser un número entero. Si no puedes estimar un precio, usa 0 o un precio de mercado razonable en Colombia.`;

        const resText = await callGeminiAPI(prompt, systemInstruction);
        const data = JSON.parse(resText);

        if (data.nombreOptimizado) {
            nombreInput.value = data.nombreOptimizado;
        }
        if (data.precioSugerido && data.precioSugerido > 0) {
            precioInput.value = data.precioSugerido;
        }
        showToast('Producto optimizado con IA ✨', 'success');
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

/* ===== AI BULK GENERATOR SECTION ===== */
window.toggleIAGenerator = () => {
    const body = document.getElementById('iaGeneratorBody');
    const icon = document.getElementById('iaGenToggleIcon');
    if (body.style.display === 'none') {
        body.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
    } else {
        body.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
};

window.generateProductsWithIA = async () => {
    const promptInput = document.getElementById('iaPrompt');
    const btn = document.getElementById('btnIAGenerate');
    const container = document.getElementById('iaSuggestionsContainer');
    const list = document.getElementById('iaSuggestionsList');
    
    const promptText = promptInput.value.trim();
    if (!promptText) {
        showToast('Escribe una idea para la generación.', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Generando...</span>';
    container.style.display = 'none';
    list.innerHTML = '';

    try {
        const prompt = `Genera una lista de productos para el catálogo de motos basándose en la siguiente solicitud: "${promptText}". Genera nombres realistas de repuestos o accesorios y sus precios de mercado estimados en Colombia (COP).`;
        const systemInstruction = `Debes responder estrictamente con un arreglo JSON de objetos que tengan el siguiente formato: [{"nombre": "Nombre del producto", "precio": 35000}]. Genera entre 3 y 8 productos según sea adecuado. No agregues explicaciones, markdown ni texto fuera del JSON. El precio debe ser un número entero.`;

        const resText = await callGeminiAPI(prompt, systemInstruction);
        const suggestions = JSON.parse(resText);

        if (!Array.isArray(suggestions) || suggestions.length === 0) {
            throw new Error('Formato de respuesta incorrecto o vacío.');
        }

        suggestions.forEach(sug => {
            const div = document.createElement('div');
            div.className = 'ia-suggestion-item';
            div.style.cssText = 'display: flex; gap: 0.75rem; align-items: center; background: var(--bg-elevated); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--border);';
            div.innerHTML = `
                <input type="text" class="form-control sug-nombre" value="${sug.nombre}" style="flex: 2; padding: 0.4rem 0.6rem; font-size: 0.85rem;">
                <input type="number" class="form-control sug-precio" value="${sug.precio}" style="flex: 1; min-width: 80px; padding: 0.4rem 0.6rem; font-size: 0.85rem;" placeholder="Precio">
                <button type="button" class="btn" style="padding: 0.45rem 0.8rem; font-size: 0.85rem; background: var(--brand); color: #0d0f14; border: none; font-weight: 700; border-radius: var(--radius-sm); cursor: pointer;" onclick="addSingleIASuggestion(this)">
                    ➕
                </button>
            `;
            list.appendChild(div);
        });

        container.style.display = 'block';
        showToast('Propuestas generadas con IA ✨', 'success');
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>🪄 Generar</span>';
    }
};

window.addSingleIASuggestion = async (btn) => {
    const row = btn.closest('.ia-suggestion-item');
    const nombre = row.querySelector('.sug-nombre').value.trim();
    const precio = Number(row.querySelector('.sug-precio').value) || null;

    if (!nombre) {
        showToast('El nombre del producto no puede estar vacío.', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '⏳';

    try {
        const payload = { nombre, precio, imagen: '', activo: true };
        const { error } = await db.from("productos").insert([payload]);
        
        if (error) throw error;
        
        showToast(`"${nombre}" agregado correctamente.`, 'success');
        row.remove();
        
        // Reload products list & stats
        loadAdminProducts();
        
        // Hide container if no suggestions left
        const list = document.getElementById('iaSuggestionsList');
        if (list.children.length === 0) {
            document.getElementById('iaSuggestionsContainer').style.display = 'none';
        }
    } catch (err) {
        console.error(err);
        showToast('Error al guardar: ' + err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '➕';
    }
};

window.addAllIASuggestions = async () => {
    const list = document.getElementById('iaSuggestionsList');
    const items = list.querySelectorAll('.ia-suggestion-item');
    if (items.length === 0) return;

    const btn = document.getElementById('btnIAAddAll');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Guardando...';

    const payloads = [];
    items.forEach(row => {
        const nombre = row.querySelector('.sug-nombre').value.trim();
        const precio = Number(row.querySelector('.sug-precio').value) || null;
        if (nombre) {
            payloads.push({ nombre, precio, imagen: '', activo: true });
        }
    });

    if (payloads.length === 0) {
        showToast('No hay productos válidos para agregar.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    try {
        const { error } = await db.from("productos").insert(payloads);
        if (error) throw error;

        showToast(`${payloads.length} productos agregados correctamente.`, 'success');
        list.innerHTML = '';
        document.getElementById('iaSuggestionsContainer').style.display = 'none';
        loadAdminProducts();
    } catch (err) {
        console.error(err);
        showToast('Error al guardar todos: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

/* ===== TAB NAVIGATION SYSTEM ===== */
window.switchTab = (tab) => {
    // Nav Items
    const navProductos = document.getElementById('navProductos');
    const navGema = document.getElementById('navGema');
    const navImagenes = document.getElementById('navImagenes');
    
    // View Divs
    const viewCatalog = document.getElementById('viewCatalog');
    const viewGema = document.getElementById('viewGema');
    const viewNanoBanan = document.getElementById('viewNanoBanan');

    // Reset Active Classes
    if (navProductos) navProductos.classList.remove('active');
    if (navGema) navGema.classList.remove('active');
    if (navImagenes) navImagenes.classList.remove('active');

    // Hide Views
    if (viewCatalog) viewCatalog.style.display = 'none';
    if (viewGema) viewGema.style.display = 'none';
    if (viewNanoBanan) viewNanoBanan.style.display = 'none';

    // Activate selected
    if (tab === 'productos') {
        if (navProductos) navProductos.classList.add('active');
        if (viewCatalog) viewCatalog.style.display = 'block';
    } else if (tab === 'gema') {
        if (navGema) navGema.classList.add('active');
        if (viewGema) viewGema.style.display = 'block';
        loadGemaSettings();
    } else if (tab === 'imagenes') {
        if (navImagenes) navImagenes.classList.add('active');
        if (viewNanoBanan) viewNanoBanan.style.display = 'block';
        populateProductSelects();
    }
};

/* ===== GEMA DE CONOCIMIENTO LOGIC ===== */
window.saveGemaSettings = async () => {
    const guidelines = document.getElementById('gemaGuidelines').value;
    localStorage.setItem('gema_guidelines', guidelines);

    const txtFileInput = document.getElementById('gemaTextFile');
    const imgFileInput = document.getElementById('gemaImgFile');
    
    const filesJSON = localStorage.getItem('gema_knowledge_files') || '[]';
    const files = JSON.parse(filesJSON);

    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const readFileAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    try {
        let added = false;
        
        // Carga de texto
        if (txtFileInput.files.length > 0) {
            const file = txtFileInput.files[0];
            const content = await readFileAsText(file);
            files.push({ name: file.name, type: 'text', content });
            txtFileInput.value = '';
            added = true;
        }

        // Carga de imagen
        if (imgFileInput.files.length > 0) {
            const file = imgFileInput.files[0];
            const content = await readFileAsDataURL(file);
            files.push({ name: file.name, type: 'image', content });
            imgFileInput.value = '';
            added = true;
        }

        localStorage.setItem('gema_knowledge_files', JSON.stringify(files));
        showToast('Gema de Conocimiento guardada correctamente.', 'success');
        renderGemaFiles();
    } catch (err) {
        console.error(err);
        showToast('Error al procesar archivos de la Gema: ' + err.message, 'error');
    }
};

window.loadGemaSettings = () => {
    const guidelines = localStorage.getItem('gema_guidelines') || '';
    const guidelinesTextarea = document.getElementById('gemaGuidelines');
    if (guidelinesTextarea) guidelinesTextarea.value = guidelines;
    renderGemaFiles();
};

window.renderGemaFiles = () => {
    const list = document.getElementById('gemaFilesList');
    const countText = document.getElementById('gemaFilesCount');
    if (!list) return;

    list.innerHTML = '';
    const filesJSON = localStorage.getItem('gema_knowledge_files') || '[]';
    const files = JSON.parse(filesJSON);

    if (countText) {
        countText.textContent = `${files.length} archivo${files.length !== 1 ? 's' : ''} cargado${files.length !== 1 ? 's' : ''}`;
    }

    if (files.length === 0) {
        list.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1rem 0;">No hay archivos cargados en la Gema de conocimiento.</p>`;
        return;
    }

    files.forEach((file, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.8rem; position: relative; display: flex; flex-direction: column; gap: 0.5rem; justify-content: space-between;';
        
        let preview = '';
        if (file.type === 'text') {
            preview = `
                <div style="font-size: 2rem; text-align: center; opacity: 0.5; margin-bottom: 0.25rem;">📄</div>
                <div style="font-size: 0.82rem; font-weight: 600; text-align: center; word-break: break-all; color: var(--text-primary);">${file.name}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); text-align: center;">Archivo de Texto</div>
            `;
        } else {
            preview = `
                <img src="${file.content}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border);" onerror="this.src='images/logo.png'">
                <div style="font-size: 0.82rem; font-weight: 600; text-align: center; word-break: break-all; color: var(--text-primary); margin-top: 0.25rem;">${file.name}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); text-align: center;">Imagen de Referencia</div>
            `;
        }

        div.innerHTML = `
            <div>${preview}</div>
            <button type="button" class="btn btn-danger" style="padding: 0.35rem; font-size: 0.72rem; width: 100%; margin-top: 0.5rem;" onclick="deleteGemaFile(${index})">
                ✕ Eliminar
            </button>
        `;
        list.appendChild(div);
    });
};

window.deleteGemaFile = (index) => {
    const filesJSON = localStorage.getItem('gema_knowledge_files') || '[]';
    const files = JSON.parse(filesJSON);
    files.splice(index, 1);
    localStorage.setItem('gema_knowledge_files', JSON.stringify(files));
    showToast('Archivo eliminado de la Gema.', 'info');
    renderGemaFiles();
};

/* ===== DROP-DOWN SELECTS LOADER ===== */
const populateProductSelects = () => {
    const nbSelect = document.getElementById('nbProductSelect');
    if (nbSelect) {
        nbSelect.innerHTML = '<option value="">-- No asociar (Sólo generar promo genérico) --</option>';
        
        adminProducts.forEach(p => {
            const opt = `<option value="${p.id}">${p.nombre} (${formatPrice(p.precio)})</option>`;
            nbSelect.innerHTML += opt;
        });
    }
};

/* ===== NANO BANAN PRO IMAGE GENERATOR ===== */
window.generateNanoBananImage = async () => {
    const select = document.getElementById('nbProductSelect');
    const styleSelect = document.getElementById('nbStyleSelect');
    const promptTextarea = document.getElementById('nbPrompt');
    const btn = document.getElementById('btnNBGenerate');
    const placeholder = document.getElementById('nbPlaceholder');
    const imageContainer = document.getElementById('nbImageContainer');
    const generatedImg = document.getElementById('nbGeneratedImg');
    const downloadLink = document.getElementById('nbDownloadLink');
    const refImageInput = document.getElementById('nbRefImage');

    const style = styleSelect.value;
    const additionalPrompt = promptTextarea.value.trim();

    let prodName = "Accesorios de Moto Premium";
    if (select.value) {
        const selectedProduct = adminProducts.find(p => p.id == select.value);
        if (selectedProduct) {
            prodName = selectedProduct.nombre;
        }
    }

    const stylePrompts = {
        estudio: "clean studio shot, minimalist dark background, professional product photography, studio lighting, hyperrealistic, 8k resolution, elegant green/white highlights",
        tuning: "tuning racing style, neon green and electric blue glow, motorcycle garage background, carbon fiber textures, dramatic atmosphere, cinematic, detailed",
        carretera: "high-speed action shot on highway road, background motion blur, dramatic sunset sky, motorcycle lifestyle, dynamic composition, photorealistic",
        mecanica: "industrial workshop background, gears, smoke, mechanical tools, metallic textures, rough motorcycle garage atmosphere, hard shadows, highly detailed",
        cyberpunk: "cyberpunk futuristic neon style, holographic overlays, rainy dark street reflection, purple and green lights, sci-fi concept art",
        banner: "social media advertising banner style, copy-space, high-impact commercial look, vibrant contrast, modern layout, motorcycle spare parts promo"
    };

    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Diseñando con Nano Banan Pro...</span>';
    placeholder.style.display = 'block';
    imageContainer.style.display = 'none';

    const readAsBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Data = reader.result.split(',')[1];
                resolve({
                    mimeType: file.type,
                    data: base64Data
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    try {
        const brandGuidelines = localStorage.getItem('gema_guidelines') || '';
        let imageObj = null;

        if (refImageInput && refImageInput.files.length > 0) {
            showToast('Leyendo imagen de referencia...', 'info');
            imageObj = await readAsBase64(refImageInput.files[0]);
        }

        let promptForGemini = "";
        
        if (imageObj) {
            promptForGemini = `Analiza detalladamente la foto del producto/repuesto de moto adjunta. Identifica qué tipo de pieza o accesorio es, describiendo su forma, color, material y detalles visuales clave.
            
Luego, escribe un prompt en inglés extremadamente descriptivo para un generador de imágenes de IA (como Stable Diffusion o Midjourney). Este prompt debe integrar el producto analizado y dibujarlo exactamente como es en un escenario correspondiente al estilo visual: "${styleSelect.options[styleSelect.selectedIndex].text}".
Incorpóralo bajo las siguientes directrices de marca: "${brandGuidelines}". El producto debe ser el elemento central, nítido y detallado, colocado en un fondo limpio y con la iluminación del estilo.
Evita texto o logos en la imagen. Responde estrictamente con el texto del prompt final en inglés. No agregues comillas, explicaciones ni preámbulos.`;
        } else {
            promptForGemini = `El usuario desea generar una imagen para el producto "${prodName}".
Estilo visual deseado: "${styleSelect.options[styleSelect.selectedIndex].text}".
Descripción adicional del usuario: "${additionalPrompt}".
Directrices de marca: "${brandGuidelines}".

Escribe un prompt en inglés extremadamente descriptivo y optimizado para Stable Diffusion o Midjourney. El prompt debe describir visualmente el producto en el fondo y atmósfera adecuada, priorizando la calidad de foto de estudio o render publicitario. Responde estrictamente con el texto del prompt en inglés. No agregues comillas, explicaciones ni preámbulos.`;
        }

        let finalImagePrompt = `${prodName}, ${stylePrompts[style] || ''}, ${additionalPrompt}`;
        
        if (localStorage.getItem('gemini_api_key')) {
            try {
                if (imageObj) {
                    showToast('Gemini analizando imagen de referencia multimodal...', 'info');
                }
                const creativePrompt = await callGeminiAPI(promptForGemini, "Eres un director creativo publicitario experto en escribir prompts para generadores de imágenes.", true, imageObj);
                if (creativePrompt && creativePrompt.trim().length > 10) {
                    finalImagePrompt = creativePrompt.trim();
                }
            } catch (gemErr) {
                console.warn("Fallo al refinar prompt con Gemini, usando prompt predeterminado:", gemErr);
                showToast("Fallo al refinar con Gemini, usando prompt predeterminado", "info");
            }
        } else if (imageObj) {
            throw new Error('Para generar a partir de una imagen de referencia, debes configurar la API Key de Gemini en Configuración.');
        }

        console.log("Generando imagen con el prompt:", finalImagePrompt);
        
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalImagePrompt)}?width=1080&height=1080&nologo=true&seed=${seed}`;

        generatedImg.src = imageUrl;
        
        generatedImg.onload = () => {
            placeholder.style.display = 'none';
            imageContainer.style.display = 'block';
            downloadLink.href = imageUrl;
            btn.disabled = false;
            btn.innerHTML = '<span>🪄 Generar Imagen con IA</span>';
            showToast('Imagen promocional creada con éxito!', 'success');
        };

        generatedImg.onerror = () => {
            throw new Error('La imagen de Pollinations no pudo cargarse.');
        };

    } catch (err) {
        console.error(err);
        showToast('Error de generación de imagen: ' + err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<span>🪄 Generar Imagen con IA</span>';
    }
};

window.saveGeneratedImgToProduct = async () => {
    const select = document.getElementById('nbProductSelect');
    const generatedImg = document.getElementById('nbGeneratedImg');
    const saveBtn = document.getElementById('nbSaveProductBtn');
    
    if (!select.value) {
        showToast('Selecciona un producto del catálogo al que desees asignarle esta imagen.', 'error');
        return;
    }
    
    const productId = Number(select.value);
    const product = adminProducts.find(p => p.id === productId);
    if (!product) return;

    saveBtn.disabled = true;
    saveBtn.innerHTML = '⏳ Guardando...';

    try {
        showToast('Descargando imagen generada y subiendo a Supabase...', 'info');
        
        const res = await fetch(generatedImg.src);
        const blob = await res.blob();
        const file = new File([blob], `nano_banan_${productId}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const publicUrl = await uploadImage(file);
        
        const { error } = await db.from("productos").update({ imagen: publicUrl }).eq('id', productId);
        if (error) throw error;
        
        showToast(`La imagen de "${product.nombre}" ha sido actualizada con éxito!`, 'success');
        loadAdminProducts();
    } catch (err) {
        console.error(err);
        showToast('Error al guardar imagen en el producto: ' + err.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Usar en Producto';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    
    // Bind search bar input event listener
    const txtSearch = document.getElementById('txtSearch');
    if (txtSearch) {
        txtSearch.addEventListener('input', renderAdminProducts);
    }
    
    // Update IA indicator on load
    updateIAStatusIndicator();
});

