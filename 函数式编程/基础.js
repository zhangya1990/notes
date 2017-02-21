const _ = require('underscore');
function existy(x){
    return x != null
}

function truthy(x){
    return (x != false) && existy(x)
}

function always(value){
    return function(){
        return value
    }
}

function fail(msg){
    console.log(msg)
}

/*function invoker(name,method){
    return function(target){
        if(!existy(target)) fail('Must provide a target');
        var targetMethod = target[name];
        var args = _.rest(arguments);

        return doWhen((existy(targetMethod) && method === targetMethod),function(){
            return targetMethod.apply(target,args)
        })
    }
}*/



function fnull(fun){
    var defaults = _.rest(arguments);
    console.log(defaults)
    return function(){
        var args = _.map(arguments,function(e,i){
            return existy(e) ? e : defaults[i]
        });
        return fun.apply(null,args)
    }
}
var nums = [1,2,3,null,5]
var safeMult = fnull(function(total,n){return total*n},1,1);
console.log(_.reduce(nums,safeMult));

//checker,接收一组谓词函数，并返回一个验证函数，返回的验证函数在给定的对象上执行每个谓词，并对每一个返回false的谓词增加一个特殊的错误字符串到一个数组中，如果所有的谓词函数都返回true，那么最终返回的结果是一个空数组
function checker(){
    var validators = _.toArray(arguments);

    return function(obj){
        return _.reduce(validators,function(errs,check){
            if(check(obj)){
                return errs
            }else{
                return _.chain(errs).push(check.message).value()
            }
        },[])
    }
}

//validator函数用来给每个验证函数添加验证信息message
function validator(message,fun){
    var f = function(){
        return fun.apply(fun,arguments);
    };
    f['message'] = message;
    return f;
}

var gonnaFail = checker(validator('ZOMG',always(false)));
console.log(gonnaFail(100))