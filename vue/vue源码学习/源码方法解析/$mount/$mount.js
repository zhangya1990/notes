Vue$3.prototype.$mount = function (
    el,
    hydrating
) {
    el = el && inBrowser ? query(el) : undefined;
    return false
    return this._mount(el, hydrating)
};


const mount = Vue.prototype.$mount


Vue.prototype.$mount = function (
    el?: string | Element,
    hydrating?: boolean
): Component {

    //标准化el对象为dom元素，且不能为body或html元素
    el = el && query(el)

    /* istanbul ignore if */
    if (el === document.body || el === document.documentElement) {
        process.env.NODE_ENV !== 'production' && warn(
            `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
        )
        return this
    }

    const options = this.$options
    // resolve template/el and convert to render function
    //解析 template/el 并且转化为render函数
    if (!options.render) {
        let template = options.template
        if (template) {
            if (typeof template === 'string') {
                if (template.charAt(0) === '#') {
                    template = idToTemplate(template)
                    /* istanbul ignore if */
                    if (process.env.NODE_ENV !== 'production' && !template) {
                        warn(
                            `Template element not found or is empty: ${options.template}`,
                            this
                        )
                    }
                }
            } else if (template.nodeType) {
                template = template.innerHTML
            } else {
                if (process.env.NODE_ENV !== 'production') {
                    warn('invalid template option:' + template, this)
                }
                return this
            }
        } else if (el) {
            //el存在template不存在，将el的outerhtml赋值为template
            template = getOuterHTML(el)
        }
        if (template) {
            /* istanbul ignore if */
            if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
                mark('compile')
            }

            //编译template并生成render函数
            const { render, staticRenderFns } = compileToFunctions(template, {
                //在处理包含换行符的属性时ie与其他的浏览器表现不一致
                shouldDecodeNewlines,
                //分隔符
                delimiters: options.delimiters
            }, this)
            //将render和staticRenderFns添加到vm.$options上
            options.render = render
            options.staticRenderFns = staticRenderFns

            /* istanbul ignore if */
            if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
                mark('compile end')
                measure(`${this._name} compile`, 'compile', 'compile end')
            }
        }
    }
    return mount.call(this, el, hydrating)
}