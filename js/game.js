const MAX_SCORE = 999999;
const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
const arena = createMatrix(12, 20);
const colors = [
  null,
  "#FF0D72",
  "#0DC2FF",
  "#0DFF72",
  "#F538FF",
  "#FF8E0D",
  "#FFE138",
  "#3877FF"
];
const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
  level: 1
};
let nextPiece = createPiece("TJLOSZI"[Math.floor(Math.random() * 7)]);
let isPaused = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

context.scale(20, 20);

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

function createPiece(type) {
  if (type === "T") return [[0, 0, 0], [1, 1, 1], [0, 1, 0]];
  if (type === "O") return [[2, 2], [2, 2]];
  if (type === "L") return [[0, 0, 3], [3, 3, 3], [0, 0, 0]];
  if (type === "J") return [[4, 0, 0], [4, 4, 4], [0, 0, 0]];
  if (type === "I") return [[0, 0, 0, 0], [5, 5, 5, 5], [0, 0, 0, 0], [0, 0, 0, 0]];
  if (type === "S") return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
  if (type === "Z") return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);

        context.strokeStyle = "#111";
        context.lineWidth = 0.05;
        context.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
    });
  });
}

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

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) continue outer;
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;
    player.score += rowCount * 10;
    player.score = Math.min(player.score, MAX_SCORE);
    document.getElementById("score-display").textContent = `Score: ${player.score}`;
    rowCount *= 2;
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    if (player.score >= player.level * 100) {
      player.level++;
      document.getElementById("level-display").textContent = `Level: ${player.level}`;
      dropInterval = Math.max(100, 1000 - (player.level - 1) * 10);
      if (player.level > 100) endGame(true);
    }
  }
  dropCounter = 0;
}

function hardDrop() {
  while (!collide(arena, player)) {
    player.pos.y++;
  }
  player.pos.y--;
  merge(arena, player);
  playerReset();
  arenaSweep();
  if (player.score >= player.level * 100) {
    player.level++;
    document.getElementById("level-display").textContent = `Level: ${player.level}`;
    dropInterval = Math.max(100, 1000 - (player.level - 1) * 10);
    if (player.level > 100) endGame(true);
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

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

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) matrix.forEach(row => row.reverse());
  else matrix.reverse();
}

function playerReset() { 
    
  player.matrix = nextPiece;
  nextPiece = createPiece("TJLOSZI"[Math.floor(Math.random() * 7)]);
  drawPreview();
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

  document.getElementById("score-display").textContent = `Score: ${player.score}`;
  document.getElementById("level-display").textContent = `Level: ${player.level}`;

  if (collide(arena, player)) endGame(false);
}

function drawPreview() {
  const preview = document.getElementById("preview");
  const ctx = preview.getContext("2d");

  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset scale
  ctx.clearRect(0, 0, preview.width, preview.height);
  ctx.scale(20, 20); // scale to grid size (1 unit = 20px)

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



function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}

function endGame(won) {
  localStorage.setItem("blocbuster_score", player.score);
  window.location.href = `gameover.html?${won ? "win" : "fail"}`;
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") playerMove(-1);
  if (e.key === "ArrowRight") playerMove(1);
  if (e.key === "ArrowDown") playerDrop();
  if (e.key === "ArrowUp") playerRotate(1);
  if (e.key === "q") playerRotate(-1);
});

document.getElementById("back-btn").addEventListener("click", () => {
  window.location.href = "index.html";
});

canvas.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }
});

canvas.addEventListener("touchend", e => {
  if (startX === null || startY === null) return;
  const endX = e.changedTouches[0].clientX;
  const endY = e.changedTouches[0].clientY;
  const dx = endX - startX;
  const dy = endY - startY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (Math.max(absX, absY) > 10) {
    if (absX > absY) {
      if (dx > 0) playerMove(1);
      else playerMove(-1);
    } else {
      if (dy > 0) playerDrop();
      else hardDrop();
    }
  } else {
    playerRotate(1);
  }
  startX = null;
  startY = null;
});

function pauseGame(){
    const pauseBtn = document.getElementById("pause-btn");
    isPaused = !isPaused;
    pauseBtn.innerHTML = isPaused
        ? '<i class="fas fa-play"></i>'
        : '<i class="fas fa-pause"></i>';

  if (!isPaused) update();
}

function update(time = 0) {
  if (isPaused) return;
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}


function restartGame(){
  arena.forEach(row => row.fill(0));
  player.score = 0;
  player.level = 1;
  dropInterval = 1000;
  document.getElementById("score-display").textContent = "Score 0";
  document.getElementById("level-display").textContent = "Level 1";
  playerReset();

  if (isPaused) {
    isPaused = false;
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    update();
  }
}

playerReset();
update();
