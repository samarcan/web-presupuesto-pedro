// Archivo principal que inicializa la aplicación
// Punto de entrada que carga y coordina todas las funcionalidades

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function () {
    console.log('Aplicación de presupuestos inicializada correctamente');

    // Verificar que los elementos críticos existan
    const criticalElements = [
        'addProduct',
        'addManualProduct',
        'generateQuote',
        'addedProducts',
        'clientName',
        'clientAddress'
    ];

    let missingElements = [];
    criticalElements.forEach(id => {
        if (!document.getElementById(id)) {
            missingElements.push(id);
        }
    });

    if (missingElements.length > 0) {
        console.error('Elementos críticos faltantes:', missingElements);
        return;
    }

    // Inicializar módulos en el orden correcto
    initializeUI();
    initializeProducts();
    initializePDFGenerator();
    initializeStorage();

    console.log('Todos los módulos inicializados correctamente');
}); 