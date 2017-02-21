Promise.resolve(4).then(function(a){
    console.log(a);
    return /*new Promise(function(resolve,reject){
        setTimeout(function(){
            resolve(6)
        },2000)
    })*/
}).then(function(a){
    console.log(a)
})


Promise.resolve(22).then(function(){
    return Promise.resolve(66)
}).then(function(val){
    console.log(val)
})