// Game Configuration & Asset Maps
const CREATORS = [
    { id: 'goofy', name: 'Goofy', cost: 30 },
    { id: 'cmsir', name: 'CMSir', cost: 30 },
    { id: 'pcdoc', name: 'PCDoc', cost: 30 },
    { id: 'asro', name: 'Asro', cost: 30 },
    { id: 'kablian', name: 'Kablian', cost: 30 },
    { id: 'stalin', name: 'Stalin', cost: 30 },
    { id: 'd7trixx', name: 'D7Trixx', cost: 30 },
    { id: 'rajini', name: 'Rajini', cost: 30 }
];

const OBSTACLE_TYPES = [
    { id: 'washingmachine', width: 55, height: 65 },
    { id: 'printer', width: 50, height: 45 },
    { id: 'dustbin', width: 40, height: 60 },
    { id: 'plasticchair', width: 40, height: 50 },
    { id: 'gascylinder', width: 35, height: 60 }
];

// Persistent State Variables
let gameState = {
    coins: 0,
    bestScore: 0,
    unlocked: ['goofy'], 
    selected: 'goofy',
    isFirstLaunch: true
};

// Runtime Mechanics Engine
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let animationFrameId;
let spawnTimerId; // Fixes overlapping background spawn tracking loops
let isPlaying = false;

let score = 0;
let coinsEarnedThisRun = 0;
let currentSpeedMultiplier = 1;
let baseSpeed = 5;

// Entity Mechanics Space Sizing States
let player = { x: 80, y: 300, width: 50, height: 80, vy: 0, gravity: 0.6, jumpForce: -13, isJumping: false };
let obstacles = [];
let bgX = 0;
let currentCarouselIndex = 0;

// Preloading Image Pools targeting specific 'images/' path
const images = {};
function preloadAssets() {

    images.background = new Image();
    images.background.src = "images/background.png";

    OBSTACLE_TYPES.forEach(obs => {

        images[obs.id] = new Image();
        images[obs.id].src = `images/${obs.id}.png`;

    });

    CREATORS.forEach(c => {

        images[`${c.id}_standing`] = new Image();
        images[`${c.id}_standing`].src = `images/${c.id}standing.png`;

        images[`${c.id}_jumping`] = new Image();
        images[`${c.id}_jumping`].src = `images/${c.id}jumping.png`;

    });

}

// LocalStorage Persistence
function loadGameData() {
    const saved = localStorage.getItem('tamil_creator_runner_save');
    if (saved) {
        gameState = JSON.parse(saved);
    }
    updateHUD();
}

function saveGameData() {
    localStorage.setItem('tamil_creator_runner_save', JSON.stringify(gameState));
}

// Initialization Lifecycle Hook
window.onload = () => {
    preloadAssets();
    loadGameData();
    
    // First launch rules condition logic sequence configuration tracker
    if (gameState.isFirstLaunch) {
        gameState.unlocked = CREATORS.map(c => c.id); 
    }
    renderCarousel();
};

// Carousel Menu Render Setup
function renderCarousel() {
    const track = document.getElementById('carousel-track');
    if (!track) return;
    track.innerHTML = '';
    
    CREATORS.forEach((c, index) => {
        const isUnlocked = gameState.isFirstLaunch || gameState.unlocked.includes(c.id);
        const isActive = index === currentCarouselIndex;
        const card = document.createElement('div');
        card.className = `character-card ${isActive ? 'active' : ''}`;
        
        card.innerHTML = `
            <img src="images/${c.id}standing.png" alt="${c.name}">
            <div class="name">${c.name}</div>
            <div class="status">${isUnlocked ? (gameState.selected === c.id && !gameState.isFirstLaunch ? 'Selected' : 'Available') : `🔒 ${c.cost} Coins`}</div>
        `;
        track.appendChild(card);
    });
    
    track.style.transform = `translateX(-${currentCarouselIndex * 170}px)`;
    
    const activeChar = CREATORS[currentCarouselIndex];
    const confirmBtn = document.getElementById('select-confirm-btn');
    
    if (gameState.isFirstLaunch || gameState.unlocked.includes(activeChar.id)) {
        confirmBtn.innerText = gameState.isFirstLaunch ? "Claim Free Character & Run" : "Select & Run";
        confirmBtn.style.background = "#00ffcc";
    } else {
        confirmBtn.innerText = `Unlock for ${activeChar.cost} Coins`;
        confirmBtn.style.background = "#ffcc00";
    }
}

function moveCarousel(direction) {
    currentCarouselIndex = (currentCarouselIndex + direction + CREATORS.length) % CREATORS.length;
    renderCarousel();
}

