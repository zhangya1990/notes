var a = 10;
!function gogo(){
    a--;
    console.log(a)
    if(a>0){
        gogo();
    }
}()
console.log(gogo)