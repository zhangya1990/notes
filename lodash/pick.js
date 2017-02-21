//从对象中提取属性生成新的对象
const _ = require('lodash');
var obj = {name:'zhang',age:22,hobby:'girl'};
var obj1 = _.pick(obj,['name','age']);
console.log(obj1)