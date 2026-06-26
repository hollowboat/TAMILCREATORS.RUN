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

// Obstacle profiles: Scaled up Plastic Chair, Printer, and Gas Cylinder to 85px width/height
const OBSTACLE_TYPES = [
    { id: 'washingmachine', width: 65, height: 65 },
    { id: 'printer', width: 85, height: 85 }, 
    { id: 'dustbin', width: 65, height: 65 },
    { id: 'plasticchair', width: 85, height: 85 }, 
    { id: 'gascylinder', width: 85, height: 85 }   
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
let spawnTimerId; 
let isPlaying = false;

let score = 0;
let coinsEarnedThisRun = 0;
let currentSpeedMultiplier = 1;

// Baseline physics velocity setting for a smooth entry pace
let baseSpeed = 2.5; 

// UPDATED PHYSICS ENGINE: Ultra-floaty gravity and adjusted jumpForce for maximum height and ~1.3s airtime
let player = { 
    x: 80, 
    y: 270, 
    width: 65, 
    height: 110, 
    vy: 0, 
    gravity: 0.18,       // Significantly lowered from 0.3 for a slow-motion descent
    jumpForce: -7.2,     // Tuned down alongside gravity to float high and stay airborne longer
    isJumping: false 
};

let obstacles = [];
let bgX = 0;
let currentCarouselIndex = 0;

// Audio Managers
let bgMusic = new Audio('sounds/background.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5; // Locked strictly to a maximum ceiling of 50% capacity volume

// Preloading Image Pools
const images = {};
function preloadAssets() {
    images['background'] = new Image(); images['background'].src = 'images/background.png';
    OBSTACLE_TYPES.forEach(obs => {
        images[obs.id] = new Image(); images[obs.id].src = `images/${obs.id}.png`;
    });
    CREATORS.forEach(c => {
        images[`${c.id}_standing`] = new Image(); images[`${c.id}_standing`].src = `images/${c.id}standing.png`;
        images[`${c.id}_jumping`] = new Image(); images[`${c.id}_jumping`].src = `images/${c.id}jumping.png`;
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
    
    if (gameState.isFirstLaunch) {
        gameState.unlocked = CREATORS.map(c => c.id); 
    }
    renderCarousel();
};

// Carousel Menu Setup
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

// Carousel controls
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

// Gameplay Loop Activation
function startGame() {
    clearTimeout(spawnTimerId);

    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    score = 0;
    coinsEarnedThisRun = 0;
    currentSpeedMultiplier = 1;
    obstacles = [];
    player.y = 270; 
    player.vy = 0;
    player.isJumping = false;
    isPlaying = true;
    
    updateHUD();
    spawnObstacle();
    
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log("Audio waiting for user gesture context initialization step"));

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
    
    // Generously expanded spawn intervals to give the player plenty of structural room for the long high jump
    let nextSpawnTime = Math.random() * 2400 + (1900 / currentSpeedMultiplier);
    spawnTimerId = setTimeout(spawnObstacle, nextSpawnTime);
}

function gameLoop() {
    if (!isPlaying) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let currentSpeed = baseSpeed * currentSpeedMultiplier;

    // Scrolling background logic layers
    bgX -= currentSpeed * 0.5; 
    if (bgX <= -canvas.width) bgX = 0;
    if (images['background']) {
        ctx.drawImage(images['background'], bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(images['background'], bgX + canvas.width, 0, canvas.width, canvas.height);
    }

    // Gravity loop processes
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y >= 270) {
        player.y = 270;
        player.vy = 0;
        player.isJumping = false;
    }

    let activePlayerSprite = player.isJumping ? `${gameState.selected}_jumping` : `${gameState.selected}_standing`;
    if (images[activePlayerSprite]) {
        ctx.drawImage(images[activePlayerSprite], player.x, player.y, player.width, player.height);
    }

    // Render & Process Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= currentSpeed;

        if (images[obs.id]) {
            ctx.drawImage(images[obs.id], obs.x, obs.y, obs.width, obs.height);
        }

        // Inner frame hit padding boxes check
        if (
            player.x + 12 < obs.x + obs.width &&
            player.x + player.width - 12 > obs.x &&
            player.y + 10 < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            handleGameOver();
            return;
        }

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

// Fixed Speed Math Logic Curve System
function adjustDifficulty() {
    if (score >= 200) {
        currentSpeedMultiplier = 10; 
    } else if (score >= 100) {
        currentSpeedMultiplier = 6 + ((score - 100) * (4 / 100));
    } else if (score >= 50) {
        currentSpeedMultiplier = 3 + ((score - 50) * (3 / 50));
    } else {
        currentSpeedMultiplier = 1 + (score * (2 / 50));
    }
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
    
    bgMusic.pause();

    window.removeEventListener('keydown', handleInput);
    window.removeEventListener('touchstart', handleInput);

    let failAudio = new Audio(`sounds/${gameState.selected}.mp3`);
    failAudio.play().catch(e => console.log("Fail sound tracking missing or browser block execution context"));

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