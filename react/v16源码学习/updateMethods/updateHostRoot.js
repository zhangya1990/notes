function updateHostRoot(current, workInProgress, renderExpirationTime) {
  // 将当前workInProgress的相关属性(dom,fiber,context)存储到reactFilberStack中
  pushHostRootContext(workInProgress);

  var updateQueue = workInProgress.updateQueue;
  if (updateQueue !== null) {
    var prevState = workInProgress.memoizedState;
    // 解析优先级足够的更新,获取最新的state，见 ../updateQueue.js
    var state = processUpdateQueue(current, workInProgress, updateQueue, null, null, renderExpirationTime);

    // 设置为 workInProgress.memoizeState = state
    memoizeState(workInProgress, state);
    updateQueue = workInProgress.updateQueue;

    var element = void 0;

    // workInProgress.updateQueue不为空 (可能有优先级不够的被跳过) 并且 有捕获到的值（错误）
    if (updateQueue !== null && updateQueue.capturedValues !== null) {
      // There's an uncaught error. Unmount the whole root.
      element = null;
    } else if (prevState === state) {
      // If the state is the same as before, that's a bailout because we had
      // no work that expires at this time.

      // 跟新的时候如果发现state相同，克隆所有的子节点
      resetHydrationState();
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    } else {
      // 首次插入的时候
      element = state.element;
    }
    var root = workInProgress.stateNode;

    // 服务端输出 ？？？
    if ((current === null || current.child === null) && root.hydrate && enterHydrationState(workInProgress)) {
      // If we don't have any current children this might be the first pass.
      // We always try to hydrate. If this isn't a hydration pass there won't
      // be any children to hydrate which is effectively the same thing as
      // not hydrating.

      // This is a bit of a hack. We track the host root as a placement to
      // know that we're currently in a mounting state. That way isMounted
      // works as expected. We must reset this before committing.
      // TODO: Delete this when we delete isMounted and findDOMNode.
      workInProgress.effectTag |= Placement;

      // Ensure that children mount into this root without tracking
      // side-effects. This ensures that we don't store Placement effects on
      // nodes that will be hydrated.
      workInProgress.child = mountChildFibers(workInProgress, null, element, renderExpirationTime);
    } else {
      // Otherwise reset hydration state in case we aborted and resumed another
      // root.

      // 重置各种跟 hydrate 相关的变量，忽略，暂时没什么卵用
      resetHydrationState();

      // 花式插入各种child
      reconcileChildren(current, workInProgress, element);
    }
    memoizeState(workInProgress, state);
    return workInProgress.child;
  }
  resetHydrationState();


  // If there is no update queue, that's a bailout because the root has no props.
  // 如果当前 workInProgress 没有更新队列
  return bailoutOnAlreadyFinishedWork(current, workInProgress);
}

var NO_CONTEXT = {};
var contextStackCursor = createCursor(NO_CONTEXT);
var contextFiberStackCursor = createCursor(NO_CONTEXT);
var rootInstanceStackCursor = createCursor(NO_CONTEXT);


function pushHostRootContext(workInProgress) {

  // context相关 暂时忽略
  var root = workInProgress.stateNode; // fiberRoot实例
  if (root.pendingContext) {
    pushTopLevelContextObject(workInProgress, root.pendingContext, root.pendingContext !== root.context);
  } else if (root.context) {
    // Should always be set
    pushTopLevelContextObject(workInProgress, root.context, false);
  }
  pushHostContainer(workInProgress, root.containerInfo);
}


// 将当前的 container (根组件所在DOM) 添加到stack中
function pushHostContainer(fiber, nextRootInstance) {
  // Push current root instance onto the stack;
  // This allows us to reset root when portals are popped.

  // rootInstanceStackCursor.current = containerInfo //DOM 并且将当前workInProgress添加到fiberStack中
  push(rootInstanceStackCursor, nextRootInstance, fiber);

  // 当前 dom 的 namespace
  var nextRootContext = getRootHostContext(nextRootInstance);

  // Track the context and the Fiber that provided it.
  // This enables us to pop only Fibers that provide unique contexts.
  // 将当前fiber赋值为 contextFiberStackCursor.current
  push(contextFiberStackCursor, fiber, fiber);
  push(contextStackCursor, nextRootContext, fiber);
}


function resetHydrationState() {
  hydrationParentFiber = null;
  nextHydratableInstance = null;
  isHydrating = false;
}


