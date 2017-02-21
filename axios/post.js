const axios = require('axios');
axios.post('/user',{name:'zhang',age:33}).then(function(res){
    console.log(res)
}).catch(function(e){
    console.log(e.stack)
})