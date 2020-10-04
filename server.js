const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
app.use(cors())
// app.use(bodyParser.json())

var jsonParser = bodyParser.json()
// var urlencodedParser = bodyParser.urlencoded({ extended: false })

const port = 3000

app.get('/', (request, response) => {
    response.json('Hello World!')
})

const res = {
    table: {
        enemy_row_2: [ 1, 0, 0, 1, 0 ],
        enemy_row_1: [ 1, 0, 0, 1, 0 ],
        territory_row: [ 0, 0, 0, 0, 0 ],
        player_row_1: [ 3, 1, 2, 1, 2 ],
        player_row_2: [ 1, -1, 3, 1, 3 ]
    },
    hand: [ 3, 2,  2 ],
    state: 'SELECT_CARDS_STATE',
    discarded_cards: [ ]
}


app.post('/ololo', jsonParser, (request, response) => {
    console.log("request path:", request.path)
    console.log("request body:", request.body)
    response.json(res)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
