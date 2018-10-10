function takeChange(total,coins){
    coins = coins.sort((a,b)=>b-a);
    var arr = [];
    var i = 0;
    var remain = total;
    while(remain && i<coins.length){
        console.log(remain)
        var curCoin = coins[i];
        var count = Math.floor(remain/curCoin);
        arr.push({coin:curCoin,count})
        remain = remain % curCoin
        i++;
    }
    return {
        remain,
        iconList:arr
    }
}

console.log(takeChange(173,[50,25,10,5,1]))

// console.log(Math.floor(0.03/0.01))
// console.log(1.73%0.5)