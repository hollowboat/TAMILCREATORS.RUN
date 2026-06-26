```javascript
/*=========================================
    TAMIL CREATOR RUNNER
    CONSTANTS.JS
==========================================*/


/*=========================================
    CHARACTERS
==========================================*/

const CHARACTERS = [

{
    id:0,
    name:"Goofy",

    standing:"images/goofyStanding.png",
    jumping:"images/goofyJumping.png",

    voice:"sounds/goofy.mp3"
},

{
    id:1,
    name:"CMSir",

    standing:"images/cmsirStanding.png",
    jumping:"images/cmsirJumping.png",

    voice:"sounds/cmsir.mp3"
},

{
    id:2,
    name:"PCDoc",

    standing:"images/pcdocStanding.png",
    jumping:"images/pcdocJumping.png",

    voice:"sounds/pcdoc.mp3"
},

{
    id:3,
    name:"Asro",

    standing:"images/asroStanding.png",
    jumping:"images/asroJumping.png",

    voice:"sounds/asro.mp3"
},

{
    id:4,
    name:"Kablian",

    standing:"images/kablianStanding.png",
    jumping:"images/kablianJumping.png",

    voice:"sounds/kablian.mp3"
},

{
    id:5,
    name:"Stalin",

    standing:"images/stalinStanding.png",
    jumping:"images/stalinJumping.png",

    voice:"sounds/stalin.mp3"
},

{
    id:6,
    name:"D7Trixx",

    standing:"images/d7trixxStanding.png",
    jumping:"images/d7trixxJumping.png",

    voice:"sounds/d7trixx.mp3"
},

{
    id:7,
    name:"Rajini",

    standing:"images/rajiniStanding.png",
    jumping:"images/rajiniJumping.png",

    voice:"sounds/rajini.mp3"
}

];


/*=========================================
    OBSTACLES
==========================================*/

const OBSTACLES=[

{
    name:"Plastic Chair",

    image:"images/plasticchair.png",

    width:130,
    height:130
},

{
    name:"Printer",

    image:"images/printer.png",

    width:145,
    height:110
},

{
    name:"Dustbin",

    image:"images/dustbin.png",

    width:110,
    height:120
},

{
    name:"Gas Cylinder",

    image:"images/gascylinder.png",

    width:90,
    height:135
},

{
    name:"Washing Machine",

    image:"images/washingmachine.png",

    width:155,
    height:165
}

];


/*=========================================
    GAME SETTINGS
==========================================*/

const PLAYER_X = 180;

const PLAYER_WIDTH = 180;

const GROUND_HEIGHT = 130;

const GRAVITY = 1.15;

const JUMP_FORCE = -22;


/*=========================================
    SPEED
==========================================*/

const START_SPEED = 1;

const MAX_SPEED = 15;


/*
0 = 1x

50 = 6x

100 = 12x

200 = 15x
*/

function getSpeed(score){

    if(score<=50){

        return 1 + score*0.10;

    }

    if(score<=100){

        return 6 + ((score-50)*0.12);

    }

    if(score<=200){

        return 12 + ((score-100)*0.03);

    }

    return 15;

}


/*=========================================
    SHOP
==========================================*/

const FIRST_CHARACTER_FREE=true;

const CHARACTER_COST=30;


/*=========================================
    AUDIO
==========================================*/

const BACKGROUND_MUSIC="sounds/background.mp3";

const MUSIC_VOLUME=0.45;

const VOICE_VOLUME=1.0;


/*=========================================
    STORAGE KEYS
==========================================*/

const SAVE_KEY="TamilCreatorRunner";

const COIN_KEY="Coins";

const BEST_KEY="BestScore";

const CHARACTER_KEY="CurrentCharacter";

const OWNED_KEY="OwnedCharacters";

const FIRST_TIME_KEY="FirstLaunch";


/*=========================================
    GAME VARIABLES
==========================================*/

let score=0;

let coins=0;

let bestScore=0;

let gameSpeed=1;

let gameRunning=false;

let currentCharacter=0;

let ownedCharacters=[];

let playerVelocity=0;

let playerY=0;

let obstacles=[];


/*=========================================
    AUDIO OBJECTS
==========================================*/

const bgMusic=document.getElementById("bgMusic");

const characterVoice=document.getElementById("characterVoice");


bgMusic.src=BACKGROUND_MUSIC;

bgMusic.loop=true;

bgMusic.volume=MUSIC_VOLUME;


/*=========================================
    AUDIO FUNCTIONS
==========================================*/


function playBackgroundMusic(){

    bgMusic.play().catch(()=>{});

}


function stopBackgroundMusic(){

    bgMusic.pause();

}


function playCharacterVoice(){

    characterVoice.pause();

    characterVoice.currentTime=0;

    characterVoice.src=CHARACTERS[currentCharacter].voice;

    characterVoice.volume=VOICE_VOLUME;

    characterVoice.play().catch(()=>{});

}


/*=========================================
    RANDOM OBSTACLE
==========================================*/

function randomObstacle(){

    return structuredClone(

        OBSTACLES[
            Math.floor(
                Math.random()*OBSTACLES.length
            )
        ]

    );

}
```
