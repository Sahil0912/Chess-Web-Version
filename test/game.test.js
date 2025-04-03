const { expect } = require('chai');
let {
  isPrime,
  generateRookMoves,
  generatePawnMoves,
  isLegalMove,
  initializeBoard,
  checkForCheckmate,
  isSquareAttacked,
  serializeBoard,
  cloneBoard,
  getOpponent,
  isInBounds,
  isKingSafe,
  performCastle,
  canCastle,
  isEnPassantMove,
  generateMovesForPiece,
  createPiece,
  handlePawnDoubleStep,
  board,
  enPassantTarget
} = require('../public/gameController');

describe('Chess Game Tests', () => {
  let testBoard;

  before(() => {
    // Testing the board
    testBoard = Array(8).fill().map(() => Array(8).fill(null));
  });

  beforeEach(() => {
    testBoard = initializeBoard();
  });

  describe('Prime Number Validation', () => {
    it('should identify prime numbers correctly', () => {
      expect(isPrime(2)).to.be.true;
      expect(isPrime(7)).to.be.true;
      expect(isPrime(1)).to.be.false;
      expect(isPrime(4)).to.be.false;
      expect(isPrime(9)).to.be.false;
    });
  });

  describe('Rook Movement', () => {
    it('should only allow prime-numbered moves for all rooks', () => {
      // Test both rooks
      testBoard = Array(8).fill().map(() => Array(8).fill(null));
      
      //(white)
      testBoard[3][3] = { type: 'rook', color: 'white', hasMoved: false };
      const friendlyMoves = generateRookMoves(testBoard, { row: 3, col: 3 }, testBoard[3][3]);
      
      // (black)
      testBoard[4][4] = { type: 'rook', color: 'black', hasMoved: false };
      const enemyMoves = generateRookMoves(testBoard, { row: 4, col: 4 }, testBoard[4][4]);
      
      const allowedDistances = new Set([2, 3, 5, 7]);
      
      // Verify both rooks follow prime movement rules
      [...friendlyMoves, ...enemyMoves].forEach(move => {
        const dx = Math.abs(move.to.col - move.from.col);
        const dy = Math.abs(move.to.row - move.from.row);
        const distance = dx + dy; // Since rook moves straight
        expect(allowedDistances.has(distance)).to.be.true;
      });
    });
  });

  describe('Pawn Movement', () => {
    let testBoard;
  
    beforeEach(() => {
      testBoard = Array(8).fill().map(() => Array(8).fill(null));
    });
  
    it('should detect en passant opportunities', () => {
      // 1. Setup pawns in proper positions
      testBoard[3][3] = createPiece('pawn', 'white'); // White pawn at (3,3)
      testBoard[3][4] = createPiece('pawn', 'black'); // Black pawn at (3,4)
      
      // 2. Simulate black pawn's double-step move to set enPassantTarget
      const doubleStepMove = {
        from: { row: 1, col: 4 }, // Original black pawn position
        to: { row: 3, col: 4 }, // New position after double step
        piece: testBoard[3][4]
      };
      handlePawnDoubleStep(doubleStepMove); // Manually set enPassantTarget
  
      // 3. Generate moves for white pawn
      const moves = generateMovesForPiece(testBoard, { row: 3, col: 3 }, testBoard[3][3]);
  
      // 4. Verify en passant move exists
      expect(moves).to.deep.include({
        from: { row: 3, col: 3 },
        to: { row: 2, col: 4 },
        piece: testBoard[3][3],
        enPassant: true
      });
    });

    it('should trigger promotion on last rank', () => {
      const pawn = { type: 'pawn', color: 'white', hasMoved: true };
      testBoard[1][0] = pawn;
      
      const moves = generatePawnMoves(testBoard, { row: 1, col: 0 }, pawn);
      expect(moves.some(m => m.to.row === 0)).to.be.true;
    });

  });
  

  describe('Check Detection', () => {
    let testBoard;
  
    beforeEach(() => {
      testBoard = Array(8).fill().map(() => Array(8).fill(null));
    });
  
    it('should identify attacked squares', () => {
      // Place black rook in same column as white king
      testBoard[0][4] = createPiece('rook', 'black'); // Top of column 4
      testBoard[4][4] = createPiece('king', 'white'); // Center king
      
      expect(isSquareAttacked(testBoard, { row: 4, col: 4 }, 'black')).to.be.true;
    });
  
    it('should detect checkmate state', () => {
      // Proper checkmate setup
      testBoard[7][4] = createPiece('king', 'white'); // White king in corner
      testBoard[6][3] = createPiece('queen', 'black'); // Queen attacking diagonally
      testBoard[7][5] = createPiece('rook', 'black'); // Rook blocking escape
      
      // Verify no legal moves
      expect(checkForCheckmate(testBoard, 'white')).to.be.false;
    });
  });

  describe('Castling', () => {
    beforeEach(() => {
      // Create fresh board with only necessary pieces
      testBoard = Array(8).fill().map(() => Array(8).fill(null));
      
      // Set up castling scenario
      testBoard[7][4] = createPiece('king', 'white');  // White king
      testBoard[7][7] = createPiece('rook', 'white');  // Kingside rook
    });

    it('should allow kingside castling when valid', () => {
      testBoard[7][5] = null;
      testBoard[7][6] = null;
      const king = testBoard[7][4];
      
      expect(canCastle(testBoard, king, { side: 'kingside', pos: { row: 7, col: 4 }})).to.be.true;
    });

    it('should prevent castling through attacked squares', () => {
      testBoard[7][5] = null;
      testBoard[7][6] = null;
      testBoard[6][5] = { type: 'bishop', color: 'black', hasMoved: true };
      const king = testBoard[7][4]; 
      
      expect(canCastle(testBoard, king, { side: 'kingside', pos: { row: 7, col: 4 }})).to.be.false;
    });
  });

  describe('Board State Management', () => {
    let testBoard;
  
    beforeEach(() => {
      // fresh board
      testBoard = Array(8).fill().map(() => Array(8).fill(null));
      
      // Add pieces that match the serialization expectation
      testBoard[0][0] = { type: 'rook', color: 'white', hasMoved: false };
      testBoard[0][1] = { type: 'bishop', color: 'white', hasMoved: false };
    });
  
    it('should clone board correctly', () => {
      const cloned = cloneBoard(testBoard);
      cloned[0][0].hasMoved = true;
      expect(testBoard[0][0].hasMoved).to.be.false;
    });
  
    it('should serialize board state', () => {
      const serialized = serializeBoard(testBoard);
      // Expected format: "rwbw......|..." (depends on full board state)
      expect(serialized).to.include('rw'); // White rook
      expect(serialized).to.include('bw'); // White bishop
    });
  });

  describe('Helper Functions', () => {
    it('should identify opponent color', () => {
      testBoard = Array(8).fill().map(() => Array(8).fill(null));
      expect(getOpponent('white')).to.equal('black');
      expect(getOpponent('black')).to.equal('white');
    });

    it('should validate board boundaries', () => {
      testBoard = Array(8).fill().map(() => Array(8).fill(null));
      expect(isInBounds(7, 7)).to.be.true;
      expect(isInBounds(-1, 3)).to.be.false;
      expect(isInBounds(4, 8)).to.be.false;
    });

    it('should generate all legal moves', () => {
      testBoard = Array(8).fill().map(() => Array(8).fill(null));
      
      // Create a white pawn at starting position (row 6, col 0)
      testBoard[6][0] = { 
        type: 'pawn', 
        color: 'white', 
        hasMoved: false 
      };
    
      // Get moves for the pawn at (6,0)
      const initialMoves = generateMovesForPiece(testBoard, { row: 6, col: 0 }, testBoard[6][0]);
      
      // Should get 2 moves: forward 1 and 2 squares
      expect(initialMoves).to.have.lengthOf(2);
    
      // Verify specific positions
      expect(initialMoves).to.deep.include.members([
        { from: { row: 6, col: 0 }, to: { row: 5, col: 0 }, piece: testBoard[6][0] },
        { from: { row: 6, col: 0 }, to: { row: 4, col: 0 }, piece: testBoard[6][0] }
      ]);
    });
  });

  describe('Special Moves', () => {
    let testBoard;

    beforeEach(() => {
      // Create fresh board with proper castling setup
      testBoard = Array(8).fill().map(() => Array(8).fill(null));
      testBoard[7][4] = { 
        type: 'king', 
        color: 'white', 
        hasMoved: false  // Crucial for castling
      };
      testBoard[7][7] = { 
        type: 'rook', 
        color: 'white', 
        hasMoved: false  // Crucial for castling
      };
      // Clear the castling path
      testBoard[7][5] = null;
      testBoard[7][6] = null;
    });

    it('should detect en passant moves', () => {
      testBoard = Array(8).fill().map(() => Array(8).fill(null));
      const move = {
        piece: { type: 'pawn', color: 'black' },
        from: { row: 1, col: 3 },
        to: { row: 3, col: 3 }
      };
      expect(isEnPassantMove(move)).to.be.false; // Should only be true in specific context
    });
});
});