/* 
  Modified Chess Game with Prime Rook Moves, Game Menu, Logout, Notifications, and Advanced Rules:
  - Friendly rooks can only move a prime number of squares (allowed: 2, 3, 5, or 7).
  - Queen moves remain standard.
  - Castling logic checks every square along the king’s path.
  - Notifications appear at the bottom-right instead of using alert dialogs.
  - Endgame notifications (checkmate, stalemate, etc.) are delayed briefly.
*/

/* ----- DOM ELEMENTS ----- */
const boardElement = document.getElementById("chessboard");
const promotionModal = document.getElementById("promotionModal");
const promotionChoices = document.querySelectorAll(".promotionChoice");
const whiteClockEl = document.getElementById("whiteClock");
const blackClockEl = document.getElementById("blackClock");

/* ----- GAME STATE VARIABLES ----- */
let board = [];
let currentPlayer = "white";
let selectedPiece = null;
let selectedPos = null;
let moveHistory = [];
let boardHistory = [];
let fiftyMoveCounter = 0;
let enPassantTarget = null;

/* ----- CLOCK VARIABLES ----- */
let whiteTime = 300; // 5 minutes default
let blackTime = 300;
let clockInterval = null;

/* ----- DRAGGING STATE ----- */
let draggingPieceEl = null;
let dragOffset = { x: 0, y: 0 };
let dragStartPos = null;

/* ----- HELPER: Check if number is prime ----- */
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

/* ----- NOTIFICATION FUNCTION ----- */
function showNotification(message, duration = 3000) {
  const container = document.getElementById("notification-container");
  if (!container) {
    console.log(message);
    return;
  }
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerText = message;
  container.appendChild(notification);
  setTimeout(() => {
    notification.classList.add("fade-out");
    notification.addEventListener("transitionend", () => {
      notification.remove();
    });
  }, duration);
}

/* ----- CLOCK FUNCTIONS ----- */
function startClock() {
  clearInterval(clockInterval);
  clockInterval = setInterval(() => {
    if (currentPlayer === "white") {
      whiteTime--;
      if (whiteTime <= 0) {
        clearInterval(clockInterval);
        showNotification("Time's up! Black wins.");
        resetGame();
        return;
      }
    } else {
      blackTime--;
      if (blackTime <= 0) {
        clearInterval(clockInterval);
        showNotification("Time's up! White wins.");
        resetGame();
        return;
      }
    }
    updateClockDisplay();
  }, 1000);
}

function updateClockDisplay() {
  whiteClockEl.innerText = formatTime(whiteTime);
  blackClockEl.innerText = formatTime(blackTime);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
}

/* ----- INITIALIZATION ----- */
function initializeBoard() {
  board = Array(8).fill(null).map(() => Array(8).fill(null));
  // Pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = createPiece("pawn", "black");
    board[6][i] = createPiece("pawn", "white");
  }
  // Rooks
  board[0][0] = createPiece("rook", "black");
  board[0][7] = createPiece("rook", "black");
  board[7][0] = createPiece("rook", "white");
  board[7][7] = createPiece("rook", "white");
  // Knights
  board[0][1] = createPiece("knight", "black");
  board[0][6] = createPiece("knight", "black");
  board[7][1] = createPiece("knight", "white");
  board[7][6] = createPiece("knight", "white");
  // Bishops
  board[0][2] = createPiece("bishop", "black");
  board[0][5] = createPiece("bishop", "black");
  board[7][2] = createPiece("bishop", "white");
  board[7][5] = createPiece("bishop", "white");
  // Queens
  board[0][3] = createPiece("queen", "black");
  board[7][3] = createPiece("queen", "white");
  // Kings
  board[0][4] = createPiece("king", "black");
  board[7][4] = createPiece("king", "white");

  moveHistory = [];
  boardHistory = [];
  fiftyMoveCounter = 0;
  enPassantTarget = null;
  selectedPiece = null;
  selectedPos = null;
  currentPlayer = "white";
  whiteTime = 300;
  blackTime = 300;
  drawBoard();
  updateBoardHistory();
}

function resetGame() {
  clearInterval(clockInterval);
  initializeBoard();
}

