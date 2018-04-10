<template>
  <div id="app">
    <img src="./assets/logo.png">
    <router-view/>
    <Radio>Radio</Radio>
  </div>
</template>

<script>
  import 'iview/dist/styles/iview.css'
  import './css/radio.css'
  import Radio from 'iview/src/components/checkbox';

  console.log(Radio)
export default {
  name: 'app'
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
  input[type=checkbox]{
    color: red;
  }

</style>
