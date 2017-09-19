var obj = {
    name:'zhang'
};
var proxy = new Proxy(obj,{
    get(){
        return true
    }
});

console.log(proxy.name === obj.name)