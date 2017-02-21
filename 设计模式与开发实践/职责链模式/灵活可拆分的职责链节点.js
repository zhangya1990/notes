//职责链模式：使多个对象都有机会处理请求，从而避免请求的发送者和接受者之间的耦合关系，将这些对象连成一条链，并沿着这条链传递该请求，直到有一个对象处理它为止。

//手机售卖
/*var order = function(orderType,pay,stock){
    if(orderType === 1){//500元定金购买模式
        if(pay === true){//已支付定金
            console.log('500元定金预购，得到100优惠券')
        }else{//未支付定金，降级为普通购买模式
            if(stock>0){//用于普通购买的手机还有库存
                console.log('普通购买，无优惠券')
            }else{
                console.log('手机库存不足')
            }
        }
    }else if(orderType === 2){
        if(pay === true){//已支付定金
            console.log('200元定金预购，得到50优惠券')
        }else{//未支付定金，降级为普通购买模式
            if(stock>0){//用于普通购买的手机还有库存
                console.log('普通购买，无优惠券')
            }else{
                console.log('手机库存不足')
            }
        }
    }else if(orderType === 3){
        if(stock>0){//用于普通购买的手机还有库存
            console.log('普通购买，无优惠券')
        }else{
            console.log('手机库存不足')
        }
    }
};*/

//职责链模式重构
var order500 = function(orderType,pay,stock){
    if(orderType === 1 && pay === true){
        console.log('500元定金预购，得到100元优惠券')
    }else{
        return 'nextSuccessor'//表示需要继续往后传递
    }
};
var order200 = function(orderType,pay,stock){
    if(orderType === 2 && pay === true){
        console.log('200元定金预购，得到50元优惠券')
    }else{
        return 'nextSuccessor'
    }
};
var orderNormal = function(orderType,pay,stock){
    if(stock>0){
        console.log('普通购买，无优惠券');
    }else{
        console.log('手机库存不足');
    }
};

var Chain = function(fn){
    this.fn = fn;
    this.successor = null;//表示在链中的下一个节点
};
Chain.prototype.setNextSuccessor = function(successor){
    return this.successor = successor
};
Chain.prototype.passRequest = function(){
    var ret = this.fn.apply(this,arguments);
    if(ret === 'nextSuccessor'){//如果得到的值为nextSuccessor,将请求传递给链中的下一个节点执行
        return this.successor && this.successor.passRequest.apply(this.successor,arguments);
    }
    return ret
};

//将3个订单函数包装成职责链中的节点
var chainOrder500 = new Chain(order500);
var chainOrder200 = new Chain(order200);
var chainOrderNormal = new Chain(orderNormal);

//指定节点在职责链中的顺序
chainOrder500.setNextSuccessor(chainOrder200);
chainOrder200.setNextSuccessor(chainOrderNormal);

//把请求传递给第一个节点
chainOrder500.passRequest(1,true,500)
chainOrder500.passRequest(1,false,500)
chainOrder500.passRequest(2,true,500)
chainOrder500.passRequest(2,false,0)
chainOrder500.passRequest(3,false,0)