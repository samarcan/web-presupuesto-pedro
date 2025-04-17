let addedProducts = [];

// Verificar que la variable productos existe
if (typeof productos === 'undefined') {
    console.error('La variable productos no está definida. Asegúrate de que el archivo productos_escoda.js está cargado correctamente.');
    alert('Error: No se pudieron cargar los productos. Por favor, recarga la página.');
}

// Add product to the list
document.getElementById('addProduct').addEventListener('click', () => {
    const productId = document.getElementById('productId').value.trim().toUpperCase();
    const quantity = parseInt(document.getElementById('quantity').value);

    if (!productId) {
        alert('Por favor, introduce un ID de producto');
        return;
    }

    if (typeof productos !== 'object' || productos === null) {
        alert('Error: Los productos no están disponibles en el formato correcto');
        return;
    }

    // Buscar el producto en el objeto
    const product = productos[productId];
    
    if (!product) {
        console.log('ID buscado:', productId);
        console.log('Productos disponibles:', Object.keys(productos));
        alert(`Producto no encontrado. ID: ${productId}`);
        return;
    }

    addedProducts.push({
        id: productId,
        quantity: quantity,
        product: product
    });

    updateProductsList();
    document.getElementById('productId').value = '';
    document.getElementById('quantity').value = '1';
});

// Update the products list in the UI
function updateProductsList() {
    const container = document.getElementById('addedProducts');
    container.innerHTML = '';

    addedProducts.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'product-item';
        div.innerHTML = `
            <span>${item.product.descripcion} (ID: ${item.id})</span>
            <span>Cantidad: ${item.quantity}</span>
            <span>Precio: ${(item.product.pvp * item.quantity).toFixed(2)}€</span>
            <button class="remove-product" data-index="${index}">Eliminar</button>
        `;
        container.appendChild(div);
    });

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-product').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            addedProducts.splice(index, 1);
            updateProductsList();
        });
    });
}

// Generate quote
document.getElementById('generateQuote').addEventListener('click', () => {
    if (addedProducts.length === 0) {
        alert('Por favor, añade al menos un producto');
        return;
    }

    let total = 0;
    let quoteText = 'PRESUPUESTO\n\n';
    quoteText += 'Productos:\n\n';

    addedProducts.forEach(item => {
        const subtotal = item.product.pvp * item.quantity;
        total += subtotal;
        quoteText += `${item.product.descripcion}\n`;
        quoteText += `ID: ${item.id}\n`;
        quoteText += `Cantidad: ${item.quantity}\n`;
        quoteText += `Precio unitario: ${item.product.pvp.toFixed(2)}€\n`;
        quoteText += `Subtotal: ${subtotal.toFixed(2)}€\n\n`;
    });

    quoteText += `\nTOTAL: ${total.toFixed(2)}€`;

    document.getElementById('quoteResult').textContent = quoteText;
}); 