var obj = {name:'zhang'};
Object.defineProperty(obj,'b',{
    value:'gogo',
    writable:true,
    configurable:false,
    enumerable:true
});
console.log(obj)
obj.b = 'haha';
console.log(obj)
delete obj.b
console.log(obj)