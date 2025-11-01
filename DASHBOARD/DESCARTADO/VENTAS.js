const productos = {
    merch: [
        { id: 1, nombre: "Camiseta Gym", precio: 25.99, imagen: "IMAGES/PRODUCTOS/CAMISETA.AVIF" },
        { id: 2, nombre: "Sudadera Gym", precio: 45.99, imagen: "IMAGES/PRODUCTOS/SUDADERA.PNG" },
        { id: 3, nombre: "Pantalón Deportivo", precio: 35.99, imagen: "IMAGES/PRODUCTOS/PANS.PNG" }
    ],
    suplementos: [
        { id: 4, nombre: "Proteína Whey", precio: 39.99, imagen: "IMAGES/PRODUCTOS/PROTEINA.PNG" },
        { id: 5, nombre: "Creatina Monohidrato", precio: 29.99, imagen: "IMAGES/PRODUCTOS/CREATINA.PNG" },
        { id: 6, nombre: "Preentreno", precio: 24.99, imagen: "IMAGES/PRODUCTOS/HYPNOTIC.PNG" }
    ],
    alimentos: [
        { id: 7, nombre: "Barra Proteica", precio: 2.99, imagen: "IMAGES/PRODUCTOS/BARRITAS.PNG" },
        { id: 8, nombre: "Gomitas Energéticas", precio: 9.99, imagen: "IMAGES/PRODUCTOS/GOMITAS.PNG" },
        { id: 9, nombre: "Mix de Frutos Secos", precio: 12.99, imagen: "IMAGES/PRODUCTOS/PROTEINA.PNG" }
    ],
    bebidas: [
        { id: 10, nombre: "Agua 1L", precio: 1.50, imagen: "IMAGES/PRODUCTOS/AG.PNG" },
        { id: 11, nombre: "Bebida Volt", precio: 2.25, imagen: "IMAGES/PRODUCTOS/VOLT.PNG" },
        { id: 12, nombre: "Monster Energy", precio: 3.25, imagen: "IMAGES/PRODUCTOS/MONSTERS.PNG" },
        { id: 13, nombre: "Predator Energy", precio: 2.75, imagen: "IMAGES/PRODUCTOS/PREDATOR.PNG" }
    ]
};

// Variables globales
let carrito = [];
let categoriaActual = null;
let nextCustomId = 1000;

// Elementos del DOM
const stepCategory = document.getElementById('step-category');
const stepProduct = document.getElementById('step-product');
const stepCart = document.getElementById('step-cart');
const currentCategory = document.getElementById('current-category');
const productsGrid = document.getElementById('products-grid');
const cartItems = document.getElementById('cart-items');
const totalAmount = document.getElementById('total-amount');
const cashAmount = document.getElementById('cash-amount');
const changeAmount = document.getElementById('change-amount');
const checkoutBtn = document.getElementById('checkout-btn');
const cashPayment = document.getElementById('cash-payment');
const backToCategory = document.getElementById('back-to-category');
const backToProduct = document.getElementById('back-to-product');
const customProductForm = document.getElementById('custom-product-form');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            categoriaActual = e.currentTarget.dataset.category;
            mostrarProductos();
        });
    });

    backToCategory.addEventListener('click', () => {
        stepCategory.classList.remove('hidden');
        stepProduct.classList.add('hidden');
    });

    backToProduct.addEventListener('click', () => {
        stepProduct.classList.remove('hidden');
        stepCart.classList.add('hidden');
    });

    document.querySelectorAll('input[name="payment-method"]').forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.value === 'efectivo') {
                cashPayment.style.display = 'grid';
            } else {
                cashPayment.style.display = 'none';
                changeAmount.textContent = '$0.00';
            }
        });
    });

    if (cashAmount) cashAmount.addEventListener('input', calcularCambio);
    if (checkoutBtn) checkoutBtn.addEventListener('click', procesarVenta);
    if (customProductForm) customProductForm.addEventListener('submit', agregarProductoPersonalizado);
});

