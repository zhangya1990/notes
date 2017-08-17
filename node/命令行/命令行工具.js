let requiredAge = 18;
process.stdout.write('Please write your age: \n');

process.stdin.setEncoding('utf8');
process.stdin.on('data',(data)=>{
    console.log(data)
    let age = parseInt(data,10);
    if(isNaN(age)){
        console.log('%s is not a valid number!',data);
    }else if(age < requiredAge){
        console.log('You must be at least %d to enter, '+ 'come back in %d years',requiredAge,requiredAge-age);
    }else{
        enterTheSecretDungeon();
    }
    if(data.slice(0,-1) === 'end'){
        // process.stdin.emit('end');
    }
    //关闭stdi
    // process.stdin.pause();
});
process.stdin.on('end',()=>{
    console.log('process ended');
})
function enterTheSecretDungeon(){
    console.log('Welcome to The Program :)');
}
process.on('exit',(code)=>{
    console.log(code)
})
process.stdin.push('lalalalallalalalal');
process.stdin.push('null');
console.log(process.stdin instanceof require('stream').Readable)