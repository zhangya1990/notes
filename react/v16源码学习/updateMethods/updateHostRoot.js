function updateHostRoot(current, workInProgress, renderExpirationTime) {
    // 将当前workInProgress的相关属性(dom,fiber,context)存储到reactFilberStack中
    pushHostRootContext(workInProgress);
    var updateQueue = workInProgress.updateQueue;
    if (updateQueue !== null) {
      var prevState = workInProgress.memoizedState;
      // 解析更新获取最新的state
      var state = processUpdateQueue(current, workInProgress, updateQueue, null, null, renderExpirationTime);
      memoizeState(workInProgress, state);
      updateQueue = workInProgress.updateQueue;

      var element = void 0;
      if (updateQueue !== null && updateQueue.capturedValues !== null) {
        // There's an uncaught error. Unmount the whole root.
        element = null;
      } else if (prevState === state) {
        // If the state is the same as before, that's a bailout because we had
        // no work that expires at this time.
        resetHydrationState();
        return bailoutOnAlreadyFinishedWork(current, workInProgress);
      } else {
        element = state.element;
      }
      var root = workInProgress.stateNode;
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
        resetHydrationState();
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
    var root = workInProgress.stateNode;
    if (root.pendingContext) {
      pushTopLevelContextObject(workInProgress, root.pendingContext, root.pendingContext !== root.context);
    } else if (root.context) {
      // Should always be set
      pushTopLevelContextObject(workInProgress, root.context, false);
    }
    pushHostContainer(workInProgress, root.containerInfo);
  }


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

