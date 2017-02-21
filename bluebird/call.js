const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
let thisPath = __dirname;
let now = Date.now();

fs.readdirAsync(thisPath)
    .map(function (filename) {
        return fs.statAsync(path.join(thisPath, filename))
    })
    .call('forEach', function (stat) {
        console.log(stat.isFile())
        // return (now - new Date(stat.mtime)) < 10000;
    })
    .then(function (what) {
        console.log(what)
    })

