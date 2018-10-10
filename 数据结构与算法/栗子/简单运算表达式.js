
var str = '1+2*(3+4)';
var str1 = '(1+2)*3/(1+2)+6';

// 首先将后缀表达式转换为中缀表达式
function getSufExp(expression){
    var arr = [];
    var suffixExp = '';
    var temp;
    for(let i = 0;i<expression.length;i++){
        var cur = expression[i];
        if(!isNaN(cur)){
            suffixExp += cur;
        }else if(cur == '+' || cur == '-' || cur == '*' || cur == '/'){
            arr.push(cur)
        }else if(cur == '('){
            arr.push('(')
        }else if(cur == ')'){
            while((temp = arr.pop()) !== '('){
                suffixExp += temp;
            }
        }
    }
    while(arr.length){
        suffixExp += arr.pop();
    }
    return suffixExp
}

// 计算
function calculateSuf(suf){
    console.log(suf)
    var stack = [];
    for(var i = 0;i<suf.length;i++){
        var cur = suf[i];
        if(!isNaN(cur)){
            stack.push(cur)
        }else{
            var result = eval(`${stack.pop()}${cur}${stack.pop()}`);
            console.log(result)
            if(i !== suf.length - 1){
                stack.push(result)
            }else{
                return result
            }
        }
    }
}

function calculate(str){
    var suffixExp = getSufExp(str);
    return calculateSuf(suffixExp)
}

console.log(calculate(str))
console.log(calculate(str1))
