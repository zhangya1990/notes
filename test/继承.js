 function Father() {
     this.a = 'aaa';
 }
 Father.prototype.fn1 = function () {
     console.log('1');
 };

 function Child() {
     this.b = 'bbb';

 }
 Child.prototype.fn2 = function () {
     console.log('2')
 };
 var originPro = Child.prototype;
 Child.prototype = Object.assign(new Father(),originPro);


 var ch = new Child();
 ch.fn1();
 ch.fn2();