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

const socket = new WebSocket('ws://localhost:80/new')

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