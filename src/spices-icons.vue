<template>
  <div ref="root" v-html="sprite"></div>
</template>

<script>
import { meta } from '.'

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
    ajax.open("GET", meta.sprite, true);
    ajax.send();
    ajax.onload = function(e) {
      that.sprite = ajax.responseText
    }
  }
}
</script>
      