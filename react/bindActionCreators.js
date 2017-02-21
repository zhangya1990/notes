import {bindActionCreators} from 'redux';
//bindActionCreator(actionCreators,dispatch)
//参数
//actionCreators:一个actionCreator(函数)或者键值是actionCreator的对象
//dispatch   由Store实例提供
//返回值
//对象或者函数
//如果是对象，对象中的每个函数值都可以dispatch一个action，如果返回值是函数，类似