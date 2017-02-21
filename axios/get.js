//github:https://github.com/mzabriskie/axios


/*const axios = require('axios');
let pro = axios.get('http://fanyi.baidu.com/sug',{
    params:{
        kw:'Performing'
    }
}).then(function(res){
    console.log(res)
});
console.log(pro)*/
//a promise obj

const axios = require('axios');
let pro = axios.get('/sug',{
    params:{
        kw:'Performing'
    },
    timeout:500
}).then(function(res){
    console.log(res)
}).catch(function(e){
    console.log(e.stack)
})