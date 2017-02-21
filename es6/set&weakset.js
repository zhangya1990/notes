//set是一组值的集合，成员的值都是唯一的,在set内部认为NaN和NaN是相等的
var s = new Set();

//set可以接受数组，或类数组进行初始化
var set2 = new Set([1,2,3,3]);

//数组去重
[...new Set([1,2,3,3,4])];

//属性方法
//set.add()  添加某个值，返回set结构本身
s.add(2);
var size = s.size;
console.log(size)
console.log(s)

//set.delete()  删除某个值，返回一个布尔值，表示是否删除成功
var m = s.delete(3)
console.log(m)

//set.has()  返回一个布尔值，表示该值是否为set的成员
var n = s.has(4);
console.log(n)

//set.clear()  清除所有成员，没有返回值
s.clear();

//Array.from()  将一个set结构转化为数组
var items = new Set([1,2,3,4,5]);
var ary  = Array.from(items);
console.log(ary)

//遍历set结构
//set.keys() 返回键名  set.values()  返回键值 set.entries() 返回键值对 set.forEach()  遍历的顺序就是插入的顺序
//keys,values,entries方法返回的都是遍历器对象

let set3 = new Set(['red','green','yellow']);
let keyiter = set3.keys();
console.log(keyiter)
console.log(set3.size)
console.log(typeof keyiter)



//WeakSet
//WeakSet的成员只能是对象，并且对象的引用都是弱引用，即垃圾回收机制不考虑WeakSet对该对象的引用，意思是，只要其他对象都不在引用该对象，那么垃圾回收机制会自动回收该对象所占用的内存，因此WeakSet是不可遍历的
//方法  add delete has