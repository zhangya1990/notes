const axios = require('axios');
function getData(url,obj){
    return axios.get(url,{params:obj})
}
axios.all([getData('http://fanyi.baidu.com/sug',{
    kw:'Performing'
}),getData('http://fanyi.baidu.com/sug',{
    kw:'Perform'
})]).then(axios.spread(function(...arg){
    console.log(arg)
}))

/*
axios.all([getData('http://fanyi.baidu.com/sug',{
    kw:'Performing'
}),getData('http://fanyi.baidu.com/sug',{
    kw:'Perform'
})]).then(function(arg){
    console.log(arg)
}).catch(console.log.bind(console))
*/
