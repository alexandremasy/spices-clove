<template>
  <div ref="root" v-html="sprite"></div>
</template>

<script>
export default {
  name: 'SpicesIcons',

  data(){
    return {
      sprite: ''
    }
  },

  created(){
    let that = this;
    var ajax = new XMLHttpRequest();
    ajax.open("GET", "https://cdn.sayl.cloud/spices/icons/spices-icons.svg", true);
    ajax.send();
    ajax.onload = function(e) {
      that.sprite = ajax.responseText
      console.log('loaded', this)
    }
  }
}
</script>
      