// 堆排序就是利用堆(假设利用大顶堆)进行排序的方法。它的基本思想是， 将待排序的序列构造成一个大顶堆。此时，整个序列的最大值就是堆顶的根结点。将它移走(其实就是将其与堆数组的末尾元素交换，此时末尾元素就是最大值) .然后将剩余的元素序列重新构造成堆，如此反复执行，得到有序序列了

//堆排序的时间复杂度为 O(nlogn) 。由于堆排序对原始记录的排序状态并不敏感，无论是最好、最坏和平均时间复杂度均为 (nlogn) 。性能上显然要远远好过于冒泡、简单选择 直接插入的 O(n2) 的时间复杂度了。由于记录的比较与交换是跳跃式进行，因此堆排序也是种不稳定的排序方法。另外，由于初始创建堆所需的比较次数较多，因此，它并不适合待排序序列个数较少的情况

// var arr = [2,5,6,3,5,6,5,8,7,8,7,9,0,12,45,74,324,75,43,7,86,5,75];

function getRandom(){
    return Math.round(Math.random()*100);
}
var arr = [];
for(var i = 0;i<100;i++){
    arr.push(getRandom())
} 

var m = 0;

// 调整索引 nodeIndex 处的值
function heapAdjust(arr,nodeIndex=0,end=arr.length-1){
    if(!arr[nodeIndex] && arr[nodeIndex] !== 0 || end > arr.length-1){
        console.warn('参数不合法~')
        return 
    }
    var temp = arr[nodeIndex];
    var startIndex = 2*nodeIndex + 1;
    for(var i = startIndex;i<=end;i =2*i+1){
        ++m;
        // 按照值较大的子节点向下查找
        if(arr[i] < arr[i+1] && i< end){
            i++
        }
        var curValue = arr[i];

        // 上浮子节点较大的值，下沉父节点较小的值（若子节点值较大，将父节点的值赋值为子节点值，继续向子节点的较大子节点查找 - - ，并标记当前子节点的位置，最终赋值为较小的值 ）
        if(temp < arr[i]){
            arr[nodeIndex] = arr[i]; 
            nodeIndex = i;
        }else{
            break;
        }
    }
    arr[nodeIndex] = temp;
    return arr
}


//堆排序
function arrHeapSort(arr){
    //首先，构建大顶堆
    var i = arr.length-1;
    HeapSort(arr,i);
    console.log(arr)

    while(i>0){
        
        // 把最大值跟最后一项互换，其余项继续调整为大顶堆...
        // console.log(arr)
        var temp = arr[0];
        arr[0] = arr[i];
        arr[i] = temp;
        i--;
        // 初始化大顶堆已完成，只需调整根节点的值即可
        heapAdjust(arr,0,i)
    }
}

function HeapSort(arr,len=arr.length-1){
    // console.log(len)
    // 从最后一个非叶子节点向前遍历
    var start = Math.floor((len+1)/2-1);
    start < 0 && (start = 0);

    for(var i = start;i>=0;i--){
        heapAdjust(arr,i,len)
    }
}

arrHeapSort(arr)
console.log(arr)
console.log(arr.length)
console.log(m)
