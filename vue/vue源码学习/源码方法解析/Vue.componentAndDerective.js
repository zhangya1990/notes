Vue[type] = function (
    id: string,
    definition: Function | Object
): Function | Object | void {
    if (!definition) {
        return this.options[type + 's'][id]
    } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production') {
            if (type === 'component' && config.isReservedTag(id)) {
                warn(
                    'Do not use built-in or reserved HTML elements as component ' +
                    'id: ' + id
                )
            }
        }
        if (type === 'component' && isPlainObject(definition)) {
            //Vue.component并且参数为对象,返回一个子级构造函数
            definition.name = definition.name || id
            definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
            //Vue.directive并且参数为函数,返回一个对象，自动添加bind和update指令钩子函数
            definition = { bind: definition, update: definition }
        }
        this.options[type + 's'][id] = definition
        return definition
    }
}