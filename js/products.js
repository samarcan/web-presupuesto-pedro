// Gestión de productos
// Módulo para manejar la adición y gestión de productos

// Variables globales
let addedProducts = [];
let manualIdCounter = 1;

// Inicialización de productos
function initializeProducts() {
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
}

// Exportar datos para uso en otros archivos
window.addedProducts = addedProducts; 