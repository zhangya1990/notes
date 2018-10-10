// 先分解，再分别组合成有序数组，依次向上归并为最终的有序数组(内存占用较大)


var arr = [2,5,6,3,5,6,5,8,7,8,7,9,0,12,45,74,324,75,43,7,86,5,75];

function getRandom(){
    return Math.round(Math.random()*100);
}
// var arr = [];
// for(var i = 0;i<100;i++){
//     arr.push(getRandom())
// } 

/* function sort(arr){
    var len = arr.length;
    if(len  == 1){
        return arr
    }
    var breakIndex = Math.ceil(len/2);
    var left = arr.slice(0,breakIndex);
    var right = arr.slice(breakIndex);
    return mergeSort(left,right)
}
 */
/* function mergeSort(arr1,arr2){
    arr1 = sort(arr1);
    arr2 = sort(arr2);
    var i = j = 0;
    var temp = [];
    while(i<arr1.length && j<arr2.length){
        if(arr1[i] < arr2[j]){
            temp.push(arr1[i++])
        }else{
            temp.push(arr2[j++])
        }
    }
    if(i == arr1.length){
        temp = temp.concat(arr2.slice(j))
    }else{
        temp = temp.concat(arr1.slice(i))
    }
    return temp
} */



function mergeSort(arr1=[],arr2=[]){
    var i = j = 0;
    var temp = [];
    while(i<arr1.length && j<arr2.length){
        if(arr1[i] < arr2[j]){
            temp.push(arr1[i++])
        }else{
            temp.push(arr2[j++])
        }
    }
    if(i == arr1.length){
        temp = temp.concat(arr2.slice(j))
    }else{
        temp = temp.concat(arr1.slice(i))
    }
    return temp
}

console.log(sort(arr))


function sort(arr){
    if(arr && arr.length == 1){
        return Array.isArray(arr[0]) ? arr[0] : arr
    }
    var i = 0;
    var len = arr.length;
    var tempArr = [];
    while(i < len){
        var cur = toArray(arr[i]);
        var next = toArray(arr[i+1]);
        tempArr.push(mergeSort(cur,next));
        i += 2;
    }
    return sort(tempArr)
}

function toArray(m){
    return typeof m == 'undefined' ? [] : Array.isArray(m) ? m : [m]
}