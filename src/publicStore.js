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
        state: "SELECT_CARDS",
    },
    setMessageAction(newValue) {
        if (this.debug) console.log('setMessageAction triggered with', newValue)
        this.state.message = newValue
    },
}
