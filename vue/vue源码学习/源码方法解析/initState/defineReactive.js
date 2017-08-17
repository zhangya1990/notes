function defineReactive (obj: Object, key: string, val: any, customSetter?: Function) {
    //对对象的每一个key创建一个Dep实例
    const dep = new Dep()

    const property = Object.getOwnPropertyDescriptor(obj, key)
    if (property && property.configurable === false) {
        return
    }

    const getter = property && property.get
    const setter = property && property.set

    //对象的属性值添加observe
    let childOb = observe(val);

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,

        get: function reactiveGetter () {
            const value = getter ? getter.call(obj) : val
            //Dep.target是当前正在计算的watcher
            if (Dep.target) {
                //调用Dep.target.addDep（this）方法，将
                dep.depend()
                if (childOb) {
                    childOb.dep.depend()
                }
                if (Array.isArray(value)) {
                    dependArray(value)
                }
            }
            return value
        },
        set: function reactiveSetter (newVal) {
            const value = getter ? getter.call(obj) : val

            if (newVal === value || (newVal !== newVal && value !== value)) {
                return
            }

            if (process.env.NODE_ENV !== 'production' && customSetter) {
                customSetter()
            }
            if (setter) {
                setter.call(obj, newVal)
            } else {
                val = newVal
            }
            childOb = observe(newVal)
            dep.notify()
        }
    })
}