function confirmSelection() {
    const selectedChar = CREATORS[currentCarouselIndex];
    
    if (gameState.isFirstLaunch) {
        gameState.unlocked = [selectedChar.id];
        gameState.selected = selectedChar.id;
        gameState.isFirstLaunch = false;
        saveGameData();
        startGame();
    } else if (gameState.unlocked.includes(selectedChar.id)) {
        gameState.selected = selectedChar.id;
        saveGameData();
        startGame();
    } else {
        if (gameState.coins >= selectedChar.cost) {
            gameState.coins -= selectedChar.cost;
            gameState.unlocked.push(selectedChar.id);
            gameState.selected = selectedChar.id;
            saveGameData();
            renderCarousel();
            updateHUD();
        } else {
            alert("Not enough coins!");
        }
    }
}

// Core Runtime Activation Gameplay Rules Loop
function startGame() {
    // Clear any lingering asynchronous timeout loops cleanly
    clearTimeout(spawnTimerId);

    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    score = 0;
    coinsEarnedThisRun = 0;
    currentSpeedMultiplier = 1;
    obstacles = [];
    player.y = 300;
    player.vy = 0;
    player.isJumping = false;
    isPlaying = true;
    
    updateHUD();
    spawnObstacle();
    
    // Explicit Window Target binding rules logic
    window.addEventListener('keydown', handleInput);
    window.addEventListener('touchstart', handleInput);
    
    gameLoop();
}

function handleInput(e) {
    if ((e.code === 'Space' || e.type === 'touchstart') && !player.isJumping) {
        player.vy = player.jumpForce;
        player.isJumping = true;
    }
}

function spawnObstacle() {
    if (!isPlaying) return;
    const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    obstacles.push({
        x: canvas.width + 100,
        y: 380 - type.height, 
        width: type.width,
        height: type.height,
        id: type.id,
        passed: false
    });
    
    let nextSpawnTime = Math.random() * 1500 + 1000 / currentSpeedMultiplier;
    spawnTimerId = setTimeout(spawnObstacle, nextSpawnTime);
}

function gameLoop() {
    if (!isPlaying) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let currentSpeed = baseSpeed * currentSpeedMultiplier;

    // Background Render Scrolling Loop
    bgX -= currentSpeed * 0.5; 
    if (bgX <= -canvas.width) bgX = 0;
    if (images['background']) {
        ctx.drawImage(images['background'], bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(images['background'], bgX + canvas.width, 0, canvas.width, canvas.height);
    }

    // Physics Engine Forces Logic Calculations
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y >= 300) {
        player.y = 300;
        player.vy = 0;
        player.isJumping = false;
    }

    let activePlayerSprite = player.isJumping ? `${gameState.selected}_jumping` : `${gameState.selected}_standing`;
    if (images[activePlayerSprite]) {
        ctx.drawImage(images[activePlayerSprite], player.x, player.y, player.width, player.height);
    }

    // Render & Move Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= currentSpeed;

        if (images[obs.id]) {
            ctx.drawImage(images[obs.id], obs.x, obs.y, obs.width, obs.height);
        }

        // Inner Padding Box Safe Collision Detection Rules Check 
        if (
            player.x + 10 < obs.x + obs.width &&
            player.x + player.width - 10 > obs.x &&
            player.y + 10 < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            handleGameOver();
            return;
        }

        // Successful Clearing Avoidance Logic Score Increments 
        if (obs.x + obs.width < player.x && !obs.passed) {
            obs.passed = true;
            score++;
            coinsEarnedThisRun++;
            gameState.coins += 1; 
            adjustDifficulty();
            updateHUD();
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

function adjustDifficulty() {
    if (score >= 200) currentSpeedMultiplier = 15;
    else if (score >= 100) currentSpeedMultiplier = 12;
    else if (score >= 50) currentSpeedMultiplier = 6;
    else currentSpeedMultiplier = 1 + (score * 0.1);
}

function updateHUD() {
    document.getElementById('score-val').innerText = score;
    document.getElementById('speed-val').innerText = `${currentSpeedMultiplier.toFixed(1)}x`;
    document.getElementById('coins-val').innerText = gameState.coins;
    document.getElementById('best-val').innerText = gameState.bestScore;
}

function handleGameOver() {
    isPlaying = false;
    cancelAnimationFrame(animationFrameId);
    clearTimeout(spawnTimerId);
    
    // Clean Input Listeners Leaks
    window.removeEventListener('keydown', handleInput);
    window.removeEventListener('touchstart', handleInput);

    let failAudio = new Audio(`${gameState.selected}.mp3`);
    failAudio.play().catch(e => console.log("Audio play blocked until interaction or missing"));

    if (score > gameState.bestScore) {
        gameState.bestScore = score;
    }
    saveGameData();

    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
    document.getElementById('final-coins').innerText = coinsEarnedThisRun;
}

function restartGame() {
    startGame();
}

function showCharacterSelection() {
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('selection-screen').classList.remove('hidden');
    renderCarousel();
}
