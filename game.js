const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreText = document.getElementById('scoreText');
const menu = document.getElementById('menu');
const startButton = document.getElementById('startButton');
const highScoreText = document.getElementById('highScore');

// Constantes para almacenamiento local
const HIGH_SCORES_KEY = 'snakeHighScores';
const LAST_PLAYER_KEY = 'lastPlayer';
const WORLD_SCORES_KEY = 'worldScores';

// Importar funciones de API
import { getWorldScores, submitWorldScore, startWorldScoresSync, checkConnectivity, isOfflineMode } from './api.js';

// Configuración de idiomas
const translations = {
    'es': {
        'start': 'Iniciar Juego',
        'playAgain': 'Jugar de nuevo',
        'score': 'Puntuación',
        'record': 'Récord',
        'player': 'Jugador',
        'points': 'Puntos',
        'gameOver': '¡Juego terminado!',
        'enterInitials': 'Ingresa tus iniciales (3 caracteres):',
        'touch': 'Controles',
        'installApp': 'Instalar Juego',
        'local': 'Local',
        'world': 'Mundial',
        'country': 'País',
        'syncingScores': 'Sincronizando puntuaciones...',
        'lastUpdate': 'Última actualización:',
        'offlineMode': 'Modo Offline',
        'usingLocalData': 'Usando datos locales',
        'tryAgain': 'Intentar de nuevo'
    },
    'en': {
        'start': 'Start Game',
        'playAgain': 'Play Again',
        'score': 'Score',
        'record': 'Record',
        'player': 'Player',
        'points': 'Points',
        'gameOver': 'Game Over!',
        'enterInitials': 'Enter your initials (3 characters):',
        'touch': 'Controls',
        'installApp': 'Install Game',
        'local': 'Local',
        'world': 'World',
        'country': 'Country',
        'syncingScores': 'Syncing scores...',
        'lastUpdate': 'Last update:',
        'offlineMode': 'Offline Mode',
        'usingLocalData': 'Using local data',
        'tryAgain': 'Try Again'
    }
};

// Detectar idioma del navegador
let userLanguage = navigator.language.split('-')[0];
if (!translations[userLanguage]) {
    userLanguage = 'en'; // Idioma por defecto
}

// Detectar si es dispositivo táctil
const isTouchDevice = ('ontouchstart' in window) || 
                      (navigator.maxTouchPoints > 0) ||
                      (navigator.msMaxTouchPoints > 0);

canvas.width = 400;
canvas.height = 400;
const gridSize = 20;

let snake = [];
let food = {};
let direction = 'right';
let score = 0;
let gameLoop;
let isPaused = true;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let playerInitials = localStorage.getItem(LAST_PLAYER_KEY) || 'XXX';
let highScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY) || '[]');

// Elementos adicionales - Aseguramos que se inicialicen después de DOMContentLoaded
let toggleScoresBtn;
let topScoresDiv;
let toggleControlsBtn;
let mobileControls;
let installButton;
let localTabBtn;
let worldTabBtn;
let localScoresTab;
let worldScoresTab;
let worldScoresList;
let desktopTouchControls;
let leftTouchControl;
let rightTouchControl;

// Variables para sincronización de puntajes mundiales
let worldScores = [];
let stopWorldScoresSync;
let lastWorldScoreUpdate = null;

function initGame() {
    snake = [{ x: 200, y: 200 }];
    direction = 'right';
    score = 0;
    scoreText.textContent = score;
    createFood();
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
        y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
    };
    // Evitar que la comida aparezca en la serpiente
    while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        food = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
        };
    }
}

function drawSnake() {
    ctx.fillStyle = '#4CAF50';
    snake.forEach((segment, index) => {
        // Cabeza más grande
        if (index === 0) {
            ctx.fillRect(segment.x, segment.y, gridSize - 1, gridSize - 1);
        } else {
            ctx.fillRect(segment.x + 1, segment.y + 1, gridSize - 2, gridSize - 2);
        }
    });
}

function drawFood() {
    ctx.fillStyle = '#FF5252';
    ctx.beginPath();
    ctx.arc(food.x + gridSize/2, food.y + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();
}

function moveSnake() {
    const head = { ...snake[0] };

    switch (direction) {
        case 'up': head.y -= gridSize; break;
        case 'down': head.y += gridSize; break;
        case 'left': head.x -= gridSize; break;
        case 'right': head.x += gridSize; break;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreText.textContent = score;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            highScoreText.textContent = highScore;
        }
        createFood();
    } else {
        snake.pop();
    }
}

