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
    document.getElementById('downloadPDF').style.display = 'block';
});

// Download PDF
document.getElementById('downloadPDF').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // Definir anchos de columna
    const columnWidths = {
        description: maxWidth * 0.45,  // Descripción
        quantity: maxWidth * 0.15,     // Cantidad
        price: maxWidth * 0.2,         // Precio unitario
        subtotal: maxWidth * 0.2       // Subtotal
    };
    
    // Add logo
    const logo = document.getElementById('sertecLogo');
    if (logo.complete) {
        addLogoToPDF(doc, logo);
    } else {
        logo.onload = function() {
            addLogoToPDF(doc, logo);
        };
    }
    
    // Añadir información del presupuesto en la cabecera
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('PRESUPUESTO', pageWidth - margin, 25, { align: 'right' });
    
    // Añadir fecha y número de presupuesto
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const today = new Date();
    doc.text(`Fecha: ${today.toLocaleDateString()}`, pageWidth - margin, 35, { align: 'right' });
    
    // Añadir línea separadora después de la cabecera
    doc.setDrawColor(70, 70, 70);
    doc.setLineWidth(0.5);
    doc.line(margin, 45, pageWidth - margin, 45);
    
    // Añadir tabla de productos
    let y = 60;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    
    // Dibujar cabecera de la tabla
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, maxWidth, 8, 'F');
    doc.text('DESCRIPCIÓN', margin + 2, y);
    doc.text('CANT.', margin + columnWidths.description + (columnWidths.quantity/2), y, { align: 'center' });
    doc.text('PRECIO/U', margin + columnWidths.description + columnWidths.quantity + (columnWidths.price/2), y, { align: 'center' });
    doc.text('SUBTOTAL', pageWidth - margin - 2, y, { align: 'right' });
    y += 10;
    
    // Contenido de la tabla
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    let total = 0;
    
    addedProducts.forEach((item, index) => {
        const subtotal = item.product.pvp * item.quantity;
        total += subtotal;
        
        // Verificar si necesitamos una nueva página
        if (y > pageHeight - 50) {
            doc.addPage();
            y = margin;
            // Repetir cabecera en la nueva página
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y - 5, maxWidth, 8, 'F');
            doc.text('DESCRIPCIÓN', margin + 2, y);
            doc.text('CANT.', margin + columnWidths.description + (columnWidths.quantity/2), y, { align: 'center' });
            doc.text('PRECIO/U', margin + columnWidths.description + columnWidths.quantity + (columnWidths.price/2), y, { align: 'center' });
            doc.text('SUBTOTAL', pageWidth - margin - 2, y, { align: 'right' });
            y += 10;
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
        }
        
        // Alternar color de fondo para las filas
        if (index % 2 === 1) {
            doc.setFillColor(248, 248, 248);
            doc.rect(margin, y - 5, maxWidth, 14, 'F');
        }
        
        // Descripción del producto con ID
        const description = `${item.product.descripcion} (ID: ${item.id})`;
        const splitDescription = doc.splitTextToSize(description, columnWidths.description - 5);
        doc.text(splitDescription, margin + 2, y);
        
        // Resto de columnas
        doc.text(item.quantity.toString(), margin + columnWidths.description + (columnWidths.quantity/2), y, { align: 'center' });
        doc.text(`${item.product.pvp.toFixed(2)}€`, margin + columnWidths.description + columnWidths.quantity + (columnWidths.price/2), y, { align: 'center' });
        doc.text(`${subtotal.toFixed(2)}€`, pageWidth - margin - 2, y, { align: 'right' });
        
        y += 16;
    });
    
    // Línea separadora antes del total
    doc.setDrawColor(70, 70, 70);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 8, pageWidth - margin, y - 8);
    
    // Total
    y += 3;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL:', pageWidth - margin - 70, y);
    doc.text(`${total.toFixed(2)}€`, pageWidth - margin - 2, y, { align: 'right' });
    
    // Pie de página
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Este presupuesto tiene una validez de 30 días desde la fecha de emisión.', margin, footerY);
    
    // Save the PDF
    doc.save('presupuesto.pdf');
});

function addLogoToPDF(doc, logo) {
    try {
        doc.addImage(logo, 'PNG', 20, 10, 40, 20);
    } catch (error) {
        console.error('Error al añadir el logo al PDF:', error);
        // Dibujar un rectángulo azul como placeholder
        doc.setFillColor(0, 0, 255);
        doc.rect(20, 10, 40, 20, 'F');
    }
} 