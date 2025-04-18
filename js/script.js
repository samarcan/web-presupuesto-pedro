let addedProducts = [];
let manualIdCounter = 1;

// Tab switching functionality
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        button.classList.add('active');
        document.getElementById(button.dataset.tab + 'Form').classList.add('active');
    });
});

// Verificar que la variable productos existe
if (typeof productos === 'undefined') {
    console.error('La variable productos no está definida. Asegúrate de que el archivo productos_escoda.js está cargado correctamente.');
    alert('Error: No se pudieron cargar los productos. Por favor, recarga la página.');
}

// Add product to the list (automatic)
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

// Add product manually
document.getElementById('addManualProduct').addEventListener('click', () => {
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const quantity = parseInt(document.getElementById('productQuantity').value);

    if (!name || isNaN(price) || price <= 0) {
        alert('Por favor, completa todos los campos correctamente');
        return;
    }

    const manualProduct = {
        id: `MANUAL-${manualIdCounter++}`,
        quantity: quantity,
        product: {
            descripcion: name,
            pvp: price
        }
    };

    addedProducts.push(manualProduct);
    updateProductsList();

    // Clear form
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productQuantity').value = '1';
});

// Update the products list in the UI
function updateProductsList() {
    const container = document.getElementById('addedProducts');
    container.innerHTML = '';

    addedProducts.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'product-item';
        
        const productNameSpan = document.createElement('span');
        productNameSpan.className = 'product-name editable';
        productNameSpan.innerHTML = `${item.product.descripcion}${!item.id.startsWith('MANUAL-') ? ` (ID: ${item.id})` : ''}`;
        productNameSpan.title = 'Haz clic para editar';
        
        productNameSpan.addEventListener('click', function() {
            const currentText = item.product.descripcion;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentText;
            input.className = 'edit-name-input';
            
            const saveEdit = () => {
                const newName = input.value.trim();
                if (newName && newName !== currentText) {
                    item.product.descripcion = newName;
                    updateProductsList();
                } else {
                    updateProductsList();
                }
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveEdit();
                }
            });

            // Reemplazar solo el texto de descripción, manteniendo el ID si existe
            const idText = !item.id.startsWith('MANUAL-') ? ` (ID: ${item.id})` : '';
            input.style.width = Math.max(200, currentText.length * 8) + 'px';
            productNameSpan.innerHTML = '';
            productNameSpan.appendChild(input);
            if (idText) {
                const idSpan = document.createElement('span');
                idSpan.className = 'product-id';
                idSpan.textContent = idText;
                productNameSpan.appendChild(idSpan);
            }
            
            input.focus();
            input.select();
        });

        const infoDiv = document.createElement('div');
        infoDiv.className = 'product-info';
        
        // Crear el span de cantidad editable
        const quantitySpan = document.createElement('span');
        quantitySpan.className = 'quantity editable';
        quantitySpan.innerHTML = `Cantidad: <span class="quantity-value">${item.quantity}</span>`;
        quantitySpan.title = 'Haz clic para editar la cantidad';
        
        quantitySpan.addEventListener('click', function() {
            const currentQuantity = item.quantity;
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.value = currentQuantity;
            input.className = 'edit-quantity-input';
            
            const saveQuantity = () => {
                const newQuantity = parseInt(input.value);
                if (!isNaN(newQuantity) && newQuantity > 0 && newQuantity !== currentQuantity) {
                    item.quantity = newQuantity;
                    updateProductsList();
                } else {
                    updateProductsList();
                }
            };

            input.addEventListener('blur', saveQuantity);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveQuantity();
                }
            });

            const quantityValueSpan = quantitySpan.querySelector('.quantity-value');
            quantityValueSpan.innerHTML = '';
            quantityValueSpan.appendChild(input);
            
            input.focus();
            input.select();
        });

        // Añadir el precio y el botón de eliminar
        const priceSpan = document.createElement('span');
        priceSpan.className = 'price-display';
        priceSpan.textContent = `Precio: ${(item.product.pvp * item.quantity).toFixed(2)}€`;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-product';
        removeButton.textContent = 'Eliminar';
        removeButton.dataset.index = index;
        removeButton.addEventListener('click', () => {
            addedProducts.splice(index, 1);
            updateProductsList();
        });

        infoDiv.appendChild(quantitySpan);
        infoDiv.appendChild(priceSpan);
        infoDiv.appendChild(removeButton);
        
        div.appendChild(productNameSpan);
        div.appendChild(infoDiv);
        container.appendChild(div);
    });
}

