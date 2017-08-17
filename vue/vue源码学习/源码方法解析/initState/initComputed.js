const computedSharedDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop
}

function initComputed (vm: Component, computed: Object) {
    for (const key in computed) {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && key in vm) {
            warn(
                `existing instance property "${key}" will be ` +
                `overwritten by a computed property with the same name.`,
                vm
            )
        }
        const userDef = computed[key]
        if (typeof userDef === 'function') {
            //值为函数，创建一个watcher实例，将该函数设置为watcher的getter方法
            computedSharedDefinition.get = makeComputedGetter(userDef, vm)
            computedSharedDefinition.set = noop
        } else {
            //值为对象，并且对象中包含cache属性，创建一个watcher，否则直接设置为get函数
            computedSharedDefinition.get = userDef.get
                ? userDef.cache !== false
                ? makeComputedGetter(userDef.get, vm)
                : bind(userDef.get, vm)
                : noop
            computedSharedDefinition.set = userDef.set
                ? bind(userDef.set, vm)
                : noop
        }
        Object.defineProperty(vm, key, computedSharedDefinition)
    }
}

function makeComputedGetter (getter: Function, owner: Component): Function {
    const watcher = new Watcher(owner, getter, noop, {
        lazy: true
    })
    return function computedGetter () {
        if (watcher.dirty) {
            //watcher.evaluate方法中，this.dirty = false, this.value = this.get()
            watcher.evaluate()
        }
        if (Dep.target) {
            //如果当前存在激活的watcher，遍历watcher.deps数组，把每一个dep添加到当前激活的wacher依赖中，并且订阅该watcher
            watcher.depend()
        }
        return watcher.value
    }
}