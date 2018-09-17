function getRandomNumber(min=0,max=9){
    var temp = (Math.random()*(max-min)).toFixed(2);
    return temp % 1 > 0 ? +temp : +((+temp).toFixed(0))
}

function getRandom(min=0,max=9){
    return Math.round(Math.random()*(max-min))
}


/* 
    计算因子
    Type ComputationalFactor{
        优先级
        priority:Number,
        是否是数字
        isNumber:Boolean,
        是否是表达式
        isExpression:Boolean,
        什么类型的表达式（表达式实例）
        表达式(单个值或者表达式)
        expression:String
        val:Number
    }

*/

class ComputationalFactor{
    constructor(getNumber){
        this.val = null;
        this.isNumber = true;
        this.getNumber = getNumber.bind(this);
        this.refresh();
    }
    refresh(){
        this.val = this.getNumber();
        this.expression = ''+this.val;
    }
}


class ExpressionUnit{
    constructor(a,b){
        /* 
            计算单元
            first:ComputationalFactor || ExpressionUnit,
            second:ComputationalFactor || ExpressionUnit,
            操作符
            operator:Enum['+','-','*','/'],
            优先级
            priority:Number,
            表达式
            expression:String,
            表达式计算结果
            val:Number
        */
        this.first = a;
        this.second = b;
        this.operator = '+';
        this.priority = 0;
        this.isExpression = true;
        this.genExpression();
    }
    calculateRule(){
        return true
    }
    genExpression(){
        this.calculateRule();
        this.expression = `${this.first.expression}${this.operator}${this.second.expression}`;
        this.val = eval(this.expression);
    }
    wrapBrackets(){
        this.expression = `(${this.expression})`;
        this.priority+=2;
    }
    refresh(){
        this.first.refresh();
        this.second.refresh();
        this.genExpression();
    }
}

class PlusUnit extends ExpressionUnit{
    constructor(a,b){
        super(a,b);
        this.genExpression();
    }
}

class MinusUnit extends ExpressionUnit{
    constructor(a,b){
        super(a,b);
        this.operator = '-';
        this.priority = 0;
        this.genExpression();
    }
    calculateRule(){
        
        while(this.first.val < this.second.val){
            this.first.refresh()
            this.second.refresh();
        }

        //第二个参数是加法表达式或减法表达式，加括号
        if(this.second.isExpression && this.second.priority == this.priority){
            if(this.second instanceof MinusUnit || this.second instanceof PlusUnit){
                this.second.wrapBrackets();
            }
        }
    }
}

class MultiplyUnit extends ExpressionUnit{
    constructor(a,b){
        super(a,b);
        this.operator = '*';
        this.priority = 1;
        this.genExpression();
    }
    calculateRule(){
        if(this.first.isExpression && this.first.priority < this.priority){
            if(this.first instanceof MinusUnit || this.first instanceof PlusUnit){
                this.first.wrapBrackets();
            }
        }
        //第二个参数是加法表达式或减法表达式，加括号
        if(this.second.isExpression && this.second.priority < this.priority){
            if(this.second instanceof MinusUnit || this.second instanceof PlusUnit){
                this.second.wrapBrackets();
            }
        }
    }
}

class DivisionUnit extends ExpressionUnit{
    constructor(a,b){
        super(a,b);
        this.operator = '/';
        this.priority = 1;
        this.genExpression();
    }
    calculateRule(){
        
        while(this.second.val == 0 || (this.first.val%this.second.val !=0)){
            this.first.refresh();
            this.second.refresh();
        }

        if(this.first.isExpression && this.first.priority <= this.priority){
            this.first.wrapBrackets();
        }
        if(this.second.isExpression && this.second.priority <= this.priority){
            this.second.wrapBrackets();
        }
    }
}

function getCalcateUnit(operator){
    
    switch (operator){
        case '+':
            return PlusUnit;
        case '-':
            return MinusUnit;
        case '*':
            return MultiplyUnit;
        default:
            return DivisionUnit
    }
}

//count个数的表达式，操作符count-1个
function getExpress(total){
    const operators = ['+','-','*','/'];
    let customOperators = [];
    let expression = '';
    let unit;
    let count = 0;

    function next(nextVal){
        const curOperator = operators[getRandom(0,3)];
        const Unit = getCalcateUnit(curOperator);
        if(!nextVal){
            let first = new ComputationalFactor(getRandom);
            let second = new ComputationalFactor(getRandom);
            unit = new Unit(first,second);
        }else{
            if(Math.random()<0.5){
                unit = new Unit(unit,nextVal);
            }else{
                unit = new Unit(nextVal,unit);
            }
        }
        // console.log('=====================')
        // console.log(unit.expression)
        // console.log(unit.val)
        expression = unit.expression;
        if(count < total-2){
            count++;
            next(new ComputationalFactor(getRandom))
        }
    }
    next();
    console.log(unit.expression)
    
    return expression
}

console.log('===================')
getExpress(2)
getExpress(3)
getExpress(4)
getExpress(5)
getExpress(6)
