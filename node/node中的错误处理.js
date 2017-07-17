//try{}catch(e){}无法捕获异步方法中的错误，之后node会触发uncaughtException事件，如果这个事件依然没有得到响应，整个进程就会crash
//当node抛出uncaughtException异常时，就会丢失当前环境的堆栈，导致node不能正常进行内存回收，可能会导致内存泄漏
//当uncaughtException有一个以上的listener时，会阻止node结束进程

//domain模块，用来捕获回调函数中抛出的异常,但是domain捕获到错误的时候依然会丢失堆栈信息，此时已经无法保证程序的健康运行，必须退出
/*let domain = require('domain');
let d = domain.create();
d.run(()=>{
    setTimeout(()=>{
        throw new Error('async error');
    },1000)
});
d.on('error',(e)=>{
    console.log('catch error:'+e)
});*/

//express
let app = require('express')();
let server = require('http').createServer(app);
let domain = require('domain');

app.use((req,res,next)=>{
    let reqDomain = domain.create();
    reqDomain.on('error',(e)=>{//下面抛出的异常，在这里被捕获
        try{
            //强制退出机制
            let killTimer = setTimeout(()=>{
                process.exit(1);
            },30000);
            //unref可以创建一个“不保持程序运行的计时器”，如果不使用unref方法，即使server的所有连接都关闭，node也回保持运行直到killTimer的回调函数运行
            killTimer.unref();

            //自动退出机制，停止接受新连接，等待当前已建立连接的关闭
            server.close(()=>{
                //Node http server的close方法，在调用时会停止server接受新的请求，但不会断开当前已经建立连接,当所有的连接都关闭时，会触发'close'事件
                //此时所有连接均已关闭，此时node会自动退出，不需要再调用process.exit(1)来结束进程

            })
        }catch(e){

        }
        res.send(500,e.stack);
    });
    reqDomain.run(next);
});

app.get('/',()=>{
    setTimeout(()=>{
        throw new Error('async exception')
    },1000)
});

process.on('uncaughtException', function (err) {
    console.log(err);

    try {
        let killTimer = setTimeout(function () {
            process.exit(1);
        }, 30000);
        killTimer.unref();

        server.close();
    } catch (e) {
        console.log('error when exit', e.stack);
    }
});

//process异常，处理未设置reject回调函数的promise错误
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason, 'sql:');
    // application specific logging, throwing an error, or other logic here
});


//express中的异常
//使用express时一定不要在controller的异步回调中抛出异常
app.get('/', function (req, res, next) { // 总是接收 next 参数
    mysql.query('SELECT * FROM users', function (err, results) {
        // 不要这样做
        if (err) throw err;

        // 应该将 err 传递给 errorHandler 处理
        if (err) return next(err);
    });
});

app.use(function (err, req, res, next) {
    // 带有四个参数的 middleware 专门用来处理异常
    res.render(500, err.stack);
});