/* ----- PIECE CREATION ----- */
function createPiece(type, color) {
  return { type, color, hasMoved: false };
}

/* ----- DRAWING THE BOARD ----- */
function drawBoard() {
  boardElement.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.dataset.row = row;
      square.dataset.col = col;
      square.classList.add((row + col) % 2 === 0 ? "light" : "dark");
      if (selectedPos && selectedPos.row === row && selectedPos.col === col) {
        square.classList.add("selected");
      }
      if (board[row][col] && board[row][col].type === "king") {
        if (isSquareAttacked(board, { row, col }, getOpponent(board[row][col].color))) {
          square.classList.add("in-check");
        }
      }
      if (board[row][col]) {
        const pieceEl = document.createElement("img");
        pieceEl.classList.add("piece-img", board[row][col].color, board[row][col].type);
        pieceEl.src = getPieceImageSrc(board[row][col]);
        pieceEl.alt = board[row][col].type;
        pieceEl.addEventListener("mousedown", onPieceMouseDown);
        square.appendChild(pieceEl);
      }
      square.addEventListener("click", onSquareClick);
      boardElement.appendChild(square);
    }
  }
}

function getPieceImageSrc(piece) {
  return `assets/${piece.color}_${piece.type}.png`;
}

/* ----- CLICK HANDLING ----- */
function onSquareClick(e) {
  if (draggingPieceEl) return;
  const row = parseInt(e.currentTarget.dataset.row);
  const col = parseInt(e.currentTarget.dataset.col);
  if (board[row][col] && board[row][col].color === currentPlayer) {
    selectedPiece = board[row][col];
    selectedPos = { row, col };
  } else if (selectedPiece) {
    const move = {
      from: { row: selectedPos.row, col: selectedPos.col },
      to: { row, col },
      piece: selectedPiece,
    };
    if (isLegalMove(board, move, currentPlayer)) {
      makeMove(move);
    } else {
      showNotification("Illegal move attempted");
    }
    selectedPiece = null;
    selectedPos = null;
  }
  drawBoard();
}

/* ----- DRAG-TO-MOVE HANDLING ----- */
function onPieceMouseDown(e) {
  const square = e.target.parentElement;
  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  if (board[row][col].color !== currentPlayer) return;
  selectedPiece = board[row][col];
  selectedPos = { row, col };
  dragStartPos = { row, col };
  draggingPieceEl = e.target.cloneNode(true);
  draggingPieceEl.classList.add("dragging");
  document.body.appendChild(draggingPieceEl);
  const rect = e.target.getBoundingClientRect();
  dragOffset.x = e.pageX - rect.left;
  dragOffset.y = e.pageY - rect.top;
  drawBoard();
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e) {
  if (draggingPieceEl) {
    draggingPieceEl.style.left = (e.pageX - dragOffset.x) + "px";
    draggingPieceEl.style.top = (e.pageY - dragOffset.y) + "px";
  }
}

function onMouseUp(e) {
  if (!draggingPieceEl) return;
  const boardRect = boardElement.getBoundingClientRect();
  const x = e.pageX - boardRect.left;
  const y = e.pageY - boardRect.top;
  const col = Math.floor(x / 80);
  const row = Math.floor(y / 80);
  if (row >= 0 && row < 8 && col >= 0 && col < 8) {
    const move = {
      from: { row: dragStartPos.row, col: dragStartPos.col },
      to: { row, col },
      piece: selectedPiece,
    };
    if (move.piece.type === "king" && Math.abs(move.to.col - move.from.col) === 2) {
      move.castle = move.to.col > move.from.col ? "kingside" : "queenside";
    }
    if (isLegalMove(board, move, currentPlayer)) {
      makeMove(move);
    } else {
      showNotification("Illegal move attempted via drag");
    }
  }
  document.body.removeChild(draggingPieceEl);
  draggingPieceEl = null;
  dragStartPos = null;
  selectedPiece = null;
  selectedPos = null;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  drawBoard();
}

