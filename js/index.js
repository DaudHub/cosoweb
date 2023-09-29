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
            let delegate
            if (dropped.getAttribute('class').split('-')[1] == 'pawn') delegate = checkMoveForPawn
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
//hay que arreglar

function checkMoveForPawn(pawn, square) {
    if (getAvailableSquaresForPawn(pawn, pawn.parentNode).includes(square))
        return true
    else return false
}

function getAvailableSquaresForPawn(pawn, square) {
    let result = []
    let x = parseInt(square.id[0])
    let y = parseInt(square.id[1])
    console.log(x)
    console.log(y)
    let yCoordinateDifference
    if (getColor(pawn) == 'white') yCoordinateDifference = -1
    else if (getColor(pawn) == 'black') yCoordinateDifference = 1
    for (i = -1; i <= 1; i += 2)
        if (chessboard[x + i][y + yCoordinateDifference] !== undefined) {
            result.push(chessboard[x + i][y + yCoordinateDifference])
        }
    if(chessboard[x][y + yCoordinateDifference] != undefined && !isTherePieceInSquare(chessboard[x][y + yCoordinateDifference]))
        result.push(chessboard[x][y + yCoordinateDifference])
    if (chessboard[x][y + yCoordinateDifference * 2] != undefined)
        result.push(chessboard[x][y + yCoordinateDifference * 2])
    return result
}
//hay que arreglar

function getColor(piece) {
    let color = piece.getAttribute('class').split('-')[0]
    return color
}

function isTherePieceInSquare(square) {
    if (square == null) return false
    if (square.firstChild == null) return false
    else return true
}