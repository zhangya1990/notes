//模板方法模式是一宗典型的通过封装变化提高系统高扩展性的设计模式，在传统的面向对象的语言中，一个运用了模板方法模式的程序，子类的方法种类和执行顺序都是不变的，把这部分逻辑抽象到父类的模板方法中，而子类的方法具体怎么实现是可变的。通过增加新的子类，可以给系统增加新的功能，在js中，可以使用高阶函数实现模板方法模式


var Beverage = function(param){
    var boilWater = function(){
        console.log('把水煮沸');
    };

    var brew = param.brew || function(){
            throw new Error('必须传递brew方法')
    };
    var pourInCup = param.pourInCup || function(){
            throw new Error('必须传递pourInCup方法')
    };
    var addCondiments = param.addCondiments ||　function(){
            throw new Error('必须传递addCondiments方法')
    };
    var F = function(){};
    F.prototype.init = function(){
        boilWater();
        brew();
        pourInCup();
        addCondiments();
    };
    return F;
};

var Coffee = Beverage({
    brew:function(){
        console.log('用沸水冲泡咖啡');
    },
    pourInCup:function(){
        console.log('把咖啡倒进杯子');
    },
    addCondiments:function(){
        console.log('加糖和牛奶');
    }
});

var Tea = Beverage({
    brew:function(){
        console.log('用沸水浸泡茶叶');
    },
    pourInCup:function(){
        console.log('把茶倒进杯子');
    },
    addCondiments:function(){
        console.log('加柠檬');
    }
});

var coffee = new Coffee;
coffee.init();

var tea = new Tea;
tea.init();