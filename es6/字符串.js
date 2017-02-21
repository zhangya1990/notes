//方法
//includes()   startsWidth()   endsWidth()  这三个方法都支持第二个参数，表示开始搜索的位置

//repeat(n)  表示将原有字符串重复n次

//padStart()   padEnd()  头部补全或者尾部补全  es7方法
// var str = 'aa';
// console.log(aa.padStart(5,'ab'))

//String.raw()  常用作模板字符串的处理函数，返回一个斜杠都被转义的字符串，对应于替换变量后的摸板字符串
var str = String.raw`c:\n${'html'}`;
console.log(str)