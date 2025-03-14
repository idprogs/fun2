const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let playerX = 50;
let playerY = 500;
const playerSize = 30;
const playerSpeed = 10;

let botX = 700;
let botY = 500;
const botSize = 50;
let botSpeed = 2;
let botDirectionX = -1; // -1 for moving left, 1 for moving right.
let botDirectionY = 1; // -1 for moving up, 1 for moving down

const boxes = [];
const numBoxes = 10; // Changed to 10 boxes
const boxSize = 60; // Increased box size for logos

let gameOver = false;
let boxesDestroyed = 0;

//Bot image variables
let botImageForward1 = new Image();
//Updated to use the images directory.
botImageForward1.src = 'images/muskf1.png';
let botImageForward2 = new Image();
//Updated to use the images directory.
botImageForward2.src = 'images/muskf2.png';
let botImageBackward1 = new Image();
//Updated to use the images directory.
botImageBackward1.src = 'images/muskb1.png';
let botImageBackward2 = new Image();
//Updated to use the images directory.
botImageBackward2.src = 'images/muskb2.png';
let currentBotImage = botImageBackward1;
let animationFrame = 0; // To alternate images

// Factoids for each box (REPLACED)
const agencyFactoids = [
  "The Environmental Protection Agency (EPA) safeguards human health and the environment by enforcing regulations on air and water quality.",
  "The Centers for Disease Control and Prevention (CDC) plays a crucial role in disease prevention, outbreak response, and public health research.",
  "The Department of Education ensures access to quality education by providing funding, setting academic standards, and supporting special education programs.",
  "The Federal Emergency Management Agency (FEMA) responds to natural disasters, helping communities recover through emergency aid and relief efforts.",
  "The Food and Drug Administration (FDA) regulates the safety of food, medicine, and medical devices, protecting public health from harmful products.",
  "The National Aeronautics and Space Administration (NASA) drives scientific discovery and innovation through space exploration, satellite research, and climate monitoring.",
  "The Social Security Administration (SSA) provides financial support to retirees, disabled individuals, and families of deceased workers, ensuring economic stability.",
  "The Department of Veterans Affairs (VA) offers healthcare, education, and housing benefits to U.S. military veterans, supporting those who served the nation.",
  "The Department of Homeland Security (DHS) protects the nation from threats, including terrorism, cyberattacks, and natural disasters.",
  "The National Institutes of Health (NIH) conducts cutting-edge medical research, leading to breakthroughs in disease treatment and public health advancements."
];

// Image Logos (NEW)
const agencyLogos = [
    //Updated to use the images directory.
  'images/epa.png',
    //Updated to use the images directory.
  'images/cdc.png',
    //Updated to use the images directory.
  'images/ed.png',
    //Updated to use the images directory.
  'images/fema.png',
    //Updated to use the images directory.
  'images/fda.png',
    //Updated to use the images directory.
  'images/nasa.png',
    //Updated to use the images directory.
  'images/ssa.png',
    //Updated to use the images directory.
  'images/va.png',
    //Updated to use the images directory.
  'images/dhs.png',
    //Updated to use the images directory.
  'images/nih.png',
];

// Preload images to avoid blank spaces.
const logoImages = agencyLogos.map(src => {
    const img = new Image();
    img.src = src;
    return img;
});


// Game state
let gamePaused = false;
let pauseStartTime = 0;
const factoidPauseDuration = 2000; // 2 seconds in milliseconds
let displayedFactoid = ""; // Variable to store the current factoid being displayed
let factoidVisible = false; // Track if a factoid is currently being displayed.

// Sound effects
const moveSound = new Audio('move.wav'); // Replace 'move.wav' with your sound file
const bounceSound = new Audio('bounce.wav'); // Replace 'bounce.wav' with your sound file
const hitSound = new Audio('hit.wav'); // Replace 'hit.wav' with your sound file
moveSound.loop = true;
moveSound.volume = 0.5;
bounceSound.volume = 0.8;
hitSound.volume = 0.8;

// Initialize boxes
function initBoxes() {
    //Calculate spacing dynamically based on the canvas width
    const horizontalSpacing = canvas.width / (numBoxes + 1);
    
    for (let i = 0; i < numBoxes; i++) {
        boxes.push({
            //Distribute the boxes horizontally and vertically
            x: horizontalSpacing * (i + 1) - boxSize / 2,
            y: 150 + (i % 2) * 150, // Alternate rows to spread out vertically
            destroyed: false,
            factoidDisplayed: false, // Add a flag to track if factoid was displayed
            //Use agency factoids instead of boxFactoids
            factoid: agencyFactoids[i] || "No Factoid Available",// Assign each box a factoid, or "No Factoid Available" if there are less than 10 factoids.
            logo: logoImages[i]
        });
    }
}

initBoxes();

// Draw functions
function drawPlayer() {
  ctx.fillStyle = 'blue';
  ctx.fillRect(playerX, playerY, playerSize, playerSize);
}

function drawBot() {
    ctx.drawImage(currentBotImage, botX, botY, botSize, botSize);
}

