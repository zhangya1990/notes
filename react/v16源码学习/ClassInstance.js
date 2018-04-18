var ReactFiberClassComponent = function (legacyContext, scheduleWork, computeExpirationForFiber, memoizeProps, memoizeState) {
    var cacheContext = legacyContext.cacheContext,
        getMaskedContext = legacyContext.getMaskedContext,
        getUnmaskedContext = legacyContext.getUnmaskedContext,
        isContextConsumer = legacyContext.isContextConsumer,
        hasContextChanged = legacyContext.hasContextChanged;
  
    // Class component state updater
  
    var updater = {
      isMounted: isMounted,

      // setState
      enqueueSetState: function (instance, partialState, callback) {
        var fiber = get(instance);
        callback = callback === undefined ? null : callback;
        {
          warnOnInvalidCallback$1(callback, 'setState');
        }
        var expirationTime = computeExpirationForFiber(fiber);
        var update = {
          expirationTime: expirationTime,
          partialState: partialState,
          callback: callback,
          isReplace: false,
          isForced: false,
          capturedValue: null,
          next: null
        };
        insertUpdateIntoFiber(fiber, update);
        scheduleWork(fiber, expirationTime);
      },

      // replaceState
      enqueueReplaceState: function (instance, state, callback) {
        var fiber = get(instance);
        callback = callback === undefined ? null : callback;
        {
          warnOnInvalidCallback$1(callback, 'replaceState');
        }
        var expirationTime = computeExpirationForFiber(fiber);
        var update = {
          expirationTime: expirationTime,
          partialState: state,
          callback: callback,
          isReplace: true,
          isForced: false,
          capturedValue: null,
          next: null
        };
        insertUpdateIntoFiber(fiber, update);
        scheduleWork(fiber, expirationTime);
      },

      // forceUpdate
      enqueueForceUpdate: function (instance, callback) {
        var fiber = get(instance);
        callback = callback === undefined ? null : callback;
        {
          warnOnInvalidCallback$1(callback, 'forceUpdate');
        }
        var expirationTime = computeExpirationForFiber(fiber);
        var update = {
          expirationTime: expirationTime,
          partialState: null,
          callback: callback,
          isReplace: false,
          isForced: true,
          capturedValue: null,
          next: null
        };
        insertUpdateIntoFiber(fiber, update);
        scheduleWork(fiber, expirationTime);
      }
    };
  
    // shouldComponentUpdate hook
    function checkShouldComponentUpdate(workInProgress, oldProps, newProps, oldState, newState, newContext) {
      if (oldProps === null || workInProgress.updateQueue !== null && workInProgress.updateQueue.hasForceUpdate) {
        // If the workInProgress already has an Update effect, return true
        return true;
      }
  
      var instance = workInProgress.stateNode;
      var ctor = workInProgress.type;
      if (typeof instance.shouldComponentUpdate === 'function') {
        startPhaseTimer(workInProgress, 'shouldComponentUpdate');
        var shouldUpdate = instance.shouldComponentUpdate(newProps, newState, newContext);
        stopPhaseTimer();
  
        {
          warning(shouldUpdate !== undefined, '%s.shouldComponentUpdate(): Returned undefined instead of a ' + 'boolean value. Make sure to return true or false.', getComponentName(workInProgress) || 'Component');
        }
  
        return shouldUpdate;
      }
  
      if (ctor.prototype && ctor.prototype.isPureReactComponent) {
        return !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState);
      }
  
      return true;
    }
  
    function checkClassInstance(workInProgress) {
      var instance = workInProgress.stateNode;
      var type = workInProgress.type;
      {
        var name = getComponentName(workInProgress) || 'Component';
        var renderPresent = instance.render;
  
        if (!renderPresent) {
          if (type.prototype && typeof type.prototype.render === 'function') {
            warning(false, '%s(...): No `render` method found on the returned component ' + 'instance: did you accidentally return an object from the constructor?', name);
          } else {
            warning(false, '%s(...): No `render` method found on the returned component ' + 'instance: you may have forgotten to define `render`.', name);
          }
        }
  
        var noGetInitialStateOnES6 = !instance.getInitialState || instance.getInitialState.isReactClassApproved || instance.state;
        warning(noGetInitialStateOnES6, 'getInitialState was defined on %s, a plain JavaScript class. ' + 'This is only supported for classes created using React.createClass. ' + 'Did you mean to define a state property instead?', name);
        var noGetDefaultPropsOnES6 = !instance.getDefaultProps || instance.getDefaultProps.isReactClassApproved;
        warning(noGetDefaultPropsOnES6, 'getDefaultProps was defined on %s, a plain JavaScript class. ' + 'This is only supported for classes created using React.createClass. ' + 'Use a static property to define defaultProps instead.', name);
        var noInstancePropTypes = !instance.propTypes;
        warning(noInstancePropTypes, 'propTypes was defined as an instance property on %s. Use a static ' + 'property to define propTypes instead.', name);
        var noInstanceContextTypes = !instance.contextTypes;
        warning(noInstanceContextTypes, 'contextTypes was defined as an instance property on %s. Use a static ' + 'property to define contextTypes instead.', name);
        var noComponentShouldUpdate = typeof instance.componentShouldUpdate !== 'function';
        warning(noComponentShouldUpdate, '%s has a method called ' + 'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' + 'The name is phrased as a question because the function is ' + 'expected to return a value.', name);
        if (type.prototype && type.prototype.isPureReactComponent && typeof instance.shouldComponentUpdate !== 'undefined') {
          warning(false, '%s has a method called shouldComponentUpdate(). ' + 'shouldComponentUpdate should not be used when extending React.PureComponent. ' + 'Please extend React.Component if shouldComponentUpdate is used.', getComponentName(workInProgress) || 'A pure component');
        }
        var noComponentDidUnmount = typeof instance.componentDidUnmount !== 'function';
        warning(noComponentDidUnmount, '%s has a method called ' + 'componentDidUnmount(). But there is no such lifecycle method. ' + 'Did you mean componentWillUnmount()?', name);
        var noComponentDidReceiveProps = typeof instance.componentDidReceiveProps !== 'function';
        warning(noComponentDidReceiveProps, '%s has a method called ' + 'componentDidReceiveProps(). But there is no such lifecycle method. ' + 'If you meant to update the state in response to changing props, ' + 'use componentWillReceiveProps(). If you meant to fetch data or ' + 'run side-effects or mutations after React has updated the UI, use componentDidUpdate().', name);
        var noComponentWillRecieveProps = typeof instance.componentWillRecieveProps !== 'function';
        warning(noComponentWillRecieveProps, '%s has a method called ' + 'componentWillRecieveProps(). Did you mean componentWillReceiveProps()?', name);
        var noUnsafeComponentWillRecieveProps = typeof instance.UNSAFE_componentWillRecieveProps !== 'function';
        warning(noUnsafeComponentWillRecieveProps, '%s has a method called ' + 'UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?', name);
        var hasMutatedProps = instance.props !== workInProgress.pendingProps;
        warning(instance.props === undefined || !hasMutatedProps, '%s(...): When calling super() in `%s`, make sure to pass ' + "up the same props that your component's constructor was passed.", name, name);
        var noInstanceDefaultProps = !instance.defaultProps;
        warning(noInstanceDefaultProps, 'Setting defaultProps as an instance property on %s is not supported and will be ignored.' + ' Instead, define defaultProps as a static property on %s.', name, name);
  
        if (typeof instance.getSnapshotBeforeUpdate === 'function' && typeof instance.componentDidUpdate !== 'function' && typeof instance.componentDidUpdate !== 'function' && !didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(type)) {
          didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(type);
          warning(false, '%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). ' + 'This component defines getSnapshotBeforeUpdate() only.', getComponentName(workInProgress));
        }
  
        var noInstanceGetDerivedStateFromProps = typeof instance.getDerivedStateFromProps !== 'function';
        warning(noInstanceGetDerivedStateFromProps, '%s: getDerivedStateFromProps() is defined as an instance method ' + 'and will be ignored. Instead, declare it as a static method.', name);
        var noInstanceGetDerivedStateFromCatch = typeof instance.getDerivedStateFromCatch !== 'function';
        warning(noInstanceGetDerivedStateFromCatch, '%s: getDerivedStateFromCatch() is defined as an instance method ' + 'and will be ignored. Instead, declare it as a static method.', name);
        var noStaticGetSnapshotBeforeUpdate = typeof type.getSnapshotBeforeUpdate !== 'function';
        warning(noStaticGetSnapshotBeforeUpdate, '%s: getSnapshotBeforeUpdate() is defined as a static method ' + 'and will be ignored. Instead, declare it as an instance method.', name);
        var _state = instance.state;
        if (_state && (typeof _state !== 'object' || isArray(_state))) {
          warning(false, '%s.state: must be set to an object or null', name);
        }
        if (typeof instance.getChildContext === 'function') {
          warning(typeof type.childContextTypes === 'object', '%s.getChildContext(): childContextTypes must be defined in order to ' + 'use getChildContext().', name);
        }
      }
    }
  
    function resetInputPointers(workInProgress, instance) {
      instance.props = workInProgress.memoizedProps;
      instance.state = workInProgress.memoizedState;
    }
  
    // 设置 workInProgress 和 instance 相关属性
    function adoptClassInstance(workInProgress, instance) {

      // 组件实例 添加 updater
      instance.updater = updater;

      // 跟容器解析的时候 fiber.stateNode = fiberRoot , react组件解析的时候为组件实例
      workInProgress.stateNode = instance;
      // The instance needs access to the fiber so that it can schedule updates
      // 添加 instance._reactInternalFiber = workInProgress
      set(instance, workInProgress);
      {
        instance._reactInternalInstance = fakeInternalInstance;
      }
    }
  
    // 组件实例化
    function constructClassInstance(workInProgress, props) {
      var ctor = workInProgress.type;

      // context 相关
      var unmaskedContext = getUnmaskedContext(workInProgress);
      var needsContext = isContextConsumer(workInProgress);
      var context = needsContext ? getMaskedContext(workInProgress, unmaskedContext) : emptyObject;
  
      // Instantiate twice to help detect side-effects.
      // 初始化两次 调试使用
      if (debugRenderPhaseSideEffects || debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & StrictMode) {
        new ctor(props, context); // eslint-disable-line no-new
      }
  
      debugger;
      var instance = new ctor(props, context);
      var state = instance.state !== null && instance.state !== undefined ? instance.state : null;

      // workInProgress添加instance
      adoptClassInstance(workInProgress, instance);
  
      {
        if (typeof ctor.getDerivedStateFromProps === 'function' && state === null) {
          var componentName = getComponentName(workInProgress) || 'Component';
          if (!didWarnAboutUninitializedState.has(componentName)) {
            didWarnAboutUninitializedState.add(componentName);
            warning(false, '%s: Did not properly initialize state during construction. ' + 'Expected state to be an object, but it was %s.', componentName, instance.state === null ? 'null' : 'undefined');
          }
        }
  
        // If new component APIs are defined, "unsafe" lifecycles won't be called.
        // Warn about these lifecycles if they are present.
        // Don't warn about react-lifecycles-compat polyfilled methods though.
        if (typeof ctor.getDerivedStateFromProps === 'function' || typeof instance.getSnapshotBeforeUpdate === 'function') {
          var foundWillMountName = null;
          var foundWillReceivePropsName = null;
          var foundWillUpdateName = null;
          if (typeof instance.componentWillMount === 'function' && instance.componentWillMount.__suppressDeprecationWarning !== true) {
            foundWillMountName = 'componentWillMount';
          } else if (typeof instance.UNSAFE_componentWillMount === 'function') {
            foundWillMountName = 'UNSAFE_componentWillMount';
          }
          if (typeof instance.componentWillReceiveProps === 'function' && instance.componentWillReceiveProps.__suppressDeprecationWarning !== true) {
            foundWillReceivePropsName = 'componentWillReceiveProps';
          } else if (typeof instance.UNSAFE_componentWillReceiveProps === 'function') {
            foundWillReceivePropsName = 'UNSAFE_componentWillReceiveProps';
          }
          if (typeof instance.componentWillUpdate === 'function' && instance.componentWillUpdate.__suppressDeprecationWarning !== true) {
            foundWillUpdateName = 'componentWillUpdate';
          } else if (typeof instance.UNSAFE_componentWillUpdate === 'function') {
            foundWillUpdateName = 'UNSAFE_componentWillUpdate';
          }
          if (foundWillMountName !== null || foundWillReceivePropsName !== null || foundWillUpdateName !== null) {
            var _componentName = getComponentName(workInProgress) || 'Component';
            var newApiName = typeof ctor.getDerivedStateFromProps === 'function' ? 'getDerivedStateFromProps()' : 'getSnapshotBeforeUpdate()';
            if (!didWarnAboutLegacyLifecyclesAndDerivedState.has(_componentName)) {
              didWarnAboutLegacyLifecyclesAndDerivedState.add(_componentName);
              warning(false, 'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' + '%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\n' + 'The above lifecycles should be removed. Learn more about this warning here:\n' + 'https://fb.me/react-async-component-lifecycle-hooks', _componentName, newApiName, foundWillMountName !== null ? '\n  ' + foundWillMountName : '', foundWillReceivePropsName !== null ? '\n  ' + foundWillReceivePropsName : '', foundWillUpdateName !== null ? '\n  ' + foundWillUpdateName : '');
            }
          }
        }
      }
  
      // 添加state缓存，即prevState
      workInProgress.memoizedState = state;
  
      // 调用 getDerivedStateFromProps 生命周期函数，由props衍生从出新的state
      var partialState = callGetDerivedStateFromProps(workInProgress, instance, props, state);
  
      if (partialState !== null && partialState !== undefined) {
        // Render-phase updates (like this) should not be added to the update queue,
        // So that multiple render passes do not enqueue multiple updates.
        // Instead, just synchronously merge the returned state into the instance.

        // 在渲染阶段多次更新不会添加到update queue中，理解为在实例化组件阶段，通过getDerivedStateFromProps获取的state不会单独更新一次，而是直接合并到prevState中
        workInProgress.memoizedState = _assign({}, workInProgress.memoizedState, partialState);
      }
  
      // Cache unmasked context so we can avoid recreating masked context unless necessary.
      // ReactFiberContext usually updates this cache but can't for newly-created instances.
      if (needsContext) {
        cacheContext(workInProgress, unmaskedContext, context);
      }
  
      return instance;
    }
  
    function callComponentWillMount(workInProgress, instance) {
      startPhaseTimer(workInProgress, 'componentWillMount');
      var oldState = instance.state;
  
      if (typeof instance.componentWillMount === 'function') {
        instance.componentWillMount();
      }
      if (typeof instance.UNSAFE_componentWillMount === 'function') {
        instance.UNSAFE_componentWillMount();
      }
  
      stopPhaseTimer();
  
      if (oldState !== instance.state) {
        {
          warning(false, '%s.componentWillMount(): Assigning directly to this.state is ' + "deprecated (except inside a component's " + 'constructor). Use setState instead.', getComponentName(workInProgress) || 'Component');
        }
        updater.enqueueReplaceState(instance, instance.state, null);
      }
    }
  
    function callComponentWillReceiveProps(workInProgress, instance, newProps, newContext) {
      var oldState = instance.state;
      startPhaseTimer(workInProgress, 'componentWillReceiveProps');
      if (typeof instance.componentWillReceiveProps === 'function') {
        instance.componentWillReceiveProps(newProps, newContext);
      }
      if (typeof instance.UNSAFE_componentWillReceiveProps === 'function') {
        instance.UNSAFE_componentWillReceiveProps(newProps, newContext);
      }
      stopPhaseTimer();
  
      if (instance.state !== oldState) {
        {
          var componentName = getComponentName(workInProgress) || 'Component';
          if (!didWarnAboutStateAssignmentForComponent.has(componentName)) {
            didWarnAboutStateAssignmentForComponent.add(componentName);
            warning(false, '%s.componentWillReceiveProps(): Assigning directly to ' + "this.state is deprecated (except inside a component's " + 'constructor). Use setState instead.', componentName);
          }
        }
        updater.enqueueReplaceState(instance, instance.state, null);
      }
    }
  

    function callGetDerivedStateFromProps(workInProgress, instance, nextProps, prevState) {
      var type = workInProgress.type;
  
  
      if (typeof type.getDerivedStateFromProps === 'function') {
        /* if (debugRenderPhaseSideEffects || debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & StrictMode) {
          // Invoke method an extra time to help detect side-effects.
          type.getDerivedStateFromProps.call(null, nextProps, prevState);
        } */
  
        var partialState = type.getDerivedStateFromProps.call(null, nextProps, prevState);
  
        /* {
          if (partialState === undefined) {
            var componentName = getComponentName(workInProgress) || 'Component';
            if (!didWarnAboutUndefinedDerivedState.has(componentName)) {
              didWarnAboutUndefinedDerivedState.add(componentName);
              warning(false, '%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. ' + 'You have returned undefined.', componentName);
            }
          }
        } */
  
        return partialState;
      }
    }
  
    // Invokes the mount life-cycles on a previously never rendered instance.
    function mountClassInstance(workInProgress, renderExpirationTime) {
      var ctor = workInProgress.type;
      var current = workInProgress.alternate;
  
      // 各种检查，报警
      {
        checkClassInstance(workInProgress);
      }
  
      var instance = workInProgress.stateNode;
      var props = workInProgress.pendingProps;
      var unmaskedContext = getUnmaskedContext(workInProgress);
  
      // 给组件实例添加 props state refs context
      instance.props = props;
      instance.state = workInProgress.memoizedState;
      instance.refs = emptyObject;
      instance.context = getMaskedContext(workInProgress, unmaskedContext);
  
      {
        if (workInProgress.mode & StrictMode) {
          ReactStrictModeWarnings.recordUnsafeLifecycleWarnings(workInProgress, instance);
        }
  
        if (warnAboutDeprecatedLifecycles) {
          ReactStrictModeWarnings.recordDeprecationWarnings(workInProgress, instance);
        }
      }
  
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (typeof ctor.getDerivedStateFromProps !== 'function' && typeof instance.getSnapshotBeforeUpdate !== 'function' && (typeof instance.UNSAFE_componentWillMount === 'function' || typeof instance.componentWillMount === 'function')) {

        // 调用 componentWillMount 钩子
        callComponentWillMount(workInProgress, instance);
        // If we had additional state updates during this life-cycle, let's
        // process them now.
        // 如果在 componentWillMount 钩子中有 setState 操作，立刻解析
        var updateQueue = workInProgress.updateQueue;
        if (updateQueue !== null) {
          instance.state = processUpdateQueue(current, workInProgress, updateQueue, instance, props, renderExpirationTime);
        }
      }
      if (typeof instance.componentDidMount === 'function') {
        workInProgress.effectTag |= Update;
      }
    }
  
    function resumeMountClassInstance(workInProgress, renderExpirationTime) {
      var ctor = workInProgress.type;
      var instance = workInProgress.stateNode;
      resetInputPointers(workInProgress, instance);
  
      var oldProps = workInProgress.memoizedProps;
      var newProps = workInProgress.pendingProps;
      var oldContext = instance.context;
      var newUnmaskedContext = getUnmaskedContext(workInProgress);
      var newContext = getMaskedContext(workInProgress, newUnmaskedContext);
  
      var hasNewLifecycles = typeof ctor.getDerivedStateFromProps === 'function' || typeof instance.getSnapshotBeforeUpdate === 'function';
  
      // Note: During these life-cycles, instance.props/instance.state are what
      // ever the previously attempted to render - not the "current". However,
      // during componentDidUpdate we pass the "current" props.
  
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillReceiveProps === 'function' || typeof instance.componentWillReceiveProps === 'function')) {
        if (oldProps !== newProps || oldContext !== newContext) {
          callComponentWillReceiveProps(workInProgress, instance, newProps, newContext);
        }
      }
  
      // Compute the next state using the memoized state and the update queue.
      var oldState = workInProgress.memoizedState;
      // TODO: Previous state can be null.
      var newState = void 0;
      var derivedStateFromCatch = void 0;
      if (workInProgress.updateQueue !== null) {
        newState = processUpdateQueue(null, workInProgress, workInProgress.updateQueue, instance, newProps, renderExpirationTime);
  
        var updateQueue = workInProgress.updateQueue;
        if (updateQueue !== null && updateQueue.capturedValues !== null && enableGetDerivedStateFromCatch && typeof ctor.getDerivedStateFromCatch === 'function') {
          var capturedValues = updateQueue.capturedValues;
          // Don't remove these from the update queue yet. We need them in
          // finishClassComponent. Do the reset there.
          // TODO: This is awkward. Refactor class components.
          // updateQueue.capturedValues = null;
          derivedStateFromCatch = callGetDerivedStateFromCatch(ctor, capturedValues);
        }
      } else {
        newState = oldState;
      }
  
      var derivedStateFromProps = void 0;
      if (oldProps !== newProps) {
        // The prevState parameter should be the partially updated state.
        // Otherwise, spreading state in return values could override updates.
        derivedStateFromProps = callGetDerivedStateFromProps(workInProgress, instance, newProps, newState);
      }
  
      if (derivedStateFromProps !== null && derivedStateFromProps !== undefined) {
        // Render-phase updates (like this) should not be added to the update queue,
        // So that multiple render passes do not enqueue multiple updates.
        // Instead, just synchronously merge the returned state into the instance.
        newState = newState === null || newState === undefined ? derivedStateFromProps : _assign({}, newState, derivedStateFromProps);
      }
      if (derivedStateFromCatch !== null && derivedStateFromCatch !== undefined) {
        // Render-phase updates (like this) should not be added to the update queue,
        // So that multiple render passes do not enqueue multiple updates.
        // Instead, just synchronously merge the returned state into the instance.
        newState = newState === null || newState === undefined ? derivedStateFromCatch : _assign({}, newState, derivedStateFromCatch);
      }
  
      if (oldProps === newProps && oldState === newState && !hasContextChanged() && !(workInProgress.updateQueue !== null && workInProgress.updateQueue.hasForceUpdate)) {
        // If an update was already in progress, we should schedule an Update
        // effect even though we're bailing out, so that cWU/cDU are called.
        if (typeof instance.componentDidMount === 'function') {
          workInProgress.effectTag |= Update;
        }
        return false;
      }
  
      var shouldUpdate = checkShouldComponentUpdate(workInProgress, oldProps, newProps, oldState, newState, newContext);
  
      if (shouldUpdate) {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for components using the new APIs.
        if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillMount === 'function' || typeof instance.componentWillMount === 'function')) {
          startPhaseTimer(workInProgress, 'componentWillMount');
          if (typeof instance.componentWillMount === 'function') {
            instance.componentWillMount();
          }
          if (typeof instance.UNSAFE_componentWillMount === 'function') {
            instance.UNSAFE_componentWillMount();
          }
          stopPhaseTimer();
        }
        if (typeof instance.componentDidMount === 'function') {
          workInProgress.effectTag |= Update;
        }
      } else {
        // If an update was already in progress, we should schedule an Update
        // effect even though we're bailing out, so that cWU/cDU are called.
        if (typeof instance.componentDidMount === 'function') {
          workInProgress.effectTag |= Update;
        }
  
        // If shouldComponentUpdate returned false, we should still update the
        // memoized props/state to indicate that this work can be reused.
        memoizeProps(workInProgress, newProps);
        memoizeState(workInProgress, newState);
      }
  
      // Update the existing instance's state, props, and context pointers even
      // if shouldComponentUpdate returns false.
      instance.props = newProps;
      instance.state = newState;
      instance.context = newContext;
  
      return shouldUpdate;
    }
  
    // Invokes the update life-cycles and returns false if it shouldn't rerender.
    function updateClassInstance(current, workInProgress, renderExpirationTime) {
      var ctor = workInProgress.type;
      var instance = workInProgress.stateNode;
      resetInputPointers(workInProgress, instance);
  
      var oldProps = workInProgress.memoizedProps;
      var newProps = workInProgress.pendingProps;
      var oldContext = instance.context;
      var newUnmaskedContext = getUnmaskedContext(workInProgress);
      var newContext = getMaskedContext(workInProgress, newUnmaskedContext);
  
      // 如果存在新的生命周期钩子，部分旧的钩子函数将不会调用(componentWillMount UNSAFE_componentWillMount componentWillReceiveProps componentWillUpdate UNSAFE_componentWillUpdate)
      var hasNewLifecycles = typeof ctor.getDerivedStateFromProps === 'function' || typeof instance.getSnapshotBeforeUpdate === 'function';
      
  
      // Note: During these life-cycles, instance.props/instance.state are what
      // ever the previously attempted to render - not the "current". However,
      // during componentDidUpdate we pass the "current" props.
  
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillReceiveProps === 'function' || typeof instance.componentWillReceiveProps === 'function')) {
        if (oldProps !== newProps || oldContext !== newContext) {
          // 调用 componentWillReceiveProps 钩子

          callComponentWillReceiveProps(workInProgress, instance, newProps, newContext);
        }
      }
  
      // Compute the next state using the memoized state and the update queue.
      var oldState = workInProgress.memoizedState;
      // TODO: Previous state can be null.
      var newState = void 0;
      var derivedStateFromCatch = void 0;
  
      if (workInProgress.updateQueue !== null) {

        // 解析 updateQueue 生成新的partialState
        newState = processUpdateQueue(current, workInProgress, workInProgress.updateQueue, instance, newProps, renderExpirationTime);
  
        var updateQueue = workInProgress.updateQueue;
        if (updateQueue !== null && updateQueue.capturedValues !== null && enableGetDerivedStateFromCatch && typeof ctor.getDerivedStateFromCatch === 'function') {
          var capturedValues = updateQueue.capturedValues;
          // Don't remove these from the update queue yet. We need them in
          // finishClassComponent. Do the reset there.
          // TODO: This is awkward. Refactor class components.
          // updateQueue.capturedValues = null;

          // 解析更新过程中出现错误，调用 getDerivedStateFromCatch 钩子
          derivedStateFromCatch = callGetDerivedStateFromCatch(ctor, capturedValues);
        }
      } else {
        newState = oldState;
      }
  
      var derivedStateFromProps = void 0;
      if (oldProps !== newProps) {
        // The prevState parameter should be the partially updated state.
        // Otherwise, spreading state in return values could override updates.

        // 如果新的属性不同，调用 getDerivedStateFromProps 钩子
        derivedStateFromProps = callGetDerivedStateFromProps(workInProgress, instance, newProps, newState);
      }
  
      // 合并各种 partialState ，生成新的state
      if (derivedStateFromProps !== null && derivedStateFromProps !== undefined) {
        // Render-phase updates (like this) should not be added to the update queue,
        // So that multiple render passes do not enqueue multiple updates.
        // Instead, just synchronously merge the returned state into the instance.
        newState = newState === null || newState === undefined ? derivedStateFromProps : _assign({}, newState, derivedStateFromProps);
      }
      if (derivedStateFromCatch !== null && derivedStateFromCatch !== undefined) {
        // Render-phase updates (like this) should not be added to the update queue,
        // So that multiple render passes do not enqueue multiple updates.
        // Instead, just synchronously merge the returned state into the instance.
        newState = newState === null || newState === undefined ? derivedStateFromCatch : _assign({}, newState, derivedStateFromCatch);
      }
  
      if (oldProps === newProps && oldState === newState && !hasContextChanged() && !(workInProgress.updateQueue !== null && workInProgress.updateQueue.hasForceUpdate)) {
        // If an update was already in progress, we should schedule an Update
        // effect even though we're bailing out, so that cWU/cDU are called.
        if (typeof instance.componentDidUpdate === 'function') {
          if (oldProps !== current.memoizedProps || oldState !== current.memoizedState) {
            workInProgress.effectTag |= Update;
          }
        }
        if (typeof instance.getSnapshotBeforeUpdate === 'function') {
          if (oldProps !== current.memoizedProps || oldState !== current.memoizedState) {
            workInProgress.effectTag |= Snapshot;
          }
        }
        return false;
      }
  
      // 调用 ShouldComponentUpdate 
      var shouldUpdate = checkShouldComponentUpdate(workInProgress, oldProps, newProps, oldState, newState, newContext);
  
      if (shouldUpdate) {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for components using the new APIs.
        if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillUpdate === 'function' || typeof instance.componentWillUpdate === 'function')) {
          startPhaseTimer(workInProgress, 'componentWillUpdate');
          if (typeof instance.componentWillUpdate === 'function') {

            // componentWillUpdate 钩子
            instance.componentWillUpdate(newProps, newState, newContext);
          }
          if (typeof instance.UNSAFE_componentWillUpdate === 'function') {

            // UNSAFE_componentWillUpdate 钩子
            instance.UNSAFE_componentWillUpdate(newProps, newState, newContext);
          }
          stopPhaseTimer();
        }
        if (typeof instance.componentDidUpdate === 'function') {
          workInProgress.effectTag |= Update;
        }
        if (typeof instance.getSnapshotBeforeUpdate === 'function') {
          workInProgress.effectTag |= Snapshot;
        }
      } else {
        // If an update was already in progress, we should schedule an Update
        // effect even though we're bailing out, so that cWU/cDU are called.
        if (typeof instance.componentDidUpdate === 'function') {
          if (oldProps !== current.memoizedProps || oldState !== current.memoizedState) {
            workInProgress.effectTag |= Update;
          }
        }
        if (typeof instance.getSnapshotBeforeUpdate === 'function') {
          if (oldProps !== current.memoizedProps || oldState !== current.memoizedState) {
            workInProgress.effectTag |= Snapshot;
          }
        }
  
        // If shouldComponentUpdate returned false, we should still update the
        // memoized props/state to indicate that this work can be reused.
        memoizeProps(workInProgress, newProps);
        memoizeState(workInProgress, newState);
      }
  
      // Update the existing instance's state, props, and context pointers even
      // if shouldComponentUpdate returns false.

      // 更新组件的状态
      instance.props = newProps;
      instance.state = newState;
      instance.context = newContext;
  
      return shouldUpdate;
    }
  
    return {
      adoptClassInstance: adoptClassInstance,
      callGetDerivedStateFromProps: callGetDerivedStateFromProps,
      constructClassInstance: constructClassInstance,
      mountClassInstance: mountClassInstance,
      resumeMountClassInstance: resumeMountClassInstance,
      updateClassInstance: updateClassInstance
    };
  };