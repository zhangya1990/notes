//http://www.ruanyifeng.com/blog/2012/11/compass.html
//http://www.th7.cn/web/html-css/201411/67314.shtml
//http://compass.aether.ru/


//compass编译命令
//compass compile 会将sass子目录中的文件编译成css，保存在stylesheets子目录中
//生产环境需要压缩后的css文件
//compass compile out-style compressed

//compass只编译发生变动的文件，重新编译未变动的文件，添加force参数
//compass compile --force

//可以在配置文件config.rb中指定编译模式
//output_style = :compressed
//:expanded模式表示编译后保留原格式，其他值还包括:nested   :compact  :compressed

//也可以通过指定environment智能判断
//output_style = (environment == "production" ? :compressed : expanded)

//自动编译
//compass watch

//模块
//1—reset  清除浏览器的默认样式
//2-css3  css3样式
//3-layout 布局   stretch  sticky-footer(50px,'#footer')
//4-typography  排版  link-colors(red,blue,yellow ,green,black)   unstyled-color  hover-link
//5-utilities  提供一些其他的功能  clearfix   table-scaffolding

//helper函数
//image-width()  image-height()返回图片的宽和高
//inline-image()  将图片转为base64