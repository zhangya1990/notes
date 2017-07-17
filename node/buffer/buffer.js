//https://github.com/nodejs/node/blob/master/doc/api/buffer.md#buffer_class_method_buffer_allocunsafe_size
//http://zhenhua-lee.github.io/node/buffer.html


//new Buffer()是nodeJs之前版本创建buffer的方式，现在已经被淘汰
//Buffer.from()    Buffer.alloc(size,fill,encoding)   Buffer.allocUnsafe(size)  Buffer.allocUnsafeSlow()
//Buffer.from(ary)   Buffer.form(string,encoding)
// Buffer.from(buffer)   返回一个buffer的copy
//Buffer.from(arrayBuffer,byteOffset,length)   返回共享内存
//typeArray.buffer  返回整段内存区域对应的ArrayBuffer对象，该属性为只读属性
//typeArray.byteLength  返回类型化数组占据的内存长度，单位为字节，只读
//typeArray.byteOffset  返回类型化数组从底层的ArrayBuffer对象的哪个字节开始，只读
//typeArray.set(typeArray,offset)  将一段内容完全复制到另一段内存，第二个参数表示偏移
var a = new Uint16Array(8);
var b = new Uint16Array(10);
b.set(a,2);




//Buffer.alloc(size,fill,encoding)  返回一个指定字节数的填充buffer，相比Buffer.allocUnsafe()方法较慢，但新分配的内存中不会包括旧的数据或敏感数据,并且性能较差，但安全性更高

//Buffer.allocUnsafe(size)  返回一个指定字节数的尚未初始化的buffer，速度较快，但可能会包含旧的数据或敏感数据，必须手动调用Buffer.fill() 或 Buffer.write()方法初始化
//Buffer.allocUnsafe()  与  Buffer.allocUnsafeSlow()的区别是，如果buffer的size小于或者等于Buffer.poolSize的一半，前者将从buffer pool中申请内存，后者直接从内存中分配

//Buffer.compare(buf1,buf2)
const buf1 = Buffer.from('0123');
const buf2 = Buffer.from('1234');
//等同于buffer1.compare(buffer2)
console.log(Buffer.compare(buf1,buf2))
console.log(buf1.compare(buf2))

//Buffer.concat(list,totalLength)  如果不提供totalLength参数，会自动计算list中buffer的总长度，但是性能差

//Buffer.byteLength(string,encoding)
//Buffer.isBuffer(obj)
//Buffer.isEncoding(encoding)

//Buffer.poolSize   预分配的buffer内存空间，默认值为8192

//buffer.buffer   返回创建该buffer的ArrayBuffer

//buffer.length

//buffer.includes(string|buffer|integer,byteoffset,encoding)
//buffer.indexOf(string|buffer|integer|unit8Array,byteoffset,encoding)
//buffer.lastIndexOf(string|buffer|integer|unit8Array,byteoffset,encoding)
//buffer.slice(start,end)
//buffer.toString(encoding,start,end)
//buffer.toJSON()
//buffer.write(string,offset,length)
//buffer.transcode(source,fromEnc,toEnc)  buffer转码
//buffer.kMaxLength   一个buffer实例允许分配的最大内存 32位操作系统为1g，64位操作系统为2g