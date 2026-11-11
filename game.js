const canvas = document.querySelector('#game-canvas');
const context = canvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const bestScoreElement = document.querySelector('#best-score');
const pauseButton = document.querySelector('#pause-button');
const startButton = document.querySelector('#start-button');
const overlay = document.querySelector('#game-overlay');
const overlayKicker = document.querySelector('#overlay-kicker');
const overlayTitle = document.querySelector('#overlay-title');
const overlayCopy = document.querySelector('#overlay-copy');
const gameStatus = document.querySelector('#game-status');
const touchButtons = document.querySelectorAll('[data-direction]');

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const GRAVITY = .58;
const JUMP_FORCE = 12.8;
const MOVE_FORCE = .82;
const MAX_SPEED = 6.4;

const input = { left: false, right: false };
const player = { x: 0, y: 0, width: 34, height: 48, vx: 0, vy: 0 };

let gameState = 'ready';
let platforms = [];
let particles = [];
let cameraY = 0;
let highestPlatformY = 0;
let startingY = 0;
let score = 0;
let bestScore = loadBestScore();
let lastTime = 0;

bestScoreElement.textContent = `${bestScore}m`;

function loadBestScore() {
    try {
        return Number.parseInt(localStorage.getItem('infinite-climb-best') || '0', 10);
    } catch {
        return 0;
    }
}

