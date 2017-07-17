//常见的Duplex Streams
//TCP sockets
//zlib streams
//crypto streams

const {Duplex} = require('stream');
const duplex = Duplex();

duplex._read = ()=>{
    var date = new Date();
    duplex.push(date.getFullYear().toString());
    //终止可读流
    duplex.push(null)
};

duplex._write = (chunk,encoding,next)=>{
    process.stdout.write(chunk.toString()+'\n');
    process.nextTick(next)
};

duplex.on('data',(chunk)=>{
    console.log(chunk.toString())
});
duplex.on('end',()=>{
    console.log('终于停下来了')
});

duplex.write('this year is');
duplex.end();