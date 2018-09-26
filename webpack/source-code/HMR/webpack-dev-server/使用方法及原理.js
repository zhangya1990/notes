//作用
/* 
    webpack内置的开发环境小型服务器，内置webpack-dev-middleware（负责提供虚拟文件路径等），内置热更新
*/


//两种使用方式

//1、命令行启动 webpack-dev-server --inline --hot

//2、nodeJS脚本启动webpack-dev-server

//工作原理
//webpack-dev-server 通过websocket连接服务器和浏览器端，（socket server端在sever启动时生效， client端通过添加webpack配置入口文件 webpack-dev-server/client/?http://localhost:8080 以及 webpack/hot/dev-server 注入到bundle中，命令行启动时配置--inline会自动注入，nodeJs方式启动需要手动配置）当检测到文件发生变化后（webpack-dev-middleware的功能），触发编译，编译完成后通过websocket发送更新到浏览器端，浏览器端触发更新事件,并通过module.hot API 完成更新