function saveBestScore(value) {
    try {
        localStorage.setItem('infinite-climb-best', String(value));
    } catch {
        // The game still works when browser storage is unavailable.
    }
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function resetGame() {
    platforms = [{ x: 210, y: 700, width: 300, height: 15, tone: 0 }];
    particles = [];
    highestPlatformY = 700;
    cameraY = 0;
    score = 0;

    player.x = GAME_WIDTH / 2 - player.width / 2;
    player.y = 700 - player.height;
    player.vx = 0;
    player.vy = -JUMP_FORCE;
    startingY = player.y;

    while (highestPlatformY > -360) addPlatform();
    updateScore(0);
}

function addPlatform() {
    const previous = platforms.reduce((highest, platform) => platform.y < highest.y ? platform : highest);
    const difficulty = Math.min(score * .05, 28);
    const gap = randomBetween(82 + difficulty * .3, 112 + difficulty * .45);
    const width = randomBetween(94, 154 - difficulty * .35);
    const horizontalReach = 155 + Math.min(score * .08, 35);
    const nextX = clamp(
        previous.x + previous.width / 2 - width / 2 + randomBetween(-horizontalReach, horizontalReach),
        24,
        GAME_WIDTH - width - 24
    );

    highestPlatformY -= gap;
    platforms.push({
        x: nextX,
        y: highestPlatformY,
        width,
        height: 13,
        tone: platforms.length % 3
    });
}

function startGame() {
    resetGame();
    gameState = 'running';
    overlay.classList.add('is-hidden');
    pauseButton.disabled = false;
    pauseButton.textContent = 'Pause';
    gameStatus.textContent = 'Infinite Climb started.';
    canvas.focus();
}

function endGame() {
    gameState = 'over';
    pauseButton.disabled = true;
    const isNewBest = score > bestScore;

    if (isNewBest) {
        bestScore = score;
        bestScoreElement.textContent = `${bestScore}m`;
        saveBestScore(bestScore);
    }

    overlayKicker.textContent = isNewBest ? 'New best' : 'You slipped';
    overlayTitle.innerHTML = `${score}m high.<br>Not bad.`;
    overlayCopy.textContent = 'The wall is still there. Fortunately, so is the restart button.';
    startButton.innerHTML = 'Climb again <span aria-hidden="true">↗</span>';
    overlay.classList.remove('is-hidden');
    gameStatus.textContent = `Game over. You climbed ${score} meters.`;
}

function togglePause() {
    if (gameState === 'running') {
        gameState = 'paused';
        pauseButton.textContent = 'Resume';
        overlayKicker.textContent = 'Paused';
        overlayTitle.innerHTML = 'Catch your<br>breath.';
        overlayCopy.textContent = 'The mountain promises not to move. Probably.';
        startButton.innerHTML = 'Resume <span aria-hidden="true">↗</span>';
        overlay.classList.remove('is-hidden');
        gameStatus.textContent = 'Game paused.';
    } else if (gameState === 'paused') {
        gameState = 'running';
        pauseButton.textContent = 'Pause';
        overlay.classList.add('is-hidden');
        gameStatus.textContent = 'Game resumed.';
        canvas.focus();
    }
}

function updateScore(nextScore) {
    score = Math.max(score, nextScore);
    scoreElement.textContent = `${score}m`;
}

function createLandingParticles(platform) {
    for (let index = 0; index < 8; index += 1) {
        particles.push({
            x: player.x + player.width / 2,
            y: platform.y,
            vx: randomBetween(-2.6, 2.6),
            vy: randomBetween(-3.2, -1),
            life: 1
        });
    }
}

function updateGame(deltaScale) {
    if (input.left) player.vx -= MOVE_FORCE * deltaScale;
    if (input.right) player.vx += MOVE_FORCE * deltaScale;
    if (!input.left && !input.right) player.vx *= Math.pow(.86, deltaScale);

    player.vx = clamp(player.vx, -MAX_SPEED, MAX_SPEED);
    player.x += player.vx * deltaScale;

    if (player.x < -player.width * .35) player.x = GAME_WIDTH - player.width * .65;
    if (player.x > GAME_WIDTH - player.width * .65) player.x = -player.width * .35;

    const previousBottom = player.y + player.height;
    player.vy = Math.min(player.vy + GRAVITY * deltaScale, 15);
    player.y += player.vy * deltaScale;

    if (player.vy > 0) {
        const currentBottom = player.y + player.height;
        for (const platform of platforms) {
            const horizontalOverlap = player.x + player.width * .78 > platform.x
                && player.x + player.width * .22 < platform.x + platform.width;
            const crossedPlatform = previousBottom <= platform.y && currentBottom >= platform.y;

            if (horizontalOverlap && crossedPlatform) {
                player.y = platform.y - player.height;
                player.vy = -JUMP_FORCE;
                createLandingParticles(platform);
                break;
            }
        }
    }

    const cameraTarget = player.y - GAME_HEIGHT * .38;
    if (cameraTarget < cameraY) {
        cameraY += (cameraTarget - cameraY) * .09 * deltaScale;
    }

    updateScore(Math.max(0, Math.floor((startingY - player.y) / 10)));

    while (highestPlatformY > cameraY - 360) addPlatform();
    platforms = platforms.filter((platform) => platform.y - cameraY < GAME_HEIGHT + 180);

    particles.forEach((particle) => {
        particle.x += particle.vx * deltaScale;
        particle.y += particle.vy * deltaScale;
        particle.vy += .16 * deltaScale;
        particle.life -= .035 * deltaScale;
    });
    particles = particles.filter((particle) => particle.life > 0);

    if (player.y - cameraY > GAME_HEIGHT + 90) endGame();
}

function roundedRectangle(x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
}

function drawBackground() {
    const gradient = context.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#d8d4ff');
    gradient.addColorStop(.48, '#e5e4df');
    gradient.addColorStop(1, '#c9cac4');
    context.fillStyle = gradient;
    context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    context.save();
    context.globalAlpha = .16;
    context.strokeStyle = '#38383b';
    context.lineWidth = 1;
    const gridOffset = ((-cameraY * .18) % 56 + 56) % 56;
    for (let y = gridOffset; y < GAME_HEIGHT; y += 56) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(GAME_WIDTH, y);
        context.stroke();
    }
    for (let x = 0; x < GAME_WIDTH; x += 56) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, GAME_HEIGHT);
        context.stroke();
    }
    context.restore();

    context.save();
    context.globalAlpha = .13;
    context.fillStyle = '#5e5b72';
    context.beginPath();
    context.moveTo(0, GAME_HEIGHT);
    context.lineTo(0, 450);
    context.lineTo(125, 310);
    context.lineTo(255, 530);
    context.lineTo(370, 365);
    context.lineTo(515, 535);
    context.lineTo(650, 330);
    context.lineTo(GAME_WIDTH, 430);
    context.lineTo(GAME_WIDTH, GAME_HEIGHT);
    context.closePath();
    context.fill();
    context.restore();
}

function drawRoute() {
    const visiblePlatforms = platforms
        .filter((platform) => platform.y - cameraY > -80 && platform.y - cameraY < GAME_HEIGHT + 80)
        .sort((first, second) => second.y - first.y);

    context.save();
    context.strokeStyle = 'rgba(50, 49, 57, .16)';
    context.lineWidth = 2;
    context.setLineDash([6, 10]);
    context.beginPath();
    visiblePlatforms.forEach((platform, index) => {
        const x = platform.x + platform.width / 2;
        const y = platform.y - cameraY + platform.height / 2;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
    });
    context.stroke();
    context.restore();
}

