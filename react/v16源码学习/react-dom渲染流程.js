// 1.
// ReactDOM.render(<App />, document.getElementById('root'),function(){console.log(this)});
// 创建一个ReactElement
/* {
    $$typeof:Symbol(react.element)
    key:null
    props:{}
    ref:null
    type:ƒ App(props)
} */

// 2.
// 调用 ReactDOM.render方法 
// 生成一个ReactRoot (reactRootInstance._internalRoot = fiberRoot)实例，挂载在container._reactRootContainer上

//3.
// 调用 reactRoot.render(children,callback) 初始化渲染
// ==> DOMRenderer.updateContainer(element, fiberRoot, parentComponent, callback) 
// ==> updateContainerAtExpirationTime(element, fiberRoot, parentComponent, currentTime, expirationTime, callback)


//4.
// 开始调度 root fiber 更新
// ==> scheduleRootUpdate(fiber, element, currentTime, expirationTime, callback);

/* 
    function scheduleRootUpdate(fiber, element, currentTime, expirationTime, callback) {

        var update = {
            expirationTime: expirationTime,
            partialState: { element: element },
            callback: callback,
            isReplace: false,
            isForced: false,
            capturedValue: null,
            next: null
        };
        insertUpdateIntoFiber(current, update);
        scheduleWork(current, expirationTime);

        return expirationTime;
    } 
*/

//5.
// insertUpdateIntoFiber(fiber, update) 解析当前fiber的updateQueue
// scheduleWork(fiber, expirationTime); 从当前fiber开始向上遍历，直至root fiber，修改各级fiber的过期时间，如果满足调度器条件，调度器开始处理 fiberRoot 更新（具体见./scheduleWork.js）


// 6. requestWork
// 调度器开始处理fiberRoot更新
/* 
    function requestWork(root, expirationTime) {
        
        // 将当前 fiberRoot 添加给调度器，并调整fiberRoot的过期时间
        addRootToSchedule(root, expirationTime);

        if (isRendering) {
            // Prevent reentrancy. Remaining work will be scheduled at the end of
            // the currently rendering batch.
            return;
        }

        if (isBatchingUpdates) {
            // Flush work at the end of the batch.
            if (isUnbatchingUpdates) {
                // ...unless we're inside unbatchedUpdates, in which case we should
                // flush it now.
                nextFlushedRoot = root;
                nextFlushedExpirationTime = Sync;
                performWorkOnRoot(root, Sync, false);
            }
            return;
        }

        // TODO: Get rid of Sync and use current time?
        if (expirationTime === Sync) {
            performSyncWork();
        } else {
            scheduleCallbackWithExpiration(expirationTime);
        }
    } 
*/


// 7.
// 依次找到当前调度器中优先级最高的fiberRoot findHighestPriorityRoot()，并处理 performWorkOnRoot(nextFlushedRoot, nextFlushedExpirationTime, false)
/* 
    performWorkOnRoot 处理当前的fiberRoot

    调和阶段

        生成当前 fiber 的 workInProgress，即为当前的工作单元 （nextWorkUnit）, 并循环处理 nextUnitOfWork = performUnitOfWork(nextUnitOfWork)

        next = beginWork(current, workInProgress, nextRenderExpirationTime) 生成当前fiber的子节点，并插入树中，所有子节点解析完成之后，开始处理当前树，完成任务 completeUnitOfWork(workInProgress)

            beginWork 根据当前的fiber type，生成不同的节点,在此过程中，会执行 processUpdateQueue 方法，解析更新，通过setState方法设置state，会记录在updateQueue 相应的update节点的partialState中(对象或函数)，通过 getStateFromUpdate(update, instance, state, props) 获取 partialState，此方法中可以看出object参数或者function参数的不同，如果在同一次调度阶段多次设置state，采用object参数只会使用最后一次设置的值，而使用function参数每次都会生效

            ==> updateHostRoot(current, workInProgress, renderExpirationTime)
            如果当前为 root fiber，解析 react element对象 reconcileChildren(current, workInProgress, nextChildren)  生成新的fiber子节点，或者更新已存在的fiber节点( key 和 type 都相同)

            ==> updateClassComponent(current, workInProgress, renderExpirationTime)
            如果是class组件 fiber
            
                constructClassInstance(workInProgress, workInProgress.pendingProps)
                实例化组件，触发 getDerivedStateFromProps 组件静态方法
                mountClassInstance(workInProgress, renderExpirationTime)
                插入组件实例，初始化组件实例的 state，props，refs，context，{{如果满足条件，(没有getDerivedStateFromProps和getSnapshotBeforeUpdate钩子函数，这两个新的生命周期函数不能和componentWillMount，componentWillUpdate以及对应的unsafe版本，同时使用) 依次触发 componentWillMount UNSAFE_componentWillMount生命周期钩子函数，在此期间，如果有额外的状态更新(setState),添加到当前workInProgress的updateQueue中，componentWillMount执行完成后，解析 updateQueue ，生成新的state，并挂载在组件实例上}},调用 render 方法，生成react element，并生成相应的fiber 子节点插入树中

            ==> updateHostComponent(current, workInProgress, renderExpirationTime)
            如果是 host 组件 fiber，如果 workInProgress.pendingProps 存在children属性(DOM属性渲染子节点)，继续调和 children 节点，生成相应的 fiber，否则 fiber树生成完成， 返回null 

        fiber树全部生成之后，开始完成当前任务单元的工作 completeUnitOfWork(workInProgress)，从链尾开始，如果当前fiber存在副作用，将当前fiber挂载在父级fiber的副作用链末尾，并重置当前fiber的过期时间，意味着当解析到root fiber时，root fiber的副作用链从最子级fiber开始，按照fiber树逆向排列(如果存在兄弟fiber，从后向前排列)，全部处理完成之后，提交更新

    提交阶段

        // 遍历副作用树，完成组件的插入，更新，及各阶段的生命周期函数的调用
        commitRoot(finishedWork)

        // 第一次遍历，依次调用组件的 getSnapshotBeforeUpdate 钩子函数
        // 第二次遍历，处理dom的插入，更新，删除以及 unmounts ref  (删除时会触发 componentWillUnmount钩子)
        // 第三次遍历, 依次调用组件的生命周期钩子(componentDidMount componentDidUpdate),需要注意的是，在 componentDidMount 钩子当中，本次调度实际上还没有完成，因此在其中多次调用 setState 会添加到当前fiber的updateQueue中，componentDidMount执行完成之后，会立即调用 setState中的回调函数，处理完成之后，会调用ReactDOM.render中的回调函数。

*/