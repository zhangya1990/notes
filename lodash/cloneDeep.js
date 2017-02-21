const _ = require('lodash');
//深度克隆
var obj = {
    name:'zhang',
    detail:{
        age:66
    }
};
var obj2 = _.cloneDeep(obj);
console.log(obj2)
