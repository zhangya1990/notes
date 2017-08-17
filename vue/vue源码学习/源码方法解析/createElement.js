import VNode, { createEmptyVNode } from './vnode'
import config from '../config'
import { createComponent } from './create-component'
import { normalizeChildren, simpleNormalizeChildren } from './helpers/index'
import { warn, resolveAsset, isPrimitive } from '../util/index'

const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2


export function createElement (
    context: Component,
    tag: any,
    data: any,
    children: any,
    normalizationType: any,
    alwaysNormalize: boolean
                                ): VNode {

    //如果data参数是数组、数字、字符串,及没有子节点,将data置为undefined，children改成data
    if (Array.isArray(data) || isPrimitive(data)) {
        normalizationType = children
        children = data
        data = undefined
    }
    if (alwaysNormalize) normalizationType = ALWAYS_NORMALIZE
    return _createElement(context, tag, data, children, normalizationType)
}

export function _createElement (
    context: Component,
    tag?: string | Class<Component> | Function | Object,
    data?: VNodeData,
    children?: any,
    normalizationType?: number
                                ): VNode {

    //如果data是一个被observe的对象，创建空的vNode实例
    if (data && data.__ob__) {
        process.env.NODE_ENV !== 'production' && warn(
            `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
            'Always create fresh vnode data objects in each render!',
            context
        )
        return createEmptyVNode()
    }
    //如果tag参数不存在,创建空的vNode实例
    if (!tag) {
        return createEmptyVNode()
    }

    //???????????????????????????????????????
    // support single function children as default scoped slot
    if (Array.isArray(children) &&
        typeof children[0] === 'function') {
        data = data || {}
        data.scopedSlots = { default: children[0] }
        children.length = 0
    }
    //???????????????????????????????????


    if (normalizationType === ALWAYS_NORMALIZE) {
        //如果最后一个参数为真
        //vNode实例数组
        children = normalizeChildren(children)
    } else if (normalizationType === SIMPLE_NORMALIZE) {
        //直接返回children或者是children的克隆数组(当数组元素中存在数组的时候)
        children = simpleNormalizeChildren(children)
    }
    let vnode, ns
    if (typeof tag === 'string') {
        let Ctor
        ns = config.getTagNamespace(tag)
        //如果是vue保留tag
        if (config.isReservedTag(tag)) {
            // platform built-in elements
            vnode = new VNode(
                config.parsePlatformTagName(tag), data, children,
                undefined, undefined, context
            )
        }
        //context.$options.components.tag存在
        else if ((Ctor = resolveAsset(context.$options, 'components', tag))) {
            // component
            vnode = createComponent(Ctor, data, context, children, tag)
        } else {
            // unknown or unlisted namespaced elements
            // check at runtime because it may get assigned a namespace when its
            // parent normalizes children
            vnode = new VNode(
                tag, data, children,
                undefined, undefined, context
            )
        }
    } else {
        // direct component options / constructor
        vnode = createComponent(tag, data, context, children)
    }
    if (vnode) {
        if (ns) applyNS(vnode, ns)
        return vnode
    } else {
        return createEmptyVNode()
    }


}

function applyNS (vnode, ns) {
    vnode.ns = ns
    if (vnode.tag === 'foreignObject') {
        // use default namespace inside foreignObject
        return
    }
    if (vnode.children) {
        for (let i = 0, l = vnode.children.length; i < l; i++) {
            const child = vnode.children[i]
            if (child.tag && !child.ns) {
                applyNS(child, ns)
            }
        }
    }
}

