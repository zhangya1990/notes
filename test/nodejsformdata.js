var FormData = require('form-data');
var fs = require('fs');
var path = require('path');

var form = new FormData();
form.append('my_field', 'my value');
form.append('my_buffer', new Buffer(10));
form.append('my_file', fs.createReadStream(path.join(__dirname,'call.js')));
console.log(Object.keys(form))
console.log(form)
console.log(form.getHeaders())

var multiparty = require('multiparty');
var form = new multiparty.Form(options);
form.parse()