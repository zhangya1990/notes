//这两个事件都是webContents实例的事件

//did-get-response-details
//当有关请求资源的详细信息可用的时候发出事件，status标识了socket链接来下载资源
//返回
// event Event
// status Boolean
// newURL String
// originalURL String
// httpResponseCode Integer
// requestMethod String
// referrer String
// headers Object
// resourceType String

//dom-ready
//当指定frame中文档加载完成的时候发出事件
//返回  event

//事件对比及使用
//当打开一个窗口，加载html（无外链资源）的时候did-get-response-details事件会触发两次（不知道为什么），第一次事件触发非常快，第二次较慢，dom-ready事件只会触发一次，触发事件介于两次did-get-response-details事件之间，这两个事件都可以配合window.webContents.insertCSS()以及window实例的ready-to-show事件来使用，使用效果dom-ready事件较好，基本不会出现白色背景，did-get-response-details事件会闪一下,需要说明的是，did-get-response-details事件只有在触发第二次的时候才会执行insertCss方法，如果改用once监听事件，是不会把css插入到页面中的,此事件的第二次触发的时间同样在window的ready-to-show之后，所以会有一段时间的白屏，因此不推荐使用这个事件

//e.m.
class Window{
    constructor(){
        this.win = new BrowserWindow({
            title:'hello world',
            autoHideMenuBar:true,
            titleBarStyle:'hidden',
            show:false
        });

        this.win.loadURL('file://'+path.join(__dirname,'index.html'));
        this.win.webContents.on('dom-ready',()=>{
            console.log('ready          '+ Date.now())
            this.win.webContents.insertCSS(css)
        });

        // this.win.webContents.once('did-get-response-details',()=>{
        //     console.log('did          '+ Date.now())
        //     // this.win.webContents.insertCSS(css)
        // });


        this.win.on('ready-to-show',()=>{
            this.win.show();
        });
        this.win.webContents.openDevTools();
    }
}


