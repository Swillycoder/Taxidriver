const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

const canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d');

const music = new Audio('audio/chase.mp3');
const taxiDriver = new Audio('audio/talkin2.mp3');
const getOut = new Audio('audio/getout.mp3');
music.load();
music.volume = 0.3;

const imageSources = [
'http://localhost:8000/taxi50px.png',
'http://localhost:8000/car1.png',
'http://localhost:8000/car2.png',
'http://localhost:8000/car3.png',
'http://localhost:8000/car4.png',
'http://localhost:8000/car5.png',
'http://localhost:8000/car6.png',
];

const images = []
let imagesLoaded = 0;

function checkAllImagesLoaded() {
    imagesLoaded += 1;
    if (imagesLoaded === imageSources.length) {
        gameLoop(); // Start game when all images are loaded
        startCountdown();
    }
}

for (let i = 0; i < imageSources.length; i++) {
    const img = new Image();
    img.src = imageSources[i];
    // Attach the onload handler for each image
    img.onload = () => {
        console.log(`Image ${i + 1} loaded: ${imageSources[i]}`);
        checkAllImagesLoaded();
    };

    // Push the image into the array for later use
    images.push(img);
}


const crashSounds = [
new Audio('audio/001.mp3'),
new Audio('audio/002.mp3'),
new Audio('audio/003.mp3'),
new Audio('audio/004.mp3'),
new Audio('audio/005.mp3'),
new Audio('audio/006.mp3'),
]

canvas2.width = 150
canvas2.height = 500

canvas.width = 900;
canvas.height = 500;

class Car {
    constructor() {
        this.pos = { x: 250, y: 350 };
        this.vel = 0; // Velocity for forward/reverse
        this.rotation = -Math.PI/2; // Angle of rotation in radians
        this.width = 50;
        this.height = 40;
        this.radius = 20;
        this.speed = 2; // Speed for forward/reverse
        this.turnSpeed = 0.05; // Speed for rotation
        this.image = images[0];
        
    }

    closestPointOnSegment(x1, y1, x2, y2, px, py) {
        const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (lineLength ** 2);
        const clampedT = Math.max(0, Math.min(1, t));
        const closestX = x1 + clampedT * (x2 - x1);
        const closestY = y1 + clampedT * (y2 - y1);
        return { x: closestX, y: closestY };
    }


    checkFareCollision(fare) {
        const dx = this.pos.x - fare.currentLocation.x;
        const dy = this.pos.y - fare.currentLocation.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);
    
