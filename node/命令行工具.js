let requiredAge = 18;
process.stdout.write('Please write your age: ');
process.stdin.setEncoding('utf8');
process.stdin.on('data',(data)=>{
    let age = parseInt(data,10);
    if(isNaN(age)){
        console.log('%s is not a valid number!',data);
    }else if(age < requiredAge){
        console.log('You must be at least %d to enter, '+ 'come back in %d years',requiredAge,requiredAge-age);
    }else{
        enterTheSecretDungeon();
    }
    //关闭stdin
    // process.stdin.pause();
});
function enterTheSecretDungeon(){
    console.log('Welcome to The Program :)');
}
process.on('exit',(code)=>{
    console.log(code)
})
console.log('\033[32mhello\033[39m');