
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

drawBoard()