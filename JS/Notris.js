// Notris: totally not Tetris. Grey board, red blocks.
(function () {
  var ROWS = 20; // Rows count
  var COLUMNS = 10; // Column count
  var BLOCK_SIZE = 30; // Block size in px

  var BOARD_COLOUR = "#acacac";
  var BLOCK_COLOUR = "#FF4136";
  var LINE_SCORES = [0, 100, 300, 500, 800];

  var SHAPES = [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // Line piece
    [[1, 1], [1, 1]], // Square piece
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]], // S piece
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]], // Z piece
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]], // T piece
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]], // L piece
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]] // J piece
  ];

  var canvas = document.getElementById("game-canvas");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("notris-score");
  var linesEl = document.getElementById("notris-lines");
  var levelEl = document.getElementById("notris-level");
  var bestEl = document.getElementById("notris-best");
  var nextCanvas = document.getElementById("notris-next");
  var holdCanvas = document.getElementById("notris-hold");

  var BEST_KEY = "notris-best";
  var board, piece, nextType, heldType, canHold, score, best, newBest, lines, level, dropTimer, lastTime, paused, gameOver;

  // Best score is kept in this browser only; storage can be blocked, so never rely on it
  function loadBest() {
    try {
      return parseInt(localStorage.getItem(BEST_KEY), 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(value) {
    try {
      localStorage.setItem(BEST_KEY, String(value));
    } catch (e) {}
  }

  function emptyBoard() {
    var rows = [];
    for (var i = 0; i < ROWS; i++) rows.push(new Array(COLUMNS).fill(0));
    return rows;
  }

  function randomType() {
    return Math.floor(Math.random() * SHAPES.length);
  }

  function newPiece(type) {
    var shape = SHAPES[type];
    return {
      type: type,
      shape: shape.map(function (row) { return row.slice(); }),
      row: 0,
      col: Math.floor((COLUMNS - shape[0].length) / 2)
    };
  }

  // True when the shape fits at (row, col) without leaving the board or overlapping blocks
  function fits(shape, row, col) {
    for (var r = 0; r < shape.length; r++) {
      for (var c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        var y = row + r;
        var x = col + c;
        if (x < 0 || x >= COLUMNS || y >= ROWS) return false;
        if (y >= 0 && board[y][x]) return false;
      }
    }
    return true;
  }

  function rotate(shape) {
    return shape[0].map(function (_, c) {
      return shape.map(function (row) { return row[c]; }).reverse();
    });
  }

  function move(dCol, dRow) {
    if (fits(piece.shape, piece.row + dRow, piece.col + dCol)) {
      piece.row += dRow;
      piece.col += dCol;
      return true;
    }
    return false;
  }

  function rotateBack(shape) {
    return rotate(rotate(rotate(shape)));
  }

  // direction 1 = clockwise, -1 = anticlockwise
  function turn(direction) {
    var turned = direction === -1 ? rotateBack(piece.shape) : rotate(piece.shape);
    // Nudge sideways if the rotation hits a wall
    var kicks = [0, -1, 1, -2, 2];
    for (var i = 0; i < kicks.length; i++) {
      if (fits(turned, piece.row, piece.col + kicks[i])) {
        piece.shape = turned;
        piece.col += kicks[i];
        return;
      }
    }
  }

  function lockPiece() {
    for (var r = 0; r < piece.shape.length; r++) {
      for (var c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        if (piece.row + r < 0) {
          endGame();
          return;
        }
        board[piece.row + r][piece.col + c] = 1;
      }
    }
    clearRows();
    spawnNext();
  }

  function spawnNext() {
    piece = newPiece(nextType);
    nextType = randomType();
    canHold = true;
    drawPreview(nextCanvas, nextType);
    drawPreview(holdCanvas, heldType);
    if (!fits(piece.shape, piece.row, piece.col)) endGame();
  }

  // Swap the current piece into the hold slot, once per piece
  function hold() {
    if (!canHold) return;
    var current = piece.type;
    if (heldType === null) {
      heldType = current;
      spawnNext();
    } else {
      piece = newPiece(heldType);
      heldType = current;
      if (!fits(piece.shape, piece.row, piece.col)) endGame();
    }
    canHold = false;
    drawPreview(holdCanvas, heldType);
    dropTimer = 0;
  }

  function clearRows() {
    var cleared = 0;
    for (var row = ROWS - 1; row >= 0; row--) {
      if (board[row].every(function (block) { return block !== 0; })) {
        board.splice(row, 1);
        board.unshift(new Array(COLUMNS).fill(0));
        cleared++;
        row++; // Check the same row again after shifting down
      }
    }
    if (cleared) {
      lines += cleared;
      score += LINE_SCORES[cleared] * level;
      level = Math.floor(lines / 10) + 1;
      updateStats();
    }
  }

  function softDrop() {
    if (move(0, 1)) {
      score += 1;
      updateStats();
    } else {
      lockPiece();
    }
    dropTimer = 0;
  }

  function hardDrop() {
    var distance = 0;
    while (move(0, 1)) distance++;
    score += distance * 2;
    updateStats();
    lockPiece();
    dropTimer = 0;
  }

  function dropInterval() {
    return Math.max(100, 800 - (level - 1) * 70);
  }

  function updateStats() {
    scoreEl.textContent = score;
    linesEl.textContent = lines;
    levelEl.textContent = level;
    bestEl.textContent = Math.max(best, score);
  }

  // Draws one piece centred in a small box, used for Next and Hold
  function drawPreview(target, type) {
    var pctx = target.getContext("2d");
    var size = 20;
    pctx.fillStyle = BOARD_COLOUR;
    pctx.fillRect(0, 0, target.width, target.height);
    if (type === null) return;
    var shape = SHAPES[type];
    var cells = [];
    for (var r = 0; r < shape.length; r++) {
      for (var c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) cells.push([r, c]);
      }
    }
    var rows = cells.map(function (p) { return p[0]; });
    var cols = cells.map(function (p) { return p[1]; });
    var minR = Math.min.apply(null, rows);
    var minC = Math.min.apply(null, cols);
    var width = (Math.max.apply(null, cols) - minC + 1) * size;
    var height = (Math.max.apply(null, rows) - minR + 1) * size;
    var offX = (target.width - width) / 2;
    var offY = (target.height - height) / 2;
    if (target === holdCanvas && !canHold) pctx.globalAlpha = 0.45;
    cells.forEach(function (p) {
      var x = offX + (p[1] - minC) * size;
      var y = offY + (p[0] - minR) * size;
      pctx.fillStyle = BLOCK_COLOUR;
      pctx.fillRect(x, y, size, size);
      pctx.strokeStyle = "black";
      pctx.strokeRect(x, y, size, size);
    });
    pctx.globalAlpha = 1;
  }

  // Row the current piece would land on if dropped now
  function ghostRow() {
    var row = piece.row;
    while (fits(piece.shape, row + 1, piece.col)) row++;
    return row;
  }

  function drawGhostBlock(x, y) {
    ctx.fillStyle = "rgba(255, 65, 54, 0.18)";
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = "rgba(255, 65, 54, 0.8)";
    ctx.strokeRect(x * BLOCK_SIZE + 1.5, y * BLOCK_SIZE + 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3);
  }

  function drawBlock(x, y) {
    ctx.fillStyle = BLOCK_COLOUR;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = "black";
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  }

  function drawMessage(title, hint) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, canvas.height / 2 - 60, canvas.width, 120);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 32px Rubik, sans-serif";
    ctx.fillText(title, canvas.width / 2, canvas.height / 2);
    ctx.font = "16px Rubik, sans-serif";
    ctx.fillText(hint, canvas.width / 2, canvas.height / 2 + 32);
  }

  function draw() {
    ctx.fillStyle = BOARD_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLUMNS; c++) {
        if (board[r][c]) drawBlock(c, r);
      }
    }

    if (!gameOver) {
      var landing = ghostRow();
      if (landing !== piece.row) {
        for (var gr = 0; gr < piece.shape.length; gr++) {
          for (var gc = 0; gc < piece.shape[gr].length; gc++) {
            if (piece.shape[gr][gc] && landing + gr >= 0) drawGhostBlock(piece.col + gc, landing + gr);
          }
        }
      }
      for (var pr = 0; pr < piece.shape.length; pr++) {
        for (var pc = 0; pc < piece.shape[pr].length; pc++) {
          if (piece.shape[pr][pc] && piece.row + pr >= 0) drawBlock(piece.col + pc, piece.row + pr);
        }
      }
    }

    if (gameOver) drawMessage(newBest ? "New best!" : "Game over", newBest ? "Score " + score + ". Enter to restart" : "Press Enter or tap Restart");
    else if (paused) drawMessage("Paused", "Press P or tap Pause");
  }

  function loop(time) {
    var delta = time - (lastTime || time);
    lastTime = time;
    if (!paused && !gameOver) {
      dropTimer += delta;
      if (dropTimer > dropInterval()) softDropByGravity();
    }
    draw();
    requestAnimationFrame(loop);
  }

  // Gravity moves the piece down without adding soft-drop points
  function softDropByGravity() {
    if (!move(0, 1)) lockPiece();
    dropTimer = 0;
  }

  function endGame() {
    gameOver = true;
    newBest = score > best;
    if (newBest) {
      best = score;
      saveBest(best);
    }
    updateStats();
  }

  function startGame() {
    board = emptyBoard();
    heldType = null;
    nextType = randomType();
    score = 0;
    best = loadBest();
    newBest = false;
    lines = 0;
    level = 1;
    dropTimer = 0;
    paused = false;
    gameOver = false;
    spawnNext();
    drawPreview(holdCanvas, null);
    updateStats();
  }

  function togglePause() {
    if (!gameOver) paused = !paused;
  }

  function act(action) {
    if (action === "restart") return startGame();
    if (action === "pause") return togglePause();
    if (paused || gameOver) return;
    if (action === "left") move(-1, 0);
    else if (action === "right") move(1, 0);
    else if (action === "rotate") turn(1);
    else if (action === "rotate-back") turn(-1);
    else if (action === "down") softDrop();
    else if (action === "drop") hardDrop();
    else if (action === "hold") hold();
  }

  // Matched on the physical key, so WASD works with Caps Lock on
  var KEYS = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ArrowUp: "rotate",
    KeyW: "rotate",
    KeyC: "rotate-back",
    ArrowDown: "down",
    KeyS: "down",
    Space: "drop",
    ShiftLeft: "hold",
    KeyP: "pause",
    Enter: "restart",
    NumpadEnter: "restart"
  };

  window.addEventListener("keydown", function (event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    var action = KEYS[event.code];
    if (!action) return;
    if (action === "restart" && !gameOver) return;
    event.preventDefault(); // Stop arrows and space scrolling the page
    act(action);
  });

  document.querySelectorAll("[data-notris]").forEach(function (button) {
    button.addEventListener("click", function () {
      act(button.getAttribute("data-notris"));
      button.blur();
    });
  });

  // Pause when the tab is hidden so pieces don't pile up in the background
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && !gameOver) paused = true;
  });

  startGame();
  requestAnimationFrame(loop);
})();
