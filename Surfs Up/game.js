const canvas = document.getElementById("gameCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

canvas.addEventListener("click", function () {
  if (gameState === "gameOver") {
    resetGame();
    gameState = "playing";
  }
});

document.addEventListener("keydown", function (event) {
  if (gameState === "gameOver" && event.code === "Space") {
    resetGame();
    gameState = "playing";
  }
});

// Game Variables
let gameState = "playing"; // Other possible state: "gameOver"

let player = {
  x: canvas.width / 2 - 25, // Center the player horizontally
  y: canvas.height / 2 - 35, // Center the player vertically
  rectangles: [
    { x: 40, y: 10, width: 50, height: 90 }, // Adjusted rectangle for surfer body
    { x: 10, y: 100, width: 80, height: 35 }, // Adjusted rectangle for surfboard
  ],
  width: 100, // Overall width (for drawing the image)
  height: 150, // Overall height (for drawing the image)
};

let shark = {
  x: canvas.width / 2 - 75,
  y: canvas.height + 100, // Positioned below the visible canvas area
  targetX: canvas.width / 2 - 75,
  width: 150,
  height: 250,
  speed: 1.5,
  followSpeed: 1, // Speed at which the shark follows the player horizontally
  maxDistance: 200, // Adjust based on your desired distance
  approachSpeed: 0.5, // Speed at which the shark approaches the player
  retreatSpeed: 2, // Speed at which the shark retreats
  spawned: false,
};

let score = 0;

let topScore = localStorage.getItem("topScore") || 0;

let keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

document.addEventListener("keydown", function (event) {
  if (keys.hasOwnProperty(event.key)) {
    keys[event.key] = true;
  }
});

document.addEventListener("keyup", function (event) {
  if (keys.hasOwnProperty(event.key)) {
    keys[event.key] = false;
  }
});

let surferImage = new Image();
surferImage.src = "surfer.png";

let backgroundImage = new Image();
backgroundImage.src = "background.png";

let buoyImage = new Image();
buoyImage.src = "buoy.png";

let sharkImage = new Image();
sharkImage.src = "shark.png";

let background = {
  y: 0,
  height: canvas.height,
  speed: 2,
};

let obstacles = [];
let obstacleSpawnRate = 200; // Adjust this value to control the frequency of obstacles
let lastObstacleSpawn = 0;

let maxSpeed = 3.5; // Adjust as needed
let minObstacleSpawnRate = 75; // Adjust as needed

// Initialization
function init() {
  let imagesToLoad = 3; // Total number of images we expect to load

  // Function to decrement the count of images to load and start game when all are loaded
  let onImageLoad = function () {
    imagesToLoad--;
    if (imagesToLoad === 0) {
      gameLoop();
    }
  };

  backgroundImage.onload = onImageLoad;
  surferImage.onload = onImageLoad;
  buoyImage.onload = onImageLoad; // Ensure buoy image is loaded
}

// Game Loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function isColliding(player, objB) {
  for (let rect of player.rectangles) {
    let adjustedA = {
      x: player.x + rect.x,
      y: player.y + rect.y,
      width: rect.width,
      height: rect.height,
    };

    if (
      adjustedA.x < objB.x + objB.width &&
      adjustedA.x + adjustedA.width > objB.x &&
      adjustedA.y < objB.y + objB.height &&
      adjustedA.y + adjustedA.height > objB.y
    ) {
      return true;
    }
  }
  return false;
}

function updateSharkSpeeds(score, shark) {
  if (score <= 13000) {
    shark.approachSpeed = 0.5; // Default approach speed
    shark.followSpeed = 1; // Default follow speed
  } else if (score <= 25000) {
    // Linearly interpolate between default and max speeds based on score
    let t = (score - 13000) / (25000 - 13000);

    shark.approachSpeed = 0.5 + t * (1.5 - 0.5);
    shark.followSpeed = 1 + t * (2 - 1);
  } else {
    shark.approachSpeed = 1.5; // Maximum approach speed
    shark.followSpeed = 2; // Maximum follow speed
  }
}

function resetGame() {
  // Reset background position and speed
  background.y = 0;
  background.speed = 2; // Resetting speed to its initial value

  // Reset obstacle spawn rate
  obstacleSpawnRate = 150; // Resetting to initial spawn rate

  // Clear obstacles
  obstacles = [];

  // Reset score
  score = 0;

  // Reset shark position and behavior
  shark.spawned = false; // Resetting to initial state
  shark.x = canvas.width / 2 - 75; // Resetting to its starting x-position
  shark.y = canvas.height; // Resetting to its starting y-position
  shark.targetX = shark.x; // Resetting target position
}

// Speed modifiers
let horizontalSpeed = 5;
let verticalSpeedModifier = 1.75;

