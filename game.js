// Código de inicialización - cargar recursos y configurar eventos
document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos UI
    menu = document.getElementById('menu');
    startButton = document.getElementById('startButton');
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreText = document.getElementById('scoreText');
    highScoreText = document.getElementById('highScore');
    
    // Cargar sonidos utilizando los elementos de audio del HTML
    eatSound = document.getElementById('eatSound');
    crashSound = document.getElementById('crashSound');
    powerUpSound = document.getElementById('powerupSound');
    levelUpSound = document.getElementById('levelUpSound');
    gameOverSound = document.getElementById('gameOverSound');
    
    // Asignar IDs para rastreo de carga
    if (eatSound) eatSound.id = 'eat';
    if (crashSound) crashSound.id = 'crash';
    if (powerUpSound) powerUpSound.id = 'powerUp';
    if (levelUpSound) levelUpSound.id = 'levelUp';
    if (gameOverSound) gameOverSound.id = 'gameOver';
    
    // Asegurarse de que los elementos de audio estén listos para reproducirse
    [eatSound, crashSound, powerUpSound, levelUpSound, gameOverSound].forEach(sound => {
        if (sound) {
            // Precarga de sonidos
            sound.load();
            // Manejo de errores
            sound.onerror = function() {
                console.log(`No se pudo cargar el sonido: ${sound.src}`);
                // El juego continuará sin sonido
            };
            sound.oncanplay = function() {
                soundsLoaded[sound.id] = true;
            };
        }
    });

    // Configurar controles del teclado
    document.addEventListener('keydown', handleKeyPress);
    
    // Configurar controles táctiles para dispositivos móviles
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    
    // Pausar/Reanudar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.style.display !== 'block') {
            togglePause();
        }
    });
    
    // Configurar eventos de botones
    startButton.addEventListener('click', () => {
        setupGameMode('classic'); // Modo por defecto
    });
    
    // Configurar botones de modo de juego (asegurar que existan)
    const classicModeBtn = document.getElementById('classicMode');
    const mazeModeBtn = document.getElementById('mazeMode');
    const timeModeBtn = document.getElementById('timeMode');
    const battleModeBtn = document.getElementById('battleMode');
    
    if (classicModeBtn) classicModeBtn.addEventListener('click', () => setupGameMode('classic'));
    if (mazeModeBtn) mazeModeBtn.addEventListener('click', () => setupGameMode('maze'));
    if (timeModeBtn) timeModeBtn.addEventListener('click', () => setupGameMode('time'));
    if (battleModeBtn) battleModeBtn.addEventListener('click', () => setupGameMode('battle'));
    
    // Botones de personalización y controles táctiles
    const toggleControlsBtn = document.getElementById('toggleControls');
    if (toggleControlsBtn) {
        toggleControlsBtn.addEventListener('click', () => {
            const mobileControls = document.querySelector('.mobile-controls');
            if (mobileControls) {
                mobileControls.style.display = mobileControls.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
    
    // Inicializar controles táctiles
    const mobileControls = document.querySelector('.mobile-controls');
    if (mobileControls && isTouchDevice) {
        mobileControls.style.display = 'block';
    }
    
    // Cargar puntuación máxima desde localStorage
    highScore = parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0');
    highScoreText.textContent = highScore;
    
    // Cargar preferencia de idioma
    userLanguage = localStorage.getItem(LANGUAGE_KEY) || navigator.language.split('-')[0];
    if (!translations[userLanguage]) {
        userLanguage = 'en'; // Idioma por defecto
    }
    
    // Cargar iniciales guardadas
    playerInitials = localStorage.getItem(INITIALS_KEY) || 'AAA';
    
    // Actualizar textos de la interfaz con el idioma elegido
    updateUITexts();
    
    // Inicializar el juego
    initGame();
});

// Control de teclado
function handleKeyPress(e) {
    if (isPaused) return;
    
    // Prevenir el desplazamiento de la página con las flechas
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    
    switch (e.key) {
        case 'ArrowUp':
            if (direction !== 'down') direction = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') direction = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') direction = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') direction = 'right';
            break;
        case ' ':
            togglePause();
            break;
    }
}

// Control táctil para dispositivos móviles
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    if (isPaused) return;
    
    e.preventDefault();
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Detectar si el movimiento fue horizontal o vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Movimiento horizontal
        if (diffX > 0 && direction !== 'right') {
            direction = 'left';
        } else if (diffX < 0 && direction !== 'left') {
            direction = 'right';
        }
    } else {
        // Movimiento vertical
        if (diffY > 0 && direction !== 'down') {
            direction = 'up';
        } else if (diffY < 0 && direction !== 'up') {
            direction = 'down';
        }
    }
    
    // Actualizar posición de inicio para el próximo movimiento
    touchStartX = touchEndX;
    touchStartY = touchEndY;
}

