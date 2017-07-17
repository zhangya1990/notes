
function tryError(){
    try{
        setTimeout(()=>{
            console.log(a)
        },0)
    }catch (e){
        console.log(e)
    }
}
// tryError();
function tryErrorPromise(){
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            try{
                resolve(a)
            }catch(e){
                console.log(c)
                reject(e)
            }
        },1000)
    }).then(()=>{},(e)=>{
        console.log(e.stack)
        console.log(b)
    }).catch((e)=>{
        console.log(e)
    })
}
Promise.resolve().then(tryErrorPromise).catch((e)=>{
    console.log(e)
})

process.on('uncaughtException',(e)=>{
    console.log(e.stack)
})