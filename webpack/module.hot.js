//热替换功能,回调函数会在模块替换完成之后执行
if(module.hot){
    module.hot.accept('./plugins.js',()=>{
        console.log('plugin模块已经热替换完成')
    })
}
