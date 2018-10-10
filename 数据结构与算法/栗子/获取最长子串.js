var str1 = 'abcacdea';
var str2 = 'babcdea';

// 暴力对比，并且将结果缓存在数组中
function getLongEqul(str1,str2){
    var arr = [];
    var max = 0;
    var results = [];
    for(var i=0;i<str1.length;i++){
        arr.push([]);
        var word1 = str1[i];
        for(var j = 0;j<str2.length;j++){
            var word2 = str2[j];
            if(word1 == word2){
                if(i == 0 || j == 0){
                    arr[i][j] = 1
                }else{
                    arr[i][j] = arr[i-1][j-1] ? arr[i-1][j-1] + 1 : 1;
                }
                if(max <= arr[i][j]){
                    max = arr[i][j];
                    if(!results.length){
                        results.push({
                            max,
                            j
                        })
                    }else{
                        if(results[0].max < max){
                            results = [{max,j}]
                        }else{
                            results.push({max,j})
                        }
                    }
                }
            }
        }
    }
    return results.map(item=>{
        var {j,max} = item;
        return str2.slice(j-max+1,j+1)
    })
}

console.log(getLongEqul(str1,str2))