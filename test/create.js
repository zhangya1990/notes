let obj = {name:'zhang'};
let obj1 = Object.create(obj);
console.log(obj1.__proto__ === obj)

let obj2 = {};
Object.setPrototypeOf(obj2,obj);
console.log(obj2.__proto__ === obj1)
console.log(obj2.__proto__ === obj)


let obj3 = Object.create(null);
console.log(obj3.__proto__ == null)