var big = [
    {
        id:0,
        size: 3,
        value: 10
    },
    {
        id:1,
        size: 4,
        value: 10
    },
    {
        id:2,
        size: 3,
        value: 16
    },
    {
        id:3,
        size: 3,
        value: 15
    },
    {
        id:4,
        size: 4,
        value: 20
    },
    {
        id:5,
        size: 5,
        value: 22
    },
    {
        id:6,
        size: 6,
        value: 26
    },
    {
        id:7,
        size: 3,
        value: 13
    },
    {
        id:8,
        size: 3,
        value: 19
    },
    {
        id:9,
        size: 4,
        value: 22
    },
    {
        id:10,
        size: 5,
        value: 22
    },
    {
        id:11,
        size: 6,
        value: 30
    }
]

var value = [10, 10, 10, 16, 20, 22, 28];
var size = [3, 4, 2, 3, 4, 5, 6];
var n = 7;

function max(a, b) {
    return (a > b) ? a : b;
}

// 递归方案
function knapsack(total, size, value, n) {
    if (n == 0 || total == 0) {
        return 0;
    }
    // 如果 第 n 项的空间大于总空间，计算前n-1项的最大值
    if (size[n - 1] > total) {
        return knapsack(total, size, value, n - 1);
    } else {
        // value[n-1] 第 n 项的价值  加上  knapsack(total - size[n - 1], size, value, n - 1) 去掉第n项的空间后，前n-1项在给定空间内的最大价值
        // knapsack(total, size, value, n - 1) 给定总空间内前n-1项的最大价值
        // 取两者的最大值，不断递归 ……
        return max(value[n - 1] +
            knapsack(total - size[n - 1], size, value, n - 1),
            knapsack(total, size, value, n - 1));
    }
}

function getMax(cur,last,most){
    var curValue = cur.value;
    var lastRoomMost = last.total;
    var mostRoomExceptCur = most.total;
    var max;
    if(curValue + lastRoomMost >= mostRoomExceptCur){
        return {
            total:curValue + lastRoomMost,
            ids:[cur.id].concat(last.ids)
        }
    }else{
        return most
    }
}

// 动态规划方案 (使用数组缓存所有的结果)
function dKnapsack(list,total){
    var arr = [];
    for(var i = 0;i<=list.length;i++){
        arr.push([]);
        var curProduct = list[i-1] || {};
        var curSize = curProduct.size;
        var curValue = curProduct.value;
        for(var j = 0;j<=total;j++){
            if(i == 0 || j == 0){
                arr[i][j] = {total:0,ids:[]}
            }else if(curSize <= j){
                // 除去当前物品的剩余空间的剩余物品最大价值
                var lastRoomMost = arr[i-1][j-curSize];
                // 总空间中除去当前物品的剩余物品的最大价值
                var mostRoomExceptCur = arr[i-1][j];
                // console.log(lastRoomMost,mostRoomExceptCur)
                arr[i][j] = getMax(curProduct,lastRoomMost,mostRoomExceptCur)
            }else{
                arr[i][j] = arr[i-1][j];
            }
        }
    }
    console.log(arr)
    // arr[len][total] 即表示 len 个物品，背包总容量为 total 时的最大价值
    return arr[list.length][total]
}


console.log(dKnapsack(big,18))

