Vue.prototype._init = function (options) {
    const vm = this
    // a uid
    vm._uid = uid++

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
        initInternalComponent(vm, options)
    } else {
        //添加$options选项，如果有父组件，对options进行处理
        vm.$options = mergeOptions(
            resolveConstructorOptions(vm.constructor),
            options || {},
            vm
        )
    }

    if (process.env.NODE_ENV !== 'production') {
        initProxy(vm)
    } else {
        vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm

    //初始化生命周期相关属性
    // vm.($root,$parent,$children,$refs,_watcher,_inactive,_directInactive,_isMounted,_isDestroyed,_isBeingDestroyed)
    initLifecycle(vm)

    //初始化事件相关
    //事件池 vm._events = Object.create(null)
    // vm._hasHockEvent = false
    //事件修饰符相关  normalizeEvent
    //如果vm.$options._parentListeners存在，对当前组件添加相应的事件监听
    initEvents(vm);

    //添加vm.$slots  vm.$scopedSlots  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
    initRender(vm)

    //调用beforeCreate钩子
    callHook(vm, 'beforeCreate')

    //处理vm.$options.inject属性
    initInjections(vm) // resolve injections before data/props

    initState(vm)

    //处理vm.$options.provide属性
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    if (vm.$options.el) {
        //$mount方法构建时生成web-runtime.js,调用vm._mount方法
        vm.$mount(vm.$options.el)
    }
}
