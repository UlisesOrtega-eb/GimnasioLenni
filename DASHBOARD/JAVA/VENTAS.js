// Datos de productos para GYM LENIN
const products = {
    merch: [
        { id: 1, name: "Camiseta Gym", price: 150, image: "IMAGES/PRODUCTOS/CAMISETA.AVIF" },
        { id: 2, name: "Sudadera Gym", price: 200, image: "IMAGES/PRODUCTOS/SUDADERA.PNG" },
        { id: 3, name: "Pantalón Deportivo", price: 150, image: "IMAGES/PRODUCTOS/PANS.PNG" }
    ],
    suplementos: [
        { id: 4, name: "Proteína Whey", price: 600, image: "IMAGES/PRODUCTOS/PROTEINA.PNG" },
        { id: 5, name: "Creatina Monohidrato", price: 800, image: "IMAGES/PRODUCTOS/CREATINA.PNG" },
        { id: 6, name: "Preentreno", price: 800, image: "IMAGES/PRODUCTOS/HYPNOTIC.PNG" }
    ],
    alimentos: [
        { id: 7, name: "Barra Proteica", price: 25, image: "IMAGES/PRODUCTOS/BARRITAS.PNG" },
        { id: 8, name: "Gomitas Energéticas", price: 15, image: "IMAGES/PRODUCTOS/GOMITAS.PNG" },
        { id: 9, name: "Mix de Frutos Secos", price: 25, image: "IMAGES/PRODUCTOS/PROTEINA.PNG" }
    ],
    bebidas: [
        { id: 10, name: "Agua 1L", price: 12, image: "IMAGES/PRODUCTOS/AG.PNG" },
        { id: 11, name: "Bebida Volt", price: 22, image: "IMAGES/PRODUCTOS/VOLT.PNG" },
        { id: 12, name: "Monster Energy", price: 45, image: "IMAGES/PRODUCTOS/MONSTERS.PNG" },
        { id: 13, name: "Predator Energy", price: 25, image: "IMAGES/PRODUCTOS/PREDATOR.PNG" }
    ]
};

// Variables globales
let currentSale = [];
let tipoPagoSeleccionado = 'efectivo'; // Valor por defecto

// Elementos del DOM
const categorySelect = document.getElementById('category');
const productSelect = document.getElementById('product');
const priceInput = document.getElementById('price');
const quantityInput = document.getElementById('quantity');
const specialRequestsInput = document.getElementById('special-requests');
const addProductBtn = document.getElementById('add-product');
const salesTableBody = document.getElementById('sales-table-body');
const totalAmount = document.getElementById('total-amount');
const clearSaleBtn = document.getElementById('clear-sale');
const completeSaleBtn = document.getElementById('complete-sale');
const productImg = document.getElementById('product-img');
const modal = document.getElementById('ticket-modal');
const closeBtn = document.querySelector('.close');
const printBtn = document.getElementById('print-ticket');
const ticketContent = document.getElementById('ticket-content');
const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
const cashContainer = document.getElementById('cash-container');
const cashReceivedInput = document.getElementById('cash-received');
const cashChangeDisplay = document.getElementById('cash-change');

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
categorySelect.addEventListener('change', loadProducts);
productSelect.addEventListener('change', showProductDetails);
addProductBtn.addEventListener('click', addProductToSale);
clearSaleBtn.addEventListener('click', clearSale);
completeSaleBtn.addEventListener('click', completeSale);
closeBtn.addEventListener('click', () => modal.style.display = 'none');
printBtn.addEventListener('click', printTicket);
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});
paymentMethodRadios.forEach(radio => {
    radio.addEventListener('change', updatePaymentMethod);
});
cashReceivedInput.addEventListener('input', calculateChange);

// Funciones principales
function initApp() {
    loadCategories();
    addProductBtn.disabled = true;
    updatePaymentMethod();

    // Estilos para botones al pasar el cursor
    const style = document.createElement('style');
    style.textContent = `
        .delete-btn:hover {
            background-color: #ff4444 !important;
            border-color: #ff0000 !important;
        }
        
        #add-product:hover:not(:disabled) {
            background-color: #ff4444 !important;
            border-color: #ff0000 !important;
        }
    `;
    document.head.appendChild(style);
}

function loadCategories() {
    // Ya están cargadas en el HTML
}

function loadProducts() {
    const category = categorySelect.value;
    productSelect.disabled = !category;

    productSelect.innerHTML = '<option value="">Seleccione producto</option>';

    if (category) {
        products[category].forEach(product => {
            const option = document.createElement('option');
            option.value = product.name;
            option.textContent = product.name;
            option.dataset.price = product.price;
            option.dataset.image = product.image || 'IMAGES/LISTO.png';
            option.dataset.id = product.id;
            productSelect.appendChild(option);
        });
    }

    priceInput.value = '';
    productImg.src = 'IMAGES/AGUA.png';
    addProductBtn.disabled = true;
}

