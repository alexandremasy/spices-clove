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
    let that = this;
    var ajax = new XMLHttpRequest();
    ajax.open("GET", meta.sprite, true);
    ajax.send();
    ajax.onload = function(e) {
      // that.sprite = ajax.responseText

      // var div = document.createElement("div");
      // div.innerHTML = ajax.responseText;
      // document.body.insertBefore(div, document.body.childNodes[0]);
    
      let svg = ajax.responseXML.documentElement
      svg.setAttribute('class', 'spices-icons')
      svg.setAttribute('style', 'display: none')
      document.body.insertBefore(svg, document.body.childNodes[0]);
    }
  }
}
</script>
      