// 用数组的起始值作为参考值，向后或向前比较换位，直到把当前值换到属于它的位置 起始 index 等于终止 index
// 具体思路 末尾值与参考值作比较，若末尾值较大，末尾index减小，向前一位，若末尾值较小，与参考值换位，此时，参考值转到末尾处，末尾 index 向后的值均比当前值大，然后起始值与参考值作比较，若起始值较小，向后一位，否则换位，此时起始index向前的值均比当前值小，参考值转到起始处 。。。最终可以确定参考值所在的位置，前后各递归处理

console.time('kuai pai')
var arr = [2,5,6,3,5,6,5,8,7,8,7,9,0,12,45,74,324,75,43,7,86,5,75];


function quickSort(arr,start=0,end=arr.length-1) {
    if(end-start < 2){
        if(end == start){
            return arr
        }
        if(arr[start] > arr[end]){
            swap(arr,start,end)
        }
        return arr
    }

    // var partialIndex = getPartial(arr,start,end);
    var partialIndex = getPartialFrontToEnd(arr,start,end);
    quickSort(arr,0,partialIndex-1);
    quickSort(arr,partialIndex+1,end);
}

// 首先选第一个值为对比对象，先从后向前遍历，如果遍历到的值小于对比值，互换，将后值设置为对比对象，再从前向后遍历，如果遍历到的值大于对比值，互换，将前值设置为对比对象，依次类推，直到遍历完整个数组……
function getPartial(arr,start,end){
    var temp = start;
    var partialValue = arr[start];
    // console.log(partialValue)
    while(start < end ){
        while(start < end && arr[end] >= partialValue){
            end--;
        }
        arr[start] = arr[end];
        arr[end] = partialValue;
        temp = end;

        while(start < end && arr[start] <= partialValue){
            start++;
        }

        arr[end] = arr[start];
        arr[start] = partialValue;
        temp = start;
        
    }
    // arr[temp] = partialValue;
    return start
}

//从前向后遍历，获取分割点，选取最后一个值为对比对象，分割点初始为零，从前向后遍历，如果小于对比对象，移动到分割点，分割点后移一位，可保证分割点前全部小于对比对象，分割点后全部不小于对比对象，直到数组末尾，将对比对象换到分割点，返回分割点索引
function getPartialFrontToEnd(arr,start,end){
    var partialValue = arr[end];
    var i = start;
    var j = start;
    while(i<end){
        var temp = arr[i];
        if(temp < partialValue){
            arr[i] = arr[j];
            arr[j] = temp;
            j++
        }
        i++;
    }
    arr[end] = arr[j];
    arr[j] = partialValue;
    return j
}

function swap(arr,one,two){
    var temp = arr[one];
    arr[one] = arr[two];
    arr[two] = temp;
}

function getMin(){
    console.log(arguments)
    return Math.min(...arguments)
}

quickSort(arr)
console.log(arr)
console.timeEnd('kuai pai')





