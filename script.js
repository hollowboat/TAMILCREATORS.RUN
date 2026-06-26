// ===============================
// TAMIL CREATOR RUNNER
// game.js (Part 1)
// ===============================

// ---------- IMAGES ----------
const player = document.getElementById("player");
const obstacleContainer = document.getElementById("obstacleContainer");

const bg1 = document.getElementById("background1");
const bg2 = document.getElementById("background2");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOver");

const scoreText = document.getElementById("score");
const speedText = document.getElementById("speed");
const finalScore = document.getElementById("finalScore");

const bgMusic = document.getElementById("bgMusic");
const voice = document.getElementById("characterVoice");

// -----------------------------

const creators = [

"goofy",
"cmsir",
"pcdoc",
"asro",
"kablian",
"stalin",
"d7trixx",
"rajini"

];

const obstacles = [

"washingmachine",
"printer",
"dustbin",
"plasticchair",
"gascylinder"

];

// -----------------------------

let currentCharacter = 0;

let score = 0;

let speed = 1;

let running = false;

let jumping = false;

let velocity = 0;

let playerY = 0;

const gravity = 1.1;

const jumpPower = -22;

let obstacleList = [];

let backgroundX = 0;

let spawnTimer = 0;

// ===============================

function unlockAudio(){

    bgMusic.volume = 0.45;

    bgMusic.play();

    bgMusic.pause();

    bgMusic.currentTime = 0;

}

document.addEventListener("click",unlockAudio,{once:true});
document.addEventListener("keydown",unlockAudio,{once:true});

// ===============================

function startGame(){

    if(running) return;

    startScreen.classList.add("hidden");

    gameOverScreen.classList.add("hidden");

    running = true;

    score = 0;

    speed = 1;

    obstacleList = [];

    obstacleContainer.innerHTML = "";

    bgMusic.currentTime = 0;

    bgMusic.play();

    requestAnimationFrame(loop);

}

// ===============================

function jump(){

    if(jumping) return;

    jumping = true;

    velocity = jumpPower;

    player.src =
    "images/" +
    creators[currentCharacter] +
    "jumping.png";

}

// ===============================

function spawnObstacle(){

    const img = document.createElement("img");

    const name =
    obstacles[
    Math.floor(Math.random()*obstacles.length)
    ];

    img.src =
    "images/" +
    name +
    ".png";

    img.className = "obstacle";

    img.style.right = "-200px";

    img.style.width = "120px";

    obstacleContainer.appendChild(img);

    obstacleList.push(img);

}

// ===============================

function updatePlayer(){

    if(!jumping) return;

    velocity += gravity;

    playerY += velocity;

    if(playerY >= 0){

        playerY = 0;

        jumping = false;

        player.src =
        "images/" +
        creators[currentCharacter] +
        "standing.png";

    }

    player.style.bottom =
    (120-playerY) + "px";

}

// ===============================

function updateBackground(){

    backgroundX += speed*6;

    bg1.style.transform =
    `translateX(${-backgroundX}px)`;

    bg2.style.transform =
    `translateX(${window.innerWidth-backgroundX}px)`;

    if(backgroundX >= window.innerWidth){

        backgroundX = 0;

    }

}

// ===============================

function updateObstacles(){

    for(let i=obstacleList.length-1;i>=0;i--){

        let obs = obstacleList[i];

        let x =
        parseFloat(obs.dataset.x || window.innerWidth);

        x -= speed*8;

        obs.dataset.x = x;

        obs.style.left = x + "px";

        if(x<-200){

            obs.remove();

            obstacleList.splice(i,1);

            score++;

            speed = Math.min(
                15,
                1 + score*0.1
            );

        }

        collision(obs);

    }

}

// ===============================

function collision(obs){

    const p = player.getBoundingClientRect();

    const o = obs.getBoundingClientRect();

    if(

        p.left < o.right &&
        p.right > o.left &&
        p.top < o.bottom &&
        p.bottom > o.top

    ){

        gameOver();

    }

}

// ===============================

function gameOver(){

    running = false;

    bgMusic.pause();

    voice.src =
    "sounds/" +
    creators[currentCharacter] +
    ".mp3";

    voice.play();

    finalScore.innerHTML =
    "Score : " + score;

    gameOverScreen.classList.remove("hidden");

}

// ===============================

function loop(){

    if(!running) return;

    scoreText.innerHTML =
    "Score : " + score;

    speedText.innerHTML =
    "Speed : " +
    speed.toFixed(1) +
    "x";

    updateBackground();

    updatePlayer();

    updateObstacles();

    spawnTimer++;

    if(spawnTimer>90){

        spawnTimer=0;

        spawnObstacle();

    }

    requestAnimationFrame(loop);

}

// ===============================

window.addEventListener("keydown",(e)=>{

    if(e.code==="Space"){

        if(!running){

            startGame();

        }else{

            jump();

        }

    }

});

window.addEventListener("mousedown",()=>{

    if(!running){

        startGame();

    }else{

        jump();

    }

});

// ===============================

document
.getElementById("restartBtn")
.onclick=()=>{

    startGame();

};