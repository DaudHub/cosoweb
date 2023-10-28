const express = require('express')
const http = require('http')
const WebSocket = require('ws')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({server})

server.listen(80, () => { console.log('listening...') })

wss.on('connection', (ws, req) => {
    console.log(`client connected at ${req.socket.remoteAddress}`)

    ws.on('message', async (message) => {
        let move = JSON.parse(message)
        response = await handleMoveRequest(move)
        ws.send(JSON.stringify(response))
    })

    ws.on('close', () => {
        console.log(`client at ${req.socket.remoteAddress} disconnected.`)
    })
})

const chessboard = [[],[],[],[],[],[],[],[]]

let pieces = []

const colors = ['white', 'black']

var turn = 'white'

for(let color = 0; color < 2; color++) {
    for(var j = 0; j < 8; j++) {
        pieces.push({type: 'pawn', color: colors[color], origin: {x: j, y: (color == 0 ? 6 : 1)}})
    }
    pieces.push({type: 'king', color: colors[color], origin: {x: 4, y: (color == 0 ? 7 : 0)}})
    pieces.push({type: 'queen', color: colors[color], origin: {x: 3, y: (color == 0 ? 7 : 0)}})
    for(var j = 2; j < 6; j += 3) {
        pieces.push({type: 'bishop', color: colors[color], origin: {x: j, y: (color == 0 ? 7 : 0)}})
    }
    for(var j = 1; j < 7; j += 5) {
        pieces.push({type: 'knight', color: colors[color], origin: {x: j, y: (color == 0 ? 7 : 0)}})
    }
    for(var j = 0; j < 8; j += 7) {
        pieces.push({type: 'rook', color: colors[color], origin: {x: j, y: (color == 0 ? 7 : 0)}})
    }
}

for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) {
    chessboard[x][y] = { piece: null }
}

for (let piece of pieces) {
    chessboard[piece.origin.x][piece.origin.y].piece = piece
}

async function handleMoveRequest(move) {
    let delegate
    if (move.piece.type == 'pawn') delegate = checkMoveForPawn
    else if (move.piece.type == 'bishop') delegate = checkMoveForBishop
    else if (move.piece.type == 'knight') delegate = checkMoveForKnight
    else if (move.piece.type == 'rook') delegate = checkMoveForRook
    else if (move.piece.type == 'queen') delegate = checkMoveForQueen
    else if (move.piece.type == 'king') delegate = checkMoveForKing
    if (delegate(move.piece, move.targetSquare)) {
        changeRightToMove()
        chessboard[findColumnIndex(move.piece)][findRowIndex(move.piece)].piece = null
        chessboard[move.targetSquare.x][move.targetSquare.y].piece = move.piece
        return {
            authorized: true
        }
    }
    else return { authorized: false }
}

function checkMoveForPawn(pawn, targetSquare) {
    for (let square of getAvailableSquaresForPawn(pawn)) {
        if (square != undefined) {
            if (square.x != targetSquare.x) continue
            if (square.y != targetSquare.y) continue
            if (turn != pawn.color) continue
            return true
        }
    }
    return false
}

function getAvailableSquaresForPawn(pawn) {
    let result = []
    let x = chessboard.indexOf(findColumn(pawn))
    let y = chessboard[x].indexOf(findRow(pawn))
    let yCoordinateDifference = (pawn.color == 'white') ? -1 : 1
    for (let i = -1; i <= 1; i += 2)
    if (chessboard[x + i] != undefined && chessboard[x + i][y + yCoordinateDifference] != undefined) {
        if (isTherePieceInSquare({ x: x + i, y: y + yCoordinateDifference }) && chessboard[x + i][y + yCoordinateDifference].piece.color != pawn.color)
            result.push({ x: x + i, y: y + yCoordinateDifference })
    }
    if(chessboard[x][y + yCoordinateDifference] != undefined && !isTherePieceInSquare({ x: x, y: y + yCoordinateDifference })) {
        result.push({ x: x, y: y + yCoordinateDifference })
        if (chessboard[x][y + yCoordinateDifference * 2] != undefined && !isTherePieceInSquare({ x: x, y: y + yCoordinateDifference * 2 })
        && !isTherePieceInSquare({ x: x, y: y + yCoordinateDifference }))
            if ([1, 6].includes(findRowIndex(pawn)))
                result.push({ x: x, y: y + yCoordinateDifference * 2 })
    }
    return result
}

