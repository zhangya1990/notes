const path = require('path');
const fs = require('fs');
console.log(path.basename(__dirname))
fs.exists(__dirname+'/ddd',function () {
    console.log(arguments)
})