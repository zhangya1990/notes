//查询符合条件的第一项
const _ = require('lodash');
var user1 = {
    name: 'zhangsan',
    height: 180,
    weight: 131
};
var user2 = {
    name: 'lisi',
    height: 180,
    weight: 130
};
var user3 = {
    name: 'zhangsan',
    height: 180,
    weight: 120
};

var users = [user1, user2, user3];
var result = _.find(users, {name: 'zhangsan', weight: 131});
var result1 = _.find(users, {name: 'zhangsan'});
console.log(result);
console.log(result1);
