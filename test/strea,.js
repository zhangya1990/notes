const fs = require('fs');
var stream = fs.createReadStream(__dirname+'/return.js');
var buffer = fs.readFileSync(__dirname+'/return.js');
console.log(stream)
console.log(buffer)