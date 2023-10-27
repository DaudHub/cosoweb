class Piece {
    constructor(type, color, origin, delegate) {
        this.type = type
        this.color = color
        this.origin = origin
        this.delegate = delegate
    }
}

class Move {
    constructor(piece, square) {
        this.piece = piece
        this.targetSquare = square
    }
}

module.exports = { Piece, Move }