function showProductDetails() {
    const selectedOption = productSelect.options[productSelect.selectedIndex];

    if (selectedOption.value) {
        priceInput.value = '$' + selectedOption.dataset.price;
        productImg.src = selectedOption.dataset.image;
        addProductBtn.disabled = false;
    } else {
        priceInput.value = '';
        productImg.src = 'IMAGES/AGUA.png';
        addProductBtn.disabled = true;
    }
}

function addProductToSale() {
    const productName = productSelect.value;
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    let price = parseFloat(selectedOption.dataset.price) || 0;
    const productId = parseInt(selectedOption.dataset.id) || 0;
    const quantity = parseInt(quantityInput.value) || 1;
    const specialRequests = specialRequestsInput.value;

    const subtotal = price * quantity;

    let displayName = productName;

    if (specialRequests) {
        displayName += ` [${specialRequests}]`;
    }

    currentSale.push({
        id: productId,
        name: displayName,
        price: price,
        quantity: quantity,
        subtotal: subtotal,
        originalName: productName,
        specialRequests: specialRequests
    });

    updateSalesTable();
    calculateTotal();

    quantityInput.value = '1';
    specialRequestsInput.value = '';
}

function updateSalesTable() {
    salesTableBody.innerHTML = '';

    currentSale.forEach((product, index) => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.quantity}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>$${product.subtotal.toFixed(2)}</td>
            <td><button class="delete-btn" data-index="${index}">Eliminar</button></td>
        `;

        salesTableBody.appendChild(row);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            currentSale.splice(index, 1);
            updateSalesTable();
            calculateTotal();
        });
    });
}

function calculateTotal() {
    const total = currentSale.reduce((sum, product) => sum + product.subtotal, 0);
    totalAmount.textContent = '$' + total.toFixed(2);
    calculateChange();
}

function clearSale() {
    if (confirm('¿Está seguro que desea limpiar la venta actual?')) {
        currentSale = [];
        updateSalesTable();
        calculateTotal();

        categorySelect.value = '';
        productSelect.innerHTML = '<option value="">Seleccione producto</option>';
        productSelect.disabled = true;
        priceInput.value = '';
        quantityInput.value = '1';
        specialRequestsInput.value = '';
        productImg.src = 'IMAGES/GYM.ico';
        addProductBtn.disabled = true;

        document.querySelector('input[name="payment-method"][value="efectivo"]').checked = true;
        cashReceivedInput.value = '';
        updatePaymentMethod();
    }
}

async function completeSale() {
    if (currentSale.length === 0) {
        alert('No hay productos en la venta');
        return;
    }

    const paymentMethodRadio = document.querySelector('input[name="payment-method"]:checked');
    if (!paymentMethodRadio) {
        alert('Debe seleccionar un método de pago');
        return;
    }

    const paymentMethod = paymentMethodRadio.value;
    const total = currentSale.reduce((sum, product) => sum + product.subtotal, 0);

    if (paymentMethod === 'efectivo') {
        const cashReceived = parseFloat(cashReceivedInput.value) || 0;
        if (cashReceived < total) {
            alert(`El efectivo recibido ($${cashReceived.toFixed(2)}) es menor al total ($${total.toFixed(2)})`);
            return;
        }
    }

    completeSaleBtn.disabled = true;
    completeSaleBtn.textContent = "Procesando...";

    try {
        // Preparar datos para enviar al servidor
        const ventaData = {
            id_empleado: 1, // Debería ser dinámico (usuario logueado)
            total: total,
            metodo_pago: paymentMethod,
            cliente_nombre: "Cliente no identificado", // Valor por defecto
            productos: currentSale.map(producto => ({
                producto_id: producto.id,
                nombre: producto.originalName,
                cantidad: producto.quantity,
                precio: producto.price,
                observaciones: producto.specialRequests || null
            }))
        };

        console.log("Enviando datos:", ventaData); // Para depuración

        // CORRECCIÓN DE RUTA: El PHP está en la misma carpeta que el JS
        const response = await fetch('VENTAS.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ventaData)
        });

        // Verificar si la respuesta es JSON válido
        const responseText = await response.text();
        console.log("Respuesta del servidor:", responseText); // Para depuración

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`El servidor respondió con un formato inválido: ${responseText}`);
        }

        if (!response.ok) {
            throw new Error(data.message || `Error HTTP: ${response.status}`);
        }

        if (!data.success) {
            throw new Error(data.message || 'Error al guardar la venta');
        }

        generateTicket(paymentMethod);
        modal.style.display = 'block';
        alert(`Venta #${data.id_venta} registrada con éxito!`);

        // LIMPIAR CAMPOS DESPUÉS DE VENTA EXITOSA
        clearSaleFields();

    } catch (error) {
        console.error('Error:', error);
        alert(`Error al procesar venta: ${error.message}`);
    } finally {
        completeSaleBtn.disabled = false;
        completeSaleBtn.textContent = "Realizar Venta";
    }
}

