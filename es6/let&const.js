//let和const声明的变量不会提升，不是顶层变量的属性，块级作用域内生效
let a = 3;
console.log(global.a)//undefined
