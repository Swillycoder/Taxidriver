const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d');

canvas.width = 900;
canvas.height = 500;

canvas2.width = 150
canvas2.height = 500

const introMusic = new Audio('audio/angela.mp3')
const music = new Audio('audio/chase.mp3');
const taxiDriver = new Audio('audio/talkin2.mp3');
const getOut = new Audio('audio/getout.mp3');

const crashSounds = [
new Audio('audio/001.mp3'),
new Audio('audio/002.mp3'),
new Audio('audio/003.mp3'),
new Audio('audio/004.mp3'),
new Audio('audio/005.mp3'),
new Audio('audio/006.mp3'),
]

music.volume = 0.3

const imageSources = [
    'http://localhost:8000/taxi50px.png',       //0
    'http://localhost:8000/building1.png',      //1
    'http://localhost:8000/intro.png',          //2
    'http://localhost:8000/fare_collect.png',   //3
    'http://localhost:8000/preintro.png',       //4
    'http://localhost:8000/outro.png',          //5
    'http://localhost:8000/car1.png',           //6
    'http://localhost:8000/car2.png',           //7
    'http://localhost:8000/car3.png',           //8
    'http://localhost:8000/car4.png',           //9
    'http://localhost:8000/car5.png',           //10
    'http://localhost:8000/car6.png',           //11
    ];
    
const images = [];
let imagesLoaded = 0;

imageSources.forEach((src, index) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        images[index] = img;
        checkAllImagesLoaded();
    };
    img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
    };
});
    
function checkAllImagesLoaded() {
    imagesLoaded += 1;
    if (imagesLoaded === imageSources.length) {
        preStart();
    }
}

function preStart () {
    ctx.drawImage(images[4],0,0);
    introMusic.play();
    if (keys.Space) gameStart();
        
}

function gameStart () {
    ctx.drawImage(images[2],0,0);
    if (keys.Enter) gameLoop();
}



class Taxi {
    constructor (x,y,radius,image) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = 3
        this.rotation = -Math.PI/2;
        this.turnSpeed = 0.05;
        this.image = image;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.rotation);
    
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.closePath();

        if (this.image) {
            const imgWidth = this.image.width;
            const imgHeight = this.image.height;
            ctx.drawImage(this.image, -imgWidth / 2, -imgHeight / 2);
        }
    
        ctx.restore();
    }

   boundaries(canvasWidth, canvasHeight) {

        if (this.x - this.radius < 0) {
            this.x = this.radius;
        }
        if (this.x + this.radius > canvasWidth) {
            this.x = canvasWidth - this.radius;
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
        }
        if (this.y + this.radius > canvasHeight) {
            this.y = canvasHeight - this.radius;
        }
    }

    checkFareCollision(fare) {
        const dx = this.x - fare.currentLocation.x;
        const dy = this.y - fare.currentLocation.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);
    
        if (distance < fare.radius + this.radius) {
            // Circle collected
            fare.handleCollection();
        }
    }

    checkNpcCollision(npcCars) {
        for (let npc of npcCars) {
            if (
                this.x + this.radius > npc.x &&
                this.x - this.radius < npc.x + npc.width &&
                this.y + this.radius > npc.y &&
                this.y - this.radius < npc.y + npc.height
            ) {
                // Collision detected
                const crash = {
                    x: this.x,
                    y: this.y,
                    sizeOuter: 50,
                    sizeInner: 25,
                    timestamp: Date.now(),
                };
                crashes.push(crash);
                playCrashSound();
                score -= 50
                npc.x = npc.originalX;
                npc.y = npc.originalY;
            }
        }
    }

    update(buildings, canvasWidth, canvasHeight, fare) {
        // Rotation logic
        if (keys.KeyA) this.rotation -= this.turnSpeed;
        if (keys.KeyD) this.rotation += this.turnSpeed;
    
        // Forward and backward movement
        let dx = 0;
        let dy = 0;
    
        if (keys.KeyW) {
            dx = Math.cos(this.rotation) * this.speed;
            dy = Math.sin(this.rotation) * this.speed;
        }
        if (keys.KeyS) {
            dx = -Math.cos(this.rotation) * this.speed;
            dy = -Math.sin(this.rotation) * this.speed;
        }
    
        // Update position
        this.x += dx;
        this.y += dy;
        for (let building of buildings){

            const rectLeft = building.x;
            const rectRight = building.x + building.width;
            const rectTop = building.y;
            const rectBottom = building.y + building.height;
        
            // Check for collision and adjust position if necessary
            if (
                this.x + this.radius > rectLeft &&
                this.x - this.radius < rectRight &&
                this.y + this.radius > rectTop &&
                this.y - this.radius < rectBottom
            ) {
                // Repulsion logic
                if (this.x < rectLeft) {
                    this.x = rectLeft - this.radius;
                } else if (this.x > rectRight) {
                    this.x = rectRight + this.radius;
                }
                if (this.y < rectTop) {
                    this.y = rectTop - this.radius;
                } else if (this.y > rectBottom) {
                    this.y = rectBottom + this.radius;
                }
            }
        }

        this.checkFareCollision(fare);
        this.boundaries(canvasWidth, canvasHeight);
        this.draw();
    }
}

