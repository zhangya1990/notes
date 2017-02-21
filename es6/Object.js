//Object.is(a,b)  比较两个值是否相同，与===基本相同，不同之处在于+0不等于-0，NaN等于NaN
console.log(Object.is(+0,-0));
console.log(Object.is(NaN,NaN));


//Object.assign  用于对象的合并，将源对象的而所有可枚举属性，复制到目标对象
//该方法实行的是浅拷贝，不是深拷贝，如果源对象某个属性的值是对象，那么目标对象拷贝的是对该对象的引用
//对于嵌套对象，一旦遇到同名属性，处理方法是替换
var target = {a:1};
var b = {b:2};
var c = {c:3};
Object.assign(target,b,c);
console.log(target)

//属性描述对象  Object.getOwnPropertyDescriptor(obj,'psops')
let obj = {
    name:'hello'
};
let curPro = Object.getOwnPropertyDescriptor(obj,'name');
console.log(curPro)
/*
* { value: 'hello',
 writable: true,
 enumerable: true,
 configurable: true }
* */
//for in循环，Object.keys(),JSON.stringify()会忽略enumerable为false的属性


//对象遍历
//遍历规则
//首先遍历所有属性名为数值的属性，按照数字排序
//其次遍历所有属性名为字符串的属性，按照生成时间排序
//最后遍历所有属性名为Symbol的属性，按照生成时间排序

//for in  遍历自身的和继承的可枚举属性(不含Symbol属性)
//Object.keys(obj)   遍历自身的可枚举属性(不含继承的，不含Symbol属性),返回一个数组
//Object.getOwnPropertyNames(obj)  遍历对象自身的所有属性(不含Symbol属性，但是包含不可枚举的),返回一个数组
//Object.getOwnPropertySymbols(obj)  包含对象自身的所有Symbol属性,返回一个数组
//Reflect.ownKeys(obj)  包含对象自身的所有属性(包含Symbol和不可枚举属性)