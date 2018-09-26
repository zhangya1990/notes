//作用：可以自行配置服务器，提供热更新的功能，通过服务端推送

//1、首先在webpack的配置文件中，添加 new webpack.HotModuleReplacementPlugin() 插件，该插件负责生成 module.hot API，并在编译阶段添加部分生命周期回调函数处理。

//2、添加 'webpack-hot-middleware/client' 入口，该入口包含服务端推送的浏览器端代码

//3、在server中使用中间件

/* 
    原理说明
    该中间件通过服务端推送来实现热更新，浏览器端的 hot-runtime 代码在接收到服务端推送的更新数据之后，执行更新 (process-update.js)

*/