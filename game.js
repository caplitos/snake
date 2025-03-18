const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreText = document.getElementById('scoreText');
const menu = document.getElementById('menu');
const startButton = document.getElementById('startButton');
const highScoreText = document.getElementById('highScore');

// Constantes para almacenamiento local
const HIGH_SCORES_KEY = 'snakeHighScores';
const LAST_PLAYER_KEY = 'lastPlayer';

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

highScoreText.textContent = highScore;

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

function saveHighScore() {
    const newScore = {
        initials: playerInitials,
        score: score,
        date: new Date().toLocaleDateString()
    };
    
    highScores.push(newScore);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 3); // Cambiado de 5 a 3 mejores puntajes
    
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores));
    localStorage.setItem(LAST_PLAYER_KEY, playerInitials);
}

function updateHighScoreDisplay() {
    const highScoresList = document.getElementById('highScoresList');
    highScoresList.innerHTML = highScores
        .map((score, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${score.initials}</td>
                <td>${score.score}</td>
            </tr>
        `).join('');
}

function gameOver() {
    clearInterval(gameLoop);
    isPaused = true;
    
    // Ask for player initials
    const newInitials = prompt(`¡Juego terminado! Puntuación: ${score}\nIngresa tus iniciales (3 caracteres):`, playerInitials);
    if (newInitials) {
        playerInitials = newInitials.slice(0, 3).toUpperCase();
        saveHighScore();
    }
    
    menu.style.display = 'block';
    startButton.textContent = 'Jugar de nuevo';
    updateHighScoreDisplay();
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

// Event Listeners
startButton.addEventListener('click', startGame);
document.addEventListener('keydown', handleKeyPress);

// Controles móviles
['up', 'down', 'left', 'right'].forEach(dir => {
    const button = document.getElementById(`${dir}Button`);
    if (button) {
        button.addEventListener('click', () => {
            if (!isPaused) {
                const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
                if (direction !== opposites[dir]) direction = dir;
            }
        });
    }
});

// Inicializar el juego y mostrar puntuaciones
initGame();
updateHighScoreDisplay();

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

// Mostrar banner de instalación
let deferredPrompt;
const installButton = document.createElement('button');
installButton.style.display = 'none';
installButton.textContent = 'Instalar App';
installButton.classList.add('install-button');
document.querySelector('.game-container').appendChild(installButton);

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir que Chrome muestre automáticamente el prompt
    e.preventDefault();
    // Guardar el evento para usarlo después
    deferredPrompt = e;
    // Mostrar el botón de instalación
    installButton.style.display = 'block';
});

installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    // Mostrar el prompt de instalación
    deferredPrompt.prompt();
    // Esperar a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuario respondió: ${outcome}`);
    // Ya no necesitamos el evento
    deferredPrompt = null;
    // Ocultar el botón
    installButton.style.display = 'none';
});

window.addEventListener('appinstalled', (e) => {
    console.log('Aplicación instalada');
    // Ocultar el botón de instalación
    installButton.style.display = 'none';
});