function togglePause() {
    isPaused = !isPaused;
    
    // Mostrar mensaje de pausa
    if (isPaused) {
        const pauseMessage = document.createElement('div');
        pauseMessage.id = 'pauseMessage';
        pauseMessage.textContent = translations[userLanguage]['paused'];
        pauseMessage.classList.add('pause-message');
        document.body.appendChild(pauseMessage);
    } else {
        // Eliminar mensaje de pausa
        const pauseMessage = document.getElementById('pauseMessage');
        if (pauseMessage) {
            pauseMessage.remove();
        }
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreText = document.getElementById('scoreText');
const menu = document.getElementById('menu');
const startButton = document.getElementById('startButton');
const highScoreText = document.getElementById('highScore');

// Constantes para almacenamiento local
const HIGHSCORE_KEY = 'snakeHighScore';
const SOUND_KEY = 'snakeSound';
const THEME_KEY = 'snakeTheme';
const LANGUAGE_KEY = 'snakeLanguage';
const INITIALS_KEY = 'playerInitials';

// Variables del juego
let snake = [{ x: 200, y: 200 }];
let direction = 'right';
let food = {};
let score = 0;
let highScore = 0;
let gameLoop;
let isPaused = false;
let gameSpeed = 150;
let gridSize = 20;
let level = 1;
let lives = 3;
let timeLeft = 60; // Para modo contrarreloj

// Variables de sonido
let eatSound;
let crashSound;
let powerUpSound;
let levelUpSound;
let gameOverSound;
let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'false';

// Variables para rastrear si los sonidos se cargaron correctamente
let soundsLoaded = {
    eat: false,
    crash: false,
    powerUp: false,
    levelUp: false,
    gameOver: false
};

// Personalización
let snakeColor = '#008000';
let snakeHeadColor = '#006400';
let foodStyle = 'classic';
let gameMode = 'classic';

// Power-ups
let powerUps = [];
let activePowerUp = null;
let powerUpTimer = null;
let isImmortal = false;

// Obstáculos para modo laberinto
let obstacles = [];

// Modo batalla (2 jugadores)
let player2Snake = [];
let player2Direction = 'left';
let player2Score = 0;

// Configuración de idioma
let userLanguage = 'en';
let playerInitials = 'AAA';

// Traducciones
const translations = {
    'en': {
        'gameTitle': 'Super Snake Game',
        'score': 'Score',
        'highScore': 'High Score',
        'level': 'Level',
        'lives': 'Lives',
        'time': 'Time',
        'start': 'Start Game',
        'playAgain': 'Play Again',
        'gameOver': 'Game Over! Your score:',
        'timeUp': 'Time\'s up!',
        'enterInitials': 'Enter your initials:',
        'paused': 'PAUSED',
        'classic': 'Classic Mode',
        'maze': 'Maze Mode',
        'timeMode': 'Time Trial',
        'battle': 'Battle Mode',
        'customize': 'Customize',
        'sound': 'Sound',
        'speed': 'Speed',
        'snakeColor': 'Snake Color',
        'headColor': 'Head Color',
        'foodStyle': 'Food Style',
        'save': 'Save',
        'cancel': 'Cancel',
        'highScores': 'High Scores',
        'name': 'Name',
        'date': 'Date',
        'viewHighScores': 'High Scores',
        'back': 'Back',
        'noScores': 'No high scores yet!'
    },
    'es': {
        'gameTitle': 'Super Juego de Serpiente',
        'score': 'Puntos',
        'highScore': 'Récord',
        'level': 'Nivel',
        'lives': 'Vidas',
        'time': 'Tiempo',
        'start': 'Comenzar',
        'playAgain': 'Jugar de nuevo',
        'gameOver': 'Juego terminado! Tu puntuación:',
        'timeUp': '¡Se acabó el tiempo!',
        'enterInitials': 'Introduce tus iniciales:',
        'paused': 'PAUSADO',
        'classic': 'Modo Clásico',
        'maze': 'Modo Laberinto',
        'timeMode': 'Contrarreloj',
        'battle': 'Modo Batalla',
        'customize': 'Personalizar',
        'sound': 'Sonido',
        'speed': 'Velocidad',
        'snakeColor': 'Color Serpiente',
        'headColor': 'Color Cabeza',
        'foodStyle': 'Estilo Comida',
        'save': 'Guardar',
        'cancel': 'Cancelar',
        'highScores': 'Puntuaciones',
        'name': 'Nombre',
        'date': 'Fecha',
        'viewHighScores': 'Puntuaciones',
        'back': 'Volver',
        'noScores': '¡Aún no hay puntuaciones!'
    }
};

// Detectar idioma del navegador
userLanguage = navigator.language.split('-')[0];
if (!translations[userLanguage]) {
    userLanguage = 'en'; // Idioma por defecto
}

// Detectar si es dispositivo táctil
const isTouchDevice = ('ontouchstart' in window) || 
                      (navigator.maxTouchPoints > 0) ||
                      (navigator.msMaxTouchPoints > 0);

canvas.width = 400;
canvas.height = 400;

// Variables de juego básicas
snake = [];
food = {};
direction = 'right';
score = 0;
gameLoop;
isPaused = true;
highScore = localStorage.getItem(HIGHSCORE_KEY) || 0;
playerInitials = localStorage.getItem(INITIALS_KEY) || 'AAA';

// Variables para niveles de dificultad
level = 1;
gameSpeed = 150; // Velocidad inicial más lenta para los primeros niveles

// Nuevas variables para las mejoras
// Modos de juego
gameMode = localStorage.getItem('gameMode') || 'classic';
obstacles = [];
timeLeft = 60; // Para modo contrarreloj
let timeInterval; // Para el contador de tiempo
player2Snake = []; // Para modo batalla
player2Direction = 'left';
player2Score = 0;

// Sistema de vidas
lives = 3;
isImmortal = false;

// Intervalos
let powerUpInterval;

// Power-ups
powerUps = [];
activePowerUp = null;
powerUpDuration = 0;

// Personalización
snakeColor = localStorage.getItem('snakeColor') || '#4CAF50';
let theme = localStorage.getItem(THEME_KEY) || 'dark';
soundEnabled = localStorage.getItem(SOUND_KEY) !== 'false';

// Elementos audio
eatSound = new Audio();
crashSound = new Audio();
powerUpSound = new Audio();
levelUpSound = new Audio();
gameOverSound = new Audio();

// Función auxiliar para reproducir sonidos de forma segura
function playSound(sound) {
    if (sound && soundEnabled && soundsLoaded[sound.id]) {
        // Usar try-catch para manejar errores de reproducción
        try {
            // Reiniciar el sonido si ya estaba reproduciendo
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.log(`Error al reproducir sonido: ${error.message}`);
            });
        } catch (error) {
            console.log(`Error al reproducir sonido: ${error.message}`);
        }
    }
}

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

