// Generación de PDF
// Módulo para manejar la generación y visualización de PDFs

// Inicialización del generador de PDF
function initializePDFGenerator() {
    // Generate quote
    document.getElementById('generateQuote').addEventListener('click', generatePDF);
}

// Función para añadir logo al PDF
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

// Función principal para generar el PDF
function generatePDF() {
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
        logo.onload = function () {
            addLogoToPDF(doc, logo, margin);
        };
    }

    // Add company information (aligned to the right)
    doc.setFontSize(11); // Tamaño más pequeño para el nombre de la empresa
    doc.setFont(undefined, 'bold');
    doc.text('SERTEC DE EXTREMADURA, SL', pageWidth - margin, 12, { align: 'right' });

    // Añadir línea separadora
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    const lineWidth = 50; // Ancho de la línea en puntos
    doc.line(pageWidth - margin - lineWidth, 14, pageWidth - margin, 14);

    doc.setFontSize(8); // Tamaño más pequeño para el resto de la información
    doc.setFont(undefined, 'normal');
    doc.text('POL. IND. LAS CAPELLANIAS', pageWidth - margin, 18, { align: 'right' });
    doc.text('PARCELA Nº 246', pageWidth - margin, 22, { align: 'right' });
    doc.text('10001 CACERES', pageWidth - margin, 26, { align: 'right' });

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
    const clientBoxWidth = (pageWidth - (margin * 2)) * 0.5; // 1/2 del espacio disponible
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
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text('CLIENTE:', clientBoxX + leftMargin, clientBoxY + 5);
    doc.setFont(undefined, 'normal');

    // Ajustar el texto del cliente al nuevo ancho del cuadro y convertir a mayúsculas
    const maxClientTextWidth = clientBoxWidth - leftMargin - rightMargin - 15; // Restamos espacio extra para "CLIENTE:"
    const clientNameLines = doc.splitTextToSize(clientName.toUpperCase(), maxClientTextWidth);
    doc.text(clientNameLines, clientBoxX + clientBoxWidth - rightMargin, clientBoxY + 10, { align: 'right' });

    const addressLines = doc.splitTextToSize(clientAddress.toUpperCase(), maxClientTextWidth);
    addressLines.forEach((line, index) => {
        doc.text(line, clientBoxX + clientBoxWidth - rightMargin, clientBoxY + 15 + (index * 3.5), { align: 'right' });
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
    doc.text('CANT.', margin + columnWidths.description + (columnWidths.quantity / 2), y, { align: 'center' });
    doc.text('PRECIO/U', margin + columnWidths.description + columnWidths.quantity + (columnWidths.price / 2), y, { align: 'center' });
    doc.text('SUBTOTAL', pageWidth - margin - 2, y, { align: 'right' });
    y += 6; // Reducido aún más el espacio inicial

    // Contenido de la tabla
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8); // Mantener tamaño de fuente 8 para legibilidad
    let total = 0;

    addedProducts.forEach((item, index) => {
        const subtotal = item.product.pvp * item.quantity;
        total += subtotal;

        // Verificar si necesitamos una nueva página (ajustar el margen inferior si es necesario)
        if (y > pageHeight - 35) { // Reducido aún más el margen inferior
            doc.addPage();
            y = margin;
            // Repetir cabecera en la nueva página
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y - 5, maxWidth, 7, 'F');
            doc.text('DESCRIPCIÓN', margin + 2, y);
            doc.text('CANT.', margin + columnWidths.description + (columnWidths.quantity / 2), y, { align: 'center' });
            doc.text('PRECIO/U', margin + columnWidths.description + columnWidths.quantity + (columnWidths.price / 2), y, { align: 'center' });
            doc.text('SUBTOTAL', pageWidth - margin - 2, y, { align: 'right' });
            y += 6; // Reducido aún más el espacio inicial en nueva página
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
        }

        // Descripción del producto con ID
        const description = !item.id.startsWith('MANUAL-') ?
            // Verificar si la descripción ya contiene el ID para evitar duplicación
            (item.product.descripcion.includes(`(ID: ${item.id})`) ?
                item.product.descripcion :
                `${item.product.descripcion} (ID: ${item.id})`) :
            item.product.descripcion;

        // 1. Obtener el texto dividido para cálculos de altura
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        const splitDescription = doc.splitTextToSize(description, columnWidths.description - 5);

        // 2. Definir dimensiones y espaciado (MUY REDUCIDO)
        const lineHeight = 4;  // Reducido aún más
        const rowPadding = 1;  // Reducido aún más

        // 3. Calcular altura total de la fila basada en el contenido
        const totalRowHeight = Math.max(
            (splitDescription.length * lineHeight) + (rowPadding * 2),
            lineHeight + (rowPadding * 2)  // Altura mínima para filas con poco contenido
        );

        // 4. Calcular la altura del bloque de descripción
        const descBlockHeight = splitDescription.length * lineHeight;

        // 5. Dibujar línea superior de la fila
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);

        // 6. Calcular posición Y inicial para el bloque de descripción (centrado verticalmente)
        // Se calcula el punto medio de la fila y se resta la mitad de la altura del bloque de descripción.
        // Se suma un pequeño ajuste para la línea base de la fuente.
        const textStartY = y + (totalRowHeight / 2) - (descBlockHeight / 2) + (lineHeight * 0.8); // Ajuste de línea base

        // 7. Renderizar texto de descripción línea por línea
        splitDescription.forEach((line, lineIndex) => {
            doc.text(line, margin + 2, textStartY + (lineIndex * lineHeight));
        });

        // 8. Definir coordenadas X para las columnas de datos
        const cantX = margin + columnWidths.description + (columnWidths.quantity / 2);
        const precioX = margin + columnWidths.description + columnWidths.quantity + (columnWidths.price / 2);
        const subtotalX = pageWidth - margin - 2;

        // 9. Calcular coordenada Y para centrar verticalmente los valores numéricos
        // Usamos el punto medio de la fila + el ajuste de línea base.
        const midRowY = y + (totalRowHeight / 2) + (lineHeight * 0.3); // Ajuste línea base para números (puede ser diferente)

        // 10. Posicionar los valores numéricos, siempre centrados verticalmente
        doc.text(item.quantity.toString(), cantX, midRowY, { align: 'center' });
        doc.text(`${item.product.pvp.toFixed(2)}€`, precioX, midRowY, { align: 'center' });
        doc.text(`${subtotal.toFixed(2)}€`, subtotalX, midRowY, { align: 'right' });

        // 11. Dibujar línea inferior de la fila
        doc.line(margin, y + totalRowHeight, pageWidth - margin, y + totalRowHeight);

        // 12. Actualizar posición Y para la siguiente fila
        y += totalRowHeight;
    });

    // Línea final de la tabla (Eliminada para compactar)
    // doc.setDrawColor(0, 0, 0);
    // doc.setLineWidth(0.2);
    // doc.line(margin, y - 6, pageWidth - margin, y - 6);

    // Total (ajustado para alinear con la columna de subtotal)
    y += 3; // Reducido aún más espacio antes del total
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.text('SUBTOTAL:', pageWidth - margin - 70, y);
    doc.text(`${total.toFixed(2)}€`, pageWidth - margin - 2, y, { align: 'right' });

    // Añadir IVA 21%
    const ivaRate = 0.21;
    const ivaAmount = total * ivaRate;
    y += 5;
    doc.text('IVA (21%):', pageWidth - margin - 70, y);
    doc.text(`${ivaAmount.toFixed(2)}€`, pageWidth - margin - 2, y, { align: 'right' });

    // Total con IVA
    const totalConIva = total + ivaAmount;
    y += 5;
    doc.setFontSize(9); // Aumentar ligeramente el tamaño para el total final
    doc.text('TOTAL:', pageWidth - margin - 70, y);
    doc.text(`${totalConIva.toFixed(2)}€`, pageWidth - margin - 2, y, { align: 'right' });
    doc.setFontSize(8); // Restaurar el tamaño de fuente

    // Pie de página
    const footerY = pageHeight - 20;
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);

    // Añadir texto de exclusiones
    doc.text('EXCLUSIONES: Trabajos de albañilería, pintura, acometidas eléctricas y de agua. Todo lo no especificado en este presupuesto.', margin, footerY - 5);

    // Texto de validez
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
} 