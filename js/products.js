// Gestión de productos
// Módulo para manejar la adición y gestión de productos desde Google Drive

// Variables globales
let addedProducts = [];
let manualIdCounter = 1;
// Información de archivos cargados
window.filesInfo = {
    successful: [],
    failed: [],
    totalProducts: 0,
    loaded: false
};

// Configuración de Google Drive
const FOLDER_ID = '1mYb3Wva5-EPc-pkj9e2GDqBzJv5bWhMc';
const API_KEY = 'AIzaSyB4TABt3k-eRdbQMj3Ye68hqJ8ahjbKZtQ';

// Tipos MIME para búsqueda
const MIME_TYPES = {
    CSV: 'text/csv',
    GOOGLE_SHEET: 'application/vnd.google-apps.spreadsheet'
};

// Función para cargar productos desde Google Drive
async function loadProductsFromDrive() {
    try {
        // Restablecer información de archivos
        window.filesInfo = {
            successful: [],
            failed: [],
            totalProducts: 0,
            loaded: false,
            loadingTime: new Date()
        };

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

            window.filesInfo.loaded = true;
            window.filesInfo.noFiles = true;
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
                    fileData = await fetchGoogleSheetData(file.id);
                } else {
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

                    const fileInfo = {
                        name: file.name,
                        type: isGoogleSheet ? 'Google Sheet' : 'CSV',
                        productsLoaded: addedInThisFile,
                        timestamp: new Date()
                    };

                    successfulFiles.push(fileInfo);
                    window.filesInfo.successful.push(fileInfo);
                } else {
                    const fileError = {
                        name: file.name,
                        type: isGoogleSheet ? 'Google Sheet' : 'CSV',
                        reason: parseResult.error,
                        timestamp: new Date()
                    };

                    failedFiles.push(fileError);
                    window.filesInfo.failed.push(fileError);
                }
            } catch (error) {
                console.error(`Error al procesar el archivo ${file.name}:`, error);

                const fileError = {
                    name: file.name,
                    type: file.mimeType === MIME_TYPES.GOOGLE_SHEET ? 'Google Sheet' : 'CSV',
                    reason: error.message,
                    timestamp: new Date()
                };

                failedFiles.push(fileError);
                window.filesInfo.failed.push(fileError);
            }
        }

        // Actualizar información global
        window.filesInfo.totalProducts = Object.keys(window.productos).length;
        window.filesInfo.totalFiles = successfulFiles.length + failedFiles.length;
        window.filesInfo.loaded = true;
        window.filesInfo.loadingFinished = new Date();

        // Mostrar en consola los archivos cargados correctamente y los fallidos
        console.log('📁 Archivos cargados correctamente:', successfulFiles);
        console.log('❌ Archivos con errores:', failedFiles);

        console.log(`Productos cargados: ${Object.keys(window.productos).length}`);
    } catch (error) {
        console.error('Error al cargar los productos desde Google Drive:', error);

        window.filesInfo.generalError = error.message;
        window.filesInfo.loaded = true;

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
    // Cargar productos desde Google Drive
    await loadProductsFromDrive();

    // Verificar que se hayan cargado productos
    if (typeof window.productos !== 'object' || Object.keys(window.productos).length === 0) {
        console.error('No se pudieron cargar los productos desde Google Drive.');
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