// Update game state
function update() {
  if (gameState !== "playing") {
    return; // If game is not in "playing" state, do not update game state
  }

  // Adjust speed based on score
  if (score > 2500) {
    let speedIncreaseFactor = 1 + (score - 2000) / 5000; // This starts at 1 when score is 2500
    if (background.speed < maxSpeed) {
      background.speed = 2 * speedIncreaseFactor;
    }
    obstacleSpawnRate = Math.max(
      150 / speedIncreaseFactor,
      minObstacleSpawnRate
    ); // Adjusting spawn rate based on speed
  }

  // Update player's horizontal position based on arrow keys
  if (keys.ArrowLeft) {
    player.x -= horizontalSpeed;
  }
  if (keys.ArrowRight) {
    player.x += horizontalSpeed;
  }

  // Adjust background speed based on vertical arrow keys
  let currentSpeed = keys.ArrowUp
    ? background.speed * verticalSpeedModifier
    : background.speed;
  currentSpeed = keys.ArrowDown
    ? background.speed / verticalSpeedModifier
    : currentSpeed;

  // Simulate background movement
  background.y += currentSpeed;
  if (background.y > canvas.height) {
    background.y = 0;
  }

  // Spawn new obstacles
  lastObstacleSpawn += currentSpeed;
  if (lastObstacleSpawn > obstacleSpawnRate) {
    spawnObstacle();
    lastObstacleSpawn = 0;
  }

  // Move obstacles with background speed
  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].y += currentSpeed;
  }

  // Remove obstacles that have moved off the screen
  obstacles = obstacles.filter((obstacle) => obstacle.y < canvas.height);

  // Increment score based on distance traveled
  score += currentSpeed;

  // Check and update top score
  if (score > topScore) {
    topScore = score;
    localStorage.setItem("topScore", topScore);
  }

  // Check for collisions with obstacles
  for (let obstacle of obstacles) {
    if (isColliding(player, obstacle)) {
      console.log("Collision detected!");
      console.log("Player hitboxes:");
      for (let rect of player.rectangles) {
        let adjustedA = {
          x: player.x + rect.x,
          y: player.y + rect.y,
          width: rect.width,
          height: rect.height,
        };
        console.log(adjustedA);
      }
      console.log("Colliding obstacle:", obstacle);

      gameState = "gameOver";
      break; // Exit loop if collision is detected
    }
  }

  /// If score is above 5000 but the shark hasn't fully spawned
  if (score > 5000 && !shark.spawned) {
    if (shark.y > canvas.height - shark.maxDistance) {
      shark.y -= shark.approachSpeed; // Make the shark rise from the bottom
    } else {
      shark.spawned = true; // Shark has reached its starting position
    }

    // Shark follows the player horizontally
    if (shark.x < player.x) {
      shark.x += shark.followSpeed;
    } else if (shark.x > player.x) {
      shark.x -= shark.followSpeed;
    }
  }
  // If the shark has fully spawned, begin chasing behavior
  else if (shark.spawned) {
    updateSharkSpeeds(score, shark);

    // Shark follows the player horizontally
    if (shark.x < player.x) {
      shark.x += shark.followSpeed;
    } else if (shark.x > player.x) {
      shark.x -= shark.followSpeed;
    }

    // Shark vertical movement based on player's speed
    if (keys.ArrowUp) {
      shark.y = Math.min(
        shark.y + shark.retreatSpeed,
        canvas.height - shark.maxDistance
      );
    } else {
      shark.y -= shark.approachSpeed;
    }

    // Keep shark within certain bounds to simulate it staying near the bottom
    shark.y = Math.min(
      canvas.height - shark.height,
      Math.max(canvas.height - 2 * shark.height, shark.y)
    );
  }

  if (isColliding(player, shark)) {
    gameState = "gameOver";
  }
}

function spawnObstacle() {
  let obstacle = {
    x: Math.random() * (canvas.width - 50), // Random position, 50 is the width of the buoy
    y: -50, // Start off the screen
    width: 60,
    height: 60,
  };
  obstacles.push(obstacle);
}

// Render game state
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw moving background with scaled dimensions
  ctx.drawImage(
    backgroundImage,
    0,
    background.y - canvas.height,
    canvas.width,
    canvas.height
  );
  ctx.drawImage(backgroundImage, 0, background.y, canvas.width, canvas.height);

  // Draw surfer
  ctx.drawImage(surferImage, player.x, player.y, player.width, player.height);

  // Visualize the hitboxes for testing:
  //   for (let rect of player.rectangles) {
  //     ctx.strokeStyle = "#FF0000"; // Red color for visibility
  //     ctx.lineWidth = 2; // Adjust thickness as needed
  //     ctx.strokeRect(
  //       player.x + rect.x,
  //       player.y + rect.y,
  //       rect.width,
  //       rect.height
  //     );
  //   }

  // Draw obstacles
  for (let obstacle of obstacles) {
    ctx.drawImage(
      buoyImage,
      obstacle.x,
      obstacle.y,
      obstacle.width,
      obstacle.height
    );
  }

  // Draw the shark
  if (shark.y < canvas.height) {
    ctx.drawImage(sharkImage, shark.x, shark.y, shark.width, shark.height);
  }

  // Draw player speed
  // ctx.fillStyle = "#000";
  // ctx.font = "24px Arial";
  // ctx.textAlign = "center";
  // ctx.fillText("Speed: " + background.speed.toFixed(2), canvas.width / 2, 30);

  // Draw top score
  ctx.fillStyle = "#000";
  ctx.font = "24px Arial";
  ctx.textAlign = "right"; // Align text to the right
  ctx.fillText("Top Score: " + Math.floor(topScore), canvas.width - 10, 30);

  // Draw current score
  ctx.textAlign = "start"; // Reset text alignment to default (left/start)
  ctx.fillText("Score: " + Math.floor(score), 10, 30);

  if (gameState === "gameOver") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // Semi-transparent black overlay
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFF";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    ctx.font = "24px Arial";
    ctx.fillText(
      "Click or press space to play again",
      canvas.width / 2,
      canvas.height / 2 + 40
    );
  }
}

init();