function checkCollision() {
    const head = snake[0];
    
    if (head.x < 0 || head.x >= canvas.width || 
        head.y < 0 || head.y >= canvas.height) {
        return true;
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    return false;
}

// Aplicar traducciones
function applyTranslations() {
    document.querySelectorAll('[class*="lang-"]').forEach(element => {
        const classes = Array.from(element.classList);
        const langClass = classes.find(cls => cls.startsWith('lang-'));
        if (langClass) {
            const key = langClass.replace('lang-', '');
            if (translations[userLanguage][key]) {
                if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
                    element.value = translations[userLanguage][key];
                } else {
                    element.textContent = translations[userLanguage][key];
                }
            }
        }
    });
    
    // Actualizar textos específicos con verificación de existencia
    if (startButton) startButton.textContent = translations[userLanguage]['start'];
    
    if (toggleControlsBtn) {
        toggleControlsBtn.textContent = translations[userLanguage]['touch'];
    }
    
    if (toggleScoresBtn) {
        toggleScoresBtn.textContent = 'TOP ▼';
    }
    
    // Actualizar el texto del botón de instalación
    if (installButton) {
        installButton.textContent = translations[userLanguage]['installApp'];
    }
}

// Función para mostrar/ocultar puntuaciones
function toggleScores() {
    if (topScoresDiv.style.display === 'block') {
        topScoresDiv.style.display = 'none';
        toggleScoresBtn.textContent = 'TOP ▼';
    } else {
        topScoresDiv.style.display = 'block';
        toggleScoresBtn.textContent = 'TOP ▲';
    }
}

// Función para mostrar/ocultar controles táctiles
function toggleControls() {
    if (!isTouchDevice) {
        // En dispositivos no táctiles, mostrar/ocultar los controles táctiles de escritorio
        if (desktopTouchControls.style.display === 'block') {
            desktopTouchControls.style.display = 'none';
        } else {
            desktopTouchControls.style.display = 'block';
        }
    } else {
        // En dispositivos táctiles, mostrar/ocultar los controles móviles
        if (mobileControls.style.display === 'block') {
            mobileControls.style.display = 'none';
        } else {
            mobileControls.style.display = 'block';
        }
    }
}

// Guardar solo el puntaje más alto por jugador
function saveHighScore() {
    const newScore = {
        initials: playerInitials,
        score: score,
        date: new Date().toLocaleDateString()
    };
    
    // Verificar si el jugador ya tiene un puntaje guardado
    const existingPlayerIndex = highScores.findIndex(s => s.initials === playerInitials);
    
    if (existingPlayerIndex !== -1) {
        // Si el jugador ya existe, actualizar solo si el nuevo puntaje es mayor
        if (score > highScores[existingPlayerIndex].score) {
            highScores[existingPlayerIndex] = newScore;
        }
    } else {
        // Si es un nuevo jugador, agregar a la lista
        highScores.push(newScore);
    }
    
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10); // Mantener solo los 10 mejores
    
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores));
    localStorage.setItem(LAST_PLAYER_KEY, playerInitials);
    
    // Enviar puntaje al servidor mundial (simulado)
    const worldScoreData = {
        initials: playerInitials,
        score: score,
        country: navigator.language.split('-')[1] || 'XX' // Usar código de país del navegador o XX si no está disponible
    };
    
    submitWorldScore(worldScoreData).then(result => {
        if (result.success) {
            console.log('Puntaje mundial enviado correctamente');
            // Actualizar la lista de puntajes mundiales
            getWorldScores().then(scores => {
                worldScores = scores;
                updateWorldScoresDisplay();
            });
        } else {
            console.error('Error al enviar puntaje mundial:', result.message);
        }
    });
}

function gameOver() {
    clearInterval(gameLoop);
    isPaused = true;
    
    // Ask for player initials with translated text
    const newInitials = prompt(
        `${translations[userLanguage]['gameOver']} ${score}\n${translations[userLanguage]['enterInitials']}`, 
        playerInitials
    );
    
    if (newInitials) {
        playerInitials = newInitials.slice(0, 3).toUpperCase();
        saveHighScore();
    }
    
    menu.style.display = 'block';
    startButton.textContent = translations[userLanguage]['playAgain'];
    
    // Eliminar el botón 'tryAgainButton' si existe para evitar duplicados
    const existingTryAgainButton = document.getElementById('tryAgainButton');
    if (existingTryAgainButton) {
        existingTryAgainButton.remove();
    }
    
    updateHighScoreDisplay();
}

