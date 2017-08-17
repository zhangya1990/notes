//1、创建Vue构造函数
function Vue (options) {
    if (process.env.NODE_ENV !== 'production' &&
        !(this instanceof Vue)) {
        warn('Vue is a constructor and should be called with the `new` keyword')
    }
    this._init(options)
}
//并依次调用
// initMixin(Vue)
// stateMixin(Vue)
// eventsMixin(Vue)
// lifecycleMixin(Vue)
// renderMixin(Vue)
// initGlobalAPI(Vue)


//2、initMixin(Vue)
/*
* 该方法中注册了Vue.prototype._init方法，在_init方法中，首先对options参数进行处理mergeOptions,然后初始化vue实例各项属性
* */

//stateMixin(Vue)
/*
* 设置了vm.$data属性,添加$set,$delete,$watch方法
* */

//eventsMixin(Vue)
/*
* 添加了vm.$on,$off,$once,$emit方法
* */

//lifecycleMixin(Vue)
/*
* 添加了vm._mount,_update,_updateFromParent,$forceUpdate,$destroy方法
* vm._mount方法，在vue实例初始化的过程中，通过vm.$mount方法调用
* vm._mount方法，首先触发beforeMount钩子函数，然后创建一个watcher实例，添加到vm._watcher属性上,最后触发mounted钩子函数
* vm._update方法，将vnode生成真实的dom节点  vm.__patch__(prevVnode,vnode)方法，将新、旧vnode进行dif算法比较，更新dom，返回一个dom节点，并赋值为vm.$el
* vm.$forceUpdate方法，强制更新所有watcher的update,以此更新实例
* vm.$destroy方法，首先触发beforeDestroy钩子函数,然后移除所有watcher和子级vm示例，接着触发destroyed钩子函数,移除当前vm实例的所有事件监听
* */

//renderMixin(Vue)
/*
* 添加vm.$nextTick,_render,以及一堆字母(_s,_v,_n,_e,_q,_i,_m,_o)方法等 - -
*   vm.$nextTick方法可用来优化vue性能，可以保证数据多次变动的时候，只改变一次dom
*   vm._render方法，调用vm.$createElement方法，生成一个vnode实例
* */

//initGlobalAPI(Vue)
/*
*   添加Vue全局方法
*   Vue.et  Vue.delete  Vue.nextTick  Vue.util
 *  添加Vue.options属性,Vue.options._base = Vue
* */

//initGlobalAPI 通过以下几个方法给Vue混入全局方法

// initUse(Vue)
/*
*   Vue.use(plugin)  安装插件
* */

// initMixin(Vue)
/*
*   添加全局混入方法Vue.mixin(mixin)，将mixin对象混入到Vue.options属性中
* */

// initExtend(Vue)
/*
*   添加Vue.extend(options)方法，返回一个子级Vue构造函数
* */

// initAssetRegisters(Vue)
/*
*   添加Vue.component和Vue.directive方法，具体见方法解析
* */


//2、调用vm._init方法，初始化vue实例
//依次调用
// initLifecycle(vm)
/*
*   初始化vm属性
*   vm.$parent  $children $root $refs
* */

// initEvents(vm)
/*
*   初始化vm._events对象，如果当前vm实例含有父级对象，将父实例的events绑定到当前实例
* */

// initRender(vm)
/*
*   添加vm.$createElement方法，生成vnode实例
* */

// callHook(vm, 'beforeCreate')  触发beforeCreate钩子函数

// initState(vm)
/*
*   首先创建vm._watchers数组，存储当前实例的watcher，然后依次调用
*       initProps
*   将props中的key value设置为响应式  核心代码defineReactive(vm, key, validateProp(key, props, propsData, vm))，defineReactive见方法详解
*       initMethods
*   将methods方法中的this指向vm
*       initData
*   将data key value设置为响应式
*       initComputed
*   将computed对象中的key添加到vm实例上，见方法详解
*       initWatch
*   将watch对象中key添加给vm.$watch方法,见方法详解
* */

// callHook(vm, 'created')  触发created钩子函数


//3、调用vm.$mount方法完成挂载