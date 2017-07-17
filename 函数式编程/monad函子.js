const fs = require('fs');
const readFile = function(filename){
    return new Monad(function(){
        return fs.readFileSync(filename,'utf8')
    })
};

const print = function(x){
    return new Monad(function(){
        console.log(x);
        return x
    })
};

const tail = function(x){
    return new Monad(function(){
        return x[x.length-1]
    })
};

class Functor{
    constructor(val){
        this.val = val
    }
    map(f){
        return new Functor(f(this.val))
    }
    join(){
        return this.val;
    }
}

class Monad extends Functor{
    constructor(val){
        super(val)
    }
    chain(f){
        return this.map(f).join()
    }
}
var l = readFile('./基础.js')
    .chain(tail)
    .chain(print);
console.log(l)
