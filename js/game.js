/*
  Project: Bloc Buster
  Description: Handles core game logic.
  Author: Dominique Thomas (github.com/dominique-thomas)
  License: Shared publicly for demonstration purposes only. Reuse or redistribution not permitted without permission.
*/
//----------------------------------
//  Global Variables
//----------------------------------
const MAX_SCORE = 999999;
const swipeThreshold = 30;
const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const arena = createMatrix(12, 20);
const audio = {
  clear: new Audio('sfx/clear.wav'),
  levelUp: new Audio('sfx/levelup.wav'),
  music: new Audio('music/theme.wav'),
};
const colors = [
  null,
  "#FF66C4",
  "#00D2B2",
  "#00FF9C",
  "#C084FC",
  "#FFB347",
  "#FFF85B",
  "#809CFF"
];
const player = {
  lines: 0,
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
  level: 1
};
let flashCells = [];
let flashUntil = 0;
let startX = 0;
let startY = 0;
let lastStepX = null;
let dropHoldTimer = 0;
let nextPiece = createPiece("TJLOSZI"[Math.floor(Math.random() * 7)]);
let audioMuted = false;
let isPaused = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

//----------------------------------
//  Canvas/Audio Handlers
//----------------------------------
context.scale(20, 20);

Object.entries(audio).forEach(([key, audio]) => {
  audio.volume = 0.4;
  if (key === 'music') audio.loop = true;
});

audio.music.volume = 0.15;
audio.music.loop = true;

// Don't trigger if clicking HUD controls or overlays
canvas.addEventListener("pointerdown", () => {
  if (!audioMuted) {
    audio.music.play().catch(() => { });
  }
}, { once: true });


//----------------------------------
//  Helper Functions
//----------------------------------
// Helper function used to create the matrix to store the game pieces
function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

// Helper function used to display the matrix on the canvas
function drawMatrix(matrix, offset, overrideColor = null) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = overrideColor || colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
        context.strokeStyle = "#111";
        context.lineWidth = 0.05;
        context.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

// Helper function used to create the game pieces
function createPiece(type) {
  if (type === "T") return [[0, 0, 0], [1, 1, 1], [0, 1, 0]];
  if (type === "O") return [[2, 2], [2, 2]];
  if (type === "L") return [[0, 0, 3], [3, 3, 3], [0, 0, 0]];
  if (type === "J") return [[4, 0, 0], [4, 4, 4], [0, 0, 0]];
  if (type === "I") return [[0, 0, 0, 0], [5, 5, 5, 5], [0, 0, 0, 0], [0, 0, 0, 0]];
  if (type === "S") return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
  if (type === "Z") return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
}

// Helper function used to draw the canvas arena and player (pieces)
function draw() {
  context.fillStyle = "#041214ff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);

  // Flash the pieces
  if (performance.now() < flashUntil && flashCells.length) {
    const blinkOn = Math.floor(performance.now() / 80) % 2 === 0; // toggle ~12.5 fps
    if (blinkOn) {
      context.save();
      context.globalAlpha = 0.9;
      context.fillStyle = "#F7FBFF";
      flashCells.forEach(({ x, y }) => context.fillRect(x, y, 1, 1));
      context.restore();
    }
  }
}

// Helper function used to lock (merge) the player piece into the arena
function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
    });
  });
}

// Helper function used to detect arena/player collision
function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