        if (distance < fare.radius + this.width / 2) {
            // Circle collected
            fare.handleCollection();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y); // Move to car's position
        ctx.rotate(this.rotation); // Rotate the canvas to the car's rotation
        ctx.drawImage(this.image, -this.width/2, -this.height/2)
        ctx.restore();
    }

    boundaries() {
        const newX = this.pos.x + this.vel * Math.cos(this.rotation);
        const newY = this.pos.y + this.vel * Math.sin(this.rotation);
    
        // Check horizontal boundaries (left and right edges)
        if (newX - this.width / 2 < 0 || newX + this.width / 2 > canvas.width) {
            this.vel = -this.vel * 5; // Reverse and reduce velocity
            this.pos.x += this.vel * Math.cos(this.rotation) * 2; // Adjust position
        } else {
            this.pos.x = newX; // Update position if no boundary collision
        }
    
        // Check vertical boundaries (top and bottom edges)
        if (newY - this.height / 2 < 0 || newY + this.height / 2 > canvas.height) {
            this.vel = -this.vel * 5; // Reverse and reduce velocity
            this.pos.y += this.vel * Math.sin(this.rotation) *2; // Adjust position
        } else {
            this.pos.y = newY; // Update position if no boundary collision
        }
    }


    checkCollision(buildings) {


        for (let building of buildings) {
            // Check all four edges of the building
            const edges = [
                { x1: building.x, y1: building.y, x2: building.x + building.width, y2: building.y }, // Top edge
                { x1: building.x + building.width, y1: building.y, x2: building.x + building.width, y2: building.y + building.height }, // Right edge
                { x1: building.x + building.width, y1: building.y + building.height, x2: building.x, y2: building.y + building.height }, // Bottom edge
                { x1: building.x, y1: building.y + building.height, x2: building.x, y2: building.y }, // Left edge
            ];

            // Check collision for each edge
            for (let edge of edges) {
                const closestPoint = this.closestPointOnSegment(edge.x1, edge.y1, edge.x2, edge.y2, this.pos.x, this.pos.y);

                const dx = this.pos.x - closestPoint.x;
                const dy = this.pos.y - closestPoint.y;
                const distance = Math.sqrt(dx ** 2 + dy ** 2);

                if (distance < this.radius) {
                    // If collision occurs, reverse the car's velocity and move it out of the building
                    const angleToEdge = Math.atan2(dy, dx); // Angle to the closest point on the edge
                    const pushDistance = (this.radius + 100); // How much we need to push the car out

                    // Move the car away from the edge along the direction of the collision
                    this.pos.x += (Math.cos(angleToEdge) * pushDistance);
                    this.pos.y += (Math.sin(angleToEdge) * pushDistance);

                    // Reverse the velocity
                    this.vel = -this.speed;
                    break

                }
            }
        }
    }

    checkNpcCollision(npcCars) {
        for (let npc of npcCars) {
            if (
                this.pos.x + this.width / 2 > npc.x &&
                this.pos.x - this.width / 2 < npc.x + npc.width &&
                this.pos.y + this.height / 2 > npc.y &&
                this.pos.y - this.height / 2 < npc.y + npc.height
            ) {
                // Collision detected
                const crash = {
                    x: this.pos.x,
                    y: this.pos.y,
                    sizeOuter: 50,
                    sizeInner: 25,
                    timestamp: Date.now(),
                };
                crashes.push(crash); // Add crash to the array
                playCrashSound();
                score -= 50
                npc.x = npc.originalX; // Reset NPC car to its starting position
                npc.y = npc.originalY;
            }
        }
    }

    update(fare, buildings) {
        // Handle rotation with keys A and D
        if (keys.KeyA) {
            this.rotation -= this.turnSpeed;
        }
        if (keys.KeyD) {
            this.rotation += this.turnSpeed;
        }

        // Adjust velocity with keys W and S
        if (keys.KeyW) {
            this.vel = this.speed;
        } else {
            this.vel = 0; // Stop when no keys are pressed
        }

        const newX = this.pos.x + this.vel * Math.cos(this.rotation);
        const newY = this.pos.y + this.vel * Math.sin(this.rotation);

        // Check for collisions with buildings
        this.checkCollision(buildings);
        
        this.pos.x = newX;
        this.pos.y = newY;
        

        this.checkFareCollision(fare);
        this.boundaries();
        this.draw();
    }
}

