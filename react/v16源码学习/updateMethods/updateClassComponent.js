function updateClassComponent(current, workInProgress, renderExpirationTime) {
    // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.
    // content 相关
    var hasContext = pushLegacyContextProvider(workInProgress);
    var shouldUpdate = void 0;
    // 首次插入组件时，current === null ， workInProgress.stateNode === null
    if (current === null) {
      if (workInProgress.stateNode === null) {
        // In the initial pass we might need to construct the instance.
        // ../ClassInstance.js
        // 实例化组件并调用 getDerivedPropsFromState生命周期钩子，生成 workInProgress.memoizedState
        constructClassInstance(workInProgress, workInProgress.pendingProps);

        // 添加 instance state props refs context 并调用 componentWillUpdate 钩子，如果钩子当中有setState操作，解析操作，得到新的state
        mountClassInstance(workInProgress, renderExpirationTime);

        shouldUpdate = true;
      } else {
        // In a resume, we'll already have an instance we can reuse.
        shouldUpdate = resumeMountClassInstance(workInProgress, renderExpirationTime);
      }
    } else {
      shouldUpdate = updateClassInstance(current, workInProgress, renderExpirationTime);
    }

    // We processed the update queue inside updateClassInstance. It may have
    // included some errors that were dispatched during the commit phase.
    // TODO: Refactor class components so this is less awkward.
    var didCaptureError = false;
    var updateQueue = workInProgress.updateQueue;
    if (updateQueue !== null && updateQueue.capturedValues !== null) {
      shouldUpdate = true;
      didCaptureError = true;
    }
    return finishClassComponent(current, workInProgress, shouldUpdate, hasContext, didCaptureError, renderExpirationTime);
  }

  function finishClassComponent(current, workInProgress, shouldUpdate, hasContext, didCaptureError, renderExpirationTime) {
    // Refs should update even if shouldComponentUpdate returns false
    // ref 相关
    markRef(current, workInProgress);

    if (!shouldUpdate && !didCaptureError) {
      // Context providers should defer to sCU for rendering
      if (hasContext) {
        invalidateContextProvider(workInProgress, false);
      }

      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }

    var ctor = workInProgress.type;
    var instance = workInProgress.stateNode;

    // Rerender
    // 渲染组件
    ReactCurrentOwner.current = workInProgress;
    var nextChildren = void 0;
    if (didCaptureError && (!enableGetDerivedStateFromCatch || typeof ctor.getDerivedStateFromCatch !== 'function')) {
      // If we captured an error, but getDerivedStateFrom catch is not defined,
      // unmount all the children. componentDidCatch will schedule an update to
      // re-render a fallback. This is temporary until we migrate everyone to
      // the new API.
      // TODO: Warn in a future release.
      nextChildren = null;
    } else {
      {
        ReactDebugCurrentFiber.setCurrentPhase('render');

        // 调用 组件的render方法
        nextChildren = instance.render();
        if (debugRenderPhaseSideEffects || debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & StrictMode) {
          instance.render();
        }
        ReactDebugCurrentFiber.setCurrentPhase(null);
      }
    }

    // React DevTools reads this flag.
    workInProgress.effectTag |= PerformedWork;
    if (didCaptureError) {
      // If we're recovering from an error, reconcile twice: first to delete
      // all the existing children.
      reconcileChildrenAtExpirationTime(current, workInProgress, null, renderExpirationTime);
      workInProgress.child = null;
      // Now we can continue reconciling like normal. This has the effect of
      // remounting all children regardless of whether their their
      // identity matches.
    }

    // 调节更新
    reconcileChildrenAtExpirationTime(current, workInProgress, nextChildren, renderExpirationTime);
    // Memoize props and state using the values we just used to render.
    // TODO: Restructure so we never read values from the instance.
    memoizeState(workInProgress, instance.state);
    memoizeProps(workInProgress, instance.props);

    // The context might have changed so we need to recalculate it.
    if (hasContext) {
      invalidateContextProvider(workInProgress, true);
    }

    return workInProgress.child;
  }
