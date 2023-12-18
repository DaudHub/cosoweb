const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const url = require('url')
const mysql = require('mysql')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({server})

server.listen(80, () => { console.log('listening...') })

wss.on('connection', async (ws, req) => {
    console.log(`client connected at ${req.socket.remoteAddress}`)
    if (req.url == '/new')
        connectionHandler(ws, req)
    else {
        ws.terminate()
        console.log(`client ${req.socket.remoteAddress} kicked`)
    }
    console.log('hola')
})

async function connectionHandler(ws, req) {
    await new Promise(async (resolve, reject) => {
        try {
            let connection = mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: 'porfavorentrar',
                database: 'chess'
            })
            connection.query('insert into games default values', (error, results, fields) => {
                if (error) {
                    ws.send(JSON.stringify({ gameCreated: false }))
                    resolve()
                }
            })
            await waitForSecondPlayer(ws, req)
            resolve()
        }
        catch {
            ws.send(JSON.stringify({ gameCreated: false }))
            resolve()
        }
        finally {
            connection.destroy()
        }
    })
}

async function waitForSecondPlayer(ws, req) {
    return new Promise((resolve, reject) => {
        wss.once('connection', async (ws2, req2) => {
            await game(ws, ws2, req, req2)
        })
    })
}

async function game(player1, player2, req1, req2) {
    return await new Promise((resolve, reject) => {

        player1.color = 'white'
        player2.color = 'black'

        player1.on('message', async (message) => {
            let move = JSON.parse(message)
            response = await handleMoveRequest(player1, move)
            ws.send(JSON.stringify(response))
        })

        player2.on('message', async (message) => {
            let move = JSON.parse(message)
            response = await handleMoveRequest(player2, move)
            ws.send(JSON.stringify(response))
        })

        player1.on('close', () => {
            console.log(`client at ${req.socket.remoteAddress} disconnected.`)
            resolve()
        })
    
        player2.on('close', () => {
            console.log(`client at ${req.socket.remoteAddress} disconnected.`)
            resolve()
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
    
        const whiteKing = chessboard[4][0].piece
        const blackKing = chessboard[4][7].piece
    
        async function handleMoveRequest(player, move) {
            if (checkMove(player, move.piece, move.targetSquare)) {
                changeRightToMove()
                chessboard[findColumnIndex(move.piece)][findRowIndex(move.piece)].piece = null
                chessboard[move.targetSquare.x][move.targetSquare.y].piece = move.piece
                return {
                    authorized: true
                }
            }
            else return { authorized: false }
        }
    
        function checkMove(player, piece, targetSquare) {
            if (player.color != turn) return false
            let delegate
            if (piece.type == 'pawn') delegate = getAvailableSquaresForPawn
            else if (piece.type == 'bishop') delegate = getAvailableSquaresForBishop
            else if (piece.type == 'knight') delegate = getAvailableSquaresForKnight
            else if (piece.type == 'rook') delegate = getAvailableSquaresForRook
            else if (piece.type == 'queen') delegate = getAvailableSquaresForQueen
            else if (piece.type == 'king') delegate = getAvailableSquaresForKing
            for (let square of delegate(piece)) {
                if (square != undefined) {
                    if (square.x != targetSquare.x) continue
                    if (square.y != targetSquare.y) continue
                    if (turn != piece.color) continue
                    return true
                }
            }
            // let chessboardCopy = chessboard
            // chessboard[findColumnIndex(piece)][findRowIndex(piece)].piece = null
            // chessboard[targetSquare.x][targetSquare.y].piece = piece
            // if (isKingInCheck())
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
    
        function getAvailableSquaresForKnight(knight) {
            let result = []
            let x = findColumnIndex(knight)
            let y = findRowIndex(knight)
            for (let i = - 1; i <= 1; i += 2) {
                for (let j = -1; j <= 1; j += 2) {
                    if(chessboard[x + i] != undefined) {
                        if (chessboard[x + i][y + j * 2] != undefined)
                            result.push({ x: x + i, y: y + j * 2 })
                    if(chessboard[x + i * 2] != undefined)
                        if (chessboard[x + i * 2][y + j] != undefined)
                            result.push({ x: x + i * 2, y: y + j })
                    }
                }
            }
            result.forEach(square => {
                if (square.piece != null)
                    if (square.piece.color == knight.color)
                        delete result[result.indexOf(square)]
            })
            return result
        }
    
        function getAvailableSquaresForRook(rook) {
            let result = []
            let x = findColumnIndex(rook)
            let y = findRowIndex(rook)
            for(let i = 1; chessboard[x + i] != undefined && chessboard[x + i][y] != undefined; i++) {
                if(isTherePieceInSquare({x: x + i, y: y})) {
                    if (chessboard[x + i][y].piece.color != rook.color) {
                        result.push({x: x + i, y: y})
                        break
                    } else break
                }
                result.push({x: x + i, y: y})
            }
            for(let i = 1; chessboard[x - i] != undefined && chessboard[x - i][y] != undefined; i++) {
                if(isTherePieceInSquare({x: x - i, y: y})) {
                    if (chessboard[x - i][y].piece.color != rook.color) {
                        result.push({x: x - i, y: y})
                        break
                    } else break
                }
                result.push({x: x - i, y: y})
            }
            for(let i = 1; chessboard[x] != undefined && chessboard[x][y + i] != undefined; i++) {
                if(isTherePieceInSquare({ x: x, y: y + i })) {
                    if (chessboard[x][y + i].piece.color != rook.color) {
                        result.push({ x: x, y: y + i })
                        break
                    } else break
                }
                result.push({ x: x, y: y + i })
            }
            for(let i = 1; chessboard[x] != undefined && chessboard[x][y - i] != undefined; i++) {
                if(isTherePieceInSquare({ x: x, y: y - i })) {
                    if (chessboard[x][y - i].piece.color != rook.color) {
                        result.push({ x: x, y: y - i })
                        break
                    } else break
                }
                result.push({ x: x, y: y - i })
            }
            return result
        }
    
        function getAvailableSquaresForQueen(queen) {
            return getAvailableSquaresForRook(queen).concat(getAvailableSquaresForBishop(queen))
        }
    
        function getAvailableSquaresForKing(king) {
            let result = []
            let x = findColumnIndex(king)
            let y = findRowIndex(king)
            for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) {
                if (chessboard[x + i] != undefined && chessboard[x + i][y + j] != undefined && (x != 0 || y != 0))
                    result.push({ x: x + i, y: y + j })
            }
            result.forEach(square => {
                if (isTherePieceInSquare(square) && chessboard[square.x][square.y].piece.color == king.color)
                    delete result[result.indexOf(square)]
            })
            return result
        }
    
        function isKingInCheck() {
            let king = turn == 'white' ? whiteKing : blackKing
            let x = findColumnIndex(king)
            let y = findRowIndex(king)
            let directions = [
                { x: 1, y: 1 },
                { x: 1, y: -1 },
                { x: -1, y: 1 },
                { x: -1, y: -1 },
                { x: 0, y: 1 },
                { x: 0, y: -1 },
                { x: 1, y: 0},
                { x: -1, y: 0}
            ]
            for (let d in directions) {
                innerLoop: for (let i = 0; chessboard[x + i * d.x] != undefined && chessboard[x + i * d.x][y + d.y] != undefined; i++) {
                    if (chessboard[x + i * d.x][y + i * d.y].piece != null && chessboard[x + i * d.x][y + i * d.y].piece.color == king.color)
                        break innerLoop
                    if (chessboard[x + i * d.x][y + i * d.y].piece != null && chessboard[x + d.x][y + d.y].piece.color != king.color)
                        return true
                }
            }
        }
    
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
    })
}