// Nuevos elementos UI
let pauseButton;
let modeButtons;
let colorButtons;
let themeButtons;
let soundToggle;
let livesText;
let timerDisplay;
let powerupHUD;
let activePowerupDisplay;

// Variables para sincronización de puntajes mundiales
let worldScores = [];
let stopWorldScoresSync;
let lastWorldScoreUpdate = null;

function initGame() {
    snake = [{ x: 200, y: 200 }];
    direction = 'right';
    score = 0;
    level = 1;
    gameSpeed = 150; // Velocidad inicial más lenta
    lives = 3;
    powerUps = [];
    obstacles = [];
    activePowerUp = null;
    isImmortal = false;
    timeLeft = 60;
    
    // Inicializar variables según el modo de juego
    if (gameMode === 'battle') {
        player2Snake = [{ x: 200, y: 200 - gridSize * 3 }];
        player2Direction = 'left';
        player2Score = 0;
    } else if (gameMode === 'maze') {
        createObstacles();
    }
    
    scoreText.textContent = score;
    document.getElementById('levelText').textContent = level;
    document.getElementById('livesText').textContent = lives;
    
    if (gameMode === 'time') {
        document.getElementById('timerDisplay').classList.remove('hidden');
        document.getElementById('timeLeft').textContent = timeLeft;
    } else {
        document.getElementById('timerDisplay').classList.add('hidden');
    }
    
    createFood();
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
        y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize,
        type: 'normal' // Tipo normal por defecto
    };
    
    // Generar comida especial cada cierto tiempo (10% de probabilidad)
    if (Math.random() < 0.1) {
        food.type = 'special';
    }
    
    // Evitar que la comida aparezca en la serpiente o en obstáculos
    while (snake.some(segment => segment.x === food.x && segment.y === food.y) ||
          obstacles.some(obs => obs.x === food.x && obs.y === food.y) ||
          (gameMode === 'battle' && player2Snake.some(segment => segment.x === food.x && segment.y === food.y))) {
        food = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize,
            type: food.type
        };
    }
}

function createPowerUp() {
    // Solo crear power-ups en determinados modos
    if (gameMode === 'battle' || Math.random() >= 0.2) return;
    
    const powerUpTypes = ['speed', 'slow', 'immortal', 'points2x', 'shrink'];
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    const powerUp = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
        y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize,
        type: randomType
    };
    
    // Evitar que el power-up aparezca sobre la serpiente, comida u obstáculos
    while (snake.some(segment => segment.x === powerUp.x && segment.y === powerUp.y) ||
          food.x === powerUp.x && food.y === powerUp.y ||
          obstacles.some(obs => obs.x === powerUp.x && obs.y === powerUp.y) ||
          (gameMode === 'battle' && player2Snake.some(segment => segment.x === powerUp.x && segment.y === powerUp.y))) {
        powerUp.x = Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize;
        powerUp.y = Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize;
    }
    
    powerUps.push(powerUp);
    
    // Eliminar power-up después de cierto tiempo si no se recoge
    setTimeout(() => {
        const index = powerUps.findIndex(p => p.x === powerUp.x && p.y === powerUp.y);
        if (index !== -1) {
            powerUps.splice(index, 1);
        }
    }, 10000); // Desaparece después de 10 segundos
}

function activatePowerUp(type) {
    if (soundEnabled) playSound(powerUpSound);
    
    // Cancelar power-up activo anterior si existe
    if (activePowerUp) {
        clearTimeout(powerUpInterval);
    }
    
    activePowerUp = type;
    powerUpDuration = 5000; // 5 segundos por defecto
    
    // Configurar efectos según el tipo
    switch (type) {
        case 'speed':
            gameSpeed = Math.max(gameSpeed * 0.7, 50); // Aumentar velocidad (reducir intervalo)
            clearInterval(gameLoop);
            gameLoop = setInterval(update, gameSpeed);
            break;
        case 'slow':
            gameSpeed = gameSpeed * 1.5; // Reducir velocidad (aumentar intervalo)
            clearInterval(gameLoop);
            gameLoop = setInterval(update, gameSpeed);
            break;
        case 'immortal':
            isImmortal = true;
            break;
        case 'points2x':
            // No necesita configuración especial, se gestiona al comer comida
            break;
        case 'shrink':
            // Reducir tamaño de la serpiente a la mitad
            if (snake.length > 5) {
                snake = snake.slice(0, Math.floor(snake.length / 2));
            }
            break;
    }
    
    // Mostrar indicador visual
    updatePowerUpDisplay(type);
    
    // Establecer temporizador para desactivar
    powerUpInterval = setTimeout(() => {
        deactivatePowerUp();
    }, powerUpDuration);
}

function deactivatePowerUp() {
    // Restaurar valores normales
    if (activePowerUp === 'speed' || activePowerUp === 'slow') {
        gameSpeed = Math.max(150 - (level - 1) * 10, 70); // Restaurar velocidad normal
        clearInterval(gameLoop);
        gameLoop = setInterval(update, gameSpeed);
    } else if (activePowerUp === 'immortal') {
        isImmortal = false;
    }
    
    // Limpiar UI
    document.getElementById('activePowerup').classList.add('hidden');
    activePowerUp = null;
}

function updatePowerUpDisplay(type) {
    const activePowerupElement = document.getElementById('activePowerup');
    const powerupIcon = document.getElementById('powerupIcon');
    const powerupTimer = document.getElementById('powerupTimer');
    
    // Configurar icono según tipo
    const iconPath = getImageForPowerUp(type);
    powerupIcon.src = iconPath;
    
    // Mostrar HUD
    activePowerupElement.classList.remove('hidden');
    
    // Iniciar animación de temporizador
    powerupTimer.style.width = '100%';
    powerupTimer.style.transition = `width ${powerUpDuration}ms linear`;
    setTimeout(() => {
        powerupTimer.style.width = '0%';
    }, 50);
}