class Building {
    constructor (x,y,width, height, image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = image;
    }
    
    draw() {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            
        }
    }

    update() {
        this.draw();
    }
}

class Fare {
    constructor(image) {
        this.image = image
        this.locations = [
            { x: 50, y: 150 },
            { x: 850, y: 150 },
            { x: 50, y: 350 },
            { x: 850, y: 350 },
            { x: 450, y: 150 },
        ];

        this.currentLocation = this.getRandomLocation(this.locations);
        this.yellowState = true;
        this.greenState = false;
        this.radius = 30;
    }

    getRandomLocation(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    handleCollection() {
        if (this.yellowState) {
            this.yellowState = false;
            this.greenState = true;
            taxiDriver.play();
            
        } else if (this.greenState) {
            this.greenState = false;
            this.yellowState = true;
            getOut.play();
            score += 200
        }
        let newLocation;
        do {
            newLocation = this.getRandomLocation(this.locations);
        } while (newLocation.x === this.currentLocation.x && newLocation.y === this.currentLocation.y);

        this.currentLocation = newLocation;
    }

    draw() {
        if (this.yellowState) {
            ctx.drawImage(this.image, this.currentLocation.x -10, this.currentLocation.y - 20, 41, 60)
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.font = '18px Showcard Gothic'
            ctx.fillText('TAXI!!!', this.currentLocation.x - 27,this.currentLocation.y - 30);
            ctx.restore();
        } else if (this.greenState) {
            ctx.save();
            ctx.fillStyle = 'blue'
            ctx.beginPath();
            ctx.arc(this.currentLocation.x, this.currentLocation.y, this.radius, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.closePath();
            ctx.fillStyle = 'red'
            ctx.beginPath();
            ctx.arc(this.currentLocation.x, this.currentLocation.y, this.radius - 8, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.closePath();
            ctx.fillStyle = 'yellow'
            ctx.beginPath();
            ctx.arc(this.currentLocation.x, this.currentLocation.y, this.radius - 16, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.closePath();
            ctx.fillStyle = 'white';
            ctx.font = '18px Showcard Gothic'
            ctx.fillText('Deliver', this.currentLocation.x - 35,this.currentLocation.y - 25);
            ctx.restore();
        }
        
    }
}

class OtherCarsRight {
    constructor (x,y,image, speed) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 40;
        this.image = image
        this.speed = speed
        this.originalX = x;
        this.originalY = y;
    }
    draw () {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);

    }
    update() {
        this.x += this.speed
        if (this.x > canvas.width) {
            this.x = -80
        }
        this.draw();
    }
}

class OtherCarsLeft {
    constructor (x,y,image, speed) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 40;
        this.image = image
        this.speed = speed
        this.originalX = x;
        this.originalY = y;
    }
    draw () {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);

    }
    update() {
        this.x += this.speed
        if (this.x < -50) {
            this.x = canvas.width + 80
        }
        this.draw();
    }
}

const keys = {
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false,
    Enter: false,
    Space: false,
};

let crashes = []

const taxi = new Taxi(450,350,20, null);

const buildings = [
    new Building(100, 100, 100, 100, null),
    new Building(300, 100, 100, 100, null),
    new Building(500, 100, 100, 100,null),
    new Building(700, 100, 100, 100,null),
    new Building(100, 300, 100, 100,null),
    new Building(300, 300, 100, 100,null),
    new Building(500, 300, 100, 100,null),
    new Building(700, 300, 100, 100,null),
];

const fare = new Fare(null)

