class Piece {
    constructor(type, color, origin) {
        this.type = type
        this.color = color
        this.origin = origin
    }
}

class Move {
    constructor(piece, square) {
        this.piece = piece
        this.targetSquare = square
    }
}

module.exports = { Piece, Move }