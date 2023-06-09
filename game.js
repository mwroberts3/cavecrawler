const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = { state: 'titleScreen', loaded: false };

const playerImage = new Image();
playerImage.src = 'player_sprite.png';
playerImage.addEventListener('load', () => gameState.loaded = true);


// Game variables
const playerSpeed = 2;
const gravity = 0.25;
let lives = 3;
let score = 0;
let player = {
  x: canvas.width / 2,
  y: 0,
  velocityX: 0,
  velocityY: 0,
  onGround: true,
  gravityReversed: false,
  direction: 1
};
let laserCooldown = 0;
const laserSpeed = 2.5;
const lasers = [];
let level = 0;

let levelColor = 'brown';

const levelData = [
  { levelChange: 0, color: 'brown' },
  { levelChange: 5, color: 'white' },
  { levelChange: 10, color: 'red' }
];

// Cave generation variables
const caveWidth = 20;
const caveHeight = canvas.height * 0.4;
const noiseScale = 0.1;
const segmentSkip = 2;
const caveSegments = [];
const caveLength = 100;
const branchChance = 0.1;
const branchMinSize = 0.1;
const branchMaxSize = 0.5;
const branchDepth = 2;

// show title screen
drawTitleScreen();

function initGameLoop(e) {
  if (e.key === 'Enter' && gameState.loaded) {
    window.removeEventListener('keydown', initGameLoop);
    gameState.state = 'gameInitiated';
    generateCave();
  }
}

function drawTitleScreen() {
  if (gameState.state === 'titleScreen') {
    window.addEventListener('keydown', initGameLoop);
  }

  ctx.fillStyle = 'brown';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = '48px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText('Cave Explorer', canvas.width / 2, canvas.height / 2 - 50);

  ctx.font = '24px Arial';
  ctx.fillText('Press ENTER to start', canvas.width / 2, canvas.height / 2 + 50);

  // Draw cave art
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;

  // Draw a simple cave painting of a person
  ctx.beginPath();
  ctx.arc(canvas.width / 4, canvas.height / 2 - 20, 10, 0, 2 * Math.PI); // Head
  ctx.moveTo(canvas.width / 4, canvas.height / 2 - 10);
  ctx.lineTo(canvas.width / 4, canvas.height / 2 + 30); // Body
  ctx.moveTo(canvas.width / 4 - 15, canvas.height / 2);
  ctx.lineTo(canvas.width / 4 + 15, canvas.height / 2); // Arms
  ctx.moveTo(canvas.width / 4, canvas.height / 2 + 30);
  ctx.lineTo(canvas.width / 4 - 15, canvas.height / 2 + 50); // Left leg
  ctx.moveTo(canvas.width / 4, canvas.height / 2 + 30);
  ctx.lineTo(canvas.width / 4 + 15, canvas.height / 2 + 50); // Right leg
  ctx.moveTo(canvas.width / 4 - 15, canvas.height / 2 + 50);
  ctx.lineTo(canvas.width / 4 - 10, canvas.height / 2 + 60); // Left foot
  ctx.moveTo(canvas.width / 4 + 15, canvas.height / 2 + 50);
  ctx.lineTo(canvas.width / 4 + 10, canvas.height / 2 + 60); // Right foot
  ctx.stroke();

  // Draw a simple cave painting of an animal
  ctx.beginPath();
  ctx.ellipse(3 * canvas.width / 4, canvas.height / 2, 30, 20, 0, 0, 2 * Math.PI); // Body
  ctx.moveTo(3 * canvas.width / 4 - 30, canvas.height / 2);
  ctx.lineTo(3 * canvas.width / 4 - 50, canvas.height / 2 - 10); // Head
  ctx.lineTo(3 * canvas.width / 4 - 45, canvas.height / 2 + 5); // Snout
  ctx.moveTo(3 * canvas.width / 4 - 45, canvas.height / 2 - 10);
  ctx.lineTo(3 * canvas.width / 4 - 40, canvas.height / 2 - 15); // Ear
  ctx.moveTo(3 * canvas.width / 4 - 20, canvas.height / 2 + 15);
  ctx.lineTo(3 * canvas.width / 4 - 10, canvas.height / 2 + 35); // Front leg
  ctx.lineTo(3 * canvas.width / 4 - 15, canvas.height / 2 + 40); // Front foot
  ctx.moveTo(3 * canvas.width / 4 - 10, canvas.height / 2 - 15);
  ctx.lineTo(3 * canvas.width / 4 + 10, canvas.height / 2 - 35); // Back leg
  ctx.lineTo(3 * canvas.width / 4 + 15, canvas.height / 2 - 40); // Back foot
  ctx.stroke();
}

