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