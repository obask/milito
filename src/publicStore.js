const SELECT_CARDS_STATE = "SELECT_CARDS_STATE"
const SELECT_COLUMN_TO_PLAY_STATE = "SELECT_COLUMN_TO_PLAY_STATE"
const DISCARD_CARDS_FROM_HAND_STATE = "DISCARD_CARDS_FROM_HAND_STATE"

export default {
    debug: true,
    state: {
        table: {
            enemy_row_2: [1, 0, 0, 1, 0],
            enemy_row_1: [1, 0, 0, 1, 0],
            territory_row: [0, 0, 0, 0, 0],
            player_row_1: [-1, 1, 2, 1, 2],
            player_row_2: [1, -1, 3, 1, 3],
        },
        hand: [1, 3, 2, 2, 2],
        state: SELECT_CARDS_STATE,
        cardsToDiscard: 0,
        selected_card: null,
        selected_column: null,
        discarded_cards: [],
    },
    setMessageAction(newValue) {
        if (this.debug) {
            console.log('setMessageAction triggered with', newValue)
        }
        this.state.message = newValue
    },
    clickOnHand(position) {
        if (this.debug) {
            console.log('STATE:', this.state.state)
            console.log('clickOnHand triggered:', position)
        }
        // const requestOptions = {
        //     method: "POST",
        //     headers: {"Content-Type": "application/json"},
        //     body: JSON.stringify({title: "Vue POST Request Example"})
        // };
        // fetch("http://localhost:3000/ololo", {mode: 'cors'})

        // fetch("http://localhost:3000/ololo", {mode: 'cors'})
        //     .then(response => console.log(response.json()))
        switch (this.state.state) {
            case SELECT_CARDS_STATE:
                this.state.selected_card = position
                this.state.state = SELECT_COLUMN_TO_PLAY_STATE
                break
            case DISCARD_CARDS_FROM_HAND_STATE:
                this.state.discarded_cards.push(position)
                this.state.cardsToDiscard -= 1
                this.state.state = DISCARD_CARDS_FROM_HAND_STATE
                console.log("cards to discard", this.state.cardsToDiscard)
                if (this.state.cardsToDiscard <= 0) {
                    const requestOptions = {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        mode: 'cors',
                        body: JSON.stringify(this.state)
                    }
                    fetch("http://localhost:3000/ololo", requestOptions)
                        .then(response => response.json())
                        .then(newst => {
                            console.log(newst)
                            Object.assign(this.state, newst)
                            this.state.state = newst.state
                        })
                    // .state = SELECT_CARDS_STATE
                }
                break
        }
    },
    clickOnPlayerRow(position) {
        if (this.debug) {
            console.log('STATE:', this.state.state)
            console.log('clickOnPlayerRow triggered:', position)
        }
        switch (this.state.state) {
            case SELECT_COLUMN_TO_PLAY_STATE:
                this.state.selected_column = position
                this.state.cardsToDiscard = 1
                this.state.state = DISCARD_CARDS_FROM_HAND_STATE
                break
        }
    },
}
