function initMethods (vm: Component, methods: Object) {
    for (const key in methods) {
        //method中的this改为当前vm实例
        vm[key] = methods[key] == null ? noop : bind(methods[key], vm)
        if (process.env.NODE_ENV !== 'production' && methods[key] == null) {
            warn(
                `method "${key}" has an undefined value in the component definition. ` +
                `Did you reference the function correctly?`,
                vm
            )
        }
    }
}