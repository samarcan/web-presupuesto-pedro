// Gestión de guardado y carga de presupuestos
// Módulo para manejar el almacenamiento local de presupuestos

// Variable para almacenar el nombre del presupuesto cargado actualmente
let currentQuoteName = null;

// Inicialización del gestor de almacenamiento
function initializeStorage() {
    // Agregar event listeners a los botones existentes
    document.getElementById('saveQuote')?.addEventListener('click', saveQuote);
    document.getElementById('manageQuotes')?.addEventListener('click', openManageDialog);

    // Agregar event listeners a los botones de la navbar (versión escritorio)
    document.getElementById('navSaveQuote')?.addEventListener('click', saveQuote);
    document.getElementById('navManageQuotes')?.addEventListener('click', openManageDialog);

    // Inicializar localStorage si no existe
    if (!localStorage.getItem('savedQuotes')) {
        localStorage.setItem('savedQuotes', JSON.stringify([]));
    }
}

// Crear un nuevo presupuesto (limpiar el actual)
function createNewQuote() {
    // Confirmar si hay productos
    if (addedProducts.length > 0) {
        if (!confirm('¿Estás seguro de que quieres crear un nuevo presupuesto? Se perderán los datos no guardados.')) {
            return;
        }
    }

    // Limpiar productos
    addedProducts.length = 0;

    // Resetear el nombre del presupuesto actual
    currentQuoteName = null;

    // Limpiar campos del cliente
    document.getElementById('clientName').value = '';
    document.getElementById('clientAddress').value = '';

    // Limpiar campo de producto
    document.getElementById('productId').value = '';
    document.getElementById('quantity').value = '1';

    // Actualizar UI
    updateProductsList();

    // Eliminar el resultado del presupuesto si existe
    const quoteResult = document.getElementById('quoteResult');
    if (quoteResult) {
        quoteResult.innerHTML = '';
    }

    // Mostrar notificación
    if (typeof showNotification === 'function') {
        showNotification('Nuevo presupuesto creado');
    }
}

// Guardar el presupuesto actual en localStorage
function saveQuote() {
    // Verificar que hay productos
    if (addedProducts.length === 0) {
        alert('No hay productos para guardar');
        return;
    }

    // Obtener presupuestos guardados
    const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes')) || [];

    // Valor predeterminado para el nombre: usar el nombre actual si existe, o el nombre del cliente, o un nombre genérico
    const defaultName = currentQuoteName ||
        document.getElementById('clientName').value ||
        'Presupuesto ' + new Date().toLocaleDateString();

    // Pedir nombre para el presupuesto, usando el nombre actual como predeterminado
    let quoteName = prompt('Nombre para guardar el presupuesto:', defaultName);

    if (!quoteName) return; // El usuario canceló

    const now = new Date();
    let createdDate = now.toISOString();

    // Comprobar si ya existe un presupuesto con el mismo nombre
    const existingQuoteIndex = savedQuotes.findIndex(q => q.name === quoteName);

    if (existingQuoteIndex !== -1) {
        // Ya existe un presupuesto con ese nombre, pedir confirmación
        const confirmOverwrite = confirm(`Ya existe un presupuesto con el nombre "${quoteName}". ¿Desea sobreescribirlo?`);

        if (!confirmOverwrite) {
            // El usuario no quiere sobreescribir, cancelar o pedir otro nombre
            return saveQuote(); // Volver a iniciar el proceso
        }

        // Mantener la fecha de creación original si estamos sobreescribiendo
        createdDate = savedQuotes[existingQuoteIndex].createdDate || savedQuotes[existingQuoteIndex].date;

        // El usuario confirmó sobreescribir, eliminar el presupuesto existente
        savedQuotes.splice(existingQuoteIndex, 1);
    }

    // Actualizar el nombre del presupuesto actual
    currentQuoteName = quoteName;

    // Crear objeto con los datos del presupuesto
    const quoteData = {
        id: Date.now(), // ID único basado en timestamp
        name: quoteName,
        createdDate: createdDate,         // Fecha de creación inicial
        modifiedDate: now.toISOString(),  // Fecha de última modificación
        products: JSON.parse(JSON.stringify(addedProducts)), // Copia profunda
        clientInfo: {
            name: document.getElementById('clientName').value,
            address: document.getElementById('clientAddress').value
        }
    };

    // Añadir el nuevo presupuesto
    savedQuotes.push(quoteData);

    // Guardar en localStorage
    localStorage.setItem('savedQuotes', JSON.stringify(savedQuotes));

    alert(`Presupuesto "${quoteName}" guardado correctamente en este dispositivo. Esta información solo estará disponible en este navegador.`);

    // Mostrar notificación
    if (typeof showNotification === 'function') {
        showNotification(`Presupuesto "${quoteName}" guardado correctamente`);
    }
}

