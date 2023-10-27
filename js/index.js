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
    chessboard[piece.origin.x][piece.origin.y].appendChild(displayedPiece)
})

chessboard.forEach(column => {
    column.forEach(square => {
        let piece = square.firstChild
        if (piece != null) piece.addEventListener('dragstart', event => {
            event.dataTransfer.setData("text", event.target.id)
        })
        square.addEventListener('drop', event => {
            event.preventDefault()
            let dropped = document.getElementById(event.dataTransfer.getData('text'))
            console.log(dropped)
            let delegate
            if (dropped.getAttribute('class').split('-')[1] == 'pawn') delegate = checkMoveForPawn
            else if (dropped.getAttribute('class').split('-')[1] == 'knight') delegate = checkMoveForKnight
            else if (dropped.getAttribute('class').split('-')[1] == 'bishop') delegate = checkMoveForBishop
            else if (dropped.getAttribute('class').split('-')[1] == 'rook') delegate = checkMoveForRook
            else if (dropped.getAttribute('class').split('-')[1] == 'queen') delegate = checkMoveForQueen
            else if (dropped.getAttribute('class').split('-')[1] == 'king') delegate = checkMoveForKing
            if(delegate(dropped, square)) {
                changeRightToMove()
                if (square.firstChild == null && event.target == square)
                    square.appendChild(dropped)
                else if (event.target != dropped)
                    square.replaceChild(dropped, square.firstChild)
            } else console.log('jugada incorrecta')
        })
        square.addEventListener('dragover', event => {
            event.preventDefault()
        })
    })
})

const socket = new WebSocket('ws://localhost:80')

socket.onopen = async () => {
    
}

async function waitForMessage() {
    let promise = new Promise((res, rej) => {
        socket.once = (message) => resolve(message)
        socket.error = (error) => reject (error)
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