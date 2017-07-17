//electron踩坑总结
//1、全局变量
//在渲染进程中，全局变量只能获取，不能修改
//将窗口挂载在全局变量上的时候，一定要在主进程中操作窗口进程消息的发送及窗口的关闭，在渲染进程中不能每次都有效的拿到窗口(通过remote.getGlobal('XXX')有可能会获取到undefined，神坑)

//2、macOs系统生产环境无法复制粘贴
//解决方案:添加系统菜单，将复制、粘贴、剪切、全选等命令绑定到菜单

//3、键盘事件相关
//input事件为普通的event事件，keydown，keyup为keyboardevent事件,keyboardevent事件中包含e.key e.keycode e.code等
//macOs系统中，e.key属性在中文及英文输入状态的时候都会输出当前按键的字母,在windows系统中，只有在英文状态才会输出，在中文状态不会输出
//keydown事件在macOs系统和windows系统的表现一致，在中文输入法状态下，e.keycode输出值一直是229，不能准确获得keycode
//在keyup事件中无论输入中文和英文，在macOs和windows上都能准确获取e.keycode，!!!!!!!!但是，当输入过快时，keyup事件不能准确生效= =

//4、audio api使用踩坑
//快速敲击键盘的时候macOs系统上面会出现audio.play()和audio.pause()冲突

//5、macos原生中文输入法可以一直输入，输入法会导致cpu飙升，应用崩溃

//6、当时用父子窗口的时候，子窗口最小化时不会隐藏，会在桌面左下角显示一个工具栏。