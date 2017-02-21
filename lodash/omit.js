const _ = require('lodash');
//删除对象属性，返回一个新对象，原对象保持不变
var obj = {
    name:'zhang',
    age:10,
    sex:'male'
}
var obj1 = _.omit(obj,'name');
console.log(obj)
console.log(obj1)
