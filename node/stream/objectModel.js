// 为了增强数据类型的灵活性，无论是可读流或是可写流，只需要往其构造函数里传入配置参数“{ objectMode: true }”，便可往流里传入/获取任意类型（null除外）的数据：
const Writable = require('stream').Writable;
const objectModeWritable = Writable({ objectMode: true });

objectModeWritable._write = (chunck, enc, next) => {
    // 输出打印
    console.log(typeof chunck);
    console.log(chunck);
    process.nextTick(next)
};

objectModeWritable.write('Happy Chinese Year');
objectModeWritable.write( { year : 2017 } );
objectModeWritable.end( 2017 );