class Building {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.save();
        ctx.fillStyle = "slategrey";
        ctx.strokeStyle = "silver";
        ctx.lineWidth = 5;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

class Fare {
    constructor() {
        this.locations = [
            { x: 50, y: 50 },
            { x: 850, y: 50 },
            { x: 50, y: 450 },
            { x: 850, y: 450 },
            { x: 450, y: 250 },
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
        // Toggle between yellow and green circles
        if (this.yellowState) {
            // If yellow is active, switch to green
            this.yellowState = false;
            this.greenState = true;
            taxiDriver.play();
            
        } else if (this.greenState) {
            // If green is active, switch to yellow
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
            ctx.fillStyle = "yellow";
        } else if (this.greenState) {
            ctx.fillStyle = "lime"; // Draw green if greenState is true
        }
        ctx.beginPath();
        ctx.arc(this.currentLocation.x, this.currentLocation.y, this.radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();
        if (this.yellowState) {
            ctx.save();
            ctx.fillStyle = 'red';
            ctx.font = '18px Impact'
            ctx.fillText('Collect', this.currentLocation.x - 27,this.currentLocation.y + 7);
            ctx.restore();
        } else if (this.greenState) {
            ctx.save();
            ctx.fillStyle = 'black';
            ctx.font = '18px Impact'
            ctx.fillText('Deliver', this.currentLocation.x - 27,this.currentLocation.y + 7);
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
        //ctx.fillStyle = this.color;
        //ctx.fillRect(this.x,this.y,this.width, this.height)
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
        //ctx.fillStyle = this.color;
        //ctx.fillRect(this.x,this.y,this.width, this.height)
    }
    update() {
        this.x += this.speed
        if (this.x < 0) {
            this.x = canvas.width + 80
        }
        this.draw();
    }
}

const keys = {
    KeyW: false,
    //KeyS: false,
    KeyA: false,
    KeyD: false,
    Space: false,
    Enter: false,
};

let crashes = []

const car = new Car();

const buildings = [
    new Building(100, 100, 100, 100),
    new Building(300, 100, 100, 100),
    new Building(500, 100, 100, 100),
    new Building(700, 100, 100, 100),
    new Building(100, 300, 100, 100),
    new Building(300, 300, 100, 100),
    new Building(500, 300, 100, 100),
    new Building(700, 300, 100, 100),
];

const fare = new Fare()

const npcCars = [
    new OtherCarsRight(-100,55, images[1], 1),
    new OtherCarsRight(-200,255, images[2],2),
    new OtherCarsRight(-320,455, images[3],1.5),
    new OtherCarsLeft(canvas.width + 250,5, images[4], -1),
    new OtherCarsLeft(canvas.width + 500,205, images[5],-2),
    new OtherCarsLeft(canvas.width + 300,405, images[6],-1.5)
    ];

function playCrashSound() {
    const randomIndex = Math.floor(Math.random() * crashSounds.length);
    const sound = crashSounds[randomIndex];
    sound.play(); // Play the selected sound
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
    const points = 9; // Number of points in the star
    const angleStep = (Math.PI * 2) / points; // Angle between points
    const asymmetry = Math.random() * 0.3 + 0.85; // Asymmetry factor
  
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      // Alternate between outer and inner radius
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
  
    // Style the star
    ctx.fillStyle = "yellow"; // Fill color
    ctx.strokeStyle = "red";  // Stroke color
    ctx.lineWidth = 2;
  
    // Fill and stroke the star
    ctx.fill();
    ctx.stroke();
}
  //CANVAS 2 INFO
    let score = 0;
    let countdownStart; // Start time of the countdown
    let countdownDuration = 60000; // Countdown duration in milliseconds (e.g., 10 seconds)
    let timeRemaining; // Time remaining in seconds
  
  // Function to start the countdown
function startCountdown() {
        countdownStart = Date.now(); // Record the start time
        timeRemaining = Math.ceil(countdownDuration / 1000); // Initial time in seconds
  }


// Function to update info canvas
function updateCanvas2() {
    const now = Date.now();
    const elapsedTime = now - countdownStart;
    timeRemaining = Math.max(0, Math.ceil((countdownDuration - elapsedTime) / 1000));
  // Clear the info canvas
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    ctx2.fillStyle = 'black';
    ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
    ctx2.fillStyle = 'white';
    ctx2.fillRect(0,0, canvas.width, canvas.height/2)
  // Draw text
    ctx2.font = '50px Impact';
    ctx2.fillStyle = 'red';
    ctx2.fillText(`${score}`, 20, 110);
    ctx2.fillText(`${timeRemaining}`, 40, 230);
    ctx2.font = '50px Impact';
    ctx2.fillStyle = 'black';
    ctx2.fillText(`Score`, 5, 50);
    ctx2.fillText(`Time`, 17, 170);

    ctx2.font = '50px Impact';
    ctx2.fillStyle = 'yellow';
    ctx2.fillText('NEW', 30, 340);
    ctx2.fillText('YORK', 20, 400);
    ctx2.fillText('TAXI', 30, 460);

    if (timeRemaining <= 0) {
        console.log('Time is up!');
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    music.play();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'darkslategrey'
    ctx.fillRect(0, 100, canvas.width, 100)
    ctx.fillRect(0, 300, canvas.width, 100)
    
    drawRoads();
    car.update(fare, buildings);
    buildings.forEach((building) => building.draw());
    fare.draw();

    for (let npc of npcCars) {
        npc.update();
    }
    car.checkNpcCollision(npcCars);

    const now = Date.now();
    crashes = crashes.filter(crash => {
        if (now - crash.timestamp < 1000) { // Keep crash on screen for 1 second
            drawCrash(ctx, crash.x, crash.y, crash.sizeOuter, crash.sizeInner);
            return true; // Keep in the array
        }
        return false; // Remove from the array
    });
    
    updateCanvas2();

    requestAnimationFrame(gameLoop);
}


checkAllImagesLoaded();

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

document.getElementById('startButton').addEventListener('keydown', () => {
    backgroundMusic.play();
    gameLoop(); 
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