// Mostrar diálogo para cargar un presupuesto
function openLoadDialog() {
    // Obtener presupuestos guardados
    const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes')) || [];

    if (savedQuotes.length === 0) {
        alert('No hay presupuestos guardados');
        return;
    }

    // Ordenar presupuestos por fecha de modificación (más recientes primero)
    savedQuotes.sort((a, b) => {
        const dateA = a.modifiedDate || a.date;
        const dateB = b.modifiedDate || b.date;
        return new Date(dateB) - new Date(dateA);
    });

    // Crear un diálogo modal
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'dialog-overlay';

    const dialogContent = document.createElement('div');
    dialogContent.className = 'dialog-content';

    // Crear título
    const dialogTitle = document.createElement('h3');
    dialogTitle.textContent = 'Cargar Presupuesto';
    dialogContent.appendChild(dialogTitle);

    // Crear lista de presupuestos
    const quotesList = document.createElement('div');
    quotesList.className = 'quotes-list';

    savedQuotes.forEach(quote => {
        const quoteItem = document.createElement('div');
        quoteItem.className = 'quote-item';

        // Formatear fechas
        const createdDate = new Date(quote.createdDate || quote.date);
        const formattedCreatedDate = createdDate.toLocaleDateString() + ' ' +
            createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let modifiedInfo = '';
        if (quote.modifiedDate && quote.createdDate !== quote.modifiedDate) {
            const modifiedDate = new Date(quote.modifiedDate);
            const formattedModifiedDate = modifiedDate.toLocaleDateString() + ' ' +
                modifiedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            modifiedInfo = `<span class="quote-modified">Modificado: ${formattedModifiedDate}</span>`;
        }

        quoteItem.innerHTML = `
            <div class="quote-info">
                <span class="quote-name">${quote.name}</span>
                <span class="quote-date">Creado: ${formattedCreatedDate}</span>
                ${modifiedInfo}
                <span class="quote-products">${quote.products.length} productos</span>
            </div>
            <div class="quote-actions">
                <button class="load-button" data-id="${quote.id}">Cargar</button>
            </div>
        `;

        quotesList.appendChild(quoteItem);
    });

    dialogContent.appendChild(quotesList);

    // Botón para cerrar
    const closeButton = document.createElement('button');
    closeButton.className = 'dialog-close-button';
    closeButton.textContent = 'Cancelar';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(dialogOverlay);
    });

    dialogContent.appendChild(closeButton);
    dialogOverlay.appendChild(dialogContent);
    document.body.appendChild(dialogOverlay);

    // Agregar event listeners a los botones de cargar
    document.querySelectorAll('.load-button').forEach(button => {
        button.addEventListener('click', function () {
            const quoteId = parseInt(this.dataset.id);
            loadQuote(quoteId);
            document.body.removeChild(dialogOverlay);
        });
    });
}

