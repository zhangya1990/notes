const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
let form = new FormData();
form.append('file',fs.createReadStream('./client.js'),'client.js');
/*axios.get('http://localhost:8080').then(()=>{
    console.log('haha')
});*/
axios.post('http://localhost:8080/json',{name:'zhang'},{
    headers:{
        'Content-Type':'application/json'
    }
}).then(()=>{
    console.log('haha')
});
axios.post('http://localhost:8080/buffer',form,{
    headers:form.getHeaders()
}).then(()=>{
    console.log('haha')

});
/*
axios.post('http://localhost:8080/buffer',fs.createReadStream('./client.js')).then(()=>{
    console.log('haha')
});*/