/* ----- MAKING MOVES ----- */
function makeMove(move) {
  if (isCastlingMove(move)) {
    performCastle(move);
  } else if (isEnPassantMove(move)) {
    performEnPassant(move);
  } else {
    board[move.to.row][move.to.col] = move.piece;
    board[move.from.row][move.from.col] = null;
    if (move.piece.type === "pawn" && isLastRank(move.to, move.piece.color)) {
      showPromotionModal(move);
      return;
    }
  }
  move.piece.hasMoved = true;
  handlePawnDoubleStep(move);
  moveHistory.push(move);
  updateFiftyMoveCounter(move);
  updateBoardHistory();
  currentPlayer = getOpponent(currentPlayer);
  startClock();
  setTimeout(() => {
    if (checkForCheckmate(board, currentPlayer)) {
      showNotification("Checkmate! " + getOpponent(currentPlayer) + " wins.");
      clearInterval(clockInterval);
      resetGame();
      return;
    } else if (checkForStalemate(board, currentPlayer)) {
      showNotification("Stalemate!");
      clearInterval(clockInterval);
      resetGame();
      return;
    } else if (isThreefoldRepetition()) {
      showNotification("Draw by threefold repetition!");
      clearInterval(clockInterval);
      resetGame();
      return;
    } else if (isFiftyMoveRule()) {
      showNotification("Draw by fifty-move rule!");
      clearInterval(clockInterval);
      resetGame();
      return;
    }
  }, 500);
  selectedPiece = null;
  selectedPos = null;
  drawBoard();
}

/* ----- MOVE VALIDATION ----- */
function isLegalMove(board, move, color) {
  const moves = generateMovesForPiece(board, move.from);
  const legal = moves.some(
    (m) => m.to.row === move.to.row && m.to.col === move.to.col
  );
  if (!legal) {
    console.log("Move not in generated moves:", move);
    return false;
  }
  const newBoard = cloneBoard(board);
  newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
  newBoard[move.from.row][move.from.col] = null;
  const kingPos = findKing(newBoard, color);
  if (!kingPos) {
    console.log("King not found after move:", move);
    return false;
  }
  if (!isKingSafe(newBoard, color)) {
    console.log("King would be in check after move:", move, "King at:", kingPos);
    return false;
  }
  return true;
}

/* ----- MOVE GENERATION ----- */
function generateMovesForPiece(board, pos) {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];
  let moves = [];
  switch (piece.type) {
    case "pawn":
      moves = generatePawnMoves(board, pos, piece);
      break;
    case "rook":
      moves = generateRookMoves(board, pos, piece);
      break;
    case "knight":
      moves = generateKnightMoves(board, pos, piece);
      break;
    case "bishop":
      moves = generateBishopMoves(board, pos, piece);
      break;
    case "queen":
      moves = generateRookMovesDefault(board, pos, piece).concat(
        generateBishopMoves(board, pos, piece)
      );
      break;
    case "king":
      moves = generateKingMoves(board, pos, piece);
      moves = moves.concat(generateCastlingMoves(board, pos, piece));
      break;
  }
  return moves;
}

function generatePawnMoves(board, pos, piece) {
  let moves = [];
  let direction = piece.color === "white" ? -1 : 1;
  let startRow = piece.color === "white" ? 6 : 1;
  let nextRow = pos.row + direction;
  if (isInBounds(nextRow, pos.col) && board[nextRow][pos.col] === null) {
    moves.push({ from: pos, to: { row: nextRow, col: pos.col }, piece });
    if (
      pos.row === startRow &&
      isInBounds(nextRow + direction, pos.col) &&
      board[nextRow + direction][pos.col] === null
    ) {
      moves.push({
        from: pos,
        to: { row: nextRow + direction, col: pos.col },
        piece,
      });
    }
  }
  for (let dc of [-1, 1]) {
    let newCol = pos.col + dc;
    if (isInBounds(nextRow, newCol)) {
      if (board[nextRow][newCol] && board[nextRow][newCol].color !== piece.color) {
        moves.push({ from: pos, to: { row: nextRow, col: newCol }, piece });
      }
      if (
        board[nextRow][newCol] === null &&
        enPassantTarget &&
        enPassantTarget.row === nextRow &&
        enPassantTarget.col === newCol
      ) {
        moves.push({ from: pos, to: { row: nextRow, col: newCol }, piece, enPassant: true });
      }
    }
  }
  return moves;
}

