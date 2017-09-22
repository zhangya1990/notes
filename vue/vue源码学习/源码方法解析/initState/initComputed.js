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
    //创建一个lazy watcher，只有当真正获取该值的时候，才会触发watcher.get()方法，获取watcher.value
    const watcher = new Watcher(owner, getter, noop, {
        lazy: true
    })
    return function computedGetter () {
        if (watcher.dirty) {
            //watcher.evaluate方法中，this.dirty = false, this.value = this.get() = this.getter.call(vm,vm),this.getter即为当前computed属性函数值，在函数的执行过程中，如果computed中依赖vm.data的某个属性，会触发当前属性的get方法，从而将该watcher与该属性的dep互相绑定
        }
        if (Dep.target) {
            //如果当前存在激活的watcher，遍历watcher.deps数组，把每一个dep添加到当前激活的wacher依赖中，并且订阅该watcher，此时的Dep.target为vue实例初始化过程中（_mount方法中）产生的watcher,至此，当computed方法中依赖的vm.data的属性值改变的时候会触发set方法，进而触发dep.subs当中的所有watcher.update()方法，最终触发watcher.run()方法，在watcher.run()方法中，首先获取watcher的值，this.value = this.get()  get方法触发watcher执行，触发watcher.getter()方法执行，生成新的vnode，进而更新dom，更新完成之后，触发watcher的回调函数(包括用户自己制定的watcher当中的回调函数)

            // vm._watcher = new Watcher(vm, function updateComponent () {
            //     vm._update(vm._render(), hydrating);
            //   }, noop);


            watcher.depend()
        }
        return watcher.value
    }
}