import Vue from 'vue'
import App from './App.vue'
import store from "@/publicStore";

Vue.config.productionTip = false

document.app = new Vue({
  render: h => h(App),
}).$mount('#app')



// const x = 123
//
console.log(document.app)

// const storex = {
//   tables: [1, 0, 0, 1, 0],
//   hand: [1, 9, 2],
//   state: "SELECT_CARDS",
// }
document.store = store
