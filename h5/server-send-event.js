//资料
//http://www.oschina.net/translate/stream-updates-with-server-sent-events?cmp
//http://songyishan.iteye.com/blog/1003466

//服务端推送
if (!!window.EventSource) {
    var source = new EventSource('url地址');
} else {
    // Result to xhr polling
}
//如果传给EventSource构造器的URL是绝对URL，那么它原有的（模式、域、端口）必须与正调用的页面的相关项相匹配。
//下一步，为消息事件建立一个处理器。你可以选择地侦听打开状态和错误状态：

//事件流格式
// 从源（上文的stream.php）发送一个事件流大致就是构造一个遵循SSE格式的纯文本的响应，响应的类型：‘text/event-stream’。基本形式如：响应必须包含一个以“data”开头的行，跟着是你的信息，再跟着是标志着流结束的两个连续的"\n"。
//
// data: My message\n\n

source.addEventListener('message', function(e) {
    console.log(e.data);
}, false);

source.addEventListener('open', function(e) {
    // Connection was opened.
}, false);

source.addEventListener('error', function(e) {
    if (e.readyState == EventSource.CLOSED) {
        // Connection was closed.
    }
}, false);

/*
关联ID和事件
你通过包含一个以”id:“开始的行就能发送一个具有唯一ID的流事件：
id: 12345\n
data: GOOG\n
data: 556\n\n
设置这样一个ID就会让浏览器跟踪最后一个启动的事件，这样如果到服务器的连接丢弃的话，特定的HTTP头(Last-Event-ID) 将在新的请求中设置。这让浏览器决定适合启动哪个事件。 消息事件包含了e.lastEventId属性。*/

/*
* 控制重连超时时长
 每个连接关闭大约3秒钟后浏览器就试图重新连接源头。你可以更改这个超时时长：包含一个以“retry:"开始的行，紧跟着试图重新连接前需要等待的毫秒数。
 下面的例子试图10秒后重新连接：

 retry: 10000\n
 data: hello world\n\n
* */

/*
*指定事件名
 单个事件源通过包含事件名就能够生各种类型的事件。如果出现了以“event:"开始的行，紧跟着事件的唯一名字，那么事件就和这个名字关联了起来。在客户端，可以设置事件侦听器去侦听特定的事件。

 例如，下面的服务器输出发送了三种类型的事件，常见的"message"事件、"userlogon"和“update”事件：
 data: {"msg": "First message"}\n\n
 event: userlogon\n
 data: {"username": "John123"}\n\n
 event: update\n
 data: {"username": "John123", "emotion": "happy"}\n\n
 而客户端事件侦听器设置如下：
* */

source.addEventListener('message', function(e) {
    var data = JSON.parse(e.data);
    console.log(data.msg);
}, false);

source.addEventListener('userlogon', function(e) {
    var data = JSON.parse(e.data);
    console.log('User login:' + data.username);
}, false);

source.addEventListener('update', function(e) {
    var data = JSON.parse(e.data);
    console.log(data.username + ' is now ' + data.emotion);
}, false);

/*
* 取消事件流

 通常，当连接关闭的时候，浏览器会自动重新连接到事件源，不过能从客户端或者服务器端取消这样的行为。

 要从客户端取消这个流，仅仅调用：

 source.close();
 要从服务器端取消这个流，以非”text/event-stream“内容类型来响应或者返回一个非200 OK的HTTP状态（比如 404 没有找到）。
 两种方法都可以阻止浏览器重新建立连接。
* */