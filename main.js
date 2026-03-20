import { supabase } from "./supabase.js";

console.log("🔥 main.js cargado");

document.addEventListener("DOMContentLoaded", async () => {
    const contenedor = document.getElementById("productos");
    const searchInput = document.getElementById("searchInput");
    const resultsCount = document.getElementById("resultsCount");

    if (!contenedor) return;

    // ── Cargar productos desde Supabase ──
    const { data: productos, error } = await supabase
        .from("productos")
        .select("*")
        .eq("activo", true)
        .order("nombre");

    if (error) {
        console.error("❌ Error Supabase:", error);
        contenedor.innerHTML = `<p class="no-results">Error al cargar los productos 😔</p>`;
        return;
    }

    // ── Renderizar lista de productos ──
    function renderProductos(lista) {
        contenedor.innerHTML = "";

        if (lista.length === 0) {
            contenedor.innerHTML = `
                <p class="no-results">
                    No se encontraron productos con ese nombre 😔<br>
                    <small>Intenta con otra palabra</small>
                </p>`;
            if (resultsCount) resultsCount.textContent = "";
            return;
        }

        // Contador de resultados
        if (resultsCount) {
            const total = productos.length;
            const mostrando = lista.length;
            resultsCount.textContent = mostrando < total
                ? `${mostrando} resultado${mostrando !== 1 ? "s" : ""} encontrado${mostrando !== 1 ? "s" : ""}`
                : `${total} producto${total !== 1 ? "s" : ""} disponible${total !== 1 ? "s" : ""}`;
        }

        lista.forEach(producto => {
            const card = document.createElement("div");
            card.className = "product";

            card.innerHTML = `
                <div class="product-image-wrapper">
                    <img
                        src="${producto.imagen}"
                        alt="${producto.nombre}"
                        loading="lazy"
                        onerror="this.src='images/placeholder.jpg'">
                </div>
                <h3>${producto.nombre}</h3>
                <p class="price">$${producto.precio.toLocaleString("es-CO")}</p>
                <a
                    class="btn"
                    target="_blank"
                    rel="noopener"
                    href="https://wa.me/573008310294?text=Hola,%20me%20interesa%20el%20producto:%20${encodeURIComponent(producto.nombre)}%20Precio:%20$${producto.precio}">
                    🛒 Comprar por WhatsApp
                </a>
            `;

            contenedor.appendChild(card);
        });
    }

    // ── Render inicial ──
    renderProductos(productos);

    // ── Buscador en tiempo real ──
    let debounceTimer;

    searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            const termino = e.target.value.toLowerCase().trim();

            if (termino === "") {
                renderProductos(productos);
                return;
            }

            const filtrados = productos.filter(p =>
                p.nombre.toLowerCase().includes(termino)
            );

            renderProductos(filtrados);
        }, 200); // pequeño debounce para no filtrar en cada tecla
    });

    // Limpiar al presionar Escape
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            searchInput.value = "";
            renderProductos(productos);
            searchInput.blur();
        }
    });
});