function updateHighScoreDisplay() {
    const highScoresList = document.getElementById('highScoresList');
    if (highScoresList) {
        highScoresList.innerHTML = highScores
            .map((score, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${score.initials}</td>
                    <td>${score.score}</td>
                </tr>
            `).join('');
    }
}

function updateWorldScoreDisplay() {
    if (!worldScoresList) return;
    
    worldScoresList.innerHTML = '';
    
    // Actualizar encabezados de la tabla según el idioma
    const worldScoresTable = document.querySelector('#worldScoresTab table');
    if (worldScoresTable) {
        const headerRow = worldScoresTable.querySelector('thead tr');
        if (headerRow) {
            headerRow.innerHTML = `
                <th>#</th>
                <th class="lang-player">${translations[userLanguage]['player']}</th>
                <th class="lang-points">${translations[userLanguage]['points']}</th>
                <th class="lang-country">${translations[userLanguage]['country']}</th>
            `;
        }
    }
    
    // Verificar si estamos en modo offline
    if (isOfflineMode) {
        // Mostrar mensaje de modo offline según el idioma
        const offlineMessage = document.createElement('tr');
        offlineMessage.innerHTML = `<td colspan="4" class="offline-mode">🔄 ${translations[userLanguage]['offlineMode']} - ${translations[userLanguage]['usingLocalData']}</td>`;
        worldScoresList.appendChild(offlineMessage);
    }
    
    if (worldScores.length === 0) {
        const loadingRow = document.createElement('tr');
        loadingRow.innerHTML = `<td colspan="4" class="loading-text">${translations[userLanguage]['syncingScores']}</td>`;
        worldScoresList.appendChild(loadingRow);
        return;
    }
    
    worldScores.forEach((score, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.initials}</td>
            <td>${score.score}</td>
            <td>${score.country || '??'}</td>
        `;
        worldScoresList.appendChild(row);
    });
    
    // Mostrar última actualización
    if (lastWorldScoreUpdate) {
        const updateInfoRow = document.createElement('tr');
        updateInfoRow.innerHTML = `<td colspan="4" class="update-info">${translations[userLanguage]['lastUpdate']} ${lastWorldScoreUpdate.toLocaleTimeString()}</td>`;
        worldScoresList.appendChild(updateInfoRow);
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    moveSnake();
    if (checkCollision()) {
        gameOver();
        return;
    }
    drawFood();
    drawSnake();
}

function handleKeyPress(event) {
    if (isPaused) {
        if (event.key === 'Enter' || event.key === ' ') {
            startGame();
        }
        return;
    }
    
    switch (event.key) {
        case 'ArrowUp': if (direction !== 'down') direction = 'up'; break;
        case 'ArrowDown': if (direction !== 'up') direction = 'down'; break;
        case 'ArrowLeft': if (direction !== 'right') direction = 'left'; break;
        case 'ArrowRight': if (direction !== 'left') direction = 'right'; break;
        case 'Escape': togglePause(); break;
    }
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameLoop);
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
        gameLoop = setInterval(update, 100);
    }
}

function startGame() {
    initGame();
    isPaused = false;
    menu.style.display = 'none';
    gameLoop = setInterval(update, 100);
}

