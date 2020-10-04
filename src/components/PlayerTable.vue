<template>
  <div id="playertables">
    <table >
      <tr >
        <td v-for="(x, index) in table.enemy_row_2" :key="index">
          <PlaceHolder/>
        </td>
      </tr>
      <tr >
        <td v-for="(x, index) in table.enemy_row_2" :key="index">
          <PlaceHolder/>
        </td>
      </tr>
      <tr>
        <td v-for="(x, index) in table.territory_row" :key="index">
          <Card @click.native="doSomething(index)" v-if="-1 != x" :pos="x" style="transform: rotate(90deg)"/>
          <PlaceHolder v-else/>
        </td>
      </tr>
      <tr>
        <td v-for="(x, index) in table.player_row_1" :key="index">
          <Card @click.native="doSomething(index)" v-if="-1 != x" :pos="x"/>
          <PlaceHolder v-else/>
        </td>
      </tr>
      <tr>
        <td v-for="(x, index) in table.player_row_2" :key="index">
          <Card @click.native="doSomething(index)" v-if="-1 != x" :pos="x"/>
          <PlaceHolder v-else/>
        </td>
      </tr>
    </table>

  </div>
</template>

<script>
import PlaceHolder from "@/components/PlaceHolder";
import Card from "@/components/Card";
import publicStore from "@/publicStore";

export default {
  name: 'PlayerTable',
  components: {
    Card,
    PlaceHolder,
  },

  props: {
    table: Object,
  },
  methods: {
    doSomething: function (event) {
      publicStore.setMessageAction("DSADSA")
      console.log(event)
      return "DSAD"
    }
  }

  // doSomething: function () {
  //   // `this` inside methods points to the Vue instance
  //   console.log("ID =" + "id")
  //
  // }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

#playertables {
  position: relative;
  width: 666px;
  height: 666px;
  background-color: burlywood;
}

</style>
