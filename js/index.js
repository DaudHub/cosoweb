const displayedChessboard = document.getElementById('chessboard')

const chessboard = [[],[],[],[],[],[],[],[]]

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

var pieces = []
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
            if(delegate(dropped, square)) {
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

function checkMoveForPawn(pawn, targetSquare) {
    if (getAvailableSquaresForPawn(pawn).includes(targetSquare))
        return true
    else return false
}

function getAvailableSquaresForPawn(pawn) {
    let result = []
    let square = pawn.parentNode
    let x = parseInt(square.id[0])
    let y = parseInt(square.id[1])
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
    if (getAvailableSquaresForKnight(knight).includes(targetSquare))
        return true
    else return false
}

function getAvailableSquaresForKnight(knight) {
    let result = []
    let square = knight.parentNode
    let x = parseInt(square.id[0])
    let y = parseInt(square.id[1])
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
    if (getAvailableSquaresForBishop(bishop).includes(targetSquare))
        return true
    else return false
}

function getAvailableSquaresForBishop(bishop) {
    let result = []
    let square = bishop.parentNode
    let x = parseInt(square.id[0])
    let y = parseInt(square.id[1])
    for (let i = 0; true; i++) {
        if (chessboard[i] != undefined) {
            if (chessboard[i][i] != undefined) {
                if (chessboard[i][i].firstChild != null) {
                    if (getColor(chessboard[i][i].firstChild) != getColor(bishop)) {
                        result.push(chessboard[i][i])
                        break
                    } else break
                } else result.push(chessboard[i][i])
            } else break
        } else break
    }
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