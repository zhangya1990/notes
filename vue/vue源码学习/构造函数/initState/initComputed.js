const computedWatcherOptions = { lazy: true }

function initComputed (vm: Component, computed: Object) {
    //将computed属性添加watcher，存入vm._computedWatchers中
    const watchers = vm._computedWatchers = Object.create(null)

    for (const key in computed) {
        const userDef = computed[key]
        let getter = typeof userDef === 'function' ? userDef : userDef.get
        if (process.env.NODE_ENV !== 'production') {
            if (getter === undefined) {
                warn(
                    `No getter function has been defined for computed property "${key}".`,
                    vm
                )
                getter = noop
            }
        }
        // create internal watcher for the computed property.
        watchers[key] = new Watcher(vm, getter, noop, computedWatcherOptions)

        // component-defined computed properties are already defined on the
        // component prototype. We only need to define computed properties defined
        // at instantiation here.
        if (!(key in vm)) {
            defineComputed(vm, key, userDef)
        }
    }
}