// Cargar un presupuesto guardado
function loadQuote(quoteId) {
    // Obtener presupuestos guardados
    const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes')) || [];

    // Encontrar el presupuesto por ID
    const quote = savedQuotes.find(q => q.id === quoteId);

    if (!quote) {
        alert('Presupuesto no encontrado');
        return;
    }

    // Confirmar carga (si ya hay productos)
    if (addedProducts.length > 0) {
        if (!confirm('Se perderán los productos actuales. ¿Desea continuar?')) {
            return;
        }
    }

    // Guardar el nombre del presupuesto para usarlo luego
    currentQuoteName = quote.name;

    // Cargar productos (limpiar primero el array existente)
    addedProducts.length = 0; // Vaciar el array sin crear uno nuevo

    // Añadir cada producto del presupuesto guardado
    quote.products.forEach(product => {
        addedProducts.push(JSON.parse(JSON.stringify(product))); // Copia profunda de cada producto
    });

    // Cargar información del cliente
    document.getElementById('clientName').value = quote.clientInfo.name || '';
    document.getElementById('clientAddress').value = quote.clientInfo.address || '';

    // Actualizar UI
    updateProductsList();

    // Mostrar notificación
    if (typeof showNotification === 'function') {
        showNotification(`Presupuesto "${quote.name}" cargado correctamente`);
    } else {
        alert(`Presupuesto "${quote.name}" cargado correctamente`);
    }
}

// Abrir diálogo para gestionar presupuestos guardados
function openManageDialog() {
    // Obtener presupuestos guardados
    const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes')) || [];

    // Crear un diálogo modal
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'dialog-overlay';

    const dialogContent = document.createElement('div');
    dialogContent.className = 'dialog-content';

    // Crear título
    const dialogTitle = document.createElement('h3');
    dialogTitle.textContent = 'Gestionar Presupuestos';
    dialogContent.appendChild(dialogTitle);

    // Añadir botón de importar YAML
    const importContainer = document.createElement('div');
    importContainer.className = 'import-container';

    const importLabel = document.createElement('label');
    importLabel.htmlFor = 'import-yaml-file';
    importLabel.className = 'import-button';
    importLabel.innerHTML = '<i class="fas fa-file-import"></i> Importar Presupuesto';

    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.id = 'import-yaml-file';
    importInput.accept = '.yaml,.yml';
    importInput.style.display = 'none';
    importInput.addEventListener('change', function (e) {
        if (e.target.files.length > 0) {
            importFromYaml(e.target.files[0]);
        }
    });

    importLabel.appendChild(importInput);
    importContainer.appendChild(importLabel);
    dialogContent.appendChild(importContainer);

    // Verificar si hay presupuestos guardados
    if (savedQuotes.length === 0) {
        const noQuotesMsg = document.createElement('p');
        noQuotesMsg.textContent = 'No hay presupuestos guardados';
        noQuotesMsg.className = 'no-quotes-message';
        dialogContent.appendChild(noQuotesMsg);
    } else {
        // Ordenar presupuestos por fecha de modificación (más recientes primero)
        savedQuotes.sort((a, b) => {
            const dateA = a.modifiedDate || a.date;
            const dateB = b.modifiedDate || b.date;
            return new Date(dateB) - new Date(dateA);
        });

        // Crear lista de presupuestos
        const quotesList = document.createElement('div');
        quotesList.className = 'quotes-list';

        savedQuotes.forEach(quote => {
            const quoteItem = document.createElement('div');
            quoteItem.className = 'quote-item';

            // Formatear fechas
            const createdDate = new Date(quote.createdDate || quote.date);
            const formattedCreatedDate = createdDate.toLocaleDateString() + ' ' +
                createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let modifiedInfo = '';
            if (quote.modifiedDate && quote.createdDate !== quote.modifiedDate) {
                const modifiedDate = new Date(quote.modifiedDate);
                const formattedModifiedDate = modifiedDate.toLocaleDateString() + ' ' +
                    modifiedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                modifiedInfo = `<span class="quote-modified">Modificado: ${formattedModifiedDate}</span>`;
            }

            quoteItem.innerHTML = `
                <div class="quote-info">
                    <span class="quote-name">${quote.name}</span>
                    <span class="quote-date">Creado: ${formattedCreatedDate}</span>
                    ${modifiedInfo}
                    <span class="quote-products">${quote.products.length} productos</span>
                </div>
                <div class="quote-actions">
                    <button class="load-button" data-id="${quote.id}">Cargar</button>
                    <button class="delete-button" data-id="${quote.id}">Eliminar</button>
                    <button class="export-yaml-button" data-id="${quote.id}">Exportar</button>
                </div>
            `;

            quotesList.appendChild(quoteItem);
        });

        dialogContent.appendChild(quotesList);
    }

    // Botón para cerrar
    const closeButton = document.createElement('button');
    closeButton.className = 'dialog-close-button';
    closeButton.textContent = 'Cerrar';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(dialogOverlay);
    });

    dialogContent.appendChild(closeButton);
    dialogOverlay.appendChild(dialogContent);
    document.body.appendChild(dialogOverlay);

    // Agregar event listeners a los botones
    document.querySelectorAll('.load-button').forEach(button => {
        button.addEventListener('click', function () {
            const quoteId = parseInt(this.dataset.id);
            loadQuote(quoteId);
            document.body.removeChild(dialogOverlay);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', function () {
            const quoteId = parseInt(this.dataset.id);
            deleteQuote(quoteId);
            // Recrear el diálogo con la lista actualizada
            document.body.removeChild(dialogOverlay);
            openManageDialog();
        });
    });

    document.querySelectorAll('.export-yaml-button').forEach(button => {
        button.addEventListener('click', function () {
            const quoteId = parseInt(this.dataset.id);
            exportToYaml(quoteId);
        });
    });
}

