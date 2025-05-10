// Gestión de guardado y carga de presupuestos
// Módulo para manejar el almacenamiento local de presupuestos

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

    // Pedir nombre para el presupuesto
    let quoteName = prompt('Nombre para guardar el presupuesto:',
        document.getElementById('clientName').value || 'Presupuesto ' + new Date().toLocaleDateString());

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

    alert(`Presupuesto "${quote.name}" cargado correctamente`);
}

// Abrir diálogo para gestionar presupuestos guardados
function openManageDialog() {
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
    dialogTitle.textContent = 'Gestionar Presupuestos';
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
                <button class="delete-button" data-id="${quote.id}">Eliminar</button>
            </div>
        `;

        quotesList.appendChild(quoteItem);
    });

    dialogContent.appendChild(quotesList);

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

// Exportar funciones para uso en otros archivos
window.saveQuote = saveQuote;
window.loadQuote = loadQuote;
window.openLoadDialog = openLoadDialog;
window.openManageDialog = openManageDialog; 