// Generate the cave
function generateCave() {
  for (let i = 0; i < caveLength; i++) {
    let noiseValue = noise.perlin2(i * (noiseScale * (segmentSkip + 1)), 0);
    let posY = (noiseValue + 1) / 2 * (canvas.height - caveHeight);
    let caveSegment = {
      posY: posY,
      branches: []
    };

    // Randomly create branches
    if (Math.random() < branchChance) {
      createBranches(caveSegment, branchDepth, i);
    }

    caveSegments.push(caveSegment);

    // Fill in missing segments using linear interpolation
    if (i < caveLength - 1) {
      for (let j = 1; j <= segmentSkip; j++) {
        let nextNoiseValue = noise.perlin2((i + 1) * (noiseScale * (segmentSkip + 1)), 0);
        let nextPosY = (nextNoiseValue + 1) / 2 * (canvas.height - caveHeight);
        let interpolatedPosY = posY + (nextPosY - posY) * (j / (segmentSkip + 1));

        let interpolatedSegment = {
          posY: interpolatedPosY,
          branches: []
        };

        caveSegments.push(interpolatedSegment);
      }
    }
  }

  gameLoop();
}

// Game loop
function gameLoop() {
  updatePlayerPosition();
  handleLasers();
  draw();
  requestAnimationFrame(gameLoop);
}

const branchColors = [
  { color: 'gray', value: 1 },
  { color: 'white', value: 2 },
  { color: 'yellow', value: 3 },
  { color: 'green', value: 4 },
  { color: 'blue', value: 5 },
  { color: 'purple', value: 6 }
];

function createBranches(segment, depth, index) {
  if (depth === 0) return;

  let branchPosY = Math.random() * (canvas.height - caveHeight) + 100;
  let branchHeight = caveHeight * (branchMinSize + Math.random() * (branchMaxSize - branchMinSize));
  let direction = Math.random() > 0.5 ? 1 : -1;
  // Assign a random color
  let color = branchColors[Math.floor(Math.random() * branchColors.length)];

  segment.branches.push({ posY: branchPosY, height: branchHeight, direction, color: color.color, colorValue: color.value });

  if (index + 1 < caveSegments.length) {
    createBranches(caveSegments[index + 1], depth - 1, index + 1);
  }
}

