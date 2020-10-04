<template>
  <div id="app">
    <PlayerTables :table="appStore.table"/>
    <Hand :hand="appStore.hand"/>
  </div>
</template>

<script>
import PlayerTables from '@/components/PlayerTable'
import Hand from "@/components/Hand";
import publicStore from "@/publicStore";


export default {
  name: 'App',
  components: {
    PlayerTables,
    Hand,
  },
  data() {
    return {
      msg1: "Welcome to Milito!",
      appStore: publicStore.state,
    }
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /*text-align: center;*/
  color: rebeccapurple;
}
</style>
