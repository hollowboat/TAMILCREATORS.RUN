const CREATORS = [
    { id: 'goofy', name: 'Goofy', cost: 30 },
    { id: 'cmsir', name: 'CMSir', cost: 30 },
    { id: 'pcdoc', name: 'PCDoc', cost: 30 },
    { id: 'asro', name: 'Asro', cost: 30 },
    { id: 'kabilan', name: 'Kabilan', cost: 30 },
    { id: 'stalin', name: 'Stalin', cost: 30 },
    { id: 'd7trixx', name: 'D7trixx', cost: 30 },
    { id: 'rajini', name: 'Rajini', cost: 30 },
    { id: 'dhanush', name: 'Dhanush', cost: 30 },
    { id: 'groot', name: 'Groot', cost: 30 },
    { id: 'jishhthetics', name: 'Jishhthetics', cost: 30 }
];

const OBSTACLE_TYPES = [
    { id: 'washingmachine', width: 65, height: 65, paddingX: 6, paddingY: 4 },
    { id: 'printer', width: 85, height: 85, paddingX: 20, paddingY: 18 },       
    { id: 'dustbin', width: 65, height: 65, paddingX: 8, paddingY: 4 },
    { id: 'plasticchair', width: 85, height: 85, paddingX: 18, paddingY: 16 },  
    { id: 'gascylinder', width: 85, height: 85, paddingX: 22, paddingY: 12 }    
];