function clearSaleFields() {
    // Limpiar todos los campos después de una venta exitosa
    currentSale = [];
    updateSalesTable();
    calculateTotal();

    categorySelect.value = '';
    productSelect.innerHTML = '<option value="">Seleccione producto</option>';
    productSelect.disabled = true;
    priceInput.value = '';
    quantityInput.value = '1';
    specialRequestsInput.value = '';
    productImg.src = 'IMAGES/LOGOC.png';
    addProductBtn.disabled = true;

    document.querySelector('input[name="payment-method"][value="efectivo"]').checked = true;
    cashReceivedInput.value = '';
    updatePaymentMethod();
}

function generateTicket(paymentMethod) {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const total = currentSale.reduce((sum, product) => sum + product.subtotal, 0);
    let paymentInfo = '';

    if (paymentMethod === 'efectivo') {
        const cashReceived = parseFloat(cashReceivedInput.value) || 0;
        const change = cashReceived - total;
        paymentInfo = `
            <p><strong>Método de pago:</strong> Efectivo</p>
            <p><strong>Efectivo recibido:</strong> $${cashReceived.toFixed(2)}</p>
            <p><strong>Cambio:</strong> $${change.toFixed(2)}</p>
        `;
    } else {
        paymentInfo = `<p><strong>Método de pago:</strong> ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</p>`;
    }

    let ticketHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <h2 style="margin: 5px 0;">GYM LENIN</h2>
            <p style="margin: 5px 0;">Sistema de Ventas</p>
            <p style="margin: 5px 0;">${dateStr} ${timeStr}</p>
            <p style="margin: 5px 0;"><strong>Cliente:</strong> Cliente no identificado</p>
        </div>
        <table style="width: 100%; margin-bottom: 15px;">
            <thead>
                <tr>
                    <th style="text-align: left; border-bottom: 1px solid #000;">Producto</th>
                    <th style="text-align: left; border-bottom: 1px solid #000;">Cant.</th>
                    <th style="text-align: left; border-bottom: 1px solid #000;">Total</th>
                </tr>
            </thead>
            <tbody>
    `;

    currentSale.forEach(product => {
        ticketHTML += `
            <tr>
                <td style="padding: 5px 0;">${product.name}</td>
                <td style="padding: 5px 0;">${product.quantity}</td>
                <td style="padding: 5px 0;">$${product.subtotal.toFixed(2)}</td>
            </tr>
        `;
    });

    ticketHTML += `
            </tbody>
        </table>
        <div style="margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px;">
            <p style="font-weight: bold; margin: 5px 0;">Total: $${total.toFixed(2)}</p>
            ${paymentInfo}
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <p style="margin: 5px 0;">¡Gracias por su compra!</p>
            <p style="margin: 5px 0;">Vuelva pronto</p>
        </div>
    `;

    ticketContent.innerHTML = ticketHTML;
}

function printTicket() {
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write('<html><head><title>Ticket de Venta</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; }
        td { padding: 5px 0; }
        .total { font-weight: bold; }
        .center { text-align: center; }
        .top-border { border-top: 1px dashed #000; padding-top: 10px; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(ticketContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function updatePaymentMethod() {
    const metodo = document.querySelector('input[name="payment-method"]:checked');
    if (!metodo) return;

    tipoPagoSeleccionado = metodo.value;

    cashReceivedInput.disabled = tipoPagoSeleccionado !== 'efectivo';
    cashContainer.style.display = tipoPagoSeleccionado === 'efectivo' ? 'block' : 'none';

    if (tipoPagoSeleccionado === 'efectivo') {
        calculateChange();
    }
}

function calculateChange() {
    if (currentSale.length === 0) return;

    const total = currentSale.reduce((sum, product) => sum + product.subtotal, 0);
    const cashReceived = parseFloat(cashReceivedInput.value) || 0;
    const change = cashReceived - total;

    if (change >= 0) {
        cashChangeDisplay.textContent = `Cambio: $${change.toFixed(2)}`;
    } else {
        cashChangeDisplay.textContent = `Faltan: $${Math.abs(change).toFixed(2)}`;
    }
}