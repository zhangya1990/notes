const Promise = require('bluebird');
const pmap = Promise.map;
const props = Promise.props;
const _ = require('lodash');
const fs = Promise.promisifyAll(require('fs'));

function getTotalSize(paths){
    return pmap(paths,function(path){
        return fs.statAsync(path).get('size');
    }).reduce(function(a,b){
        return a+b
    },0);
}
fs.readdirAsync('.').then(_)
    .call('groupBy',function (filename) {
        // console.log(arguments.callee.toString())
        return filename.charAt(0);
    })
    .call('map',function(filenames,firstCh){
        return props({
            firstCh:firstCh,
            count:filenames.length,
            totalSize:getTotalSize(filenames)
        })
    })
    .call('value').all().then(_)
    .call('sortBy','count')
    .call('reverse')
    .call('map',function(data){
        return data.count + ' total files beginning with ' + data.firstCh + ' with total size of ' + data.totalSize + ' bytes'
    })
    .call('join','\n')
    .then(console.log)
    .catch(console.log.bind(console))

console.log(_([1,2,3]).groupBy)