let gameState = {
    coins: 0,
    bestScore: 0,
    unlocked: ['goofy'], 
    selected: 'goofy',
    isFirstLaunch: true
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let animationFrameId;
let spawnTimerId; 
let isPlaying = false;
let isPaused = false;

let score = 0;
let coinsEarnedThisRun = 0;
let currentSpeedMultiplier = 1;

let baseSpeed = 4.0; 
const TARGET_GROUND_Y = 365; // FIXED GROUND MATRIX: Locks feet squarely to red carpet graphics base line

let player = { 
    x: 80, 
    y: TARGET_GROUND_Y - 110, 
    width: 65, 
    height: 110, 
    vy: 0, 
    gravity: 0.38,       
    jumpForce: -10.5,    
    isJumping: false 
};

let obstacles = [];
let bgX = 0;
let currentCarouselIndex = 0;

let bgMusic = new Audio('sounds/background.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;

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

window.onload = () => {
    preloadAssets();
    loadGameData();
    
    if (gameState.isFirstLaunch) {
        gameState.unlocked = CREATORS.map(c => c.id); 
    }
    renderCarousel();
};

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
    
    // DYNAMIC MATHEMATIC CENTERING CALCULATION: Centers items smoothly across both mobile or desktop width layouts
    const cards = track.getElementsByClassName('character-card');
    if (cards.length > 0) {
        const trackWidth = track.clientWidth;
        const cardWidth = cards[0].offsetWidth + (window.innerWidth <= 600 ? 12 : 20); // Syncs with CSS margin settings dynamically
        const centerOffset = (trackWidth / 2) - (cardWidth / 2);
        const targetTranslation = centerOffset - (currentCarouselIndex * cardWidth);
        
        track.style.transform = `translateX(${targetTranslation}px)`;
    }
    
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

function startGame() {
    clearTimeout(spawnTimerId);
    obstacles = [];

    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('pause-menu').classList.add('hidden');
    
    score = 0;
    coinsEarnedThisRun = 0;
    currentSpeedMultiplier = 1;
    
    player.y = TARGET_GROUND_Y - player.height; 
    player.vy = 0;
    player.isJumping = false;
    
    isPlaying = true;
    isPaused = false;
    
    updateHUD();
    
    spawnTimerId = setTimeout(spawnObstacle, 1500);
    
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log("Audio waiting for user gesture initialization"));

    window.addEventListener('keydown', handleInput);
    window.addEventListener('touchstart', handleInput, { passive: false });
    
    gameLoop();
}

function handleInput(e) {
    if (isPaused) return;
    if (e.type === 'touchstart') {
        if (e.target.id === 'pause-btn' || e.target.closest('#pause-menu')) return;
        e.preventDefault(); 
    }
    
    if ((e.code === 'Space' || e.type === 'touchstart') && !player.isJumping) {
        player.vy = player.jumpForce;
        player.isJumping = true;
    }
}

function togglePause() {
    if (!isPlaying) return;
    isPaused = !isPaused;
    const menu = document.getElementById('pause-menu');
    
    if (isPaused) {
        menu.classList.remove('hidden');
        bgMusic.pause();
        clearTimeout(spawnTimerId);
    } else {
        menu.classList.add('hidden');
        bgMusic.play().catch(e => {});
        let nextSpawnTime = Math.random() * 2000 + (1600 / currentSpeedMultiplier);
        spawnTimerId = setTimeout(spawnObstacle, nextSpawnTime);
        gameLoop();
    }
}

function changeBaseSpeed(val) {
    baseSpeed = parseFloat(val);
    document.getElementById('slider-val').innerText = baseSpeed.toFixed(1);
    updateHUD();
}

function spawnObstacle() {
    if (!isPlaying || isPaused) return;

    // 1. Check the last obstacle in the array to ensure fair spacing
    if (obstacles.length > 0) {
        const lastObstacle = obstacles[obstacles.length - 1];
        
        // Calculate a safe pixel gap proportional to how fast the game is moving
        // Higher speed requires a larger physical pixel gap on screen
        const currentSpeed = baseSpeed * currentSpeedMultiplier;
        const safeGap = player.width * 2.5 + (currentSpeed * 12); 
        
        // If the last obstacle hasn't cleared the safe gap distance yet, skip this spawn frame
        if (canvas.width + 100 - lastObstacle.x < safeGap) {
            // Re-check shortly in the next micro-timer frame
            spawnTimerId = setTimeout(spawnObstacle, 150);
            return;
        }
    }

    // 2. Standard spawning block if conditions are safe
    const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    obstacles.push({
        x: canvas.width + 100,
        y: TARGET_GROUND_Y - type.height, 
        width: type.width,
        height: type.height,
        id: type.id,
        paddingX: type.paddingX,
        paddingY: type.paddingY,
        passed: false
    });
    
    // 3. Scale the random delay component gracefully so it never reaches absolute zero
    let nextSpawnTime = Math.random() * 1500 + (2000 / (currentSpeedMultiplier * 0.75));
    spawnTimerId = setTimeout(spawnObstacle, nextSpawnTime);
}

function gameLoop() {
    if (!isPlaying || isPaused) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let currentSpeed = baseSpeed * currentSpeedMultiplier;

    // Scrolling background logic layers
    bgX -= currentSpeed * 0.5; 
    if (bgX <= -canvas.width) bgX = 0;
    if (images['background']) {
        ctx.drawImage(images['background'], bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(images['background'], bgX + canvas.width, 0, canvas.width, canvas.height);
    }

    // Gravity handling loops
    player.vy += player.gravity;
    player.y += player.vy;
    
    let floorLimit = TARGET_GROUND_Y - player.height;
    if (player.y >= floorLimit) {
        player.y = floorLimit;
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

        // TIGHT BOUNDBOX CHECK: Removes empty transparent bounds
        let playerHitboxLeft = player.x + 15;
        let playerHitboxRight = player.x + player.width - 15;
        let playerHitboxTop = player.y + 12;
        let playerHitboxBottom = player.y + player.height;

        let obsHitboxLeft = obs.x + obs.paddingX;
        let obsHitboxRight = obs.x + obs.width - obs.paddingX;
        let obsHitboxTop = obs.y + obs.paddingY;
        let obsHitboxBottom = obs.y + obs.height;

        if (
            playerHitboxLeft < obsHitboxRight &&
            playerHitboxRight > obsHitboxLeft &&
            playerHitboxTop < obsHitboxBottom &&
            playerHitboxBottom > obsHitboxTop
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

function adjustDifficulty() {
    if (score >= 500) currentSpeedMultiplier = 10; 
    else if (score >= 200) currentSpeedMultiplier = 5 + ((score - 100) * (4 / 100));
    else if (score >= 100) currentSpeedMultiplier = 3 + ((score - 50) * (3 / 50));
    else currentSpeedMultiplier = 1 + (score * (2 / 50));
}

function updateHUD() {
    document.getElementById('score-val').innerText = score;
    document.getElementById('speed-val').innerText = `${(currentSpeedMultiplier * baseSpeed / 4).toFixed(1)}x`;
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
    failAudio.play().catch(e => console.log("Fail sound missing"));

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