const npcCars = [
    new OtherCarsRight(-100,55, null, 1),
    new OtherCarsRight(-200,255, null,2),
    new OtherCarsRight(-320,455, null,1.5),
    new OtherCarsLeft(canvas.width + 250,5, null, -1),
    new OtherCarsLeft(canvas.width + 500,205, null,-2),
    new OtherCarsLeft(canvas.width + 300,405, null,-1.5)
    ];

function playCrashSound() {
    const randomIndex = Math.floor(Math.random() * crashSounds.length);
    const sound = crashSounds[randomIndex];
    sound.play();
}

function drawRoads () {
    ctx.save();
    ctx.setLineDash([10, 5]);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(canvas.width, 50);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 250);
    ctx.lineTo(canvas.width, 250);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 450);
    ctx.lineTo(canvas.width, 450);
    ctx.stroke();

    ctx.restore();
}

function drawCrash(ctx, x, y, outerRadius, innerRadius) {
    const points = 9;
    const angleStep = (Math.PI * 2) / points;
    const asymmetry = Math.random() * 0.3 + 0.85;
  
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius * asymmetry;
      const angle = i * angleStep;
  
      const xPoint = x + Math.cos(angle) * radius;
      const yPoint = y + Math.sin(angle) * radius;
  
      if (i === 0) {
        ctx.moveTo(xPoint, yPoint);
      } else {
        ctx.lineTo(xPoint, yPoint);
      }
    }
    ctx.closePath();
  
    ctx.fillStyle = "yellow";
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
}

let score = 0;
let countdownStart;
let countdownDuration = 60000;
let timeRemaining;

function startCountdown() {
        countdownStart = Date.now();
        timeRemaining = Math.ceil(countdownDuration / 1000);
  }

function updateCanvas2() {
    const now = Date.now();
    const elapsedTime = now - countdownStart;
    timeRemaining = Math.max(0, Math.ceil((countdownDuration - elapsedTime) / 1000));

    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    ctx2.fillStyle = 'black';
    ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
    ctx2.fillStyle = 'white';
    ctx2.fillRect(0,0, canvas.width, canvas.height/2)
  // Draw text
    ctx2.font = '50px Showcard Gothic';
    ctx2.fillStyle = 'red';
    ctx2.fillText(`${score}`, 20, 110);
    ctx2.fillText(`${timeRemaining}`, 40, 230);
    ctx2.font = '50px Showcard Gothic';
    ctx2.fillStyle = 'black';
    ctx2.fillText(`Score`, 3, 50);
    ctx2.fillText(`Time`, 17, 170);

    ctx2.font = '50px Showcard Gothic';
    ctx2.fillStyle = 'yellow';
    ctx2.fillText('NEW', 20, 340);
    ctx2.fillText('YORK', 5, 400);
    ctx2.fillText('TAXI', 18, 460);
}

let gameOver = true

function gameOverScreen () {
    gameOver = true;
    music.pause();
    introMusic.play();
    ctx.drawImage(images[5], 0, 0);
    taxi = null
}

function gameLoop () {
    if (!gameOver)
        introMusic.pause();
        taxi.image = images[0];
        buildings.forEach(building => building.image = images[1]);
        fare.image = images[3]
        npcCars[0].image = images[6]
        npcCars[1].image = images[7]
        npcCars[2].image = images[8]
        npcCars[3].image = images[9]
        npcCars[4].image = images[10]
        npcCars[5].image = images[11]

        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'darkslategrey'
        ctx.fillRect(0, 100, canvas.width, 100)
        ctx.fillRect(0, 300, canvas.width, 100)

        drawRoads();
        taxi.update(buildings, canvas.width, canvas.height, fare);
        buildings.forEach((building) => building.draw());
        fare.draw();

        for (let npc of npcCars) {
            npc.update();
        }
        taxi.checkNpcCollision(npcCars);
    
        const now = Date.now();
        crashes = crashes.filter(crash => {
            if (now - crash.timestamp < 1000) {
                drawCrash(ctx, crash.x, crash.y, crash.sizeOuter, crash.sizeInner);
                return true;
            }
            return false;
        });

        updateCanvas2();

        if (timeRemaining <= 0) {

            gameOver = true
            gameOverScreen();
        }

        requestAnimationFrame(gameLoop);
    }

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
    if (e.code === 'Enter' && gameOver) {
        introMusic.pause();
        music.play();
        gameLoop();
        startCountdown();
    }
    if (e.code === 'Space' && gameOver) {
        introMusic.play();
        gameStart();
    }
    if (e.code === 'KeyP' && gameOver) {
        location.reload()
        }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});