/* Modified Rook Moves: For friendly rooks, allow moves only if the number of squares moved is prime (2, 3, 5, or 7) */
function generateRookMoves(board, pos, piece) {
  let moves = [];
  let directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  directions.forEach((d) => {
    let r = pos.row;
    let c = pos.col;
    let steps = 0;
    while (true) {
      r += d[0];
      c += d[1];
      steps++;
      if (!isInBounds(r, c)) break;
      if (isPrime(steps)) {
        if (board[r][c] === null) {
          moves.push({ from: pos, to: { row: r, col: c }, piece });
        } else {
          if (board[r][c].color !== piece.color) {
            moves.push({ from: pos, to: { row: r, col: c }, piece });
          }
          break;
        }
      } else {
        if (board[r][c] !== null) break;
      }
    }
  });
  return moves;
}

/* Default Rook Moves for queen moves and enemy attack detection (no prime restriction) */
function generateRookMovesDefault(board, pos, piece) {
  let moves = [];
  let directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  directions.forEach((d) => {
    let r = pos.row;
    let c = pos.col;
    while (true) {
      r += d[0];
      c += d[1];
      if (!isInBounds(r, c)) break;
      if (board[r][c] === null) {
        moves.push({ from: pos, to: { row: r, col: c }, piece });
      } else {
        moves.push({ from: pos, to: { row: r, col: c }, piece });
        break;
      }
    }
  });
  return moves;
}

function generateKnightMoves(board, pos, piece) {
  let moves = [];
  let offsets = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];
  offsets.forEach((o) => {
    let r = pos.row + o[0];
    let c = pos.col + o[1];
    if (isInBounds(r, c) && (!board[r][c] || board[r][c].color !== piece.color)) {
      moves.push({ from: pos, to: { row: r, col: c }, piece });
    }
  });
  return moves;
}

function generateBishopMoves(board, pos, piece) {
  let moves = [];
  let directions = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  directions.forEach((d) => {
    let r = pos.row;
    let c = pos.col;
    while (true) {
      r += d[0];
      c += d[1];
      if (!isInBounds(r, c)) break;
      if (board[r][c] === null) {
        moves.push({ from: pos, to: { row: r, col: c }, piece });
      } else {
        if (board[r][c].color !== piece.color)
          moves.push({ from: pos, to: { row: r, col: c }, piece });
        break;
      }
    }
  });
  return moves;
}

function generateQueenMoves(board, pos, piece) {
  // Queen moves = default rook moves (no prime restriction) + bishop moves
  return generateRookMovesDefault(board, pos, piece).concat(
    generateBishopMoves(board, pos, piece)
  );
}

function generateKingMoves(board, pos, piece) {
  let moves = [];
  for (let r = pos.row - 1; r <= pos.row + 1; r++) {
    for (let c = pos.col - 1; c <= pos.col + 1; c++) {
      if (r === pos.row && c === pos.col) continue;
      if (isInBounds(r, c) && (!board[r][c] || board[r][c].color !== piece.color)) {
        moves.push({ from: pos, to: { row: r, col: c }, piece });
      }
    }
  }
  return moves;
}

function generateCastlingMoves(board, pos, king) {
  let moves = [];
  if (king.hasMoved) return moves;
  if (canCastle(board, king, { side: "kingside", pos })) {
    moves.push({
      from: pos,
      to: { row: pos.row, col: pos.col + 2 },
      piece: king,
      castle: "kingside",
    });
  }
  if (canCastle(board, king, { side: "queenside", pos })) {
    moves.push({
      from: pos,
      to: { row: pos.row, col: pos.col - 2 },
      piece: king,
      castle: "queenside",
    });
  }
  return moves;
}

