const _ = require('underscore');
function lazyChain(obj){
    var calls = [];

    return {
        invoke:function(methodName){
            var args = _.rest(arguments);
            calls.push(function(target){
                var meth = target[methodName];
                return meth.apply(target,args);
            });
            return this;
        },
        force:function(){
            return _.reduce(calls,function(ret,thunk){
                return thunk(ret);
            },obj)
        }
    }
}

var lazyOp = lazyChain([2,3,1])
    .invoke('concat',[7,7,4,5,3])
    .invoke('sort');
console.log(lazyOp.force())

function deferredSort(ary){
    return lazyChain(ary).invoke('sort');
}

var deferredSorts = _.map([[2,1,3],[5,3,6],[0,9,6]],deferredSort);
function force(thunk){
    return thunk.force();
}
console.log(_.map(deferredSorts,force))
