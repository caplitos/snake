// API para manejar puntajes mundiales

// URL base para la API (vacía hasta que se implemente correctamente)
// Cuando se implemente la API real, aquí se colocará la URL correcta
const API_BASE_URL = '';

// Variable para controlar si estamos en modo offline
// Siempre en modo offline hasta que se implemente la API
let isOfflineMode = true;

// Función para verificar la conectividad
async function checkConnectivity() {
    // Siempre retornamos false (modo offline) hasta que se implemente la API
    console.log('Modo offline activado hasta implementación de API');
    isOfflineMode = true;
    return false;
}

// Función para obtener los puntajes mundiales
async function getWorldScores() {
    try {
        // Siempre en modo offline hasta implementación de API
        console.log('Modo offline: usando datos locales para puntajes mundiales');
        
        // Verificar si hay datos de demostración en localStorage
        const demoWorldScores = localStorage.getItem('demoWorldScores');
        if (demoWorldScores) {
            return JSON.parse(demoWorldScores);
        }
        
        // Datos de demostración si no hay nada guardado
        const demoScores = [
            { initials: 'AAA', score: 250, country: 'US', date: '2023-05-15' },
            { initials: 'BBB', score: 220, country: 'ES', date: '2023-05-16' },
            { initials: 'CCC', score: 190, country: 'JP', date: '2023-05-17' },
            { initials: 'DDD', score: 180, country: 'BR', date: '2023-05-18' },
            { initials: 'EEE', score: 170, country: 'DE', date: '2023-05-19' }
        ];
        
        // Guardar datos de demostración para uso futuro
        localStorage.setItem('demoWorldScores', JSON.stringify(demoScores));
        
        return demoScores;
    } catch (error) {
        console.error('Error al obtener puntajes mundiales:', error);
        isOfflineMode = true; // Cambiar a modo offline si hay error
        
        // Devolver datos de demostración en caso de error
        const demoScores = [
            { initials: 'AAA', score: 250, country: 'US', date: '2023-05-15' },
            { initials: 'BBB', score: 220, country: 'ES', date: '2023-05-16' },
            { initials: 'CCC', score: 190, country: 'JP', date: '2023-05-17' }
        ];
        
        return demoScores;
    }
}

// Función para enviar un nuevo puntaje mundial
async function submitWorldScore(scoreData) {
    try {
        // Siempre en modo offline hasta implementación de API
        console.log('Modo offline: guardando puntaje solo localmente');
        
        // Obtener puntajes actuales
        const currentScores = await getWorldScores();
        
        // Verificar si el jugador ya tiene un puntaje
        const existingIndex = currentScores.findIndex(s => s.initials === scoreData.initials);
        
        if (existingIndex !== -1) {
            // Actualizar solo si el nuevo puntaje es mayor
            if (scoreData.score > currentScores[existingIndex].score) {
                currentScores[existingIndex] = {
                    ...scoreData,
                    date: new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
                };
            }
        } else {
            // Agregar nuevo puntaje
            currentScores.push({
                ...scoreData,
                date: new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
            });
        }
        
        // Ordenar por puntaje (mayor a menor)
        currentScores.sort((a, b) => b.score - a.score);
        
        // Limitar a los 10 mejores
        const topScores = currentScores.slice(0, 10);
        
        // Guardar en localStorage para demostración
        localStorage.setItem('demoWorldScores', JSON.stringify(topScores));
        
        return { success: true, message: 'Puntaje guardado correctamente' };
    } catch (error) {
        console.error('Error al enviar puntaje mundial:', error);
        isOfflineMode = true; // Cambiar a modo offline si hay error
        return { success: false, message: 'Error al enviar puntaje, guardado localmente' };
    }
}

// Función para actualizar periódicamente los puntajes mundiales
function startWorldScoresSync(updateCallback, intervalMs = 5000) { // Intervalo reducido para actualización más rápida
    console.log('Iniciando sincronización de puntajes en modo offline');
    
    // Realizar actualización inicial
    getWorldScores().then(updateCallback).catch(error => {
        console.error('Error en actualización inicial de puntajes:', error);
        // Proporcionar datos de respaldo en caso de error
        const fallbackScores = [
            { initials: 'AAA', score: 250, country: 'US', date: '2023-05-15' },
            { initials: 'BBB', score: 220, country: 'ES', date: '2023-05-16' }
        ];
        updateCallback(fallbackScores);
    });
    
    // Configurar actualización periódica
    const intervalId = setInterval(() => {
        // Verificar conectividad antes de cada sincronización
        checkConnectivity().catch(error => {
            console.error('Error al verificar conectividad en intervalo:', error);
            isOfflineMode = true;
        }).finally(() => {
            getWorldScores().then(updateCallback).catch(error => {
                console.error('Error al obtener puntajes en intervalo:', error);
            });
        });
    }, intervalMs);
    
    // Devolver función para detener la sincronización
    return () => clearInterval(intervalId);
}

// Exportar funciones
export { getWorldScores, submitWorldScore, startWorldScoresSync, checkConnectivity, isOfflineMode };