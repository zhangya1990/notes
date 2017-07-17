import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
    if (process.env.NODE_ENV !== 'production' &&
        !(this instanceof Vue)) {
        warn('Vue is a constructor and should be called with the `new` keyword')
    }
    //初始化vm实例
    this._init(options)
}

//添加vm._init方法
initMixin(Vue)

//添加Vue.prototype.$set   $delete  $watch方法
stateMixin(Vue)

//Vue.prototype添加事件相关方法($on,$off,$once,$emit)
eventsMixin(Vue)

//处理生命周期相关方法Vue.prototype.$forceUpdate,Vue.prototype.$destroy
lifecycleMixin(Vue)

//添加Vue.prototype.$nextTick，Vue.prototype._render
renderMixin(Vue)

export default Vue
