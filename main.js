const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const Piece = require('./classes').Piece

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
        pieces.push({type: 'pawn', color: colors[color], origin: {x: j, y: (color == 0 ? 6 : 1), delegate: checkMoveForPawn}})
    }
    pieces.push({type: 'king', color: colors[color], origin: {x: 4, y: (color == 0 ? 7 : 0)}, delegate: checkMoveForKing})
    pieces.push({type: 'queen', color: colors[color], origin: {x: 3, y: (color == 0 ? 7 : 0)}, delegate: checkMoveForQueen})
    for(var j = 2; j < 6; j += 3) {
        pieces.push({type: 'bishop', color: colors[color], origin: {x: j, y: (color == 0 ? 7 : 0)}, delegate: checkMoveForBishop})
    }
    for(var j = 1; j < 7; j += 5) {
        pieces.push({type: 'knight', color: colors[color], origin: {x: j, y: (color == 0 ? 7 : 0)}, delegate: checkMoveForKnight})
    }
    for(var j = 0; j < 8; j += 7) {
        pieces.push({type: 'rook', color: colors[color], origin: {x: j, y: (color == 0 ? 7 : 0)}, delegate: checkMoveForRook})
    }
}

for (let piece of pieces) {
    chessboard[piece.origin.x][piece.origin.y] = piece
}

async function handleMoveRequest(move) {
    if (piece.delegate(move.piece, move.targetSquare)) {
        return {
            authorized: true
        }
    }
}

function checkMoveForPawn(pawn, targetSquare) {
    if (getAvailableSquaresForPawn(pawn).includes(targetSquare) && pawn.color == turn)
        return true
    else return false
}

function getAvailableSquaresForPawn(pawn) {
    let result = []
    let x = chessboard.indexOf(findColumn(pawn))
    let y = chessboard[x].indexOf(findRow(pawn))
    console.log(x)
    console.log(y)
    let yCoordinateDifference = (pawn.color == 'white') ? -1 : 1
    for (let i = -1; i <= 1; i += 2)
    if (chessboard[x + i] != undefined && chessboard[x + i][y + yCoordinateDifference] != undefined) {
        if (isTherePieceInSquare({ x: x + i, y: y + yCoordinateDifference }) && chessboard[x + i][y + yCoordinateDifference].color != pawn.color)
            result.push({ x: x + i, y: y + yCoordinateDifference })
    }
    if(chessboard[x][y + yCoordinateDifference] != undefined && !isTherePieceInSquare({ x: x, y: + yCoordinateDifference})) {
        result.push({ x: x, y: y + yCoordinateDifference })
        if (chessboard[x][y + yCoordinateDifference * 2] != undefined && !isTherePieceInSquare({ x: x, y: + yCoordinateDifference * 2 }
        && !isTherePieceInSquare({ x: x, y: + yCoordinateDifference})))
            if ([1, 6].includes(findRowIndex(pawn)))
                result.push({ x: x, y: y + yCoordinateDifference * 2 })
    }
    return result
}

function checkMoveForBishop() {}

function checkMoveForKnight() {}

function checkMoveForRook() {}

function checkMoveForQueen() {}

function checkMoveForKing() {}

function findRow(piece) {
    for (let row of chessboard[findColumn(piece)])
        if (row.contains(piece)) return row
    return null
}

function findRowIndex(piece) {
    for (let row of chessboard[findColumn(piece)])
        if (row.contains(piece)) return chessboard[findColumn(piece)].indexOf(row)
    return null
}

function findColumn(piece) {
    for(let column of chessboard)
        if (column.contains(piece)) return column
    return null
}

function findColumnIndex(piece) {
    for(let column of chessboard)
        if (column.contains(piece)) return chessboard.indexOf(column)
    else return null
}

function isTherePieceInSquare(square) {
    if (chessboard[square.x][square.y] != undefined) return true
    else return false
}

function getPiecePosition(piece) {
    let x = chessboard.indexOf(findColumn(pawn))
    let y = chessboard[x].indexOf(findRow(pawn))
    return {x: x, y: y}
}