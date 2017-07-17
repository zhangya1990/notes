function initProps (vm: Component, props: Object) {
    //如果options中包含propsData属性，对props中的属性特别处理
    const propsData = vm.$options.propsData || {}
    //props属性名
    const keys = vm.$options._propKeys = Object.keys(props)
    //是否是根组件
    const isRoot = !vm.$parent

    // 跟组件的props属性需要被转化??暂时没搞明白这个flag的意思
    observerState.shouldConvert = isRoot
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]

        if (process.env.NODE_ENV !== 'production') {
            //属性名不能是vue的保留字
            if (isReservedProp[key]) {
                warn(
                    `"${key}" is a reserved attribute and cannot be used as component prop.`,
                    vm
                )
            }

            //对vm[prop]添加observe和watcher
            defineReactive(vm, key, validateProp(key, props, propsData, vm), () => {
                if (vm.$parent && !observerState.isSettingProps) {
                    warn(
                        `Avoid mutating a prop directly since the value will be ` +
                        `overwritten whenever the parent component re-renders. ` +
                        `Instead, use a data or computed property based on the prop's ` +
                        `value. Prop being mutated: "${key}"`,
                        vm
                    )
                }
            })
        } else {
            defineReactive(vm, key, validateProp(key, props, propsData, vm))
        }
    }
    observerState.shouldConvert = true
}

//返回当前属性的值，并对该值添加observe
function validateProp (key: string, propOptions: Object, propsData: Object, vm?: Component): any {
    const prop = propOptions[key]
    //options中的propsData选项是否包含当前属性,如果包含，返回propsData中该属性的值，如果不包含，返回value = getPropDefaultValue(vm, prop, key)，并且对value添加observe
    const absent = !hasOwn(propsData, key)
    let value = propsData[key]

    //属性是布尔类型
    if (isType(Boolean, prop.type)) {
        //propsData中不包含当前属性并且当前属性没有默认值
        if (absent && !hasOwn(prop, 'default')) {
            value = false
        } else if (!isType(String, prop.type) && (value === '' || value === hyphenate(key))) {
            value = true
        }
    }
    // propsData中不包含当前属性
    if (value === undefined) {
        //返回当前属性的值
        value = getPropDefaultValue(vm, prop, key)
        // since the default value is a fresh copy,
        // make sure to observe it.
        const prevShouldConvert = observerState.shouldConvert
        observerState.shouldConvert = true
        observe(value)
        observerState.shouldConvert = prevShouldConvert
    }
    if (process.env.NODE_ENV !== 'production') {
        //验证prop是否有效
        assertProp(prop, key, value, vm, absent)
    }
    return value
}

function getPropDefaultValue (vm: ?Component, prop: PropOptions, key: string): any {
    // prop的default属性必须存在
    if (!hasOwn(prop, 'default')) {
        return undefined
    }
    const def = prop.default
    // default属性不能是数组或对象，必须通过工厂函数返回一个数组或对象
    if (process.env.NODE_ENV !== 'production' && isObject(def)) {
        warn(
            'Invalid default value for prop "' + key + '": ' +
            'Props with type Object/Array must use a factory function ' +
            'to return the default value.',
            vm
        )
    }
    // the raw prop value was also undefined from previous render,
    // return previous default value to avoid unnecessary watcher trigger
    if (vm && vm.$options.propsData &&
        vm.$options.propsData[key] === undefined &&
        vm._props[key] !== undefined) {
        return vm._props[key]
    }
    // call factory function for non-Function types
    // a value is Function if its prototype is function even across different execution context
    return typeof def === 'function' && getType(prop.type) !== 'Function'
        ? def.call(vm)
        : def
}

function assertProp (prop: PropOptions, name: string,  value: any, vm: ?Component, absent: boolean) {
    if (prop.required && absent) {
        warn(
            'Missing required prop: "' + name + '"',
            vm
        )
        return
    }
    if (value == null && !prop.required) {
        return
    }
    let type = prop.type
    let valid = !type || type === true
    const expectedTypes = []
    if (type) {
        if (!Array.isArray(type)) {
            type = [type]
        }
        for (let i = 0; i < type.length && !valid; i++) {
            const assertedType = assertType(value, type[i])
            expectedTypes.push(assertedType.expectedType || '')
            valid = assertedType.valid
        }
    }
    if (!valid) {
        warn(
            'Invalid prop: type check failed for prop "' + name + '".' +
            ' Expected ' + expectedTypes.map(capitalize).join(', ') +
            ', got ' + Object.prototype.toString.call(value).slice(8, -1) + '.',
            vm
        )
        return
    }
    //自定义验证函数
    const validator = prop.validator
    if (validator) {
        if (!validator(value)) {
            warn(
                'Invalid prop: custom validator check failed for prop "' + name + '".',
                vm
            )
        }
    }
}