//查找一个字符串或数组中的指定值，并返回所在位置

function findValueInArr(val,arr){
    for(let i = 0;i<arr.length;){
        if(arr[i] == val){
            return i
        }
        i++
    }
    return -1
}


//添加哨兵,在循环体内少一次比较
function findValueInArrByGuard(val,arr){
    var len = arr.length;
    var lastValue = arr[len-1];
    arr[len-1] = val;
    for(let i = 0;arr[i] !== val;){
        i++
    }
    arr[len-1] = lastValue
    return i == len - 1 ? -1 : i
}