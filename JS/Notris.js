// Notris: totally not Tetris. Grey board, one colour per piece.
(function () {
  var ROWS = 20; // Rows count
  var COLUMNS = 10; // Column count
  var BLOCK_SIZE = 30; // Block size in px
  var PREVIEW_SIZE = 30; // Block size in the Hold and Next boxes
  var PREVIEW_SLOT = 105; // Height of one piece slot in the Hold and Next boxes
  var NEXT_COUNT = 3; // How many upcoming pieces to show
  var LOCK_DELAY = 500; // ms a landed piece waits before locking
  var MAX_LOCK_RESETS = 15; // Moves that can restart the lock delay, so a piece can't stall forever

  var BOARD_COLOUR = "#acacac";
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

  // One colour per piece, in the same order as SHAPES (the Z keeps the original red)
  var COLOURS = [
    [63, 193, 232], // Line: cyan
    [245, 211, 60], // Square: yellow
    [76, 195, 82], // S: green
    [255, 65, 54], // Z: red
    [176, 92, 224], // T: purple
    [255, 140, 26], // L: orange
    [61, 107, 240] // J: blue
  ];

  var canvas = document.getElementById("game-canvas");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("notris-score");
  var linesEl = document.getElementById("notris-lines");
  var levelEl = document.getElementById("notris-level");
  var bestEl = document.getElementById("notris-best");
  var nextCanvas = document.getElementById("notris-next");
  var holdCanvas = document.getElementById("notris-hold");
  var shakeTarget = document.querySelector("main") || document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var BEST_KEY = "notris-best";
  var board, piece, queue, heldType, canHold, score, best, newBest, lines, level;
  var dropTimer, lockTimer, lockResets, lastTime, paused, gameOver;

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

  function rgb(colour, alpha) {
    return "rgba(" + colour[0] + ", " + colour[1] + ", " + colour[2] + ", " + (alpha === undefined ? 1 : alpha) + ")";
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

  function grounded() {
    return !fits(piece.shape, piece.row + 1, piece.col);
  }

  function rotate(shape) {
    return shape[0].map(function (_, c) {
      return shape.map(function (row) { return row[c]; }).reverse();
    });
  }

  function rotateBack(shape) {
    return rotate(rotate(rotate(shape)));
  }

  // A move or turn while landed restarts the lock delay, up to MAX_LOCK_RESETS times
  function afterShift() {
    if (lockTimer > 0 && lockResets < MAX_LOCK_RESETS) {
      lockTimer = 0;
      lockResets++;
    }
  }

  function move(dCol, dRow) {
    if (fits(piece.shape, piece.row + dRow, piece.col + dCol)) {
      piece.row += dRow;
      piece.col += dCol;
      if (dCol) afterShift();
      return true;
    }
    return false;
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
        afterShift();
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
        board[piece.row + r][piece.col + c] = piece.type + 1;
      }
    }
    clearRows();
    spawnNext();
  }

  function resetTimers() {
    dropTimer = 0;
    lockTimer = 0;
    lockResets = 0;
  }

  function spawnPiece(type) {
    piece = newPiece(type);
    resetTimers();
    if (!fits(piece.shape, piece.row, piece.col)) endGame();
  }

  function spawnNext() {
    var type = queue.shift();
    queue.push(randomType());
    canHold = true;
    spawnPiece(type);
    drawSideBoxes();
  }

  // Swap the current piece into the hold slot, once per piece
  function hold() {
    if (!canHold) return;
    var current = piece.type;
    if (heldType === null) {
      heldType = current;
      spawnNext();
    } else {
      spawnPiece(heldType);
      heldType = current;
    }
    canHold = false;
    drawSideBoxes();
  }

  function clearRows() {
    var full = [];
    for (var row = 0; row < ROWS; row++) {
      if (board[row].every(function (block) { return block !== 0; })) full.push(row);
    }
    if (!full.length) return;

    full.forEach(function (row) {
      board.splice(row, 1);
      board.unshift(new Array(COLUMNS).fill(0));
    });

    lines += full.length;
    score += LINE_SCORES[full.length] * level;
    level = Math.floor(lines / 10) + 1;
    updateStats();
    lineClearEffect(full);
  }

  function softDrop() {
    if (move(0, 1)) {
      score += 1;
      updateStats();
      dropTimer = 0;
    }
    // Already landed: the lock delay in the loop decides when it locks
  }

  function hardDrop() {
    var distance = 0;
    while (move(0, 1)) distance++;
    score += distance * 2;
    updateStats();
    lockPiece();
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

  // Line clear: a gentle shake and hex codes bursting out of each cleared row
  function lineClearEffect(rows) {
    if (!reduceMotion.matches && shakeTarget.animate) {
      shakeTarget.animate(
        [
          { transform: "translate(0, 0)" },
          { transform: "translate(-4px, 2px)" },
          { transform: "translate(4px, -2px)" },
          { transform: "translate(-3px, -1px)" },
          { transform: "translate(2px, 1px)" },
          { transform: "translate(0, 0)" }
        ],
        { duration: 320, easing: "ease-out" }
      );
    }

    var rect = canvas.getBoundingClientRect();
    var rowHeight = rect.height / ROWS;
    var count = 8 + rows.length * 2;
    var distance = reduceMotion.matches ? 40 : 160;

    rows.forEach(function (row) {
      var y = rect.top + (row + 0.5) * rowHeight;
      for (var i = 0; i < count; i++) {
        var colour = [0, 0, 0].map(function () { return 60 + Math.floor(Math.random() * 196); });
        var hex = "#" + colour.map(function (v) { return v.toString(16).padStart(2, "0"); }).join("").toUpperCase();
        var bit = document.createElement("span");
        bit.className = "notris__hex";
        bit.textContent = hex;
        bit.style.color = rgb(colour);
        bit.style.left = rect.left + Math.random() * rect.width + "px";
        bit.style.top = y + "px";
        document.body.appendChild(bit);

        var angle = Math.random() * Math.PI * 2;
        var reach = distance * (0.5 + Math.random());
        var dx = Math.cos(angle) * reach;
        var dy = Math.sin(angle) * reach * 0.7;
        var spin = (Math.random() - 0.5) * 60;
        var animation = bit.animate(
          [
            { transform: "translate(-50%, -50%) scale(0.6)", opacity: 1 },
            { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) rotate(" + spin + "deg) scale(1.1)", opacity: 0 }
          ],
          { duration: 700 + Math.random() * 400, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }
        );
        animation.onfinish = bit.remove.bind(bit);
      }
    });
  }

  // Draws one piece centred in a box on a preview canvas
  function drawPieceIn(pctx, type, top, height, alpha) {
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
    var width = (Math.max.apply(null, cols) - minC + 1) * PREVIEW_SIZE;
    var tall = (Math.max.apply(null, rows) - minR + 1) * PREVIEW_SIZE;
    var offX = (pctx.canvas.width - width) / 2;
    var offY = top + (height - tall) / 2;
    pctx.globalAlpha = alpha;
    cells.forEach(function (p) {
      var x = offX + (p[1] - minC) * PREVIEW_SIZE;
      var y = offY + (p[0] - minR) * PREVIEW_SIZE;
      pctx.fillStyle = rgb(COLOURS[type]);
      pctx.fillRect(x, y, PREVIEW_SIZE, PREVIEW_SIZE);
      pctx.strokeStyle = "black";
      pctx.strokeRect(x, y, PREVIEW_SIZE, PREVIEW_SIZE);
    });
    pctx.globalAlpha = 1;
  }

  function drawSideBoxes() {
    var hctx = holdCanvas.getContext("2d");
    hctx.fillStyle = BOARD_COLOUR;
    hctx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (heldType !== null) drawPieceIn(hctx, heldType, 0, holdCanvas.height, canHold ? 1 : 0.45);

    var nctx = nextCanvas.getContext("2d");
    nctx.fillStyle = BOARD_COLOUR;
    nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    queue.forEach(function (type, i) {
      drawPieceIn(nctx, type, i * PREVIEW_SLOT, PREVIEW_SLOT, 1);
    });
  }

  // Row the current piece would land on if dropped now
  function ghostRow() {
    var row = piece.row;
    while (fits(piece.shape, row + 1, piece.col)) row++;
    return row;
  }

  function drawGhostBlock(x, y, colour) {
    ctx.fillStyle = rgb(colour, 0.18);
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = rgb(colour, 0.85);
    ctx.strokeRect(x * BLOCK_SIZE + 1.5, y * BLOCK_SIZE + 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3);
  }

  function drawBlock(x, y, colour) {
    ctx.fillStyle = rgb(colour);
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
        if (board[r][c]) drawBlock(c, r, COLOURS[board[r][c] - 1]);
      }
    }

    if (!gameOver) {
      var colour = COLOURS[piece.type];
      var landing = ghostRow();
      if (landing !== piece.row) {
        for (var gr = 0; gr < piece.shape.length; gr++) {
          for (var gc = 0; gc < piece.shape[gr].length; gc++) {
            if (piece.shape[gr][gc] && landing + gr >= 0) drawGhostBlock(piece.col + gc, landing + gr, colour);
          }
        }
      }
      for (var pr = 0; pr < piece.shape.length; pr++) {
        for (var pc = 0; pc < piece.shape[pr].length; pc++) {
          if (piece.shape[pr][pc] && piece.row + pr >= 0) drawBlock(piece.col + pc, piece.row + pr, colour);
        }
      }
    }

    if (gameOver) drawMessage(newBest ? "New best!" : "Game over", newBest ? "Score " + score + ". Enter to restart" : "Press Enter or tap Restart");
    else if (paused) drawMessage("Paused", "Press P or tap Pause");
  }

  function update(delta) {
    if (grounded()) {
      // Landed: wait LOCK_DELAY so there's time to slide or rotate it into place
      lockTimer += delta;
      if (lockTimer >= LOCK_DELAY) lockPiece();
      return;
    }
    lockTimer = 0;
    dropTimer += delta;
    if (dropTimer > dropInterval()) {
      move(0, 1);
      dropTimer = 0;
    }
  }

  function loop(time) {
    var delta = Math.min(time - (lastTime || time), 100);
    lastTime = time;
    if (!paused && !gameOver) update(delta);
    draw();
    requestAnimationFrame(loop);
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
    queue = [];
    for (var i = 0; i < NEXT_COUNT; i++) queue.push(randomType());
    score = 0;
    best = loadBest();
    newBest = false;
    lines = 0;
    level = 1;
    paused = false;
    gameOver = false;
    spawnNext();
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
