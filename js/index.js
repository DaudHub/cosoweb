const displayedChessboard = document.getElementById('chessboard')

const chessboard = [[],[],[],[],[],[],[],[]]

var turn = 'white'

for (i = 0; i < 8; i++) {
    for (i2 = 0; i2 < 8; i2++) {
        let square = document.createElement('div');
        if (i2 % 2 == 0)
            square.setAttribute("class", `square ${i % 2 == 0 ? 'light' : 'dark'}`)
        else 
            square.setAttribute("class", `square ${i % 2 == 0 ? 'dark' : 'light'}`)
        square.setAttribute('id', `${i2}${i}`)
        chessboard[i2][i] = square
        displayedChessboard.appendChild(square)
    }
}

const pieces = []
const colors = ['white', 'black']

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

pieces.forEach(piece => {
    let displayedPiece = document.createElement('img')
    displayedPiece.setAttribute('id', `${piece.origin.x},${piece.origin.y}`)
    displayedPiece.setAttribute('class', `${piece.color}-${piece.type}`)
    displayedPiece.setAttribute('src', `../img/${piece.color}-${piece.type}.png`)
    displayedPiece.setAttribute('draggable', 'true')
    displayedPiece.origin = piece.origin
    chessboard[piece.origin.x][piece.origin.y].appendChild(displayedPiece)
})

const socket = new WebSocket('ws://localhost:80')

chessboard.forEach(column => {
    column.forEach(square => {
        let piece = square.firstChild
        if (piece != null) piece.addEventListener('dragstart', event => {
            event.dataTransfer.setData("text", event.target.id)
        })
        square.addEventListener('drop', async (event) => {
            event.preventDefault()
            let dropped = document.getElementById(event.dataTransfer.getData('text'))
            console.log(dropped)
            square.coordinates = { x: parseInt(square.id[0]), y: parseInt(square.id[1]) }
            let move = { 
                piece: { 
                    type: `${dropped.getAttribute('class').split('-')[1]}`,
                    color: `${dropped.getAttribute('class').split('-')[0]}`,
                    origin: dropped.origin
                },
                targetSquare: square.coordinates
            }
            console.log(move.piece)
            let response = JSON.parse(await waitForResponse(JSON.stringify(move)))
            if (response.authorized == true) {
                if (square.firstChild == null && event.target == square)
                    square.appendChild(dropped)
                else if (event.target != dropped)
                    square.replaceChild(dropped, square.firstChild)
            }
        })
        square.addEventListener('dragover', event => {
            event.preventDefault()
        })
    })
})

function waitForResponse(data) {
    let promise = new Promise((resolve, reject) => {
        socket.onmessage = onMessage
        socket.onerror = (error) => reject(error)
        function onMessage(message) {
            console.log(message)
            resolve(message.data)
            removeListeners()
        }
        function onError(error) {
            reject(error)
            removeListeners()
        }
        function removeListeners() {
            socket.onmessage = null
            socket.onmessage = null
        }
        socket.send(data)
    })
    return promise
}

function checkMoveForPawn(pawn, targetSquare) {
    if (getAvailableSquaresForPawn(pawn).includes(targetSquare) && getColor(pawn) == turn)
        return true
    else return false
}

function getAvailableSquaresForPawn(pawn) {
    let result = []
    let currentSquare = pawn.parentNode
    let x = parseInt(currentSquare.id[0])
    let y = parseInt(currentSquare.id[1])
    console.log(x)
    console.log(y)
    let yCoordinateDifference = (getColor(pawn) == 'white') ? -1 : 1
    for (let i = -1; i <= 1; i += 2)
    if (chessboard[x + i] != undefined && chessboard[x + i][y + yCoordinateDifference] != undefined) {
        if (isTherePieceInSquare(chessboard[x + i][y + yCoordinateDifference]) && getColor(chessboard[x + i][y + yCoordinateDifference].firstChild) != getColor(pawn))
            result.push(chessboard[x + i][y + yCoordinateDifference])
    }
    if(chessboard[x] != undefined && chessboard[x][y + yCoordinateDifference] != undefined && !isTherePieceInSquare(chessboard[x][y + yCoordinateDifference])) {
        result.push(chessboard[x][y + yCoordinateDifference])
        if (chessboard[x] != undefined && chessboard[x][y + yCoordinateDifference * 2] != undefined && !isTherePieceInSquare(chessboard[x][y + yCoordinateDifference * 2]
        && !isTherePieceInSquare(chessboard[x][y + yCoordinateDifference])))
            if (['1', '6'].includes(pawn.parentNode.getAttribute('id')[1]))
                result.push(chessboard[x][y + yCoordinateDifference * 2])
    }
    return result
}

function checkMoveForKnight(knight, targetSquare) {
    if (getAvailableSquaresForKnight(knight).includes(targetSquare) && getColor(knight) == turn)
        return true
    else return false
}

function getAvailableSquaresForKnight(knight) {
    let result = []
    let currentSquare = knight.parentNode
    let x = parseInt(currentSquare.id[0])
    let y = parseInt(currentSquare.id[1])
    for (let i = - 1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
            if(chessboard[x + i] != undefined) {
                if (chessboard[x + i][y + j * 2] != undefined)
                    result.push(chessboard[x + i][y + j * 2])
            if(chessboard[x + i * 2] != undefined)
                if (chessboard[x + i * 2][y + j] != undefined)
                    result.push(chessboard[x + i * 2][y + j])
            }
        }
    }
    result.forEach(move => {
        if (move.firstChild != null)
            if (getColor(move.firstChild) == getColor(knight))
                delete result[result.indexOf(move)]
    })
    return result
}

