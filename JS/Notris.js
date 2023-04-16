
const ROWS = 20; 		//Rows Count
const COLUMNS = 10; 	//Column count
const BLOCK_SIZE = 30; 	// block size in PX

const SHAPES = [
  [
    [1, 1, 1, 1], //Line Peice [0][*]
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  [
    [1, 1, 0], //Square peice [1][*]
    [1, 1, 0],
    [0, 0, 0]
  ],
  [
    [1, 0, 0],//S peice [2][*]
    [1, 1, 0],
    [0, 1, 0]
  ],
  [
    [0, 0, 1], //Z peice [3][*]
    [0, 1, 1],
    [0, 1, 0]
  ],
  [
    [0, 0, 0], //t peice [4][*]
    [0, 1, 0],
    [1, 1, 1]
  ],
  [
    [1, 0, 0], //l peice [5][*]
    [1, 0, 0],
    [1, 1, 0]
  ],
  [
    [1, 1, 0], //r peice [6][*]
    [1, 0, 0],
    [1, 0, 0]
  ],
];



var board = [];
//initialise, Check, Continue
for (var i = 0; i < ROWS; i++) 
	{
		
	board[i] = []; //gives us [[],[],[],[]..x20]
	
	for (var j = 0; j < COLUMNS; j++) 
		{
			
		board[i][j] = 0; // 0 represents an empty block
		
		} 
	}
	
// we end up with 
//[
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0],
//[0,0,0,0,0,0,0,0,0,0]
//]

//-=--=-=-=-=-=-=-=-=-=-

let canvas = document.getElementById("game-canvas");
let ctx = canvas.getContext("2d");

function drawBoard() 
{
  for (let i = 0; i < ROWS; i++) 
  {
    for (let j = 0; j < COLUMNS; j++) 
	{
      if (board[i][j] === 1) 
	  {
        ctx.fillStyle = "#FF4136"; // red
        ctx.fillRect(j * BLOCK_SIZE, i * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
      else 
	  {
        ctx.fillStyle = "#acacac";
        ctx.fillRect(j * BLOCK_SIZE, i * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }
}

function newPiece() {
  let shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  let piece = new Piece(shape);
  return piece;
}

class Piece {
  constructor(shape) {
    this.shape = shape;
    this.row = 0;
    this.col = Math.floor(COLUMNS / 2) - Math.floor(shape[0].length / 2);
  }
}

function drawPiece(piece) {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col] !== 0) {
        let x = (piece.col + col) * BLOCK_SIZE;
        let y = (piece.row + row) * BLOCK_SIZE;
        drawBlock(x, y);
      }
    }
  }
}

function drawBlock(x, y) {
  ctx.fillStyle = "red";
  ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeStyle = "black";
  ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
}

function update() {
  if (canMoveDown(currentPiece)) {
    currentPiece.row++;
  } else {
    addToBoard(currentPiece);
	clearRows()
	isGameOver()
    currentPiece = newPiece();
  }
}

function canMoveDown(piece) {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col] !== 0) {
        let nextRow = piece.row + row + 1;
        if (nextRow >= ROWS || board[nextRow][piece.col + col] !== 0) {
          return false;
        }
      }
    }
  }
  return true;
}

function addToBoard(piece) {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col] !== 0) {
        board[piece.row + row][piece.col + col] = piece.color;
      }
    }
  }
}

function clearRows() {
  let rowsCleared = 0;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every(block => block !== 0)) {
      board.splice(row, 1);
      board.unshift(new Array(COLS).fill(0));
      rowsCleared++;
      row++;
    }
  }
  return rowsCleared;
}


function handleInput(event) {
  switch (event.keyCode) {
    case LEFT_ARROW:
      currentPiece.moveLeft();
      if (isValidMove(currentPiece)) {
        update();
      } else {
        currentPiece.moveRight();
      }
      break;
    case RIGHT_ARROW:
      currentPiece.moveRight();
      if (isValidMove(currentPiece)) {
        update();
      } else {
        currentPiece.moveLeft();
      }
      break;
    case DOWN_ARROW:
      currentPiece.moveDown();
      if (isValidMove(currentPiece)) {
        update();
      } else {
        addToBoard(currentPiece);
        const rowsCleared = clearRows();
        score += SCORE_PER_ROW * rowsCleared;
        updateScore();
        if (isGameOver()) {
          alert("Game Over");
          resetGame();
        } else {
          spawnPiece();
        }
      }
      break;
    case UP_ARROW:
      currentPiece.rotate();
      if (isValidMove(currentPiece)) {
        update();
      } else {
        currentPiece.rotate(-1);
      }
      break;
  }
}

function draw() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the game board
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const block = board[row][col];
      if (block !== 0) {
        drawBlock(col, row, COLORS[block - 1]);
      }
    }
  }

  // Draw the current piece
  for (let row = 0; row < currentPiece.shape.length; row++) {
    for (let col = 0; col < currentPiece.shape[row].length; col++) {
      const block = currentPiece.shape[row][col];
      if (block !== 0) {
        drawBlock(currentPiece.x + col, currentPiece.y + row, COLORS[currentPiece.color - 1]);
      }
    }
  }
}

function startGame() {
  // Initialize the game state
  board = new Array(ROWS).fill().map(() => new Array(COLS).fill(0));
  currentPiece = newPiece();
  score = 0;

  // Start the game loop
  let lastTime = 0;
  function loop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}


drawBoard()

window.addEventListener("keydown", handleInput);

setInterval(update, 2000); // calls the update() function every 1000 milliseconds (i.e. 1 second)
