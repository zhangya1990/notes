export function initState (vm: Component) {
    //首先增加_watchers属性，用来存放添加的watcher
    vm._watchers = []

    //根据options中的属性依次初始化，顺序为props,methods,data,computed,watch
    const opts = vm.$options
    if (opts.props) initProps(vm, opts.props)
    if (opts.methods) initMethods(vm, opts.methods)
    if (opts.data) {
        initData(vm)
    } else {
        //observe（val,boolean）boolean属性存在的时候说明当前ob实例绑定的对象是根数据
        observe(vm._data = {}, true /* asRootData */)
    }
    if (opts.computed) initComputed(vm, opts.computed)
    if (opts.watch) initWatch(vm, opts.watch)
}