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

  var board, piece, score, lines, level, dropTimer, lastTime, paused, gameOver;

  function emptyBoard() {
    var rows = [];
    for (var i = 0; i < ROWS; i++) rows.push(new Array(COLUMNS).fill(0));
    return rows;
  }

  function newPiece() {
    var shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    return {
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

  function turn() {
    var turned = rotate(piece.shape);
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
    piece = newPiece();
    if (!fits(piece.shape, piece.row, piece.col)) endGame();
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
      for (var pr = 0; pr < piece.shape.length; pr++) {
        for (var pc = 0; pc < piece.shape[pr].length; pc++) {
          if (piece.shape[pr][pc] && piece.row + pr >= 0) drawBlock(piece.col + pc, piece.row + pr);
        }
      }
    }

    if (gameOver) drawMessage("Game over", "Press Enter or tap Restart");
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
  }

  function startGame() {
    board = emptyBoard();
    piece = newPiece();
    score = 0;
    lines = 0;
    level = 1;
    dropTimer = 0;
    paused = false;
    gameOver = false;
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
    else if (action === "rotate") turn();
    else if (action === "down") softDrop();
    else if (action === "drop") hardDrop();
  }

  var KEYS = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "rotate",
    ArrowDown: "down",
    " ": "drop",
    p: "pause",
    P: "pause",
    Enter: "restart"
  };

  window.addEventListener("keydown", function (event) {
    var action = KEYS[event.key];
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
