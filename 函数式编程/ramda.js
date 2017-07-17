//http://www.ruanyifeng.com/blog/2017/03/ramda.html
//http://www.ruanyifeng.com/blog/2017/03/pointfree.html
const R = require('ramda');
//Ramda的理念是function first，data last，数据一律放在后边
//Ramda的所有方法都支持柯理化
let square = n => n*n;
console.log(R.map(square,[4,8]));
console.log(R.map(square)([4,8]));