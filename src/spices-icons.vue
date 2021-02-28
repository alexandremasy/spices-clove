<template></template>

<script>
import { meta } from '.'

export default {
  name: 'SpicesIcons',

  data(){
    return {
      sprite: ''
    }
  },

  computed: {
    url(){
      return meta.sprite
    }
  },

  created(){
    var ajax = new XMLHttpRequest();
    ajax.open("GET", meta.sprite, true);
    ajax.send();
    ajax.onload = function(e) {
      let svg = ajax.responseXML.documentElement
      svg.setAttribute('class', 'spices-icons')
      svg.setAttribute('style', 'display: none')
      document.body.insertBefore(svg, document.body.childNodes[0]);
    }
  }
}
</script>
      