// Eliminar un presupuesto guardado
function deleteQuote(quoteId) {
    // Obtener presupuestos guardados
    const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes')) || [];

    // Encontrar el presupuesto por ID
    const quoteIndex = savedQuotes.findIndex(q => q.id === quoteId);

    if (quoteIndex === -1) {
        alert('Presupuesto no encontrado');
        return;
    }

    // Confirmar eliminación
    if (!confirm(`¿Está seguro de eliminar el presupuesto "${savedQuotes[quoteIndex].name}"?`)) {
        return;
    }

    // Eliminar el presupuesto
    const deletedQuote = savedQuotes.splice(quoteIndex, 1)[0];

    // Guardar en localStorage
    localStorage.setItem('savedQuotes', JSON.stringify(savedQuotes));

    alert(`Presupuesto "${deletedQuote.name}" eliminado correctamente`);
}

// Exportar un presupuesto a formato YAML
function exportToYaml(quoteId) {
    // Obtener presupuestos guardados
    const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes')) || [];

    // Encontrar el presupuesto por ID
    const quote = savedQuotes.find(q => q.id === quoteId);

    if (!quote) {
        alert('Presupuesto no encontrado');
        return;
    }

    try {
        // Convertir a formato YAML utilizando la librería js-yaml
        const yamlContent = jsyaml.dump(quote);

        // Crear un archivo Blob para la descarga
        const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' });

        // Crear URL para el archivo
        const url = URL.createObjectURL(blob);

        // Crear elemento de descarga
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `presupuesto_${quote.name.replace(/\s+/g, '_')}.yaml`;

        // Simular clic para iniciar la descarga
        document.body.appendChild(downloadLink);
        downloadLink.click();

        // Limpiar
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);

        // Mostrar notificación
        if (typeof showNotification === 'function') {
            showNotification(`Presupuesto "${quote.name}" exportado como YAML`);
        } else {
            alert(`Presupuesto "${quote.name}" exportado como YAML`);
        }
    } catch (error) {
        console.error('Error al exportar YAML:', error);
        alert(`Error al exportar el archivo YAML: ${error.message}`);
    }
}

// Exportar el presupuesto actual a formato YAML
function exportCurrentToYaml() {
    // Verificar que hay productos
    if (addedProducts.length === 0) {
        alert('No hay productos para exportar');
        return;
    }

    try {
        // Obtener nombre del cliente o usar genérico
        const clientName = document.getElementById('clientName').value || 'Cliente';

        // Crear un objeto con los datos del presupuesto actual
        const now = new Date();
        const quoteData = {
            name: currentQuoteName || `Presupuesto ${clientName} (${now.toLocaleDateString()})`,
            id: Date.now(),
            createdDate: now.toISOString(),
            modifiedDate: now.toISOString(),
            clientInfo: {
                name: document.getElementById('clientName').value,
                address: document.getElementById('clientAddress').value
            },
            products: addedProducts.map(item => ({
                id: item.id,
                description: item.product.descripcion,
                price: item.product.pvp,
                quantity: item.quantity,
                total: (item.product.pvp * item.quantity).toFixed(2)
            }))
        };

        // Convertir a formato YAML utilizando la librería js-yaml
        const yamlContent = jsyaml.dump(quoteData);

        // Crear un archivo Blob para la descarga
        const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' });

        // Crear URL para el archivo
        const url = URL.createObjectURL(blob);

        // Crear elemento de descarga
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `presupuesto_${quoteData.name.replace(/\s+/g, '_')}.yaml`;

        // Simular clic para iniciar la descarga
        document.body.appendChild(downloadLink);
        downloadLink.click();

        // Limpiar
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);

        // Mostrar notificación
        if (typeof showNotification === 'function') {
            showNotification('Presupuesto actual exportado como YAML');
        } else {
            alert('Presupuesto actual exportado como YAML');
        }
    } catch (error) {
        console.error('Error al exportar YAML:', error);
        alert(`Error al exportar el archivo YAML: ${error.message}`);
    }
}