function checkMoveForBishop(bishop, targetSquare) {
    if (getAvailableSquaresForBishop(bishop).includes(targetSquare) && getColor(bishop) == turn)
        return true
    else return false
}

function getAvailableSquaresForBishop(bishop) {
    let result = []
    let currentSquare = bishop.parentNode
    let x = parseInt(currentSquare.id[0])
    let y = parseInt(currentSquare.id[1])
    for (let i = 1; chessboard[x + i] != undefined && chessboard[x + i][y + i] != undefined; i++) {
        if (isTherePieceInSquare(chessboard[x + i][y + i])) {
            if (getColor(chessboard[x + i][y + i].firstChild) != getColor(bishop)) {
                result.push(chessboard[x + i][y + i])
                break
            } else break
        }
        result.push(chessboard[x + i][y + i])
    }
    for (let i = 1; chessboard[x + i] != undefined && chessboard[x + i][y - i] != undefined; i++) {
        if (isTherePieceInSquare(chessboard[x + i][y - i])) {            
            if (getColor(chessboard[x + i][y - i].firstChild) != getColor(bishop)) {
                result.push(chessboard[x + i][y - i])
                break
            } else break
        }
        result.push(chessboard[x + i][y - i])
    }
    for (let i = 1; chessboard[x - i] != undefined && chessboard[x - i][y + i] != undefined; i++) {
        if (isTherePieceInSquare(chessboard[x - i][y + i])) {            
            if (getColor(chessboard[x - i][y + i].firstChild) != getColor(bishop)) {
                result.push(chessboard[x - i][y + i])
                break
            } else break
        }
        result.push(chessboard[x - i][y + i])
    }
    for (let i = 1; chessboard[x - i] != undefined && chessboard[x - i][y - i] != undefined; i++) {
        if (isTherePieceInSquare(chessboard[x - i][y - i])) {            
            if (getColor(chessboard[x - i][y - i].firstChild) != getColor(bishop)) {
                result.push(chessboard[x - i][y - i])
                break
            } else break
        }
        result.push(chessboard[x - i][y - i])
    }
    return result
}

function checkMoveForRook(rook, targetSquare) {
    if (getAvailableSquaresForRook(rook).includes(targetSquare) && getColor(rook) == turn)
        return true
    else return false
}

function getAvailableSquaresForRook(rook) {
    let result = []
    let currentSquare = rook.parentNode
    let x = parseInt(currentSquare.id[0])
    let y = parseInt(currentSquare.id[1])
    
    for(let i = 1; chessboard[x + i] != undefined && chessboard[x + i][y] != undefined; i++) {
        if(isTherePieceInSquare(chessboard[x + i][y])) {
            if (getColor(chessboard[x + i][y].firstChild) != getColor(rook)) {
                result.push(chessboard[x + i][y])
                break
            } else break
        }
        result.push(chessboard[x + i][y])
    }
    for(let i = 1; chessboard[x - i] != undefined && chessboard[x - i][y] != undefined; i++) {
        if(isTherePieceInSquare(chessboard[x - i][y])) {
            if (getColor(chessboard[x - i][y].firstChild) != getColor(rook)) {
                result.push(chessboard[x - i][y])
                break
            } else break
        }
        result.push(chessboard[x - i][y])
    }
    for(let i = 1; chessboard[x] != undefined && chessboard[x][y + i] != undefined; i++) {
        if(isTherePieceInSquare(chessboard[x][y + i])) {
            if (getColor(chessboard[x][y + i].firstChild) != getColor(rook)) {
                result.push(chessboard[x][y + i])
                break
            } else break
        }
        result.push(chessboard[x][y + i])
    }
    for(let i = 1; chessboard[x] != undefined && chessboard[x][y - i] != undefined; i++) {
        if(isTherePieceInSquare(chessboard[x][y - i])) {
            if (getColor(chessboard[x][y - i].firstChild) != getColor(rook)) {
                result.push(chessboard[x][y - i])
                break
            } else break
        }
        result.push(chessboard[x][y - i])
    }
    return result
}

function checkMoveForQueen(queen, targetSquare) {
    if (getAvailableSquaresForRook(queen).concat(getAvailableSquaresForBishop(queen)).includes(targetSquare)) 
        if (getColor(queen) == turn) return true
    else return false
}

function checkMoveForKing(king, targetSquare) {
    if (getAvailableSquaresForKing(king).includes(targetSquare) && getColor(king) == turn)
        return true
    else return false
}

function getAvailableSquaresForKing(king) {
    let result = []
    let currentSquare = king.parentNode
    let x = parseInt(currentSquare.id[0])
    let y = parseInt(currentSquare.id[1])
    for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) {
        if (chessboard[x + i] != undefined && chessboard[x + i][y + j] != undefined && chessboard[x + i][y + j] != currentSquare)
            result.push(chessboard[x + i][y + j])
    }
    result.forEach(square => {
        if (isTherePieceInSquare(square) && getColor(square.firstChild) == getColor(king))
            delete result[result.indexOf(square)]
    })
    return result
}

function getColor(piece) {
    let color = piece.getAttribute('class').split('-')[0]
    return color
}

function isTherePieceInSquare(square) {
    if (square.firstChild == null) return false
    else return true
}

function changeRightToMove() {
    turn = turn == 'white' ? 'black' : 'white'
}