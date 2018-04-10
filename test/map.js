const obj = {
    name:'zhang'
}
const a = new Map([[obj,2]]);
console.log(a.get(obj))
a.set(obj,1)
console.log(a.get(obj))
// a.delete(obj)
console.log(a)
// a.clear()
console.log(a.size)