// Importar presupuesto desde archivo YAML
function importFromYaml(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        const yamlContent = e.target.result;
        try {
            console.log("Contenido YAML a importar:", yamlContent);

            // Parsear el YAML utilizando la librería js-yaml
            const parsedData = jsyaml.load(yamlContent);
            console.log("Datos parseados con js-yaml:", parsedData);

            if (!parsedData) {
                throw new Error('No se pudo parsear el archivo YAML');
            }

            // Procesar los datos importados
            handleImportedData(parsedData);

        } catch (error) {
            console.error('Error al importar YAML:', error);
            alert(`Error al importar el archivo YAML: ${error.message}`);
        }
    };

    reader.onerror = function () {
        alert('Error al leer el archivo');
    };

    reader.readAsText(file);
}

// Función que procesa los datos importados
function handleImportedData(parsedData) {
    if (!parsedData) {
        throw new Error('No se pudo parsear el archivo YAML');
    }

    if (!parsedData.name) {
        throw new Error('Falta el campo obligatorio "name" en el archivo YAML');
    }

    if (!parsedData.products) {
        throw new Error('Falta el campo obligatorio "products" en el archivo YAML');
    }

    if (!Array.isArray(parsedData.products)) {
        throw new Error('El campo "products" debe ser un array');
    }

    if (parsedData.products.length === 0) {
        throw new Error('El presupuesto no contiene productos');
    }

    // Verificar que tiene los campos requeridos
    if (!parsedData.id) {
        // Generar un ID si no existe
        parsedData.id = Date.now();
        console.log("ID generado automáticamente:", parsedData.id);
    }

    if (!parsedData.clientInfo) {
        parsedData.clientInfo = { name: '', address: '' };
        console.log("Información de cliente generada por defecto");
    }

    // Verificar información del cliente
    console.log("Información del cliente antes de procesar:", parsedData.clientInfo);

    // Analizar la estructura de un producto para depuración
    if (parsedData.products.length > 0) {
        console.log("Estructura del primer producto:", JSON.stringify(parsedData.products[0], null, 2));
    }

    // Preparar la estructura de productos
    const productsData = [];

    // Verificar y convertir cada producto
    for (let i = 0; i < parsedData.products.length; i++) {
        const product = parsedData.products[i];

        console.log(`Procesando producto ${i}:`, product);

        if (!product) {
            console.warn(`Producto en índice ${i} es null o undefined`);
            continue;
        }

        // Verificar campos obligatorios
        if (!product.id) {
            product.id = `AUTO-${Date.now()}-${i}`;
            console.warn(`Producto sin ID, generando automáticamente: ${product.id}`);
        }

        // Usar descripción por defecto si no existe
        let description = "Producto sin descripción";
        if (product.description) {
            description = product.description;
        } else if (product.descripcion) {
            description = product.descripcion;
        } else {
            console.warn(`Producto ${product.id} no tiene descripción, usando valor por defecto`);
        }

        // Verificar precio
        let price = 0;
        if (typeof product.price !== 'undefined') {
            price = parseFloat(product.price);
        } else if (typeof product.pvp !== 'undefined') {
            price = parseFloat(product.pvp);
        } else {
            console.warn(`Producto ${product.id} no tiene precio (price o pvp), usando 0 por defecto`);
        }

        if (isNaN(price)) {
            console.warn(`Precio inválido para producto ${product.id}: "${product.price}", usando 0 por defecto`);
            price = 0;
        }

        // Verificar cantidad
        let quantity = 1;
        if (typeof product.quantity !== 'undefined') {
            quantity = parseInt(product.quantity);
        } else if (typeof product.cantidad !== 'undefined') {
            quantity = parseInt(product.cantidad);
        }

        if (isNaN(quantity) || quantity <= 0) {
            console.warn(`Cantidad inválida para producto ${product.id}, usando 1 por defecto`);
            quantity = 1;
        }

        // Añadir producto en el formato correcto
        productsData.push({
            id: product.id,
            quantity: quantity,
            product: {
                descripcion: description,
                pvp: price
            }
        });
    }

    if (productsData.length === 0) {
        throw new Error('No se pudieron procesar productos válidos del archivo');
    }

    // Convertir al formato interno de presupuesto
    const quoteData = {
        id: parsedData.id,
        name: parsedData.name,  // Mantener el nombre original del presupuesto
        createdDate: parsedData.createdDate || new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        clientInfo: {
            name: parsedData.clientInfo?.name || '',
            address: parsedData.clientInfo?.address || ''
        },
        products: productsData
    };

    console.log(`Nombre del presupuesto importado: "${quoteData.name}" (este es el que se mantendrá)`);
    console.log(`Nombre del cliente: "${quoteData.clientInfo.name}" (solo se usará como información del cliente)`);
    console.log("Presupuesto final a guardar:", quoteData);

    // Obtener presupuestos guardados
    const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes')) || [];

    // Verificar si ya existe un presupuesto con ese nombre
    const existingIndex = savedQuotes.findIndex(q => q.name === quoteData.name);
    if (existingIndex !== -1) {
        if (!confirm(`Ya existe un presupuesto con el nombre "${quoteData.name}". ¿Desea sobreescribirlo?`)) {
            return;
        }
        savedQuotes.splice(existingIndex, 1);
    }

    // Cargar la información del cliente a los campos del formulario
    if (quoteData.clientInfo && quoteData.clientInfo.name) {
        document.getElementById('clientName').value = quoteData.clientInfo.name;
        console.log(`Campo clientName actualizado a: "${quoteData.clientInfo.name}"`);
    }

    if (quoteData.clientInfo && quoteData.clientInfo.address) {
        document.getElementById('clientAddress').value = quoteData.clientInfo.address;
        console.log(`Campo clientAddress actualizado a: "${quoteData.clientInfo.address}"`);
    }

    // Cargar los productos en la aplicación
    addedProducts.length = 0; // Limpiar productos actuales

    quoteData.products.forEach(product => {
        addedProducts.push({
            id: product.id,
            quantity: product.quantity,
            product: {
                descripcion: product.product.descripcion,
                pvp: product.product.pvp
            }
        });
    });

    // Actualizar la visualización de productos
    if (typeof updateProductsList === 'function') {
        updateProductsList();
    }

    // Guardar el presupuesto
    savedQuotes.push(quoteData);
    localStorage.setItem('savedQuotes', JSON.stringify(savedQuotes));

    // Establecer el nombre actual del presupuesto
    currentQuoteName = quoteData.name;  // Usar el nombre del presupuesto, no el del cliente
    console.log(`Nombre del presupuesto actual establecido a: "${currentQuoteName}"`);

    // Mostrar mensaje y actualizar la vista
    alert(`Presupuesto "${quoteData.name}" importado correctamente`);

    // Cerrar y reabrir el diálogo para mostrar el presupuesto importado
    const dialogOverlay = document.querySelector('.dialog-overlay');
    if (dialogOverlay) {
        document.body.removeChild(dialogOverlay);
        openManageDialog();
    }
}

// Exportar funciones para uso en otros archivos
window.saveQuote = saveQuote;
window.loadQuote = loadQuote;
window.openLoadDialog = openLoadDialog;
window.openManageDialog = openManageDialog;
window.exportToYaml = exportToYaml;
window.exportCurrentToYaml = exportCurrentToYaml;
window.importFromYaml = importFromYaml; 