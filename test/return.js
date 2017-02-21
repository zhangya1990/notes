const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const baseDir = process.argv[2] || '.';
console.log(baseDir)

function writeFile(curpath,contents){
   var fullPath = path.join(baseDir,curpath);
   console.log(fullPath)
   return fs.writeFileAsync(fullPath,contents).thenReturn(1111111111)
}

writeFile('test.txt','this is text').then(function(fullPath){
    console.log(fullPath);
    console.log(`Successfully file at ${fullPath}`)
})