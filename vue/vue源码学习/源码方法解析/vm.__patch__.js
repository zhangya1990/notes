Vue.prototype.__patch__ = inBrowser ? patch : noop

//nodeOps 操作dom的方法集合对象
//modules  [ attrs,klass,events,domProps,style,transition,directives,refs]
const patch = createPatchFunction({ nodeOps, modules })


const emptyNode = new VNode('', {}, [])

const hooks = ['create', 'activate', 'update', 'remove', 'destroy']

function isUndef (s) {
    return s == null
}

function isDef (s) {
    return s != null
}

function sameVnode (vnode1, vnode2) {
    return (
        vnode1.key === vnode2.key &&
        vnode1.tag === vnode2.tag &&
        vnode1.isComment === vnode2.isComment &&
        !vnode1.data === !vnode2.data
    )
}

function createKeyToOldIdx (children, beginIdx, endIdx) {
    let i, key
    const map = {}
    for (i = beginIdx; i <= endIdx; ++i) {
        key = children[i].key
        if (isDef(key)) map[key] = i
    }
    return map
}

function createPatchFunction (backend) {
    let i, j
    const cbs = {}

    const { modules, nodeOps } = backend

    for (i = 0; i < hooks.length; ++i) {
        cbs[hooks[i]] = []
        for (j = 0; j < modules.length; ++j) {
            if (modules[j][hooks[i]] !== undefined) cbs[hooks[i]].push(modules[j][hooks[i]])
        }
    }

    //创建一个空的顶层vnode
    function emptyNodeAt (elm) {
        return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
    }

    function createRmCb (childElm, listeners) {
        function remove () {
            if (--remove.listeners === 0) {
                removeNode(childElm)
            }
        }
        remove.listeners = listeners
        return remove
    }

    function removeNode (el) {
        const parent = nodeOps.parentNode(el)
        // element may have already been removed due to v-html / v-text
        if (parent) {
            nodeOps.removeChild(parent, el)
        }
    }

    let inPre = 0
    function createElm (vnode, insertedVnodeQueue, parentElm, refElm, nested) {
        vnode.isRootInsert = !nested // for transition enter check
        if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
            return
        }

        const data = vnode.data
        const children = vnode.children
        const tag = vnode.tag
        console.warn(tag)
        if (isDef(tag)) {
            if (process.env.NODE_ENV !== 'production') {
                if (data && data.pre) {
                    inPre++
                }
                if (
                    !inPre &&
                    !vnode.ns &&
                    !(config.ignoredElements.length && config.ignoredElements.indexOf(tag) > -1) &&
                    config.isUnknownElement(tag)
                ) {
                    warn(
                        'Unknown custom element: <' + tag + '> - did you ' +
                        'register the component correctly? For recursive components, ' +
                        'make sure to provide the "name" option.',
                        vnode.context
                    )
                }
            }
            //根据tag创建标签
            vnode.elm = vnode.ns
                ? nodeOps.createElementNS(vnode.ns, tag)
                : nodeOps.createElement(tag, vnode)
            setScope(vnode)

            /* istanbul ignore if */
            if (__WEEX__) {
                // in Weex, the default insertion order is parent-first.
                // List items can be optimized to use children-first insertion
                // with append="tree".
                const appendAsTree = data && data.appendAsTree
                if (!appendAsTree) {
                    if (isDef(data)) {
                        invokeCreateHooks(vnode, insertedVnodeQueue)
                    }
                    insert(parentElm, vnode.elm, refElm)
                }
                createChildren(vnode, children, insertedVnodeQueue)
                if (appendAsTree) {
                    if (isDef(data)) {
                        invokeCreateHooks(vnode, insertedVnodeQueue)
                    }
                    insert(parentElm, vnode.elm, refElm)
                }
            } else {
                //创建子节点
                createChildren(vnode, children, insertedVnodeQueue)

                if (isDef(data)) {
                    invokeCreateHooks(vnode, insertedVnodeQueue)
                }
                //插入父节点
                insert(parentElm, vnode.elm, refElm)
            }

            if (process.env.NODE_ENV !== 'production' && data && data.pre) {
                inPre--
            }
        } else if (vnode.isComment) {
            vnode.elm = nodeOps.createComment(vnode.text)
            insert(parentElm, vnode.elm, refElm)
        } else {
            vnode.elm = nodeOps.createTextNode(vnode.text)
            insert(parentElm, vnode.elm, refElm)
        }
    }

    function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
        let i = vnode.data
        if (isDef(i)) {
            const isReactivated = isDef(vnode.componentInstance) && i.keepAlive
            if (isDef(i = i.hook) && isDef(i = i.init)) {
                i(vnode, false /* hydrating */, parentElm, refElm)
            }
            // after calling the init hook, if the vnode is a child component
            // it should've created a child instance and mounted it. the child
            // component also has set the placeholder vnode's elm.
            // in that case we can just return the element and be done.
            if (isDef(vnode.componentInstance)) {
                initComponent(vnode, insertedVnodeQueue)
                if (isReactivated) {
                    reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
                }
                return true
            }
        }
    }

    function initComponent (vnode, insertedVnodeQueue) {
        if (vnode.data.pendingInsert) {
            insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert)
        }
        vnode.elm = vnode.componentInstance.$el
        if (isPatchable(vnode)) {
            invokeCreateHooks(vnode, insertedVnodeQueue)
            setScope(vnode)
        } else {
            // empty component root.
            // skip all element-related modules except for ref (#3455)
            registerRef(vnode)
            // make sure to invoke the insert hook
            insertedVnodeQueue.push(vnode)
        }
    }

    function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
        let i
        // hack for #4339: a reactivated component with inner transition
        // does not trigger because the inner node's created hooks are not called
        // again. It's not ideal to involve module-specific logic in here but
        // there doesn't seem to be a better way to do it.
        let innerNode = vnode
        while (innerNode.componentInstance) {
            innerNode = innerNode.componentInstance._vnode
            if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
                for (i = 0; i < cbs.activate.length; ++i) {
                    cbs.activate[i](emptyNode, innerNode)
                }
                insertedVnodeQueue.push(innerNode)
                break
            }
        }
        // unlike a newly created component,
        // a reactivated keep-alive component doesn't insert itself
        insert(parentElm, vnode.elm, refElm)
    }

    function insert (parent, elm, ref) {
        if (parent) {
            if (ref) {
                nodeOps.insertBefore(parent, elm, ref)
            } else {
                nodeOps.appendChild(parent, elm)
            }
        }
    }

    function createChildren (vnode, children, insertedVnodeQueue) {
        if (Array.isArray(children)) {
            for (let i = 0; i < children.length; ++i) {
                createElm(children[i], insertedVnodeQueue, vnode.elm, null, true)
            }
        } else if (isPrimitive(vnode.text)) {
            nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(vnode.text))
        }
    }

    function isPatchable (vnode) {
        while (vnode.componentInstance) {
            vnode = vnode.componentInstance._vnode
        }
        return isDef(vnode.tag)
    }

    //解析vnode.data中的钩子
    function invokeCreateHooks (vnode, insertedVnodeQueue) {
        //依次触发create钩子集合中的回调函数
        for (let i = 0; i < cbs.create.length; ++i) {
            cbs.create[i](emptyNode, vnode)
        }
        i = vnode.data.hook // Reuse variable
        if (isDef(i)) {
            //如果包含create钩子，触发钩子函数
            if (i.create) i.create(emptyNode, vnode)
            //如果包含insert钩子，将当前vnode添加进insertedVnodeQueue中，可保证按照插入的顺序依次出发insert钩子
            if (i.insert) insertedVnodeQueue.push(vnode)
        }
    }

    // set scope id attribute for scoped CSS.
    // this is implemented as a special case to avoid the overhead
    // of going through the normal attribute patching process.
    function setScope (vnode) {
        let i
        if (isDef(i = vnode.context) && isDef(i = i.$options._scopeId)) {
            nodeOps.setAttribute(vnode.elm, i, '')
        }
        if (isDef(i = activeInstance) &&
            i !== vnode.context &&
            isDef(i = i.$options._scopeId)) {
            nodeOps.setAttribute(vnode.elm, i, '')
        }
    }

    function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
        for (; startIdx <= endIdx; ++startIdx) {
            createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm)
        }
    }

    function invokeDestroyHook (vnode) {
        let i, j
        const data = vnode.data
        if (isDef(data)) {
            if (isDef(i = data.hook) && isDef(i = i.destroy)) i(vnode)
            for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode)
        }
        if (isDef(i = vnode.children)) {
            for (j = 0; j < vnode.children.length; ++j) {
                invokeDestroyHook(vnode.children[j])
            }
        }
    }

    function removeVnodes (parentElm, vnodes, startIdx, endIdx) {
        for (; startIdx <= endIdx; ++startIdx) {
            const ch = vnodes[startIdx]
            if (isDef(ch)) {
                if (isDef(ch.tag)) {
                    removeAndInvokeRemoveHook(ch)
                    invokeDestroyHook(ch)
                } else { // Text node
                    removeNode(ch.elm)
                }
            }
        }
    }

    function removeAndInvokeRemoveHook (vnode, rm) {
        if (rm || isDef(vnode.data)) {
            const listeners = cbs.remove.length + 1
            if (!rm) {
                // directly removing
                rm = createRmCb(vnode.elm, listeners)
            } else {
                // we have a recursively passed down rm callback
                // increase the listeners count
                rm.listeners += listeners
            }
            // recursively invoke hooks on child component root node
            if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
                removeAndInvokeRemoveHook(i, rm)
            }
            for (i = 0; i < cbs.remove.length; ++i) {
                cbs.remove[i](vnode, rm)
            }
            if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
                i(vnode, rm)
            } else {
                rm()
            }
        } else {
            removeNode(vnode.elm)
        }
    }

    function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
        let oldStartIdx = 0
        let newStartIdx = 0
        let oldEndIdx = oldCh.length - 1
        let oldStartVnode = oldCh[0]
        let oldEndVnode = oldCh[oldEndIdx]
        let newEndIdx = newCh.length - 1
        let newStartVnode = newCh[0]
        let newEndVnode = newCh[newEndIdx]
        let oldKeyToIdx, idxInOld, elmToMove, refElm

        // removeOnly is a special flag used only by <transition-group>
        // to ensure removed elements stay in correct relative positions
        // during leaving transitions
        const canMove = !removeOnly

        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            if (isUndef(oldStartVnode)) {
                oldStartVnode = oldCh[++oldStartIdx] // Vnode has been moved left
            } else if (isUndef(oldEndVnode)) {
                oldEndVnode = oldCh[--oldEndIdx]
            } else if (sameVnode(oldStartVnode, newStartVnode)) {
                patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue)
                oldStartVnode = oldCh[++oldStartIdx]
                newStartVnode = newCh[++newStartIdx]
            } else if (sameVnode(oldEndVnode, newEndVnode)) {
                patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue)
                oldEndVnode = oldCh[--oldEndIdx]
                newEndVnode = newCh[--newEndIdx]
            } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
                patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue)
                canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
                oldStartVnode = oldCh[++oldStartIdx]
                newEndVnode = newCh[--newEndIdx]
            } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
                patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue)
                canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
                oldEndVnode = oldCh[--oldEndIdx]
                newStartVnode = newCh[++newStartIdx]
            } else {
                //根据vnode的key属性操作dom
                if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
                idxInOld = isDef(newStartVnode.key) ? oldKeyToIdx[newStartVnode.key] : null
                if (isUndef(idxInOld)) { // New element
                    //如果newStartVnode不包含key，或oldChildren中不存在当前key属性，新建dom
                    createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm)
                    newStartVnode = newCh[++newStartIdx]
                } else {
                    elmToMove = oldCh[idxInOld]
                    /* istanbul ignore if */
                    if (process.env.NODE_ENV !== 'production' && !elmToMove) {
                        warn(
                            'It seems there are duplicate keys that is causing an update error. ' +
                            'Make sure each v-for item has a unique key.'
                        )
                    }
                    if (sameVnode(elmToMove, newStartVnode)) {
                        //新旧children中都存在当前，并且类似
                        patchVnode(elmToMove, newStartVnode, insertedVnodeQueue)
                        oldCh[idxInOld] = undefined
                        canMove && nodeOps.insertBefore(parentElm, newStartVnode.elm, oldStartVnode.elm)
                        newStartVnode = newCh[++newStartIdx]
                    } else {
                        // same key but different element. treat as new element
                        //具有相同的key但是是不同的元素，创建新的
                        createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm)
                        newStartVnode = newCh[++newStartIdx]
                    }
                }
            }
        }
        if (oldStartIdx > oldEndIdx) {
            refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
            addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue)
        } else if (newStartIdx > newEndIdx) {
            removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
        }
    }

    function patchVnode (oldVnode, vnode, insertedVnodeQueue, removeOnly) {
        if (oldVnode === vnode) {
            return
        }
        // reuse element for static trees.
        // note we only do this if the vnode is cloned -
        // if the new node is not cloned it means the render functions have been
        // reset by the hot-reload-api and we need to do a proper re-render.
        if (vnode.isStatic &&
            oldVnode.isStatic &&
            vnode.key === oldVnode.key &&
            (vnode.isCloned || vnode.isOnce)) {
            vnode.elm = oldVnode.elm
            vnode.componentInstance = oldVnode.componentInstance
            return
        }
        let i
        const data = vnode.data
        const hasData = isDef(data)
        //依次触发prepatch中的钩子
        if (hasData && isDef(i = data.hook) && isDef(i = i.prepatch)) {
            i(oldVnode, vnode)
        }
        const elm = vnode.elm = oldVnode.elm
        const oldCh = oldVnode.children
        const ch = vnode.children
        if (hasData && isPatchable(vnode)) {
            for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
            if (isDef(i = data.hook) && isDef(i = i.update)) i(oldVnode, vnode)
        }
        if (isUndef(vnode.text)) {
            //vnode.text 不存在
            if (isDef(oldCh) && isDef(ch)) {
                //oldVnode.children和vnode.children都存在，但不相同
                if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly)
            } else if (isDef(ch)) {
                //oldVnode.children不存在，vnode.children存在
                //首先在真实dom中移除oldVnode.text
                if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '')
                //将vnode.children依次创建
                addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
            } else if (isDef(oldCh)) {
                //oldVnode.children存在，vnode.children不存在
                //全部移除
                removeVnodes(elm, oldCh, 0, oldCh.length - 1)
            } else if (isDef(oldVnode.text)) {
                //oldVnode.text存在，将text置为空
                nodeOps.setTextContent(elm, '')
            }
        } else if (oldVnode.text !== vnode.text) {
            //新旧vnode.text不相同,替换为新
            nodeOps.setTextContent(elm, vnode.text)
        }
          //依次触发postpatch中的钩子
        if (hasData) {
            if (isDef(i = data.hook) && isDef(i = i.postpatch)) i(oldVnode, vnode)
        }
    }

    function invokeInsertHook (vnode, queue, initial) {
        // delay insert hooks for component root nodes, invoke them after the
        // element is really inserted
        if (initial && vnode.parent) {
            vnode.parent.data.pendingInsert = queue
        } else {
            for (let i = 0; i < queue.length; ++i) {
                queue[i].data.hook.insert(queue[i])
            }
        }
    }

    let bailed = false
    // list of modules that can skip create hook during hydration because they
    // are already rendered on the client or has no need for initialization
    const isRenderedModule = makeMap('attrs,style,class,staticClass,staticStyle,key')

    // Note: this is a browser-only function so we can assume elms are DOM nodes.
    function hydrate (elm, vnode, insertedVnodeQueue) {
        if (process.env.NODE_ENV !== 'production') {
            if (!assertNodeMatch(elm, vnode)) {
                return false
            }
        }
        vnode.elm = elm
        const { tag, data, children } = vnode
        if (isDef(data)) {
            if (isDef(i = data.hook) && isDef(i = i.init)) i(vnode, true /* hydrating */)
            if (isDef(i = vnode.componentInstance)) {
                // child component. it should have hydrated its own tree.
                initComponent(vnode, insertedVnodeQueue)
                return true
            }
        }
        if (isDef(tag)) {
            if (isDef(children)) {
                // empty element, allow client to pick up and populate children
                if (!elm.hasChildNodes()) {
                    createChildren(vnode, children, insertedVnodeQueue)
                } else {
                    let childrenMatch = true
                    let childNode = elm.firstChild
                    for (let i = 0; i < children.length; i++) {
                        if (!childNode || !hydrate(childNode, children[i], insertedVnodeQueue)) {
                            childrenMatch = false
                            break
                        }
                        childNode = childNode.nextSibling
                    }
                    // if childNode is not null, it means the actual childNodes list is
                    // longer than the virtual children list.
                    if (!childrenMatch || childNode) {
                        if (process.env.NODE_ENV !== 'production' &&
                            typeof console !== 'undefined' &&
                            !bailed) {
                            bailed = true
                            console.warn('Parent: ', elm)
                            console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children)
                        }
                        return false
                    }
                }
            }
            if (isDef(data)) {
                for (const key in data) {
                    if (!isRenderedModule(key)) {
                        invokeCreateHooks(vnode, insertedVnodeQueue)
                        break
                    }
                }
            }
        } else if (elm.data !== vnode.text) {
            elm.data = vnode.text
        }
        return true
    }

    function assertNodeMatch (node, vnode) {
        if (vnode.tag) {
            return (
                vnode.tag.indexOf('vue-component') === 0 ||
                vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
            )
        } else {
            return node.nodeType === (vnode.isComment ? 8 : 3)
        }
    }

    return function patch (oldVnode, vnode, hydrating, removeOnly, parentElm, refElm) {
        if (!vnode) {
            if (oldVnode) invokeDestroyHook(oldVnode)
            return
        }

        let isInitialPatch = false
        const insertedVnodeQueue = []

        if (!oldVnode) {
            // empty mount (likely as component), create new root element
            isInitialPatch = true
            createElm(vnode, insertedVnodeQueue, parentElm, refElm)
        } else {
            const isRealElement = isDef(oldVnode.nodeType)
            if (!isRealElement && sameVnode(oldVnode, vnode)) {
                // patch existing root node
                patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly)
            } else {
                if (isRealElement) {
                    // mounting to a real element
                    // check if this is server-rendered content and if we can perform
                    // a successful hydration.
                    if (oldVnode.nodeType === 1 && oldVnode.hasAttribute('server-rendered')) {
                        oldVnode.removeAttribute('server-rendered')
                        hydrating = true
                    }
                    if (hydrating) {
                        if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
                            invokeInsertHook(vnode, insertedVnodeQueue, true)
                            return oldVnode
                        } else if (process.env.NODE_ENV !== 'production') {
                            warn(
                                'The client-side rendered virtual DOM tree is not matching ' +
                                'server-rendered content. This is likely caused by incorrect ' +
                                'HTML markup, for example nesting block-level elements inside ' +
                                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                                'full client-side render.'
                            )
                        }
                    }
                    // either not server-rendered, or hydration failed.
                    // create an empty node and replace it
                    //创建一个空的vnode
                    oldVnode = emptyNodeAt(oldVnode)
                }
                // replacing existing element
                const oldElm = oldVnode.elm
                const parentElm = nodeOps.parentNode(oldElm)
                //创建真正的dom
                createElm(
                    vnode,
                    insertedVnodeQueue,
                    // extremely rare edge case: do not insert if old element is in a
                    // leaving transition. Only happens when combining transition +
                    // keep-alive + HOCs. (#4590)
                    oldElm._leaveCb ? null : parentElm,
                    nodeOps.nextSibling(oldElm)
                )

                //vnode的祖籍vnode元素修改el属性
                if (vnode.parent) {
                    // component root element replaced.
                    // update parent placeholder node element, recursively
                    let ancestor = vnode.parent
                    while (ancestor) {
                        ancestor.elm = vnode.elm
                        ancestor = ancestor.parent
                    }

                    //vnode是一个组件？？？并且包含tag属性
                    if (isPatchable(vnode)) {
                        for (let i = 0; i < cbs.create.length; ++i) {
                            cbs.create[i](emptyNode, vnode.parent)
                        }
                    }
                }

                //移除旧的vnode,($mount(el)初始化时，会移除掉旧的dom，并根据vnode生成新的dom)
                if (parentElm !== null) {
                    removeVnodes(parentElm, [oldVnode], 0, 0)
                } else if (isDef(oldVnode.tag)) {
                    invokeDestroyHook(oldVnode)
                }
            }
        }

        //依次触发insert钩子
        invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
        return vnode.elm
    }
}