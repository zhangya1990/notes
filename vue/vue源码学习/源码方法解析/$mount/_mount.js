Vue.prototype._mount = function (
    el?: Element | void,
    hydrating?: boolean
): Component {
    const vm: Component = this
    vm.$el = el
    if (!vm.$options.render) {
        vm.$options.render = createEmptyVNode
        if (process.env.NODE_ENV !== 'production') {
            /* istanbul ignore if */
            if (vm.$options.template && vm.$options.template.charAt(0) !== '#') {
                warn(
                    'You are using the runtime-only build of Vue where the template ' +
                    'option is not available. Either pre-compile the templates into ' +
                    'render functions, or use the compiler-included build.',
                    vm
                )
            } else {
                warn(
                    'Failed to mount component: template or render function not defined.',
                    vm
                )
            }
        }
    }
    callHook(vm, 'beforeMount')
    vm._watcher = new Watcher(vm, function updateComponent () {
        vm._update(vm._render(), hydrating)
    }, noop)
    hydrating = false
    // manually mounted instance, call mounted on self
    // mounted is called for render-created child components in its inserted hook
    if (vm.$vnode == null) {
        vm._isMounted = true
        callHook(vm, 'mounted')
    }
    return vm
}