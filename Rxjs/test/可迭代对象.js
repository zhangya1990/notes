const obj = {
    [Symbol.iterator]:function(){
        let i = 0;
        return {
            next(){
                i++;
                return {
                    value:1,
                    done:i>10
                }
            }
        }
    }
}
for(let val of obj){
    console.log(val)
}