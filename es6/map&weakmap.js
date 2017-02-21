//Map结构是一组键值对的集合，不同于对象的是，键可以是任何数据类型
//Map接受一个数组作为参数，该数组的成员是一个个表示键值对的数组,如果对同一个键多次赋值，后面的值会覆盖前面的值，读取一个未知的键，返回undefined，map结构将NaN视为同一个键

var map = new Map([
    [{obj:'haa'},3],
    [function get(){
        return 'haha'
    },'gogo']
]);
console.log(map)

//属性方法
//map.set(key,value)  返回整个Map结构，如果key已经有值，就覆盖原有的值，可以采用链式写法

let map2 = new Map();
map2.set('hello',1).set(
    {obj:'gg'},'lala'
).set([1,3,4,5],'woqu');

//get(key) has(key) delete(key) clear()   map.size

//遍历方法   遍历顺序及插入顺序
//keys()  values()   entries()  forEach()
let map3 = new Map([
    ['F', 'no'],
    ['T',  'yes'],
]);
console.log(map3.keys())
for (let key of map3.keys()) {
    console.log(key);
}

//WeakMap  只接受对象作为键名(null除外),键名所指的对象，不计入垃圾回收机制，当对象被回收后，WeakMap自动移除对应的键值对,无法遍历，没有size属性
//get()  set()  has() delete()