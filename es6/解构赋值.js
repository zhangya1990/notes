const obj = {foo:'lala',boo:'golgo'};
const {foo:fs,boo:co} = obj;
const {foo,boo} = obj;
console.log(fs,co)
console.log(foo,boo)