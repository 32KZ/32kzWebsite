let selectedPiece = null;

// Board configuration
let board = [
  ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
  ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
  ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
];

function drawBoard() {
    let boardElem = document.getElementById('board');
    boardElem.innerHTML = '';

    for(let i = 0; i < 8; i++) {
        let rowElem = document.createElement('tr');

        for(let j = 0; j < 8; j++) {
            let cellElem = document.createElement('td');
            cellElem.textContent = board[i][j];
            cellElem.addEventListener('click', () => {
                if(selectedPiece !== null) {
                    board[i][j] = selectedPiece;
                    selectedPiece = null;
                    drawBoard();
                } else if (board[i][j] !== '') {
                    selectedPiece = board[i][j];
                    board[i][j] = '';
                    drawBoard();
                }
            });
            rowElem.appendChild(cellElem);
        }
        boardElem.appendChild(rowElem);
    }
}

window.onload = () => {
    drawBoard();

    let pieces = document.getElementsByClassName('piece');
    for(let i = 0; i < pieces.length; i++) {
        pieces[i].addEventListener('click', (e) => {
            selectedPiece = e.target.getAttribute('data-piece');
        });
    }
};
