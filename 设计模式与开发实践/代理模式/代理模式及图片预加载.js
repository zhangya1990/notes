//代理的意义
//单一职责原则指的是，就一个类（通常也包括对象和函数等）而言，应该仅有一个引起它变化的原因。如果一个对象承担了多项职责，就意味着这个对象将变得巨大，引起它变化的原因可能会有多个。面向对象设计鼓励将行为分布到细粒度的对象之中，如果一个对象承担的职责过多，等于把这些职责耦合到了一起，这种耦合会导致脆弱和低内聚的设计，当变化发生时，设计可能会遭到意外的破坏。
//在客户看来，代理对象和本体是一致的，代理接手请求的过程对于用户来说是透明的，用户并不清楚代理和本体的区别，这样做的好处：
//用户可以放心的请求代理，他只关心能否得到想要的结果
//在任何使用本体的地方都可以替换成使用代理

var myImage = (function(){
    var imgNode = document.createElement('img');
    document.body.appendChild(imgNode);
    return {
        setSrc:function(src){
            imgNode.src = src
        }
    }
})();

var proxyImage = (function(){
    var img = new Image();
    img.onload = function(){
        myImage.setSrc(this.src)
    }
    return {
        setSrc:function(src){
            myImage.setSrc('file://...');//本地图片
            img.src = src
        }
    }
})();

proxyImage.setSrc('http://....')//请求图片