function drawBoxes() {
  //ctx.fillStyle = 'brown'; // Removed the brown box filler.
  for (const box of boxes) {
    if (!box.destroyed) {
      ctx.drawImage(box.logo, box.x, box.y, boxSize, boxSize); // Draw logo instead
    }
  }
}

function drawText(text, x, y, color = 'black', font = '30px Arial') {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.fillText(text, x, y);
}

//Game logic function
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let metrics = null;
    let testWidth = 0;

    for (let n = 0; n < words.length; n++) {
        testLine += words[n] + ' ';
        metrics = context.measureText(testLine);
        testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
        testLine = line;
    }

    context.fillText(line, x, y);
}

// Game logic functions
function updateBot() {
  let bounced = false;
  // Update bot's position based on direction
  botX += botSpeed * botDirectionX;
  botY += botSpeed * botDirectionY;

  // Bounce off the walls
  if (botX <= 0 || botX + botSize >= canvas.width) {
    botDirectionX *= -1; // Reverse horizontal direction
    bounced = true;
  }
  if (botY <= 0 || botY + botSize >= canvas.height) {
    botDirectionY *= -1; // Reverse vertical direction
    bounced = true;
  }

  if (bounced) {
    bounceSound.play();
  }

  // Update bot image based on direction
  if (botDirectionX === 1) { // Moving forward
    if (animationFrame % 20 < 10) {
      currentBotImage = botImageForward1;
    } else {
      currentBotImage = botImageForward2;
    }
  } else { // Moving backward
    if (animationFrame % 20 < 10) {
      currentBotImage = botImageBackward1;
    } else {
      currentBotImage = botImageBackward2;
    }
  }

  animationFrame++; // Increment animation frame for next draw
  if (!gamePaused) {
    moveSound.play();
  }

  // Check for collision with boxes
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    if (!box.destroyed && checkCollision(botX, botY, botSize, botSize, box.x, box.y, boxSize, boxSize)) {
      hitSound.play();
      box.destroyed = true;
      boxesDestroyed++;
      if (!box.factoidDisplayed) { // Check if factoid was already displayed
        displayedFactoid = box.factoid; // Store the factoid to be displayed
        box.factoidDisplayed = true; // Set flag to true
        gamePaused = true; // Pause the game
        factoidVisible = true;
        pauseStartTime = Date.now(); // Record the pause start time
      }
    }
  }
  if (boxesDestroyed === boxes.length) {
    gameOver = true;
  }
}

function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2;
}

function checkPlayerBotCollision() {
  if (checkCollision(playerX, playerY, playerSize, playerSize, botX, botY, botSize, botSize)) {
    if (botDirectionX === -1) {
      botX += 20
      botDirectionX = 1
    } else {
      botX -= 20
      botDirectionX = -1
    }
    if (botDirectionY === -1) {
      botY += 20
      botDirectionY = 1
    } else {
      botY -= 20
      botDirectionY = -1
    }
  }
}

function updateGame() {
  if (gameOver) {
    moveSound.pause();
    moveSound.currentTime = 0;
    if (boxesDestroyed === boxes.length) {
      drawText('Game Over! Bot destroyed all boxes.', 150, 300, 'red');
    }
    return;
  }

  // Check if the pause duration has elapsed
  if (gamePaused) {
    moveSound.pause();
    moveSound.currentTime = 0;
    const elapsedTime = Date.now() - pauseStartTime;
    if (elapsedTime >= factoidPauseDuration) {
      gamePaused = false; // Unpause the game
      
    }
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoxes();
    drawPlayer();
    drawBot();
      if (factoidVisible) {
        //moved this Y value from 100 to 50.
          ctx.font = "20px Arial"
          wrapText(ctx, displayedFactoid, 50, 50, canvas.width - 100, 25);
      }

    return;
  }

  //Factoid drawing code.
  if (factoidVisible) {
    //moved this Y value from 100 to 50.
    ctx.font = "20px Arial"
    wrapText(ctx, displayedFactoid, 50, 50, canvas.width - 100, 25);
  }
    
    
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateBot();
  checkPlayerBotCollision();
  drawBoxes();
  drawPlayer();
  drawBot();
}

// Event listeners
document.addEventListener('keydown', (event) => {
  if (gameOver || gamePaused) return;

  if (event.key === 'ArrowUp' && playerY > 0) {
    playerY -= playerSpeed;
  } else if (event.key === 'ArrowDown' && playerY < canvas.height - playerSize) {
    playerY += playerSpeed;
  } else if (event.key === 'ArrowLeft' && playerX > 0) {
    playerX -= playerSpeed;
  } else if (event.key === 'ArrowRight' && playerX < canvas.width - playerSize) {
    playerX += playerSpeed;
  }
});

// Game loop
function gameLoop() {
  updateGame();
  requestAnimationFrame(gameLoop);
}
const startButton = document.getElementById('startButton');
let gameStarted = false;

startButton.addEventListener('click', () => {
  if (!gameStarted) {
    gameStarted = true;
    moveSound.play();
    gameLoop();
    startButton.disabled = true;
    startButton.style.display = "none";
  }
});
