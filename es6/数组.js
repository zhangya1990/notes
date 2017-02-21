//Array.from()  将可遍历的对象转化为对象  array-like  set map string
var obj = {
    0:'a',
    1:'b',
    2:'c',
    length:3
}
var ary = Array.from(obj);
console.log(ary);
console.log(Array.from('abcec'))
console.log(Array.from(new Set(['a','b'])));
console.log(Array.from(new Map([['a','b'],['c','d']])))
~function(a,b){
    console.log(Array.from(arguments))
}(1,2)

//Array.of()  用于将一组值，转化为数组，用于弥补Array方法的不足，因为参数的个数不同，会导致Array方法的差异
console.log(Array.of('name','big',3,5))
console.log(Array.of())
console.log(Array.of(3))
console.log(Array(3))

//数组实例的find和findIndex方法  找到第一个符合条件的数组成员或者索引
var aa = [1,2,3,4].find(a=>a>3);
console.log(aa)

var bb = ['a','b','c','d'].findIndex(a=>a==='a')
console.log(bb)

//数组实例的fill方法，填充一个数组
var arr = Array(10).fill(7);
console.log(arr)

//遍历器  entries()  keys()  数组values()方法chrome报错，需要babel转译
var aaa = [1,2,3];
var en = aaa.entries();
var ke = aaa.keys();
for(let value of en){
    console.log(value)
}
for(let value of ke){
    console.log(value)
}
for(let value of aaa){
    console.log(value)
}
// console.log(aaa.values())

//includes  表示数组是否包含给定的值，第二个参数表示开始搜索的位置
console.log(aaa.includes(2))
var bbb = [NaN];
console.log(bbb.includes(NaN))