let a,b;
[a,b] = [1,2];
console.log(a,b)

let c,d;
({a:c,...d} = {a:'zhang',b:'wang'});
console.log(c,d)

// function get({a=0,b='zhang'}){
//     console.log(a,b)
// }
// get({b:'lala'})
//
// function get1({a,b} = {a:'la',b:'zhang'}){
//     console.log(a,b)
// }
// get1({b:'lala'})

var defaultO = {
    a:'zhang',
    b:'wang',
    c:'liiu'
};
/*var a1 = {
    a:'lala',
    ...defaultO
};

console.log(a1)
console.log(defaultO)*/

var b1 = {
    ...defaultO,
    a:'lala'
}

console.log(b1)
console.log(defaultO)
