/*
*     @
*
* */
export function mergeOptions (parent,child,vm){
    if (process.env.NODE_ENV !== 'production') {
        //检查当前注册组件的对象中components中的键是否有效(不能为component，slot或者vue保留组件名称 大小写都不可以)
        checkComponents(child)
    }
    //规范化当前注册组件的对象的props属性(全部转为对象)
    normalizeProps(child)
    //规范化当前注册组件的对象的directives属性（如果值为函数，自动添加bind和update钩子函数）
    normalizeDirectives(child)

    //处理extends属性（??）
    const extendsFrom = child.extends
    if (extendsFrom) {
        parent = typeof extendsFrom === 'function'
            ? mergeOptions(parent, extendsFrom.options, vm)
            : mergeOptions(parent, extendsFrom, vm)
    }

    //处理mixins属性
    if (child.mixins) {
        for (let i = 0, l = child.mixins.length; i < l; i++) {
            let mixin = child.mixins[i]
            if (mixin.prototype instanceof Vue) {
                mixin = mixin.options
            }
            parent = mergeOptions(parent, mixin, vm)
        }
    }
    const options = {}
    let key
    for (key in parent) {
        mergeField(key)
    }
    for (key in child) {
        if (!hasOwn(parent, key)) {
            mergeField(key)
        }
    }
    function mergeField (key) {
        //处理options中的(el,propsData,生命周期钩子函数，components，directives，filters，data,props,methods,computed,watch属性)
        const strat = strats[key] || defaultStrat
        options[key] = strat(parent[key], child[key], vm, key)
    }
    return options
}