function handleLasers() {
  // Laser creation and movement
  if (laserCooldown <= 0) {
    let posY = Math.random() * (600);
    lasers.push({ x: 0, y: posY });
    // Adjust these numbers to control the frequency of the lasers
    laserCooldown = Math.max(60 + Math.floor(Math.random() * 100) - (level * 50), 20);
  } else {
    laserCooldown--;
  }

  // Update laser positions
  for (let i = 0; i < lasers.length; i++) {
    lasers[i].x += laserSpeed;

    // Check for collision with branches
    let hitBranch = false;
    for (let j = 0; j < caveSegments.length && !hitBranch; j++) {
      const segment = caveSegments[j];
      const segmentLeft = j * caveWidth;
      const segmentRight = (j + 1) * caveWidth;

      // Check if the laser is within the horizontal bounds of the cave segment
      if (lasers[i].x + 30 >= segmentLeft && lasers[i].x <= segmentRight) {
        // Check for collisions with the branches of the current cave segment
        for (let k = 0; k < segment.branches.length; k++) {
          const branch = segment.branches[k];
          const branchTop = branch.posY;
          const branchBottom = branch.posY + branch.height;

          if (lasers[i].y + 10 >= branchTop && lasers[i].y <= branchBottom) {
            // If the laser is within the vertical bounds of the branch, it's a collision
            if (branch.direction === 1 && lasers[i].x + 30 >= segmentLeft && lasers[i].x <= segmentRight) {
              // Laser collided with the solid part of a rightward branch
              lasers.splice(i, 1);
              hitBranch = true;

              // Decrease the branch's color value and change the color accordingly
              branch.colorValue -= 1;
              if (branch.colorValue <= 0) {
                // Remove the branch if the value becomes 0
                segment.branches.splice(k, 1);
              } else {
                branch.color = branchColors[branch.colorValue - 1].color;
              }

              break;
            } else if (branch.direction === -1 && lasers[i].x + 30 >= segmentRight && lasers[i].x <= segmentLeft) {
              // Laser collided with the solid part of a leftward branch
              lasers.splice(i, 1);
              hitBranch = true;

              // Decrease the branch's color value and change the color accordingly
              branch.colorValue -= 1;
              if (branch.colorValue <= 0) {
                // Remove the branch if the value becomes 0
                segment.branches.splice(k, 1);
              } else {
                branch.color = branchColors[branch.colorValue - 1].color;
              }

              break;
            }
          }
        }
      }
    }
    // If the laser hit a branch, skip the remaining checks
    if (hitBranch) continue;

    // Remove laser if it goes off the screen
    if (lasers[i].x > canvas.width) {
      lasers.splice(i, 1);
      i--;
    }
  }
}

