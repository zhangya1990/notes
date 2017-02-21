//修饰符
//u
//“Unicode模式”，用来正确处理大于\uFFFF的Unicode字符。也就是说，会正确处理四个字节的UTF-16编码。

//y
//“粘连”（sticky）修饰符，全局匹配，后一次匹配都从上一次匹配成功的下一个位置开始且必须从剩余的第一个位置开始，
//正则对象的sticky属性，表示是否设置了y修饰符
// source属性，返回正则表达式的正文，flags属性，返回修饰符
var r = /reg/y;
console.log(r.sticky)
console.log(r.source)
console.log(r.flags)