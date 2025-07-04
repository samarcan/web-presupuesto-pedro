// Manejo de la interfaz de usuario
// Módulo para manejar la interfaz de usuario y manipulación del DOM

// Inicialización de la UI
function initializeUI() {
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

    // Inicializar los elementos activos de la navbar
    setupNavbarActiveItems();

    // Inicializar el menú móvil
    setupMobileMenu();

    // Inicializar el modal de información
    setupInfoModal();
}

// Función para configurar el menú móvil
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const sidemenu = document.getElementById('sidemenu');

    // Abrir menú
    menuToggle?.addEventListener('click', () => {
        sidemenu.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.classList.add('menu-open');
    });

    // Cerrar menú (botón X)
    closeMenu?.addEventListener('click', closeMenuFunction);

    // Cerrar menú (clic en overlay)
    menuOverlay?.addEventListener('click', closeMenuFunction);

    // Función para cerrar el menú
    function closeMenuFunction() {
        sidemenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
    }

    // Víncular eventos de los botones del menú móvil
    document.getElementById('navSaveQuoteMobile')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof saveQuote === 'function') {
            saveQuote();
        }
        closeMenuFunction();
    });

    document.getElementById('navManageQuotesMobile')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof openManageDialog === 'function') {
            openManageDialog();
        }
        closeMenuFunction();
    });

    document.getElementById('navInfoMobile')?.addEventListener('click', (e) => {
        e.preventDefault();
        showProductsInfoModal();
        closeMenuFunction();
    });

    // Gestionar cambios de tamaño de ventana
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && sidemenu.classList.contains('active')) {
            closeMenuFunction();
        }
    });
}