// Generate quote
document.getElementById('generateQuote').addEventListener('click', () => {
    if (addedProducts.length === 0) {
        alert('Por favor, añade al menos un producto');
        return;
    }

    // Verificar información del cliente
    const clientName = document.getElementById('clientName').value.trim();
    const clientAddress = document.getElementById('clientAddress').value.trim();

    if (!clientName || !clientAddress) {
        alert('Por favor, completa la información del cliente');
        return;
    }

    const quoteContainer = document.getElementById('quoteResult');
    quoteContainer.innerHTML = '';

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // Definir anchos de columna
    const columnWidths = {
        description: maxWidth * 0.60,  // Reducido para dejar más espacio
        quantity: maxWidth * 0.10,     
        price: maxWidth * 0.15,        // Aumentado para el precio
        subtotal: maxWidth * 0.15      // Aumentado para el subtotal
    };
    
    // Add logo
    const logo = document.getElementById('sertecLogo');
    if (logo.complete) {
        addLogoToPDF(doc, logo, margin);
    } else {
        logo.onload = function() {
            addLogoToPDF(doc, logo, margin);
        };
    }
    
    // Add company information (aligned to the right)
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('SERTEC DE EXTREMADURA, SL', pageWidth - margin, 15, { align: 'right' });
    doc.text('POL. IND. LAS CAPELLANIAS', pageWidth - margin, 20, { align: 'right' });
    doc.text('PARCELA Nº 246', pageWidth - margin, 25, { align: 'right' });
    doc.text('10001 CACERES', pageWidth - margin, 30, { align: 'right' });
    
    // Add title (left-aligned)
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('PRESUPUESTO', margin, 50);
    
    // Add date below title (left-aligned)
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    const today = new Date();
    doc.text(`Fecha: ${today.toLocaleDateString()}`, margin, 55);
    
    // Add client information (in a box to the right)
    doc.setFontSize(8);
    const clientBoxWidth = (pageWidth - (margin * 2)) * 0.3; // 3/10 del espacio disponible
    const clientBoxX = pageWidth - margin - clientBoxWidth; // Alineado a la derecha
    const clientBoxY = 40;
    const clientBoxHeight = 25;
    
    // Draw client info box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.rect(clientBoxX, clientBoxY, clientBoxWidth, clientBoxHeight);
    
    // Add client info inside box (mixed alignment)
    const rightMargin = 4;
    const leftMargin = 4;
    doc.setFont(undefined, 'bold');
    doc.text('CLIENTE:', clientBoxX + leftMargin, clientBoxY + 5);
    doc.setFont(undefined, 'normal');
    
    // Ajustar el texto del cliente al nuevo ancho del cuadro
    const maxClientTextWidth = clientBoxWidth - leftMargin - rightMargin - 15; // Restamos espacio extra para "CLIENTE:"
    const clientNameLines = doc.splitTextToSize(clientName, maxClientTextWidth);
    doc.text(clientNameLines, clientBoxX + clientBoxWidth - rightMargin, clientBoxY + 10, { align: 'right' });
    
    const addressLines = doc.splitTextToSize(clientAddress, maxClientTextWidth);
    addressLines.forEach((line, index) => {
        doc.text(line, clientBoxX + clientBoxWidth - rightMargin, clientBoxY + 15 + (index * 4), { align: 'right' });
    });
    
    // Añadir línea separadora después de la cabecera
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, 70, pageWidth - margin, 70);
    
    // Añadir tabla de productos
    let y = 80;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    
    // Dibujar cabecera de la tabla
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, maxWidth, 7, 'F');
    doc.text('DESCRIPCIÓN', margin + 2, y);
    doc.text('CANT.', margin + columnWidths.description + (columnWidths.quantity/2), y, { align: 'center' });
    doc.text('PRECIO/U', margin + columnWidths.description + columnWidths.quantity + (columnWidths.price/2), y, { align: 'center' });
    doc.text('SUBTOTAL', pageWidth - margin - 2, y, { align: 'right' });
    y += 10;
    
    // Contenido de la tabla
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    let total = 0;
    
    addedProducts.forEach((item, index) => {
        const subtotal = item.product.pvp * item.quantity;
        total += subtotal;
        
        // Verificar si necesitamos una nueva página
        if (y > pageHeight - 50) {
            doc.addPage();
            y = margin;
            // Repetir cabecera en la nueva página
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y - 5, maxWidth, 7, 'F');
            doc.text('DESCRIPCIÓN', margin + 2, y);
            doc.text('CANT.', margin + columnWidths.description + (columnWidths.quantity/2), y, { align: 'center' });
            doc.text('PRECIO/U', margin + columnWidths.description + columnWidths.quantity + (columnWidths.price/2), y, { align: 'center' });
            doc.text('SUBTOTAL', pageWidth - margin - 2, y, { align: 'right' });
            y += 10;
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
        }
        
        // Línea superior de la fila
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.line(margin, y - 6, pageWidth - margin, y - 6);
        
        // Descripción del producto con ID
        const description = !item.id.startsWith('MANUAL-') ? 
            `${item.product.descripcion} (ID: ${item.id})` : 
            item.product.descripcion;
        const splitDescription = doc.splitTextToSize(description, columnWidths.description - 5);
        doc.text(splitDescription, margin + 2, y);
        
        // Resto de columnas con posiciones ajustadas
        const cantX = margin + columnWidths.description + (columnWidths.quantity/2);
        const precioX = margin + columnWidths.description + columnWidths.quantity + (columnWidths.price/2);
        const subtotalX = pageWidth - margin - 2;

        doc.text(item.quantity.toString(), cantX, y, { align: 'center' });
        doc.text(`${item.product.pvp.toFixed(2)}€`, precioX, y, { align: 'center' });
        doc.text(`${subtotal.toFixed(2)}€`, subtotalX, y, { align: 'right' });
        
        y += 10;
    });
    
    // Línea final de la tabla
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 6, pageWidth - margin, y - 6);
    
    // Total (ajustado para alinear con la columna de subtotal)
    y += 6;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL:', pageWidth - margin - 70, y);
    doc.text(`${total.toFixed(2)}€`, pageWidth - margin - 2, y, { align: 'right' });
    
    // Pie de página
    const footerY = pageHeight - 20;
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Este presupuesto tiene una validez de 30 días desde la fecha de emisión.', margin, footerY);
    
    // Create PDF viewer and download button
    const pdfDataUri = doc.output('datauristring');
    
    const container = document.createElement('div');
    container.className = 'pdf-container';
    
    // Formatear la fecha para el nombre del archivo
    const dateStr = today.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '-');
    
    // Formatear el nombre del cliente (eliminar caracteres especiales y espacios)
    const cleanClientName = clientName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
        .replace(/[^a-zA-Z0-9]/g, "_") // Reemplazar caracteres especiales con _
        .replace(/_+/g, "_") // Reemplazar múltiples _ con uno solo
        .replace(/^_|_$/g, ""); // Eliminar _ al inicio y final
    
    const fileName = `presupuesto_${cleanClientName}_${dateStr}.pdf`;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'download-button-container';
    
    const downloadButton = document.createElement('button');
    downloadButton.className = 'primary-button';
    downloadButton.textContent = 'Descargar PDF';
    downloadButton.onclick = () => doc.save(fileName);
    
    buttonContainer.appendChild(downloadButton);
    
    const embed = document.createElement('embed');
    embed.src = pdfDataUri;
    embed.type = 'application/pdf';
    embed.style.width = '100%';
    embed.style.height = '800px';
    
    container.appendChild(buttonContainer);
    container.appendChild(embed);
    quoteContainer.appendChild(container);
});

function addLogoToPDF(doc, logo, margin) {
    try {
        // Crear un canvas temporal para convertir la imagen
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = logo.width;
        canvas.height = logo.height;
        ctx.drawImage(logo, 0, 0);
        
        // Convertir el canvas a base64
        const imgData = canvas.toDataURL('image/png');
        
        // Añadir la imagen al PDF
        doc.addImage(imgData, 'PNG', margin, 10, 40, 20);
    } catch (error) {
        console.error('Error al añadir el logo al PDF:', error);
        // En caso de error, añadir un rectángulo azul como placeholder
        doc.setFillColor(51, 122, 183); // Color azul corporativo
        doc.rect(margin, 10, 40, 20, 'F');
    }
} 