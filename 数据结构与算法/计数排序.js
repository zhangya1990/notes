
function getRandom(n,m){
    return Math.round(Math.random()*(m-n)+n);
}
var arr = [];
for(var i = 0;i<50;i++){
    arr.push(getRandom(12,36))
} 
console.log(arr)

function countSort(arr){
    var len = arr.length;
    // 查找原数组中的最大值和最小值
    var max = Math.max.apply(Math,arr);
    var min = Math.min.apply(Math,arr);

    // 创建计数数组，数组索引及源数据值，起始索引为原数据最小值
    var bottleArr = new Array(max+1);
    bottleArr.fill(0);
    for(var i = 0;i<len;i++){
        bottleArr[arr[i]]++
    }
    console.log(bottleArr)
    // 重置数组的值为数组项的累加值，表明不大于原数值（及数组索引）的值共有多少项,即排序后的 索引+1
    for(var j = min+1;j<=max;j++){
        bottleArr[j] = bottleArr[j] + bottleArr[j-1]=
    }

    console.log(bottleArr)

    // 从后向前遍历原数组，从 bottleArr 中获取排序后所处位置
    var result = [];
    for(var z = len-1;z>=0;z--){
        var index = arr[z];
        var resultIndex = bottleArr[index];
        result[resultIndex-1] = index;
        bottleArr[index]--
    }
    console.log(result.length)
    return result
}

console.log(countSort(arr))