function updatePlayerPosition() {
  // update player position based on velocity
  player.x += player.velocityX;
  player.y += player.velocityY;

  // clamp player position
  // player.x = Math.min(Math.max(player.x, 0), canvas.width);

  // apply gravity
  if (player.gravityReversed) {
    player.velocityY -= gravity;
  } else {
    player.velocityY += gravity;
  }

  // check if player on ground
  let groundY = getBottomCaveY(player.x) - 10;
  let ceilingY = getTopCaveY(player.x) + 10;
  if (!player.gravityReversed && player.y >= groundY) {
    player.y = groundY;
    player.velocityY = 0;
    player.onGround = true;
  } else if (player.gravityReversed && player.y <= ceilingY) {
    player.y = ceilingY;
    player.velocityY = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // check if player reached RIGHT boundary
  if (player.x >= canvas.width - 5) {
    player.x = 5;
    level++;

    for (let i = 0; i < levelData.length; i++) {
      if (level >= levelData[i].levelChange) {
        levelColor = levelData[i].color;
      }
    }

    regenerateCave();
  }
}

function regenerateCave() {
  caveSegments.length = 0;
  let newSeed = Math.random() * 1000;

  // Reset the lasers array
  lasers.length = 0;

  for (let i = 0; i < caveLength; i++) {
    let noiseValue = noise.perlin2((i * noiseScale) + newSeed, 0);
    let posY = (noiseValue + 1) / 2 * (canvas.height - caveHeight);
    let caveSegment = {
      posY: posY,
      branches: []
    };

    if (Math.random() < branchChance) {
      createBranches(caveSegment, branchDepth, i);
    }

    caveSegments.push(caveSegment);
  }

  player.y = getBottomCaveY(player.x) - 10;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player
  if (player.direction === 1) {
    ctx.drawImage(playerImage, player.x - 10, player.y - 10, 20, 20);
  } else {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(playerImage, -player.x - 10, player.y - 10, -20, 20);
    ctx.restore();
  }

  // Draw cave
  ctx.fillStyle = levelColor;
  for (let i = 0; i < caveSegments.length; i++) {
    let posY = caveSegments[i].posY;
    // shows top of cave

    if (level % 5 !== 0) {
      ctx.fillRect(i * caveWidth, 0, caveWidth, posY);
    }

    // shows bottom of cave
    ctx.fillRect(i * caveWidth, posY + caveHeight, caveWidth, canvas.height - posY - caveHeight);

    // Draw branches
    for (let j = 0; j < caveSegments[i].branches.length; j++) {
      let branch = caveSegments[i].branches[j];
      ctx.fillStyle = caveSegments[i].branches[j].color;

      if (branch.direction === 1) { // Rightward branch
        ctx.clearRect(i * caveWidth, branch.posY, caveWidth, branch.height);
        ctx.fillRect(i * caveWidth, branch.posY, caveWidth, branch.height);
      } else { // Leftward branch
        ctx.clearRect((i + 1) * caveWidth, branch.posY, -caveWidth, branch.height);
        ctx.fillRect((i + 1) * caveWidth, branch.posY, -caveWidth, branch.height);
      }
    }
    ctx.fillStyle = levelColor;
  }

  // Draw lasers
  ctx.fillStyle = 'red';
  for (let i = 0; i < lasers.length; i++) {
    let laser = lasers[i];
    ctx.fillRect(laser.x, laser.y, 30, 10);
  }

  // Update player's level, lives and score
  const playerHUD = document.querySelector('#playerHUD');
  playerHUD.innerHTML = `
      <p>Level: ${level}</p>
      <p>Lives: ${lives}</p>
      <p>Score: ${score}</p>
    `;
}


function catmullRomSpline(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;

  const a = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
  const b = p0 - 2.5 * p1 + 2 * p2 - 0.5 * p3;
  const c = -0.5 * p0 + 0.5 * p2;
  const d = p1;

  return a * t3 + b * t2 + c * t + d;
}


// Handle user input
const keys = {};
let spaceBarPressedDuration = 0;

window.addEventListener('keydown', (event) => {
  if (!keys[event.key]) {
    keys[event.key] = true;
    updatePlayerVelocity();
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.key] = false;
  updatePlayerVelocity();
});

function updatePlayerVelocity() {
  player.velocityX = 0;

  if (keys['ArrowLeft'] || keys['a']) {
    player.velocityX = -playerSpeed;
    player.direction = -1;
  }
  if (keys['ArrowRight'] || keys['d']) {
    player.velocityX = playerSpeed;
    player.direction = 1;
  }

  // Update player's y position based on ground or ceiling position
  if (player.gravityReversed) {
    player.y = getTopCaveY(player.x) + 10;
  } else {
    player.y = getBottomCaveY(player.x) - 10;
  }

  if (keys['ArrowUp']) {
    if (!player.gravityReversed && player.onGround) {
      player.gravityReversed = true;
      player.onGround = false;
    }
  } else {
    let ceilingY = getTopCaveY(player.x) + 10;
    if (player.gravityReversed && player.y <= ceilingY) {
      player.gravityReversed = false;
      player.onGround = false;
    }
  }
}

// Get the y position of the bottom of the cave at a given x position
function getBottomCaveY(x) {
  let segmentIndex = Math.floor(x / caveWidth);
  let segmentPosX = x % caveWidth;
  let posYStart = caveSegments[segmentIndex].posY + caveHeight;
  let posYEnd = caveSegments[segmentIndex + 1].posY + caveHeight;

  console.log(caveSegments);

  const p0 = caveSegments[Math.max(segmentIndex - 1, 0)].posY;
  const p1 = posYStart;
  const p2 = posYEnd;
  const p3 = caveSegments[Math.min(segmentIndex + 2, caveSegments.length - 1)].posY;
  const t = segmentPosX / caveWidth;
  let posY = catmullRomSpline(p0, p1, p2, p3, t);
  return posY;
}

function getTopCaveY(x) {
  let segmentIndex = Math.floor(x / caveWidth);
  console.log(x, segmentIndex, caveSegments)
  let segmentPosX = x % caveWidth;
  let posYStart = caveSegments[segmentIndex].posY;
  let posYEnd = caveSegments[segmentIndex + 1].posY;

  const p0 = caveSegments[Math.max(segmentIndex - 1, 0)].posY;
  const p1 = posYStart;
  const p2 = posYEnd;
  const p3 = caveSegments[Math.min(segmentIndex + 2, caveSegments.length - 1)].posY;
  const t = segmentPosX / caveWidth;
  let posY = catmullRomSpline(p0, p1, p2, p3, t);
  return posY;
}