/* ----- CASTLING LOGIC ----- */
function canCastle(board, king, { side, pos }) {
  let row = pos.row;
  if (king.hasMoved) return false;
  if (side === "kingside") {
    let rook = board[row][7];
    if (!rook || rook.type !== "rook" || rook.hasMoved) return false;
    if (board[row][5] !== null || board[row][6] !== null) return false;
    if (
      !isSquareSafeForKing(board, { row, col: 4 }, king.color) ||
      !isSquareSafeForKing(board, { row, col: 5 }, king.color) ||
      !isSquareSafeForKing(board, { row, col: 6 }, king.color)
    )
      return false;
    return true;
  } else if (side === "queenside") {
    let rook = board[row][0];
    if (!rook || rook.type !== "rook" || rook.hasMoved) return false;
    if (board[row][1] !== null || board[row][2] !== null || board[row][3] !== null)
      return false;
    if (
      !isSquareSafeForKing(board, { row, col: 4 }, king.color) ||
      !isSquareSafeForKing(board, { row, col: 3 }, king.color) ||
      !isSquareSafeForKing(board, { row, col: 2 }, king.color)
    )
      return false;
    return true;
  }
  return false;
}

function isSquareSafeForKing(board, pos, color) {
  let tempBoard = cloneBoard(board);
  tempBoard[pos.row][pos.col] = { type: "king", color, hasMoved: true };
  return isKingSafe(tempBoard, color);
}

/* ----- HELPER FUNCTIONS ----- */
function isInBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function isKingSafe(board, color) {
  let kingPos = findKing(board, color);
  if (!kingPos) return false;
  return !isSquareAttacked(board, kingPos, getOpponent(color));
}

function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      let piece = board[r][c];
      if (piece && piece.type === "king" && piece.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function isSquareAttacked(board, pos, attackerColor) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      let piece = board[r][c];
      if (piece && piece.color === attackerColor) {
        let moves;
        if (piece.type === "rook") {
          // For enemy rooks, use full-range moves (default) for attack detection.
          moves = generateRookMovesDefault(board, { row: r, col: c }, piece);
        } else {
          moves = generateMovesForPiece(board, { row: r, col: c });
        }
        for (let move of moves) {
          if (move.to.row === pos.row && move.to.col === pos.col) return true;
        }
      }
    }
  }
  return false;
}

function getOpponent(color) {
  return color === "white" ? "black" : "white";
}

/* ----- EN PASSANT LOGIC ----- */
function handlePawnDoubleStep(move) {
  if (
    move.piece.type === "pawn" &&
    Math.abs(move.from.row - move.to.row) === 2
  ) {
    enPassantTarget = {
      row: (move.from.row + move.to.row) / 2,
      col: move.from.col,
    };
  } else {
    enPassantTarget = null;
  }
}

function isEnPassantMove(move) {
  return (
    move.piece.type === "pawn" &&
    move.from.col !== move.to.col &&
    board[move.to.row][move.to.col] === null
  );
}

function performEnPassant(move) {
  board[move.to.row][move.to.col] = move.piece;
  board[move.from.row][move.from.col] = null;
  let captureRow = move.piece.color === "white" ? move.to.row + 1 : move.to.row - 1;
  board[captureRow][move.to.col] = null;
}

/* ----- CASTLING HANDLING ----- */
function isCastlingMove(move) {
  return (
    move.piece.type === "king" && Math.abs(move.to.col - move.from.col) === 2
  );
}

function performCastle(move) {
  let row = move.from.row;
  if (move.castle === "kingside") {
    board[row][6] = move.piece;
    board[row][4] = null;
    let rook = board[row][7];
    board[row][5] = rook;
    board[row][7] = null;
    rook.hasMoved = true;
  } else if (move.castle === "queenside") {
    board[row][2] = move.piece;
    board[row][4] = null;
    let rook = board[row][0];
    board[row][3] = rook;
    board[row][0] = null;
    rook.hasMoved = true;
  }
}

/* ----- PAWN PROMOTION ----- */
function isLastRank(pos, color) {
  return (color === "white" && pos.row === 0) || (color === "black" && pos.row === 7);
}

function showPromotionModal(move) {
  promotionModal.style.display = "block";
  promotionModal.dataset.fromRow = move.from.row;
  promotionModal.dataset.fromCol = move.from.col;
  promotionModal.dataset.toRow = move.to.row;
  promotionModal.dataset.toCol = move.to.col;
  promotionModal.dataset.color = move.piece.color;
  promotionModal.dataset.pieceType = move.piece.type;
}

