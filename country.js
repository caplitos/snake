// Módulo para manejar la detección de país y banderas

// API para obtener información de país basada en IP
const IP_API_URL = 'https://ipapi.co/json/';

// Caché para almacenar el código de país del usuario actual
let userCountryCode = localStorage.getItem('userCountryCode') || null;

// Función para obtener el código de país del usuario actual
async function getUserCountry() {
    // Si ya tenemos el código de país en caché, lo devolvemos
    if (userCountryCode) {
        return userCountryCode;
    }
    
    try {
        // Intentar obtener la información de país desde la API
        const response = await fetch(IP_API_URL);
        const data = await response.json();
        
        if (data && data.country) {
            // Guardar el código de país en caché
            userCountryCode = data.country;
            localStorage.setItem('userCountryCode', userCountryCode);
            return userCountryCode;
        } else {
            // Si no se pudo obtener el país, usar un valor predeterminado
            console.error('No se pudo obtener el país del usuario');
            return 'XX'; // Código para país desconocido
        }
    } catch (error) {
        console.error('Error al obtener el país del usuario:', error);
        return 'XX'; // Código para país desconocido
    }
}

// Función para generar el HTML de la bandera según el código de país
function getCountryFlagHTML(countryCode) {
    if (!countryCode || countryCode === 'XX') {
        // Si no hay código de país o es desconocido, mostrar un icono genérico
        return '<span class="unknown-flag">🌐</span>';
    }
    
    // Convertir el código de país a letras mayúsculas
    countryCode = countryCode.toUpperCase();
    
    // Generar la bandera usando emojis de banderas regionales
    // Convertir cada letra a su equivalente en emoji regional
    const offset = 127397; // Offset para convertir ASCII a emoji de bandera regional
    const flagEmoji = countryCode
        .split('')
        .map(char => String.fromCodePoint(char.charCodeAt(0) + offset))
        .join('');
    
    return `<span class="country-flag" title="${countryCode}">${flagEmoji}</span>`;
}

// Exportar funciones
export { getUserCountry, getCountryFlagHTML };