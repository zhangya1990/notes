'use strict';
const vm = require('vm');


//vm.runInThisContext(code)
//用于创建一个独立的沙箱运行空间，code内的代码可以访问外部的global对象，但是不能访问其他的对象，而且内部的global和外部的共享,该方法只能访问最顶层的global对象
var  p = 5;
global.p = 11;
//有点类似eval
/*vm.runInThisContext('console.log(p)');//11
vm.runInThisContext(console.log(p));//5
vm.runInThisContext('console.log(global)');//global*/

//vm.runInContext(code,contextGlobal)
//contextGlobal将做为变量传入code内，但不存在global变量,contextGlobal必须是vm.createContext()方法创建的sandBox
var window = {
    p:14,
    console
};
vm.createContext(window);//创建一个沙箱
vm.runInContext('console.log(p);console.log(global)',window);
//14  global is not defined