function drawPlatforms() {
    const colors = ['#171719', '#5266f5', '#8f7be8'];

    platforms.forEach((platform) => {
        const screenY = platform.y - cameraY;
        if (screenY < -30 || screenY > GAME_HEIGHT + 30) return;

        context.save();
        context.shadowColor = 'rgba(25, 25, 28, .18)';
        context.shadowBlur = 16;
        context.shadowOffsetY = 7;
        roundedRectangle(platform.x, screenY, platform.width, platform.height, platform.height / 2);
        context.fillStyle = colors[platform.tone];
        context.fill();

        context.shadowColor = 'transparent';
        context.globalAlpha = .35;
        roundedRectangle(platform.x + 7, screenY + 3, Math.max(14, platform.width * .32), 2, 1);
        context.fillStyle = '#fff';
        context.fill();
        context.restore();
    });
}

function drawPlayer() {
    const screenY = player.y - cameraY;
    const centerX = player.x + player.width / 2;

    context.save();
    context.translate(centerX, screenY + player.height / 2);
    context.rotate(clamp(player.vx * .035, -.18, .18));

    context.strokeStyle = '#171719';
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(-5, 10);
    context.lineTo(-13, 23);
    context.moveTo(5, 10);
    context.lineTo(14, 22);
    context.moveTo(-7, -4);
    context.lineTo(-15, 7);
    context.moveTo(7, -4);
    context.lineTo(16, 5);
    context.stroke();

    context.fillStyle = '#5266f5';
    roundedRectangle(-11, -9, 22, 27, 8);
    context.fill();

    context.beginPath();
    context.arc(0, -17, 10, 0, Math.PI * 2);
    context.fillStyle = '#f0bd8f';
    context.fill();

    context.beginPath();
    context.arc(0, -20, 10, Math.PI, Math.PI * 2);
    context.fillStyle = '#171719';
    context.fill();

    context.fillStyle = '#c9bdfc';
    roundedRectangle(7, -5, 8, 20, 4);
    context.fill();
    context.restore();
}

function drawParticles() {
    particles.forEach((particle) => {
        context.save();
        context.globalAlpha = particle.life;
        context.fillStyle = '#fff';
        context.beginPath();
        context.arc(particle.x, particle.y - cameraY, 3, 0, Math.PI * 2);
        context.fill();
        context.restore();
    });
}

function drawGame() {
    drawBackground();
    drawRoute();
    drawPlatforms();
    drawParticles();
    drawPlayer();
}

function gameLoop(timestamp) {
    const elapsed = lastTime ? timestamp - lastTime : 16.67;
    lastTime = timestamp;
    const deltaScale = Math.min(elapsed / 16.67, 2);

    if (gameState === 'running') updateGame(deltaScale);
    drawGame();
    requestAnimationFrame(gameLoop);
}

function setDirection(direction, isPressed) {
    input[direction] = isPressed;
    const button = document.querySelector(`[data-direction="${direction}"]`);
    button?.classList.toggle('is-pressed', isPressed);
}

function handleKey(event, isPressed) {
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'a', 'd', ' ', 'p'].includes(key)) event.preventDefault();

    if (key === 'arrowleft' || key === 'a') setDirection('left', isPressed);
    if (key === 'arrowright' || key === 'd') setDirection('right', isPressed);

    if (!isPressed && (key === 'p' || key === 'escape') && ['running', 'paused'].includes(gameState)) {
        togglePause();
    }

    if (!isPressed && (key === ' ' || key === 'enter')) {
        if (gameState === 'ready' || gameState === 'over') startGame();
        else if (gameState === 'paused') togglePause();
    }
}

document.addEventListener('keydown', (event) => handleKey(event, true));
document.addEventListener('keyup', (event) => handleKey(event, false));

touchButtons.forEach((button) => {
    const direction = button.dataset.direction;
    button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        setDirection(direction, true);
    });
    button.addEventListener('pointerup', () => setDirection(direction, false));
    button.addEventListener('pointercancel', () => setDirection(direction, false));
});

window.addEventListener('pointerup', () => {
    setDirection('left', false);
    setDirection('right', false);
});

startButton.addEventListener('click', () => {
    if (gameState === 'paused') togglePause();
    else startGame();
});

pauseButton.addEventListener('click', togglePause);

document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState === 'running') togglePause();
});

resetGame();
player.vy = 0;
drawGame();
requestAnimationFrame(gameLoop);
