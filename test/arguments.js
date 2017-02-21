function sum(){
    console.log(arguments);
    [].shift.call(arguments);
    console.log(arguments);
}
sum(1,2)