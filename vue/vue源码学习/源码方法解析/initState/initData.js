function initData (vm: Component) {
    let data = vm.$options.data
    //vm._data赋值为data()执行的结果（对象）
    data = vm._data = typeof data === 'function'
        ? data.call(vm)
        : data || {}
    if (!isPlainObject(data)) {
        data = {}
        process.env.NODE_ENV !== 'production' && warn(
            'data functions should return an object:\n' +
            'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
            vm
        )
    }
    // proxy data on instance
    const keys = Object.keys(data)
    const props = vm.$options.props
    let i = keys.length
    while (i--) {
        //data属性不能与props中重复
        if (props && hasOwn(props, keys[i])) {
            process.env.NODE_ENV !== 'production' && warn(
                `The data property "${keys[i]}" is already declared as a prop. ` +
                `Use prop default value instead.`,
                vm
            )
        } else {
            proxy(vm, keys[i])
        }
    }
    // observe data
    observe(data, true /* asRootData */)
}