function getImageForPowerUp(type) {
    // En una implementación real, estos podrían ser iconos reales almacenados en la carpeta de assets
    // Para simplificar, usamos emoji o una URL de placeholder
    switch (type) {
        case 'speed': return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%233498db"><path d="M13 5.08c3.06.44 5.48 2.86 5.92 5.92h3.03c-.47-4.72-4.23-8.48-8.95-8.95v3.03zM18.92 13c-.44 3.06-2.86 5.48-5.92 5.92v3.03c4.72-.47 8.48-4.23 8.95-8.95h-3.03zM11 18.92c-3.39-.49-6-3.4-6-6.92s2.61-6.43 6-6.92V2.05c5.05.5 9 4.76 9 9.95 0 5.19-3.95 9.45-9 9.95v-3.03z"/></svg>';
        case 'slow': return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%239b59b6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z"/></svg>';
        case 'immortal': return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23f1c40f"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
        case 'points2x': return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23e74c3c"><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>';
        case 'shrink': return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%234CAF50"><path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6zM3 9l2.3-2.3 2.87 2.89 1.42-1.42 2.89-2.87L6.7 5.3 9 3H3v6zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42 2.89 2.87L15 21h6v-6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.87 2.89L21 15v6h-6z"/></svg>';
        default: return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%233498db"><circle cx="12" cy="12" r="10"/></svg>';
    }
}

