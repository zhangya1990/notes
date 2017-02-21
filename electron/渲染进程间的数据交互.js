//1、将数据保存在全局变量中
//main.js
global.sharedObj = {
    name:'zhang'
};

//render1
remote.getGlobal('sharedObj').name = 'wang';

//render2
remote.getGlobal('sharedObj').ege = 10

//注意：
//在渲染进程中不要操作全局变量(删除，修改)，有无法预测的坑，最好是只用来获取，在主进程中修改


//2.localStorage
//render1
localStorage.setItem('name','zhang');

//render2
localStorage.getItem('name')