promotionChoices.forEach((choice) => {
  choice.addEventListener("click", function () {
    let selectedType = this.dataset.type;
    let move = {
      from: {
        row: parseInt(promotionModal.dataset.fromRow),
        col: parseInt(promotionModal.dataset.fromCol),
      },
      to: {
        row: parseInt(promotionModal.dataset.toRow),
        col: parseInt(promotionModal.dataset.toCol),
      },
      piece: {
        type: promotionModal.dataset.pieceType,
        color: promotionModal.dataset.color,
      },
    };
    board[move.to.row][move.to.col] = createPiece(selectedType, move.piece.color);
    board[move.from.row][move.from.col] = null;
    promotionModal.style.display = "none";
    board[move.to.row][move.to.col].hasMoved = true;
    moveHistory.push(move);
    updateFiftyMoveCounter(move);
    updateBoardHistory();
    if (checkForCheckmate(board, getOpponent(currentPlayer))) {
      alert("Checkmate! " + getOpponent(currentPlayer) + " wins.");
      clearInterval(clockInterval);
      resetGame();
      return;
    } else if (checkForStalemate(board, getOpponent(currentPlayer))) {
      alert("Stalemate!");
      clearInterval(clockInterval);
      resetGame();
      return;
    }
    currentPlayer = getOpponent(currentPlayer);
    startClock();
    selectedPiece = null;
    selectedPos = null;
    drawBoard();
  });
});

/* ----- BOARD HISTORY & DRAWING RULES ----- */
function serializeBoard(board) {
  return board
    .map((row) =>
      row.map((cell) => (cell ? cell.type[0] + cell.color[0] : "  ")).join("")
    )
    .join("|");
}

function updateBoardHistory() {
  boardHistory.push(serializeBoard(board));
}

function isThreefoldRepetition() {
  let counts = {};
  boardHistory.forEach((state) => {
    counts[state] = (counts[state] || 0) + 1;
  });
  return Object.values(counts).some((count) => count >= 3);
}

function updateFiftyMoveCounter(move) {
  if (move.piece.type === "pawn" || board[move.to.row][move.to.col] !== null) {
    fiftyMoveCounter = 0;
  } else {
    fiftyMoveCounter++;
  }
}

function isFiftyMoveRule() {
  return fiftyMoveCounter >= 50;
}

/* ----- CHECKMATE & STALEMATE ----- */
// Checkmate: the current player's king is in check and has no legal moves.
function checkForCheckmate(board, color) {
  if (!isKingSafe(board, color)) {
    let moves = generateAllMoves(board, color);
    let legalMoves = moves.filter((m) => isLegalMove(board, m, color));
    if (legalMoves.length === 0) {
      console.log("Checkmate detected for", color);
      return true;
    }
  }
  return false;
}

function checkForStalemate(board, color) {
  if (isKingSafe(board, color)) {
    let moves = generateAllMoves(board, color);
    let legalMoves = moves.filter((m) => isLegalMove(board, m, color));
    if (legalMoves.length === 0) return true;
  }
  return false;
}

function generateAllMoves(board, color) {
  let moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      let piece = board[r][c];
      if (piece && piece.color === color) {
        moves = moves.concat(generateMovesForPiece(board, { row: r, col: c }));
      }
    }
  }
  return moves;
}

/* ----- MOVE VALIDATION ----- */
function isLegalMove(board, move, color) {
  let moves = generateMovesForPiece(board, move.from);
  let legal = moves.some(
    (m) => m.to.row === move.to.row && m.to.col === move.to.col
  );
  if (!legal) {
    console.log("Move not in generated moves:", move);
    return false;
  }

  let newBoard = cloneBoard(board);
  newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
  newBoard[move.from.row][move.from.col] = null;

  let kingPos = findKing(newBoard, color);
  if (!kingPos) {
    console.log("King not found after move:", move);
    return false;
  }

  if (!isKingSafe(newBoard, color)) {
    console.log("King would be in check after move:", move, "King at:", kingPos);
    return false;
  }

  return true;
}

/* ----- END GAME INITIALIZATION ----- */
initializeBoard();
module.exports = {
  initializeBoard,
  createPiece,
  isLegalMove,
  generateMovesForPiece,
  canCastle,
  checkForCheckmate,
  checkForStalemate,
  generateRookMoves,
  generateRookMovesDefault,
  cloneBoard,
  getOpponent,
  generateAllMoves,
  // Add any other functions you need for testing
};