// Inicialización de la interfaz según el dispositivo
function initializeUI() {
    // Inicializar elementos DOM
    toggleScoresBtn = document.getElementById('toggleScores');
    topScoresDiv = document.querySelector('.top-scores');
    toggleControlsBtn = document.getElementById('toggleControls');
    mobileControls = document.querySelector('.mobile-controls');
    localTabBtn = document.getElementById('localTabBtn');
    worldTabBtn = document.getElementById('worldTabBtn');
    localScoresTab = document.getElementById('localScoresTab');
    worldScoresTab = document.getElementById('worldScoresTab');
    worldScoresList = document.getElementById('worldScoresList');
    desktopTouchControls = document.querySelector('.desktop-touch-controls');
    leftTouchControl = document.getElementById('leftTouchControl');
    rightTouchControl = document.getElementById('rightTouchControl');
    
    // Crear el botón de instalación
    installButton = document.createElement('button');
    installButton.style.display = 'none';
    installButton.textContent = translations[userLanguage]['installApp'];
    installButton.classList.add('install-button');
    document.querySelector('.game-container').appendChild(installButton);
    
    // Aplicar traducciones
    applyTranslations();
    
    // Configurar visibilidad de controles según el dispositivo
    if (isTouchDevice) {
        if (mobileControls) {
            mobileControls.style.display = 'block';
        }
        if (toggleControlsBtn) {
            toggleControlsBtn.style.display = 'none';
        }
        if (desktopTouchControls) {
            desktopTouchControls.style.display = 'none';
        }
    } else {
        if (mobileControls) {
            mobileControls.style.display = 'none';
        }
        if (toggleControlsBtn) {
            toggleControlsBtn.style.display = 'block';
        }
        if (desktopTouchControls) {
            desktopTouchControls.style.display = 'none'; // Oculto por defecto, se mostrará al activar controles táctiles
        }
    }
    
    // Event listeners para los nuevos botones
    if (toggleScoresBtn) {
        toggleScoresBtn.addEventListener('click', toggleScores);
    }
    if (toggleControlsBtn) {
        toggleControlsBtn.addEventListener('click', toggleControls);
    }
    
    // Event Listeners para pestañas de puntajes
    if (localTabBtn) {
        localTabBtn.addEventListener('click', () => {
            localTabBtn.classList.add('active');
            worldTabBtn.classList.remove('active');
            localScoresTab.classList.add('active');
            worldScoresTab.classList.remove('active');
        });
    }
    
    if (worldTabBtn) {
        worldTabBtn.addEventListener('click', () => {
            worldTabBtn.classList.add('active');
            localTabBtn.classList.remove('active');
            worldScoresTab.classList.add('active');
            localScoresTab.classList.remove('active');
            
            // Iniciar sincronización de puntajes mundiales si no está activa
            if (!stopWorldScoresSync) {
                initWorldScoresSync();
            }
        });
    }
    
    // Event Listeners
    startButton.addEventListener('click', startGame);
    document.addEventListener('keydown', handleKeyPress);
    
    // Controles de rotación
    const leftRotateButton = document.getElementById('leftRotateButton');
    const rightRotateButton = document.getElementById('rightRotateButton');
    
    if (leftRotateButton) {
        leftRotateButton.addEventListener('click', () => {
            if (!isPaused) {
                // Rotar a la izquierda
                switch(direction) {
                    case 'up': direction = 'left'; break;
                    case 'left': direction = 'down'; break;
                    case 'down': direction = 'right'; break;
                    case 'right': direction = 'up'; break;
                }
            }
        });
    }
    
    if (rightRotateButton) {
        rightRotateButton.addEventListener('click', () => {
            if (!isPaused) {
                // Rotar a la derecha
                switch(direction) {
                    case 'up': direction = 'right'; break;
                    case 'right': direction = 'down'; break;
                    case 'down': direction = 'left'; break;
                    case 'left': direction = 'up'; break;
                }
            }
        });
    }
    
    // Controles táctiles para escritorio
    if (leftTouchControl) {
        leftTouchControl.addEventListener('click', () => {
            if (!isPaused) {
                // Rotar a la izquierda
                switch(direction) {
                    case 'up': direction = 'left'; break;
                    case 'left': direction = 'down'; break;
                    case 'down': direction = 'right'; break;
                    case 'right': direction = 'up'; break;
                }
            }
        });
    }
    
    if (rightTouchControl) {
        rightTouchControl.addEventListener('click', () => {
            if (!isPaused) {
                // Rotar a la derecha
                switch(direction) {
                    case 'up': direction = 'right'; break;
                    case 'right': direction = 'down'; break;
                    case 'down': direction = 'left'; break;
                    case 'left': direction = 'up'; break;
                }
            }
        });
    }
    
    // Iniciar sincronización de puntajes mundiales (con retraso para mejorar carga inicial)
    setTimeout(() => {
        initWorldScoresSync();
    }, 1000);
    
    // Configurar el botón de instalación
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Usuario respondió: ${outcome}`);
        deferredPrompt = null;
        installButton.style.display = 'none';
    });
    
    // Función para iniciar la sincronización de puntajes mundiales
    function initWorldScoresSync() {
        // Detener sincronización anterior si existe
        if (stopWorldScoresSync) {
            stopWorldScoresSync();
        }
        
        // Iniciar nueva sincronización
        stopWorldScoresSync = startWorldScoresSync(scores => {
            worldScores = scores;
            lastWorldScoreUpdate = new Date();
            updateWorldScoresDisplay();
        }, 30000); // Actualizar cada 30 segundos
    }
    
    // Inicializar el juego y mostrar puntuaciones
    initGame();
    updateHighScoreDisplay();
    highScoreText.textContent = highScore;
    
    // Cargar puntajes mundiales iniciales
    getWorldScores().then(scores => {
        worldScores = scores;
        lastWorldScoreUpdate = new Date();
        updateWorldScoresDisplay();
    });
}

// Variables para la instalación de la PWA
let deferredPrompt;

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registrado con éxito:', registration.scope);
            })
            .catch(error => {
                console.log('Error al registrar el Service Worker:', error);
            });
    });
}

// Configurar eventos de instalación
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installButton) installButton.style.display = 'block';
});

window.addEventListener('appinstalled', (e) => {
    console.log('Aplicación instalada');
    if (installButton) installButton.style.display = 'none';
});

// Inicializar la interfaz después de cargar la página
window.addEventListener('DOMContentLoaded', () => {
    initializeUI();
});