function mostrarProductos() {
    stepCategory.classList.add('hidden');
    stepProduct.classList.remove('hidden');
    currentCategory.textContent = getCategoryName(categoriaActual);
    productsGrid.innerHTML = '';

    if (productos[categoriaActual] && productos[categoriaActual].length > 0) {
        productos[categoriaActual].forEach(producto => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='IMAGES/PRODUCTOS/default.jpg'">
                </div>
                <div class="product-info">
                    <h3>${producto.nombre}</h3>
                    <p class="product-price">$${producto.precio.toFixed(2)}</p>
                </div>
            `;
            productCard.addEventListener('click', () => agregarAlCarrito(producto));
            productsGrid.appendChild(productCard);
        });
    } else {
        productsGrid.innerHTML = '<p class="empty-cart">No hay productos en esta categoría</p>';
    }
}

function agregarAlCarrito(producto) {
    const itemExistente = carrito.find(item => item.id === producto.id);
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            imagen: producto.imagen,
            categoria: categoriaActual
        });
    }
    mostrarCarrito();
    mostrarNotificacion(`${producto.nombre} agregado al carrito`);
}

function agregarProductoPersonalizado(e) {
    e.preventDefault();
    const nombre = document.getElementById('custom-product-name').value;
    const precio = parseFloat(document.getElementById('custom-product-price').value);

    if (!nombre || isNaN(precio) || precio <= 0) {
        alert('Por favor ingresa un nombre y precio válidos');
        return;
    }

    const productoPersonalizado = {
        id: nextCustomId++,
        nombre: nombre,
        precio: precio,
        cantidad: 1,
        imagen: 'IMAGES/PRODUCTOS/personalizado.jpg',
        categoria: categoriaActual,
        personalizado: true
    };

    carrito.push(productoPersonalizado);
    mostrarCarrito();
    mostrarNotificacion(`${nombre} agregado al carrito`);
    document.getElementById('custom-product-name').value = '';
    document.getElementById('custom-product-price').value = '';
}

function mostrarCarrito() {
    stepProduct.classList.add('hidden');
    stepCart.classList.remove('hidden');

    if (carrito.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">El carrito está vacío</p>';
        totalAmount.textContent = '$0.00';
        return;
    }

    cartItems.innerHTML = '';
    let total = 0;

    carrito.forEach((item, index) => {
        const itemTotal = item.precio * item.cantidad;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.imagen}" alt="${item.nombre}" onerror="this.src='IMAGES/PRODUCTOS/default.jpg'">
            </div>
            <div class="cart-item-name">${item.nombre}</div>
            <div class="cart-item-price">$${item.precio.toFixed(2)}</div>
            <div class="quantity-controls">
                <button class="quantity-btn minus" data-index="${index}">-</button>
                <span>${item.cantidad}</span>
                <button class="quantity-btn plus" data-index="${index}">+</button>
            </div>
            <button class="remove-item" data-index="${index}">×</button>
        `;
        cartItems.appendChild(cartItem);
    });

    totalAmount.textContent = `$${total.toFixed(2)}`;

    document.querySelectorAll('.quantity-btn.minus').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            disminuirCantidad(index);
        });
    });

    document.querySelectorAll('.quantity-btn.plus').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            aumentarCantidad(index);
        });
    });

    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            eliminarDelCarrito(index);
        });
    });

    if (document.querySelector('input[name="payment-method"]:checked').value === 'efectivo') {
        calcularCambio();
    }
}

function aumentarCantidad(index) {
    carrito[index].cantidad++;
    mostrarCarrito();
}

function disminuirCantidad(index) {
    if (carrito[index].cantidad > 1) {
        carrito[index].cantidad--;
    } else {
        eliminarDelCarrito(index);
        return;
    }
    mostrarCarrito();
}

function eliminarDelCarrito(index) {
    const item = carrito[index];
    carrito.splice(index, 1);
    mostrarCarrito();
    mostrarNotificacion(`${item.nombre} eliminado del carrito`);
}

function calcularCambio() {
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const montoRecibido = parseFloat(cashAmount.value) || 0;
    const cambio = montoRecibido - total;

    if (cambio >= 0) {
        changeAmount.textContent = `$${cambio.toFixed(2)}`;
        changeAmount.style.color = '#28a745';
    } else {
        changeAmount.textContent = `-$${Math.abs(cambio).toFixed(2)}`;
        changeAmount.style.color = '#dc3545';
    }
}

// FUNCIÓN PROCESAR VENTA - COMPLETAMENTE CORREGIDA
function procesarVenta() {
    if (carrito.length === 0) {
        alert('El carrito está vacío. Agrega productos para procesar la venta.');
        return;
    }

    const metodoPago = document.querySelector('input[name="payment-method"]:checked').value;
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    if (metodoPago === 'efectivo') {
        const montoRecibido = parseFloat(cashAmount.value) || 0;
        if (montoRecibido < total) {
            alert(`El monto recibido ($${montoRecibido.toFixed(2)}) es menor al total ($${total.toFixed(2)}).`);
            return;
        }
    }

    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Procesando...';

    // PREPARAR DATOS EN EL FORMATO EXACTO QUE ESPERA EL PHP
    const ventasData = carrito.map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        monto_total: parseFloat((item.precio * item.cantidad).toFixed(2)),
        metodo_pago: metodoPago,
        producto_nombre: item.nombre
    }));

    const datosEnvio = {
        ventas: ventasData,
        total_venta: parseFloat(total.toFixed(2))
    };

    console.log('Datos a enviar:', datosEnvio);

    // USAR RUTA ABSOLUTA PARA EVITAR PROBLEMAS
    const url = 'GUARDAR_VENTAS.php';

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(datosEnvio)
    })
        .then(response => {
            console.log('Status:', response.status);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
            }

            return response.text().then(text => {
                console.log('Respuesta completa:', text);

                if (!text.trim()) {
                    throw new Error('El servidor devolvió una respuesta vacía');
                }

                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Error parsing JSON:', e);
                    throw new Error(`Respuesta no JSON: ${text.substring(0, 100)}...`);
                }
            });
        })
        .then(data => {
            console.log('Datos parseados:', data);

            if (data.success) {
                alert(`✅ Venta procesada exitosamente!\nTotal: $${total.toFixed(2)}\nMétodo: ${metodoPago}`);
                carrito = [];
                mostrarCarrito();
                if (cashAmount) cashAmount.value = '';
                if (changeAmount) changeAmount.textContent = '$0.00';
                stepCart.classList.add('hidden');
                stepCategory.classList.remove('hidden');
            } else {
                throw new Error(data.message || 'Error desconocido del servidor');
            }
        })
        .catch(error => {
            console.error('Error completo:', error);
            alert('❌ Error al procesar la venta: ' + error.message);
        })
        .finally(() => {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Procesar Venta';
        });
}

function getCategoryName(category) {
    const nombres = {
        'merch': 'Merch (Ropa)',
        'suplementos': 'Suplementos',
        'alimentos': 'Alimentos',
        'bebidas': 'Bebidas'
    };
    return nombres[category] || category;
}

function mostrarNotificacion(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notification';
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);

    setTimeout(() => notificacion.style.opacity = '1', 10);
    setTimeout(() => {
        notificacion.style.opacity = '0';
        setTimeout(() => document.body.removeChild(notificacion), 300);
    }, 3000);
}