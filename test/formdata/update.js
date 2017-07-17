var FormData = require('form-data');
var fs = require('fs');
var path = require('path');
const axios = require('axios');

var form = new FormData();
form.append('my_field', 'my value');
// form.append('my_buffer', new Buffer(10));
form.append('my_file', fs.createReadStream(path.join(__dirname,'server.js')),'server.js');

axios.post('http://localhost:8080/update',form,{headers:form.getHeaders()}).then((response)=>{
    console.log(response)
}).catch((e)=>{
    console.log(e)
});