function checkMoveForBishop(bishop, targetSquare) {
    for (let square of getAvailableSquaresForBishop(bishop)) {
        if (square != undefined) {
            if (square.x != targetSquare.x) continue
            if (square.y != targetSquare.y) continue
            if (turn != bishop.color) continue
            return true
        }
    }
    return false
}

function getAvailableSquaresForBishop(bishop) {
    let result = []
    let x = findColumnIndex(bishop)
    let y = findRowIndex(bishop)
    console.log(x, y)
    for (let i = 1; chessboard[x + i] != undefined && chessboard[x + i][y + i] != undefined; i++) {
        if (isTherePieceInSquare({x: x + i, y: y + i})) {
            if (chessboard[x + i][y + i].piece.color != bishop.color) {
                result.push({ x: x + i, y: y + i })
                break
            } else break
        }
        result.push({ x: x + i, y: y + i })
    }
    for (let i = 1; chessboard[x + i] != undefined && chessboard[x + i][y - i] != undefined; i++) {
        if (isTherePieceInSquare({x: x + i, y: y - i})) {            
            if (chessboard[x + i][y - i].piece.color != bishop.color) {
                result.push({ x: x + i, y: y - i })
                break
            } else break
        }
        result.push({ x: x + i, y: y - i })
    }
    for (let i = 1; chessboard[x - i] != undefined && chessboard[x - i][y + i] != undefined; i++) {
        if (isTherePieceInSquare({ x: x - i, y: y + i })) {            
            if (chessboard[x - i][y + i].piece.color != bishop.color) {
                result.push({ x: x - i, y: y + i })
                break
            } else break
        }
        result.push({ x: x - i, y: y + i })
    }
    for (let i = 1; chessboard[x - i] != undefined && chessboard[x - i][y - i] != undefined; i++) {
        if (isTherePieceInSquare({ x: x - i, y: y - i })) {            
            if (chessboard[x - i][y - i].piece.color != bishop.color) {
                result.push({ x: x - i, y: y - i })
                break
            } else break
        }
        result.push({ x: x - i, y: y - i })
    }
    return result
}

function checkMoveForKnight() {}

function checkMoveForRook() {}

function checkMoveForQueen() {}

function checkMoveForKing() {}

function findRow(piece) {
    for (let square of chessboard[findColumnIndex(piece)])
        if (square.piece != null) {
            if (square.piece.type != piece.type) continue
                if (square.piece.color != piece.color) continue
                if (square.piece.origin.x != piece.origin.x || square.piece.origin.y != piece.origin.y) continue
                return square
        }
    return null
}

function findRowIndex(piece) {
    return chessboard[findColumnIndex(piece)].indexOf(findRow(piece))
}

function findColumn(piece) {
    for(let column of chessboard)
        for (let square of column) {
            if (square.piece != null) {
                if (square.piece.type != piece.type) continue
                if (square.piece.color != piece.color) continue
                if (square.piece.origin.x != piece.origin.x || square.piece.origin.y != piece.origin.y) continue
                return column
            }
        }
    return null
}

function findColumnIndex(piece) {
    return chessboard.indexOf(findColumn(piece))
}

function isTherePieceInSquare(square) {
    console.log('square: ', square)
    if (chessboard[square.x][square.y].piece != null) return true
    else return false
}

function getPiecePosition(piece) {
    let x = findColumnIndex(piece)
    let y = findRowIndex(piece)
    return {x: x, y: y}
}

function changeRightToMove() {
    turn = turn == 'white' ? 'black' : 'white'
}