// Configurar el modal de información
function setupInfoModal() {
    const modal = document.getElementById('infoModal');
    const closeButton = modal?.querySelector('.close-modal');
    const infoButton = document.getElementById('navInfo');
    const infoButtonMobile = document.getElementById('navInfoMobile');

    // Abrir modal al hacer clic en el botón de información
    infoButton?.addEventListener('click', (e) => {
        e.preventDefault();
        showProductsInfoModal();
    });

    // Cerrar modal al hacer clic en el botón de cierre
    closeButton?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Cerrar modal con la tecla Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

// Función para mostrar el modal con la información de productos cargados
function showProductsInfoModal() {
    const modal = document.getElementById('infoModal');
    const contentDiv = document.getElementById('productsInfoContent');

    if (!modal || !contentDiv) return;

    // Mostrar el modal
    modal.style.display = 'block';

    // Verificar si la información de archivos está disponible
    if (!window.filesInfo || !window.filesInfo.loaded) {
        contentDiv.innerHTML = '<div class="loading-indicator">Cargando información de productos...</div>';
        // Intentar actualizar la información después de un segundo
        setTimeout(updateProductsInfo, 1000);
        return;
    }

    // Si hay un error general en la carga
    if (window.filesInfo.generalError) {
        contentDiv.innerHTML = `
            <div class="info-section">
                <div class="info-item error">
                    <div class="file-name">Error al cargar los archivos</div>
                    <div class="file-error">${window.filesInfo.generalError}</div>
                </div>
            </div>`;
        return;
    }

    // Si no hay archivos
    if (window.filesInfo.noFiles) {
        contentDiv.innerHTML = `
            <div class="info-section">
                <div class="info-item">
                    <div class="file-name">No se encontraron archivos de productos</div>
                    <div class="file-details">No hay archivos CSV ni Google Sheets en la carpeta especificada.</div>
                </div>
            </div>`;
        return;
    }

    // Generar HTML para los archivos cargados correctamente
    let successfulFilesHtml = '';
    if (window.filesInfo.successful.length > 0) {
        window.filesInfo.successful.forEach(file => {
            const time = file.timestamp ? new Date(file.timestamp).toLocaleTimeString() : '';
            successfulFilesHtml += `
                <div class="info-item success">
                    <div class="file-name">${file.name}</div>
                    <div class="file-details">
                        Tipo: ${file.type} | 
                        Productos cargados: ${file.productsLoaded} | 
                        Hora: ${time}
                    </div>
                </div>`;
        });
    } else {
        successfulFilesHtml = '<div class="info-item">No se cargó ningún archivo correctamente.</div>';
    }

    // Generar HTML para los archivos con errores
    let failedFilesHtml = '';
    if (window.filesInfo.failed.length > 0) {
        window.filesInfo.failed.forEach(file => {
            const time = file.timestamp ? new Date(file.timestamp).toLocaleTimeString() : '';
            failedFilesHtml += `
                <div class="info-item error">
                    <div class="file-name">${file.name}</div>
                    <div class="file-details">
                        Tipo: ${file.type} | 
                        Hora: ${time}
                    </div>
                    <div class="file-error">Error: ${file.reason}</div>
                </div>`;
        });
    } else {
        failedFilesHtml = '<div class="info-item">No hubo errores al cargar los archivos.</div>';
    }

    // Calcular tiempo de carga
    let loadTime = '';
    if (window.filesInfo.loadingTime && window.filesInfo.loadingFinished) {
        const timeInMs = new Date(window.filesInfo.loadingFinished) - new Date(window.filesInfo.loadingTime);
        loadTime = `(${(timeInMs / 1000).toFixed(2)} segundos)`;
    }

    // Actualizar el contenido del modal
    contentDiv.innerHTML = `
        <div class="products-info">
            <div class="info-section">
                <h3>Archivos Cargados Correctamente</h3>
                ${successfulFilesHtml}
            </div>
            
            <div class="info-section">
                <h3>Archivos con Errores</h3>
                ${failedFilesHtml}
            </div>
            
            <div class="info-summary">
                Total de archivos: ${window.filesInfo.totalFiles || 0} | 
                Total de productos: ${window.filesInfo.totalProducts || 0} ${loadTime}
            </div>
        </div>`;
}

// Función para actualizar la información de productos en el modal
function updateProductsInfo() {
    if (document.getElementById('infoModal').style.display === 'block') {
        showProductsInfoModal();
    }
}

// Función para configurar elementos activos en la navbar
function setupNavbarActiveItems() {
    // Obtener todos los elementos del menú
    const menuItems = document.querySelectorAll('.navbar-menu li a, .sidemenu-links li a');

    // Añadir event listeners para establecer el elemento activo
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            // No activar el botón de información
            if (this.id === 'navInfo' || this.id === 'navInfoMobile') {
                return;
            }

            // Eliminar la clase active de todos los elementos
            menuItems.forEach(link => {
                if (link.id !== 'navInfo' && link.id !== 'navInfoMobile') {
                    link.classList.remove('active');
                }
            });

            // Añadir la clase active al elemento clickeado
            this.classList.add('active');

            // También activar el elemento correspondiente en el otro menú (móvil o escritorio)
            const isMobileLink = this.id.includes('Mobile');
            const correspondingId = isMobileLink
                ? this.id.replace('Mobile', '')
                : this.id + 'Mobile';

            const correspondingLink = document.getElementById(correspondingId);
            if (correspondingLink) {
                correspondingLink.classList.add('active');
            }
        });
    });

    // Establecer el botón "Guardar" como activo por defecto
    const saveButtonDesktop = document.getElementById('navSaveQuote');
    const saveButtonMobile = document.getElementById('navSaveQuoteMobile');

    if (saveButtonDesktop) {
        saveButtonDesktop.classList.add('active');
    }

    if (saveButtonMobile) {
        saveButtonMobile.classList.add('active');
    }
}

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

        productNameSpan.addEventListener('click', function () {
            const currentText = item.product.descripcion;
            const editContainer = document.createElement('div');
            editContainer.className = 'edit-container';

            const textarea = document.createElement('textarea');
            textarea.value = currentText;
            textarea.className = 'edit-name-textarea';

            // Configurar altura automática
            textarea.style.height = 'auto';

            const saveEdit = () => {
                const newName = textarea.value.trim();
                if (newName && newName !== currentText) {
                    item.product.descripcion = newName;
                    updateProductsList();
                } else {
                    updateProductsList();
                }
            };

            // Eliminar el evento blur que cerraba la edición

            textarea.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                }
            });

            // Función para ajustar la altura automáticamente
            const adjustHeight = () => {
                textarea.style.height = 'auto';
                textarea.style.height = (textarea.scrollHeight) + 'px';
            };

            // Aplicar ajuste de altura en eventos
            textarea.addEventListener('input', adjustHeight);

            // Evitar que el click en el textarea se propague al span padre
            textarea.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Agregar botones para guardar y cancelar
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'edit-buttons-container';

            const saveButton = document.createElement('button');
            saveButton.className = 'edit-save-button';
            saveButton.textContent = 'Guardar';
            saveButton.addEventListener('click', saveEdit);

            const cancelButton = document.createElement('button');
            cancelButton.className = 'edit-cancel-button';
            cancelButton.textContent = 'Cancelar';
            cancelButton.addEventListener('click', () => {
                updateProductsList();
            });

            buttonsContainer.appendChild(saveButton);
            buttonsContainer.appendChild(cancelButton);

            // Reemplazar solo el texto de descripción, manteniendo el ID si existe
            const idText = !item.id.startsWith('MANUAL-') ? ` (ID: ${item.id})` : '';
            // Limitar el ancho máximo en píxeles para que no sea excesivo
            const maxWidth = Math.min(500, Math.max(200, currentText.length * 8));
            textarea.style.width = maxWidth + 'px';
            productNameSpan.innerHTML = '';

            // Añadimos primero el textarea y luego los botones al contenedor
            editContainer.appendChild(textarea);
            editContainer.appendChild(buttonsContainer);

            // Añadimos el contenedor al span
            productNameSpan.appendChild(editContainer);

            if (idText) {
                const idSpan = document.createElement('span');
                idSpan.className = 'product-id';
                idSpan.textContent = idText;
                productNameSpan.appendChild(idSpan);
            }

            textarea.focus();
            textarea.select();
            // Ajustar altura al inicio
            setTimeout(adjustHeight, 0);
        });

        const infoDiv = document.createElement('div');
        infoDiv.className = 'product-info';

        // Crear el span de cantidad editable
        const quantitySpan = document.createElement('span');
        quantitySpan.className = 'quantity editable';
        quantitySpan.innerHTML = `Cantidad: <span class="quantity-value">${item.quantity}</span>`;
        quantitySpan.title = 'Haz clic para editar la cantidad';

        quantitySpan.addEventListener('click', function () {
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
        priceSpan.className = 'price-display editable';
        priceSpan.innerHTML = `Precio: <span class="price-value">${item.product.pvp.toFixed(2)}€</span>`;
        priceSpan.title = 'Haz clic para editar el precio';

        priceSpan.addEventListener('click', function () {
            const currentPrice = item.product.pvp;
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0.01';
            input.step = '0.01';
            input.value = currentPrice;
            input.className = 'edit-price-input';

            const savePrice = () => {
                const newPrice = parseFloat(input.value);
                if (!isNaN(newPrice) && newPrice > 0 && newPrice !== currentPrice) {
                    item.product.pvp = newPrice;
                    updateProductsList();
                } else {
                    updateProductsList();
                }
            };

            input.addEventListener('blur', savePrice);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    savePrice();
                }
            });

            const priceValueSpan = priceSpan.querySelector('.price-value');
            priceValueSpan.innerHTML = '';
            priceValueSpan.appendChild(input);

            input.focus();
            input.select();
        });

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