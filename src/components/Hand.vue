<template>
  <ul id="hand">
    <li v-for="(x, index) in hand" :key="index">
      <Card :pos="x"/>
      <!--      <Placeholder/>-->
    </li>
  </ul>

</template>

<script>
import Card from "@/components/Card";
// import Placeholder from "@/components/Placeholder";

export default {
  name: 'Hand',
  props: {
    hand: Array,
  },
  components: {
    // Placeholder,
    Card,
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

ul#hand li {
  display: inline;
  list-style: none;
  background-color: dimgrey;
}

</style>
