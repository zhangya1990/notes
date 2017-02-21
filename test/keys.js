var obj = {
    name:'zhang',
    age:9
}
console.log(Object.keys(obj))
// console.log(Object.values(obj))
// console.log(Object.entries(obj))
var ary = [1,2,3];
var i = ary.keys();
console.log(i.next().value)
console.log(i.next().value)
console.log(i.next().value)
console.log(ary.keys())