function drawSnake() {
    // Dibujar el cuerpo de la serpiente con efecto de gradiente y bordes redondeados
    for (let i = 0; i < snake.length; i++) {
        // El tamaño puede variar si el powerup 'shrink' está activo
        const size = (activePowerUp === 'shrink') ? gridSize * 0.7 : gridSize;
        const offset = (activePowerUp === 'shrink') ? (gridSize - size) / 2 : 0;
        const radius = size / 4; // Radio para bordes redondeados
        
        // Efecto visual para inmortalidad
        if (isImmortal) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#f1c40f';
        }
        
        // Cabeza de la serpiente
        if (i === 0) {
            // Dibujar cabeza con color distinto y forma redondeada
            ctx.fillStyle = '#006400';
            
            // Dibujar cabeza redondeada
            ctx.beginPath();
            ctx.roundRect(snake[i].x + offset, snake[i].y + offset, size, size, radius);
            ctx.fill();
            
            // Dibujar ojos
            ctx.fillStyle = '#FFFFFF';
            // Posición de los ojos basada en la dirección
            let eyeSize = gridSize / 6;
            let eyeOffsetX = 0, eyeOffsetY = 0;
            
            switch (direction) {
                case 'right':
                    eyeOffsetX = gridSize * 0.7;
                    eyeOffsetY = gridSize * 0.3;
                    ctx.beginPath();
                    ctx.arc(snake[i].x + eyeOffsetX, snake[i].y + eyeOffsetY, eyeSize/2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(snake[i].x + eyeOffsetX, snake[i].y + eyeOffsetY + gridSize * 0.4, eyeSize/2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'left':
                    eyeOffsetX = gridSize * 0.2;
                    eyeOffsetY = gridSize * 0.3;
                    ctx.beginPath();
                    ctx.arc(snake[i].x + eyeOffsetX, snake[i].y + eyeOffsetY, eyeSize/2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(snake[i].x + eyeOffsetX, snake[i].y + eyeOffsetY + gridSize * 0.4, eyeSize/2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'up':
                    eyeOffsetX = gridSize * 0.3;
                    eyeOffsetY = gridSize * 0.2;
                    ctx.beginPath();
                    ctx.arc(snake[i].x + eyeOffsetX, snake[i].y + eyeOffsetY, eyeSize/2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(snake[i].x + eyeOffsetX + gridSize * 0.4, snake[i].y + eyeOffsetY, eyeSize/2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'down':
                    eyeOffsetX = gridSize * 0.3;
                    eyeOffsetY = gridSize * 0.7;
                    ctx.beginPath();
                    ctx.arc(snake[i].x + eyeOffsetX, snake[i].y + eyeOffsetY, eyeSize/2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(snake[i].x + eyeOffsetX + gridSize * 0.4, snake[i].y + eyeOffsetY, eyeSize/2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
        } else {
            // Cuerpo: añadir gradiente de color y bordes redondeados
            const colorValue = Math.max(50, 180 - (i * 5));
            ctx.fillStyle = `rgb(0, ${colorValue}, 0)`;
            
            // Dibujar segmento redondeado
            ctx.beginPath();
            ctx.roundRect(snake[i].x + offset, snake[i].y + offset, size, size, radius);
            ctx.fill();
        }
    }
    
    // Resetear el shadow
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    
    // Dibujar serpiente del jugador 2 en modo batalla
    if (gameMode === 'battle' && player2Snake.length > 0) {
        drawPlayer2Snake();
    }
}

function drawPlayer2Snake() {
    const player2Color = '#C71585'; // Magenta oscuro
    const player2HeadColor = '#FF1493'; // Magenta
    
    for (let i = 0; i < player2Snake.length; i++) {
        if (i === 0) {
            ctx.fillStyle = player2HeadColor;
        } else {
            // Cuerpo con gradiente
            const colorValue = Math.max(50, 180 - (i * 5));
            ctx.fillStyle = `rgb(${colorValue}, 20, ${colorValue})`;
        }
        
        ctx.fillRect(player2Snake[i].x, player2Snake[i].y, gridSize, gridSize);
    }
}

function drawFood() {
    // Añadir efecto de brillo para comida especial
    if (food.type === 'special') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FFA500';
        ctx.fillStyle = '#FFD700'; // Dorado
    } else {
        ctx.fillStyle = '#FF0000'; // Rojo
    }

    // Dibujar forma circular para la comida
    ctx.beginPath();
    ctx.arc(food.x + gridSize / 2, food.y + gridSize / 2, gridSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Resetear el shadow
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
}

function drawPowerUps() {
    for (const powerUp of powerUps) {
        // Añadir efecto de brillo
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#3498db';
        
        // Fondo del power-up
        ctx.fillStyle = '#3498db'; // Azul
        ctx.beginPath();
        ctx.arc(powerUp.x + gridSize / 2, powerUp.y + gridSize / 2, gridSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Dibujar el icono de power-up
        const iconUrl = getPowerUpIcon(powerUp.type);
        drawPowerUpIcon(powerUp.x, powerUp.y, iconUrl);
        
        // Resetear shadow
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }
}

function drawPowerUpIcon(x, y, iconUrl) {
    try {
        // Intentar dibujar un ícono bonito
        ctx.beginPath();
        ctx.fillStyle = '#333';
        ctx.arc(x + gridSize / 2, y + gridSize / 2, gridSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Si tenemos una URL de icono, intentar cargarla y dibujarla
        if (iconUrl) {
            loadImageSafely(iconUrl, '#F9A825').then(img => {
                ctx.drawImage(img, x, y, gridSize, gridSize);
            });
        } else {
            // Fallback si no hay icono
            ctx.fillStyle = '#F9A825';
            ctx.fillRect(x + 5, y + 5, gridSize - 10, gridSize - 10);
        }
    } catch (error) {
        // Fallback simple si hay algún error
        console.log('Error al dibujar powerup:', error);
        ctx.fillStyle = '#F9A825';
        ctx.fillRect(x, y, gridSize, gridSize);
    }
}

function drawObstacles() {
    ctx.fillStyle = '#8B4513'; // Marrón
    
    for (const obstacle of obstacles) {
        ctx.fillRect(obstacle.x, obstacle.y, gridSize, gridSize);
        
        // Dibujar textura simple para los obstáculos
        ctx.fillStyle = '#A0522D'; // Marrón más claro para detalle
        ctx.fillRect(obstacle.x + gridSize / 4, obstacle.y + gridSize / 4, gridSize / 2, gridSize / 2);
        ctx.fillStyle = '#8B4513'; // Resetear color
    }
}

function createObstacles() {
    obstacles = [];
    
    // Patrón de obstáculos según el nivel
    const patternCount = Math.min(level, 5); // Máximo 5 patrones
    
    for (let i = 0; i < patternCount; i++) {
        // Diferentes patrones de obstáculos
        const patternType = Math.floor(Math.random() * 4);
        
        switch (patternType) {
            case 0: // Línea horizontal
                const y = Math.floor(Math.random() * (canvas.height / gridSize - 4) + 2) * gridSize;
                const length = Math.floor(Math.random() * 5) + 3; // 3-7 bloques
                const startX = Math.floor(Math.random() * (canvas.width / gridSize - length)) * gridSize;
                
                for (let j = 0; j < length; j++) {
                    obstacles.push({ x: startX + j * gridSize, y });
                }
                break;
                
            case 1: // Línea vertical
                const x = Math.floor(Math.random() * (canvas.width / gridSize - 4) + 2) * gridSize;
                const height = Math.floor(Math.random() * 5) + 3; // 3-7 bloques
                const startY = Math.floor(Math.random() * (canvas.height / gridSize - height)) * gridSize;
                
                for (let j = 0; j < height; j++) {
                    obstacles.push({ x, y: startY + j * gridSize });
                }
                break;
                
            case 2: // Patrón en L
                const cornerX = Math.floor(Math.random() * (canvas.width / gridSize - 6) + 3) * gridSize;
                const cornerY = Math.floor(Math.random() * (canvas.height / gridSize - 6) + 3) * gridSize;
                const legLength = Math.floor(Math.random() * 3) + 3; // 3-5 bloques
                
                for (let j = 0; j < legLength; j++) {
                    obstacles.push({ x: cornerX - j * gridSize, y: cornerY });
                    obstacles.push({ x: cornerX, y: cornerY + j * gridSize });
                }
                break;
                
            case 3: // Obstáculos aleatorios
                const count = Math.floor(Math.random() * 5) + 3; // 3-7 obstáculos
                
                for (let j = 0; j < count; j++) {
                    const randomX = Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize;
                    const randomY = Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize;
                    
                    // Evitar colocar cerca del centro (posición inicial de la serpiente)
                    if (Math.abs(randomX - 200) > 60 || Math.abs(randomY - 200) > 60) {
                        obstacles.push({ x: randomX, y: randomY });
                    }
                }
                break;
        }
    }
    
    // Asegurar que no haya obstáculos en la posición inicial de la serpiente
    obstacles = obstacles.filter(obs => 
        !snake.some(segment => Math.abs(segment.x - obs.x) < gridSize * 2 && 
                               Math.abs(segment.y - obs.y) < gridSize * 2));
}

function setupGame() {
    // Resetear variables del juego
    snake = [{ x: 200, y: 200 }];
    direction = 'right';
    score = 0;
    level = 1;
    isPaused = false;
    isImmortal = false;
    activePowerUp = null;
    powerUpTimer = null;
    powerUps = [];
    obstacles = [];
    timeLeft = 60;
    lives = 3;
    
    // Resetear variables específicas de modo batalla
    if (gameMode === 'battle') {
        player2Snake = [{ x: 280, y: 280 }];
        player2Direction = 'left';
        player2Score = 0;
    }
    
    // Crear obstáculos en modo laberinto
    if (gameMode === 'maze') {
        createObstacles();
    }
    
    // Crear comida inicial
    createFood();
    
    // Establecer velocidad inicial
    gameSpeed = 150;
    
    // Actualizar UI
    scoreText.textContent = score;
    document.getElementById('levelText').textContent = level;
    document.getElementById('livesText').textContent = lives;
    
    // Iniciar temporizador en modo contrarreloj
    if (gameMode === 'time') {
        document.getElementById('timeLeft').textContent = timeLeft;
        document.getElementById('timerDisplay').classList.remove('hidden');
    } else {
        document.getElementById('timerDisplay').classList.add('hidden');
    }
    
    // Resetear intervalo
    clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
    
    // Ocultar menú y mostrar el juego
    menu.style.display = 'none';
}

function setupGameMode(mode) {
    gameMode = mode;
    
    switch(mode) {
        case 'classic':
            // Configuración clásica
            obstacles = [];
            break;
            
        case 'maze':
            // Configuración laberinto (los obstáculos se crean en setupGame)
            break;
            
        case 'time':
            // Configuración contrarreloj
            timeLeft = 60; // 1 minuto
            obstacles = [];
            break;
            
        case 'battle':
            // Configuración batalla (2 jugadores, uno AI)
            player2Snake = [{ x: 280, y: 280 }];
            player2Direction = 'left';
            player2Score = 0;
            obstacles = [];
            break;
    }
    
    setupGame();
}

function applyCustomizations() {
    // Aplicar color de serpiente elegido
    const snakeColorPicker = document.getElementById('snakeColor');
    if (snakeColorPicker) {
        snakeColor = snakeColorPicker.value;
    }
    
    // Aplicar color de cabeza elegido
    const headColorPicker = document.getElementById('headColor');
    if (headColorPicker) {
        snakeHeadColor = headColorPicker.value;
    }
    
    // Aplicar tipo de comida elegido
    const foodStyleSelect = document.getElementById('foodStyle');
    if (foodStyleSelect) {
        foodStyle = foodStyleSelect.value;
    }
    
    // Aplicar velocidad inicial
    const speedSelect = document.getElementById('speedSelect');
    if (speedSelect) {
        const speed = parseInt(speedSelect.value);
        gameSpeed = 180 - (speed * 30); // 150 por defecto, más rápido según el valor seleccionado
        
        // Actualizar el intervalo del juego si está en marcha
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = setInterval(update, gameSpeed);
        }
    }
    
    // Aplicar música y sonidos
    const soundCheckbox = document.getElementById('soundEnabled');
    if (soundCheckbox) {
        soundEnabled = soundCheckbox.checked;
    }
}

function showHighScores() {
    // Obtener las puntuaciones guardadas
    const highScores = JSON.parse(localStorage.getItem('snakeHighScores') || '[]');
    
    // Ordenar por puntuación en orden descendente
    highScores.sort((a, b) => b.score - a.score);
    
    // Mostrar solo las 10 mejores
    const topScores = highScores.slice(0, 10);
    
    // Construir HTML para la tabla
    let highScoreHTML = `
        <h2>${translations[userLanguage]['highScores']}</h2>
        <table class="high-score-table">
            <tr>
                <th>#</th>
                <th>${translations[userLanguage]['name']}</th>
                <th>${translations[userLanguage]['score']}</th>
                <th>${translations[userLanguage]['date']}</th>
            </tr>
    `;
    
    topScores.forEach((score, index) => {
        highScoreHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${score.initials}</td>
                <td>${score.score}</td>
                <td>${new Date(score.date).toLocaleDateString()}</td>
            </tr>
        `;
    });
    
    if (topScores.length === 0) {
        highScoreHTML += `
            <tr>
                <td colspan="4">${translations[userLanguage]['noScores']}</td>
            </tr>
        `;
    }
    
    highScoreHTML += '</table>';
    
    // Añadir botón para volver
    highScoreHTML += `
        <button id="closeHighScores" class="button">${translations[userLanguage]['back']}</button>
    `;
    
    // Mostrar en el div de puntuaciones
    const highScoresDiv = document.getElementById('highScores');
    highScoresDiv.innerHTML = highScoreHTML;
    highScoresDiv.style.display = 'block';
    
    // Ocultar menú principal
    menu.style.display = 'none';
    
    // Evento para el botón de volver
    document.getElementById('closeHighScores').addEventListener('click', () => {
        highScoresDiv.style.display = 'none';
        menu.style.display = 'block';
    });
}

function saveHighScore() {
    // Solo guardar si hay puntuación
    if (score > 0) {
        const highScoreEntry = {
            initials: playerInitials,
            score: score,
            date: new Date().getTime(),
            mode: gameMode
        };
        
        // Obtener puntuaciones existentes
        const highScores = JSON.parse(localStorage.getItem('snakeHighScores') || '[]');
        
        // Añadir nueva puntuación
        highScores.push(highScoreEntry);
        
        // Ordenar por puntuación
        highScores.sort((a, b) => b.score - a.score);
        
        // Guardar en localStorage
        localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
    }
}

function updateHighScoreDisplay() {
    // Actualizar la tabla de puntuaciones si está visible
    const highScoresDiv = document.getElementById('highScores');
    if (highScoresDiv.style.display === 'block') {
        showHighScores();
    }
}

function changeLanguage(lang) {
    userLanguage = lang;
    localStorage.setItem('snakeLanguage', lang);
    
    // Actualizar todos los textos de la interfaz
    updateUITexts();
}

function updateUITexts() {
    // Títulos y textos estáticos
    document.getElementById('gameTitle').textContent = translations[userLanguage]['gameTitle'];
    document.getElementById('scoreLabel').textContent = translations[userLanguage]['score'];
    document.getElementById('highScoreLabel').textContent = translations[userLanguage]['highScore'];
    document.getElementById('levelLabel').textContent = translations[userLanguage]['level'];
    document.getElementById('livesLabel').textContent = translations[userLanguage]['lives'];
    
    // Menú
    document.getElementById('startButton').textContent = translations[userLanguage]['start'];
    document.getElementById('highScoreButton').textContent = translations[userLanguage]['viewHighScores'];
    document.getElementById('customizeButton').textContent = translations[userLanguage]['customize'];
    
    // Modos de juego
    document.getElementById('classicModeBtn').textContent = translations[userLanguage]['classic'];
    document.getElementById('mazeModeBtn').textContent = translations[userLanguage]['maze'];
    document.getElementById('timeModeBtn').textContent = translations[userLanguage]['timeMode'];
    document.getElementById('battleModeBtn').textContent = translations[userLanguage]['battle'];
    
    // Opciones de personalización
    document.getElementById('soundLabel').textContent = translations[userLanguage]['sound'];
    document.getElementById('speedLabel').textContent = translations[userLanguage]['speed'];
    document.getElementById('snakeColorLabel').textContent = translations[userLanguage]['snakeColor'];
    document.getElementById('headColorLabel').textContent = translations[userLanguage]['headColor'];
    document.getElementById('foodStyleLabel').textContent = translations[userLanguage]['foodStyle'];
    
    // Botones de control
    document.getElementById('saveCustomButton').textContent = translations[userLanguage]['save'];
    document.getElementById('cancelCustomButton').textContent = translations[userLanguage]['cancel'];
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

    // Verificar si comió comida
    if (head.x === food.x && head.y === food.y) {
        // Reproducir sonido
        if (soundEnabled) playSound(eatSound);
        
        // Añadir puntos según el tipo de comida
        let pointsToAdd = food.type === 'special' ? 25 : 10;
        
        // Duplicar puntos si el power-up está activo
        if (activePowerUp === 'points2x') {
            pointsToAdd *= 2;
        }
        
        // Añadir puntos
        score += pointsToAdd;
        
        // Animación al comer
        scoreText.classList.add('pulse');
        setTimeout(() => {
            scoreText.classList.remove('pulse');
        }, 300);
        
        scoreText.textContent = score;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            highScoreText.textContent = highScore;
        }
        
        createFood();
        
        // Probabilidad de crear power-up (15% de probabilidad cada vez que come)
        if (Math.random() < 0.15) {
            createPowerUp();
        }
        
        // Aumentar nivel y velocidad cada 50 puntos
        const newLevel = Math.floor(score / 50) + 1;
        if (newLevel > level) {
            level = newLevel;
            
            // Reproducir sonido de nivel
            if (soundEnabled) playSound(levelUpSound);
            
            // Aumentar velocidad gradualmente (reducir el intervalo)
            gameSpeed = Math.max(150 - (level - 1) * 10, 70);
            
            // Actualizar el intervalo del juego
            clearInterval(gameLoop);
            gameLoop = setInterval(update, gameSpeed);
            
            // Actualizar el texto del nivel con animación
            const levelElement = document.getElementById('levelText');
            levelElement.textContent = level;
            levelElement.classList.add('pulse');
            setTimeout(() => {
                levelElement.classList.remove('pulse');
            }, 300);
            
            // Crear obstáculos nuevos en modo laberinto
            if (gameMode === 'maze') {
                createObstacles();
            }
        }
    } else {
        snake.pop();
    }
    
    // Mover segundo jugador en modo batalla
    if (gameMode === 'battle' && player2Snake.length > 0) {
        movePlayer2();
    }
    
    // Verificar power-ups
    checkPowerUpCollision();
}

function movePlayer2() {
    // IA simple para el jugador 2
    const head = { ...player2Snake[0] };
    const foodDirX = food.x - head.x;
    const foodDirY = food.y - head.y;
    
    // Decidir dirección basada en la posición de la comida
    if (Math.abs(foodDirX) > Math.abs(foodDirY)) {
        // Moverse horizontalmente
        if (foodDirX > 0 && player2Direction !== 'left') {
            player2Direction = 'right';
        } else if (foodDirX < 0 && player2Direction !== 'right') {
            player2Direction = 'left';
        }
    } else {
        // Moverse verticalmente
        if (foodDirY > 0 && player2Direction !== 'up') {
            player2Direction = 'down';
        } else if (foodDirY < 0 && player2Direction !== 'down') {
            player2Direction = 'up';
        }
    }
    
    // Evitar colisiones
    const nextPosition = getNextPosition(head, player2Direction);
    if (isCollisionForPlayer2(nextPosition)) {
        // Cambiar a una dirección segura si va a chocar
        const directions = ['up', 'right', 'down', 'left'];
        const safeDirections = directions.filter(dir => dir !== getOppositeDirection(player2Direction));
        
        for (const dir of safeDirections) {
            const testPos = getNextPosition(head, dir);
            if (!isCollisionForPlayer2(testPos)) {
                player2Direction = dir;
                break;
            }
        }
    }
    
    // Mover cabeza en la dirección elegida
    const newHead = getNextPosition(head, player2Direction);
    player2Snake.unshift(newHead);
    
    // Verificar si come comida
    if (newHead.x === food.x && newHead.y === food.y) {
        player2Score += food.type === 'special' ? 25 : 10;
        createFood();
    } else {
        player2Snake.pop();
    }
}

function getNextPosition(position, dir) {
    const next = { ...position };
    switch (dir) {
        case 'up': next.y -= gridSize; break;
        case 'down': next.y += gridSize; break;
        case 'left': next.x -= gridSize; break;
        case 'right': next.x += gridSize; break;
    }
    return next;
}

function getOppositeDirection(dir) {
    switch (dir) {
        case 'up': return 'down';
        case 'down': return 'up';
        case 'left': return 'right';
        case 'right': return 'left';
    }
}

function isCollisionForPlayer2(position) {
    // Colisión con bordes
    if (position.x < 0 || position.x >= canvas.width || 
        position.y < 0 || position.y >= canvas.height) {
        return true;
    }
    
    // Colisión con obstáculos
    if (obstacles.some(obs => obs.x === position.x && obs.y === position.y)) {
        return true;
    }
    
    // Colisión con la serpiente del jugador 1
    if (snake.some(segment => segment.x === position.x && segment.y === position.y)) {
        return true;
    }
    
    // Colisión consigo mismo (excluyendo la cola que se moverá)
    for (let i = 0; i < player2Snake.length - 1; i++) {
        if (player2Snake[i].x === position.x && player2Snake[i].y === position.y) {
            return true;
        }
    }
    
    return false;
}

function checkPowerUpCollision() {
    const head = snake[0];
    
    // Verificar colisiones con power-ups
    for (let i = 0; i < powerUps.length; i++) {
        if (head.x === powerUps[i].x && head.y === powerUps[i].y) {
            const powerUpType = powerUps[i].type;
            // Eliminar el power-up recogido
            powerUps.splice(i, 1);
            // Activar el efecto
            activatePowerUp(powerUpType);
            break;
        }
    }
}

function checkCollision() {
    const head = snake[0];
    
    // Colisión con bordes
    let wallCollision = head.x < 0 || head.x >= canvas.width || 
                        head.y < 0 || head.y >= canvas.height;
                        
    // Colisión con obstáculos en modo laberinto
    let obstacleCollision = false;
    if (gameMode === 'maze') {
        obstacleCollision = obstacles.some(obs => head.x === obs.x && head.y === obs.y);
    }
    
    // Colisión con la otra serpiente en modo batalla
    let player2Collision = false;
    if (gameMode === 'battle') {
        player2Collision = player2Snake.some(segment => head.x === segment.x && head.y === segment.y);
    }

    // Colisión consigo mismo
    let selfCollision = false;
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            selfCollision = true;
            break;
        }
    }
    
    // Si hay colisión pero es inmortal, no contar como colisión
    if ((wallCollision || obstacleCollision || selfCollision || player2Collision) && isImmortal) {
        return false;
    }
    
    return wallCollision || obstacleCollision || selfCollision || player2Collision;
}

function update() {
    if (isPaused) return;
    
    // Actualizar temporizador en modo contrarreloj
    if (gameMode === 'time' && !isPaused) {
        updateTimer();
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar obstáculos en modo laberinto
    if (gameMode === 'maze') {
        drawObstacles();
    }
    
    moveSnake();
    
    if (checkCollision()) {
        handleCollision();
        return;
    }
    
    drawFood();
    drawPowerUps(); // Dibujar power-ups
    drawSnake();
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        document.getElementById('timeLeft').textContent = Math.ceil(timeLeft);
    } else {
        // Tiempo agotado
        gameOver('time');
    }
}

function handleCollision() {
    // Reproducir sonido de choque
    if (soundEnabled) playSound(crashSound);
    
    // Efecto visual de choque
    canvas.classList.add('shake');
    setTimeout(() => {
        canvas.classList.remove('shake');
    }, 500);
    
    lives--;
    document.getElementById('livesText').textContent = lives;
    
    if (lives <= 0) {
        gameOver('collision');
    } else {
        // Reseteamos posición pero mantenemos puntuación y nivel
        const resetSnake = () => {
            snake = [{ x: 200, y: 200 }];
            direction = 'right';
            clearInterval(gameLoop);
            gameLoop = setInterval(update, gameSpeed);
        };
        
        // Pausa breve antes de continuar
        isPaused = true;
        setTimeout(() => {
            resetSnake();
            isPaused = false;
        }, 1000);
    }
}

function gameOver(reason = 'collision') {
    clearInterval(gameLoop);
    isPaused = true;
    
    // Detener temporizador en modo contrarreloj
    if (gameMode === 'time') {
        clearInterval(timeInterval);
    }
    
    // Reproducir sonido de game over
    if (soundEnabled) playSound(gameOverSound);
    
    // Mensaje diferente según el motivo
    let gameOverMessage = translations[userLanguage]['gameOver'];
    if (reason === 'time') {
        gameOverMessage += ' ' + translations[userLanguage]['timeUp'];
    }
    
    // Pedir iniciales
    const newInitials = prompt(
        `${gameOverMessage} ${score}\n${translations[userLanguage]['enterInitials']}`, 
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

// Manejo global de errores para que el juego no se bloquee
window.onerror = function(msg, url, line, col, error) {
    console.log(`Error: ${msg} en ${url} (línea: ${line}, columna: ${col})`);
    // Evitar que el juego se detenga completamente
    return true;
};

// Función auxiliar para cargar imágenes de forma segura
function loadImageSafely(src, fallbackColor = '#4CAF50') {
    return new Promise((resolve) => {
        if (!src || src === '') {
            // Si no hay URL, crear un canvas como fallback
            const canvas = document.createElement('canvas');
            canvas.width = 20;
            canvas.height = 20;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = fallbackColor;
            ctx.fillRect(0, 0, 20, 20);
            resolve(canvas);
            return;
        }
        
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.log(`No se pudo cargar la imagen: ${src}, usando fallback`);
            // Crear un canvas como fallback
            const canvas = document.createElement('canvas');
            canvas.width = 20;
            canvas.height = 20;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = fallbackColor;
            ctx.fillRect(0, 0, 20, 20);
            resolve(canvas);
        };
        img.src = src;
    });
}

// Función para iniciar el juego
function startGame() {
    setupGame();
    
    // Iniciar el intervalo para modo contrarreloj
    if (gameMode === 'time') {
        if (timeInterval) clearInterval(timeInterval);
        timeInterval = setInterval(updateTimer, 1000);
    }
    
    // Configurar intervalo para power-ups
    if (powerUpInterval) clearInterval(powerUpInterval);
    powerUpInterval = setInterval(() => {
        if (Math.random() < 0.3) { // 30% de probabilidad
            createPowerUp();
        }
    }, 10000); // Cada 10 segundos
}