// Helper function used to clear the arena line(s)
function arenaSweep() {
  const rows = [];
  for (let y = arena.length - 1; y >= 0; --y) {
    if (arena[y].every(v => v !== 0)) rows.push(y);
  }
  if (!rows.length) return;

  // Blink the full rows first
  flashCells = [];
  rows.forEach(y => {
    for (let x = 0; x < arena[y].length; x++) {
      if (arena[y][x] !== 0) flashCells.push({ x, y });
    }
  });
  flashUntil = performance.now() + 200;

  // After the blink, actually clear & score
  setTimeout(() => {
    rows.sort((a, b) => b - a).forEach(y => {
      const row = arena.splice(y, 1)[0].fill(0);
      arena.unshift(row);
    });

    const linesCleared = rows.length;
    const linePoints = [0, 100, 300, 500, 800];
    const earned = linePoints[linesCleared] * player.level;

    player.score += earned;
    player.lines += linesCleared;
    updateHUD();

    audio.clear.currentTime = 0;
    audio.clear.play();

    if (player.lines >= player.level * 5) {
      player.level++;
      audio.levelUp.currentTime = 0;
      audio.levelUp.play();
      dropInterval = Math.max(100, 1000 - (player.level - 1) * 10);
    }
  }, 200);
}

// Helper function used for "dropping" the player to the arena
function playerDrop() {
  player.pos.y++;

  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();

    if (player.lines >= player.level * 5) {
      audio.levelUp.currentTime = 0;
      audio.levelUp.play();
      player.level++;
      updateHUD();

      dropInterval = Math.max(100, 1000 - (player.level - 1) * 10);
      if (player.level > 100) endGame(true);
    }
  }

  dropCounter = 0;
}

// Helper function for the player "hard drop" feature
function hardDrop() {
  let dropDistance = 0;

  while (!collide(arena, player)) {
    player.pos.y++;
    dropDistance++;
  }
  player.pos.y--;
  merge(arena, player);

  player.score += dropDistance * 2;
  updateHUD();

  // Flash landed piece before resetting
  flashLandedBlocks(player.matrix, player.pos);

  // Delay game logic slightly to show a flash
  setTimeout(() => {
    playerReset();
    arenaSweep();

    if (player.lines >= player.level * 10) {
      player.level++;
      updateHUD();
      dropInterval = Math.max(100, 1000 - (player.level - 1) * 10);
      if (player.level > 100) endGame(true);
    }

    dropCounter = 0;
  }, 100);
}

// Helper function used to show that the block has landed; hard drops only
function flashLandedBlocks(matrix, pos, duration = 160) {
  flashCells = [];
  matrix.forEach((row, y) => {
    row.forEach((v, x) => {
      if (v !== 0) flashCells.push({ x: x + pos.x, y: y + pos.y });
    });
  });
  flashUntil = performance.now() + duration;
}

// Helper function to move the player left or right
function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

// Helper function to rotate the player
function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

// Helper function that assits with rotation
function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) matrix.forEach(row => row.reverse());
  else matrix.reverse();
}

// Helper function used to reset the player's position
function playerReset() {
  player.matrix = nextPiece;
  nextPiece = createPiece("TJLOSZI"[Math.floor(Math.random() * 7)]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

  document.getElementById("score-display").textContent = player.score;
  document.getElementById("level-display").textContent = player.level;

  if (collide(arena, player)) endGame(false);
}

// Helper method used to draw a preview of the next player piece
// Note: Functionality is currently not used for screen real estate purposes
function drawPreview() {
  const preview = document.getElementById("preview");
  const ctx = preview.getContext("2d");

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, preview.width, preview.height);
  ctx.scale(20, 20);

  const gridSize = 4;
  const pieceWidth = nextPiece[0].length;
  const pieceHeight = nextPiece.length;

  const offsetX = (gridSize - pieceWidth) / 2;
  const offsetY = (gridSize - pieceHeight) / 2;

  nextPiece.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 0.05;
        ctx.strokeRect(x + offsetX, y + offsetY, 1, 1);
      }
    });
  });
}

// Helper function used to update the HUD elements
function updateHUD() {
  document.getElementById("score-display").textContent = player.score;
  document.getElementById("level-display").textContent = player.level;
}

// Helper function used to show the help overlay 
function showHelp() {
  pauseGame();
  document.getElementById("help-overlay").classList.remove("hidden");
}

// Helper function used to hide the help overlay 
function closeHelp() {
  document.getElementById("help-overlay").classList.add("hidden");
  pauseGame();
}


