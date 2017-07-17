function a(){

}
a.apply()
a.apply.call();

Function.prototype.apply = function(thisArg,argArray) {};

Function.prototype.call = function(thisArg,args) {};