// Gestión de productos
// Módulo para manejar la adición y gestión de productos desde Google Drive

// Variables globales
let addedProducts = [];
let manualIdCounter = 1;
// Ahora todos los productos se cargan desde Google Drive

// Configuración de Google Drive
const FOLDER_ID = '1mYb3Wva5-EPc-pkj9e2GDqBzJv5bWhMc';
const API_KEY = 'AIzaSyB4TABt3k-eRdbQMj3Ye68hqJ8ahjbKZtQ';

// Tipos MIME para búsqueda
const MIME_TYPES = {
    CSV: 'text/csv',
    GOOGLE_SHEET: 'application/vnd.google-apps.spreadsheet'
};

// Función para mostrar notificaciones
function showNotification(message, isError = false) {
    // Crear el elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;

    // Buscar o crear el contenedor de notificaciones
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    // Añadir la notificación al contenedor
    notificationContainer.appendChild(notification);

    // Eliminar la notificación después de 5 segundos
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
            // Si no hay más notificaciones, eliminar el contenedor
            if (notificationContainer.children.length === 0) {
                notificationContainer.remove();
            }
        }, 500);
    }, 5000);
}

// Función para cargar productos desde Google Drive
async function loadProductsFromDrive() {
    try {
        showNotification('Cargando archivos de productos desde Google Drive...');

        // Arrays para rastrear archivos cargados correctamente y fallidos
        const successfulFiles = [];
        const failedFiles = [];

        // URL para obtener la lista de archivos CSV y Google Sheets en la carpeta
        const mimeFilter = `(mimeType='${MIME_TYPES.CSV}' or mimeType='${MIME_TYPES.GOOGLE_SHEET}')`;
        const url = `https://www.googleapis.com/drive/v3/files` +
            `?q='${FOLDER_ID}'+in+parents+and+${mimeFilter}` +
            `&fields=files(id,name,size,mimeType)` +
            `&key=${API_KEY}`;

        // Obtener la lista de archivos
        const response = await fetch(url);
        const lista = await response.json();

        if (!lista.files || lista.files.length === 0) {
            console.warn('No se encontraron archivos CSV ni Google Sheets en la carpeta especificada.');
            showNotification('No se encontraron archivos de datos en la carpeta especificada.', true);
            return;
        }

        // Crear el objeto productos para almacenar todos los productos
        window.productos = {};

        let filesLoaded = 0;
        let productsLoaded = 0;

        // Procesar cada archivo encontrado
        for (const file of lista.files) {
            try {
                let fileData;
                const isGoogleSheet = file.mimeType === MIME_TYPES.GOOGLE_SHEET;

                if (isGoogleSheet) {
                    showNotification(`Procesando Google Sheet: ${file.name}...`);
                    fileData = await fetchGoogleSheetData(file.id);
                } else {
                    showNotification(`Procesando CSV: ${file.name}...`);
                    const csvUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${API_KEY}`;
                    const csvResponse = await fetch(csvUrl);
                    fileData = await csvResponse.text();
                }

                // Obtener el número de productos antes de cargar este archivo
                const prevCount = Object.keys(window.productos).length;

                // Parsear el archivo y cargar los productos
                const parseResult = isGoogleSheet
                    ? parseGoogleSheetAndLoadProducts(fileData, file.name)
                    : parseCSVAndLoadProducts(fileData, file.name);

                // Calcular cuántos productos se añadieron con este archivo
                const newCount = Object.keys(window.productos).length;
                const addedInThisFile = newCount - prevCount;

                // Verificar si el archivo se procesó correctamente
                if (parseResult.success) {
                    filesLoaded++;
                    productsLoaded += addedInThisFile;

                    successfulFiles.push({
                        name: file.name,
                        type: isGoogleSheet ? 'Google Sheet' : 'CSV',
                        productsLoaded: addedInThisFile
                    });

                    showNotification(`Archivo ${file.name} cargado: ${addedInThisFile} productos`);
                } else {
                    failedFiles.push({
                        name: file.name,
                        type: isGoogleSheet ? 'Google Sheet' : 'CSV',
                        reason: parseResult.error
                    });

                    showNotification(`Error al cargar ${file.name}: ${parseResult.error}`, true);
                }
            } catch (error) {
                console.error(`Error al procesar el archivo ${file.name}:`, error);
                failedFiles.push({
                    name: file.name,
                    type: file.mimeType === MIME_TYPES.GOOGLE_SHEET ? 'Google Sheet' : 'CSV',
                    reason: error.message
                });

                showNotification(`Error al procesar ${file.name}: ${error.message}`, true);
            }
        }

        // Mostrar en consola los archivos cargados correctamente y los fallidos
        console.log('📁 Archivos cargados correctamente:', successfulFiles);
        console.log('❌ Archivos con errores:', failedFiles);

        console.log(`Productos cargados: ${Object.keys(window.productos).length}`);
        showNotification(`Carga completa: ${filesLoaded} archivos con ${productsLoaded} productos en total`);
    } catch (error) {
        console.error('Error al cargar los productos desde Google Drive:', error);
        showNotification('Error al cargar los productos. Por favor, recarga la página o contacta al administrador.', true);
        alert('Error al cargar los productos. Por favor, recarga la página o contacta al administrador.');
    }
}

// Función para obtener datos de una hoja de Google Sheets
async function fetchGoogleSheetData(fileId) {
    // URL para exportar la hoja como CSV (primera hoja por defecto)
    const sheetUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export` +
        `?mimeType=text/csv&key=${API_KEY}`;

    const response = await fetch(sheetUrl);

    if (!response.ok) {
        throw new Error(`Error al descargar Google Sheet (${response.status}): ${response.statusText}`);
    }

    return await response.text();
}

// Función para parsear Google Sheet y cargar productos (usando mismo formato que CSV)
function parseGoogleSheetAndLoadProducts(sheetData, fileName) {
    // La API de Google Drive exporta las hojas como CSV, así que usamos el mismo parser
    return parseCSVAndLoadProducts(sheetData, fileName);
}

// Función para parsear CSV y cargar productos
function parseCSVAndLoadProducts(csvText, fileName) {
    try {
        // Dividir el CSV en líneas
        const lines = csvText.split('\n');
        if (lines.length <= 1) {
            return {
                success: false,
                error: 'El archivo está vacío o solo tiene encabezados'
            };
        }

        // Verificar la cabecera
        const header = lines[0].split(',');
        const codeIndex = header.findIndex(col => col.trim().toLowerCase() === 'code');
        const descIndex = header.findIndex(col => col.trim().toLowerCase() === 'description');
        const priceIndex = header.findIndex(col => col.trim().toLowerCase() === 'price');

        if (codeIndex === -1 || descIndex === -1 || priceIndex === -1) {
            const error = `El archivo ${fileName} no tiene la estructura esperada (code, description, price).`;
            console.error(error);
            showNotification(`Error: El archivo ${fileName} no tiene la estructura esperada.`, true);
            return { success: false, error: 'Estructura incorrecta' };
        }

        let productsAdded = 0;

        // Procesar las líneas de datos
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Saltar líneas vacías

            const columns = lines[i].split(',');
            if (columns.length < 3) continue; // Asegurar que hay suficientes columnas

            const code = columns[codeIndex].trim().toUpperCase();
            const description = columns[descIndex].trim();
            const price = parseFloat(columns[priceIndex].trim());

            if (code && description && !isNaN(price)) {
                window.productos[code] = {
                    descripcion: description,
                    pvp: price
                };
                productsAdded++;
            }
        }

        return {
            success: true,
            productsAdded: productsAdded
        };
    } catch (error) {
        console.error(`Error al parsear el archivo ${fileName}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Inicialización de productos
async function initializeProducts() {
    showNotification('Iniciando carga de productos...');

    // Cargar productos desde Google Drive
    await loadProductsFromDrive();

    // Verificar que se hayan cargado productos
    if (typeof window.productos !== 'object' || Object.keys(window.productos).length === 0) {
        console.error('No se pudieron cargar los productos desde Google Drive.');
        showNotification('No se pudieron cargar los productos. Por favor, recarga la página.', true);
        alert('Error: No se pudieron cargar los productos. Por favor, recarga la página.');
    } else {
        showNotification(`Aplicación lista - ${Object.keys(window.productos).length} productos disponibles`);
    }

    // Add product to the list (automatic)
    document.getElementById('addProduct').addEventListener('click', () => {
        const productId = document.getElementById('productId').value.trim().toUpperCase();
        const quantity = parseInt(document.getElementById('quantity').value);

        if (!productId) {
            alert('Por favor, introduce un ID de producto');
            return;
        }

        if (typeof window.productos !== 'object' || window.productos === null) {
            alert('Error: Los productos no están disponibles en el formato correcto');
            return;
        }

        // Buscar el producto en el objeto
        const product = window.productos[productId];

        if (!product) {
            console.log('ID buscado:', productId);
            console.log('Productos disponibles:', Object.keys(window.productos));
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

// Exportar funciones y datos para uso en otros archivos
window.addedProducts = addedProducts;
window.initializeProducts = initializeProducts; 