//----------------------------------
//  Core Gameplay Logic
//----------------------------------
//  Used to update the timing, drop pieces, and redraw the game
function update(time = 0) {
  if (isPaused) return;

  const deltaTime = Math.min(time - lastTime, 100);
  lastTime = time;
  dropCounter += deltaTime;

  if (dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  requestAnimationFrame(update);
}

// Used to pause the game 
function pauseGame() {
  const pauseBtn = document.getElementById("pause-btn");
  const pauseOverlay = document.getElementById("pause-overlay");

  isPaused = !isPaused;

  pauseBtn.innerHTML = isPaused
    ? '<i class="fas fa-play"></i>'
    : '<i class="fas fa-pause"></i>';

  if (isPaused) {
    audio.music.pause();
    pauseOverlay.classList.remove("hidden");
  } else {
    audio.music.play().catch(() => { });
    pauseOverlay.classList.add("hidden");
    update();
  }
}

// Used to save handle the end of the game
function endGame(won) {
  localStorage.setItem("blocbuster_score", player.score);
  window.location.href = `gameover.html?${won ? "win" : "fail"}`;
}

//----------------------------------
//  Event Listeners
//----------------------------------
// Handles audio toggling
document.getElementById("audio-toggle").addEventListener("click", () => {
  audioMuted = !audioMuted;

  Object.values(audio).forEach(audio => {
    audio.muted = audioMuted;
  });

  const icon = document.querySelector("#audio-toggle i");
  icon.className = audioMuted ? "fas fa-volume-mute" : "fas fa-volume-up";
});

// Handles keyboard events
document.addEventListener("keydown", e => {
  if (isPaused) return;

  // Skip repeats only for rotation keys
  if (e.repeat && (e.key === "ArrowUp")) return;

  if (e.key === "ArrowLeft") playerMove(-1);
  if (e.key === "ArrowRight") playerMove(1);
  if (e.key === "ArrowDown") {
    playerDrop();
    updateHUD();
  }
  if (e.code === "Space") {
    hardDrop();
    updateHUD();
    player.score += 1;
  }
  if (e.key === "ArrowUp") playerRotate(1);
});

// Handles touch gesture events
canvas.addEventListener("touchstart", e => {
  if (e.touches.length !== 1) return;

  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
  startT = performance.now();
  lastStepX = startX;

  // Tap/hold to drop faster (soft drop)
  dropHoldTimer = setInterval(() => {
    playerDrop();
    updateHUD();
  }, 120);
}, { passive: true });

// Handles touch move events
canvas.addEventListener("touchmove", e => {
  if (startX === null || startY === null) return;

  const t = e.touches[0];
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;

  if (Math.abs(dx) > 12 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
    const stepDelta = t.clientX - lastStepX;
    if (Math.abs(stepDelta) >= 18) {
      const dir = stepDelta > 0 ? 1 : -1;
      playerMove(dir);
      lastStepX += dir * 18;
    }
  }
}, { passive: true });

// Handles touch end events
canvas.addEventListener("touchend", e => {
  clearInterval(dropHoldTimer);
  dropHoldTimer = null;

  if (startX === null || startY === null) return;

  const endX = e.changedTouches[0].clientX;
  const endY = e.changedTouches[0].clientY;
  const dx = endX - startX;
  const dy = endY - startY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const duration = performance.now() - startT;

  // Swipe detection (for quick moves only)
  if (Math.max(absX, absY) > (typeof swipeThreshold !== 'undefined' ? swipeThreshold : 24)) {
    if (absX > absY) {
      // Left or right swipe
      if (dx > 0) playerMove(1);
      else playerMove(-1);
    } else {
      if (dy < 0) {
        player.score += 1;
        hardDrop();
      }
    }
  } else {
    playerRotate(1);
  }

  startX = null;
  startY = null;
});

// Pause the game when user leaves the window
window.addEventListener("blur", () => {
  if (!isPaused) {
    pauseGame();
  }
});

//----------------------------------
//  Misc
//----------------------------------
// Reset player and start the game
playerReset();
update();