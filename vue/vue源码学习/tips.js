//vue实例构造options中的props，最终都转化为了对象的形式
function normalizeProps (options) {
    const props = options.props
    if (!props) return
    const res = {}
    let i, val, name
    if (Array.isArray(props)) {
        i = props.length
        while (i--) {
            val = props[i]
            if (typeof val === 'string') {
                name = camelize(val)
                res[name] = { type: null }
            } else if (process.env.NODE_ENV !== 'production') {
                warn('props must be strings when using array syntax.')
            }
        }
    } else if (isPlainObject(props)) {
        for (const key in props) {
            val = props[key]
            name = camelize(key)
            res[name] = isPlainObject(val)
                ? val
                : { type: val }
        }
    }
    options.props = res
}

//directives中如果当前的directive值为一个函数，默认将改函数绑定为bind和update钩子函数
function normalizeDirectives (options) {
    const dirs = options.directives
    if (dirs) {
        for (const key in dirs) {
            const def = dirs[key]
            if (typeof def === 'function') {
                dirs[key] = { bind: def, update: def }
            }
        }
    }
}

//事件修饰符前缀处理
const normalizeEvent = cached((name)=> {
    const once = name.charAt(0) === '~';
    name = once ? name.slice(1) : name;
    const capture = name.charAt(0) === '!';
    name = capture ? name.slice(1) : name;
    return {
        name,
        once,
        capture
    }
});
function cached(fn){
    const cache = Object.create(null);
    return function cachedFn (str) {
        const hit = cache[str];
        return hit || (cache[str] = fn(str))
    }
}