//   core/index.js
//  initGlobalAPI 初始化全局api
function initGlobalAPI (Vue) {

    //Vue.config相关，获取Vue相关配置，开发环境下不能替换Vue.config对象,由于用setter函数实现，因此可以修改(Vue.config.name = 'zhang')
    const configDef = {}
    configDef.get = () => config
    if (process.env.NODE_ENV !== 'production') {
        configDef.set = () => {
            warn(
                'Do not replace the Vue.config object, set individual fields instead.'
            )
        }
    }
    Object.defineProperty(Vue, 'config', configDef)



    Vue.util = {
        warn,
        extend,
        mergeOptions,
        defineReactive
    }

    Vue.set = set
    Vue.delete = del
    Vue.nextTick = nextTick

    ////初始化Vue.options中的{components,directives,filters}为{}
    Vue.options = Object.create(null)
    config._assetTypes.forEach(type => {
        Vue.options[type + 's'] = Object.create(null)
    })

    Vue.options._base = Vue

    //extend  Vue.options.components中默认添加Keep-alive组件
    extend(Vue.options.components, builtInComponents)


    //处理Vue插件相关,Vue.use(plugin)调用plugin.install()
    initUse(Vue)
    //Vue.mixin(mixin) 添加全局混入，将mixin参数与Vue.options合并
    initMixin(Vue)
    //添加Vue.extend()方法
    initExtend(Vue)
    initAssetRegisters(Vue)
}