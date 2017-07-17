const stream = require('stream');
const rs = new stream.Readable();
rs.setEncoding('utf8');
rs.on('data',(data)=>{
    console.log(data)
});
rs.on('end',()=>{
    console.log('end-----------------')
});
rs.push('gogo');
rs.push('lolo');
rs.push('haha');
rs.push('wawa');
rs.push(null);