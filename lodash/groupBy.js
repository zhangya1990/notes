const _ = require('lodash');
var obj = _.groupBy([4.2,6.4,6.6],function(item){
    console.log(item)
    return Math.floor(item)
    //回调函数的返回值作为groupBy方法返回对象的key，并以此来分类
})
console.log(obj)
// {4:[4.2],6:[6.4,6.6]}