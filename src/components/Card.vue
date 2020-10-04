<template>
  <div class="cardontable" v-bind:style="ololo">
  </div>
</template>

<script>
export default {
  name: 'Card',
  props: {
    pos: Number
  },
  computed: {
    ololo: function () {
      return "background-position:-" + 80 * this.pos + "px -0px"
    }
  },
}
</script>

<style scoped>

.cardontable {
  /*position: absolute;*/
  display: inline-block;
  margin-top: 2px;
  margin-left: 38px;
  width: 80px;
  height: 112px;
  background-image: url('../assets/cards.jpg');
  background-size: 320px 224px;
}

</style>
