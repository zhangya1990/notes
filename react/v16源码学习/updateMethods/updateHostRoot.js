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


function reconcileChildren(current, workInProgress, nextChildren) {
  reconcileChildrenAtExpirationTime(current, workInProgress, nextChildren, workInProgress.expirationTime);
}

function reconcileChildrenAtExpirationTime(current, workInProgress, nextChildren, renderExpirationTime) {
  if (current === null) {
    // If this is a fresh new component that hasn't been rendered yet, we
    // won't update its child set by applying minimal side-effects. Instead,
    // we will add them all to the child before it gets rendered. That means
    // we can optimize this reconciliation pass by not tracking side-effects.
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderExpirationTime);
  } else {
    // If the current child is the same as the work in progress, it means that
    // we haven't yet started any work on these children. Therefore, we use
    // the clone algorithm to create a copy of all the current children.

    // If we had any progressed work already, that is invalid at this point so
    // let's throw it out.

    // 用当前的过期时间创建 workInProgress 的 child fiber ，可以为数组
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren, renderExpirationTime);
  }
}

// This API will tag the children with the side-effect of the reconciliation
// itself. They will be added to the side-effect list as we pass through the
// children and the parent.
function reconcileChildFibers(returnFiber, currentFirstChild, newChild, expirationTime) {
  // This function is not recursive.
  // If the top level item is an array, we treat it as a set of children,
  // not as a fragment. Nested arrays on the other hand will be treated as
  // fragment nodes. Recursion happens at the normal flow.

  // Handle top level unkeyed fragments as if they were arrays.
  // This leads to an ambiguity between <>{[...]}</> and <>...</>.
  // We treat the ambiguous cases above the same.
  
  // 先不管什么array fragment，忽略忽略
  if (typeof newChild === 'object' && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE && newChild.key === null) {
    newChild = newChild.props.children;
  }

  // Handle object types
  var isObject = typeof newChild === 'object' && newChild !== null;

  if (isObject) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
          // newChild 是 React element
        return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, expirationTime));
      case REACT_PORTAL_TYPE:
        return placeSingleChild(reconcileSinglePortal(returnFiber, currentFirstChild, newChild, expirationTime));
    }
  }

  if (typeof newChild === 'string' || typeof newChild === 'number') {
    return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, '' + newChild, expirationTime));
  }

  if (isArray$1(newChild)) {
    return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, expirationTime);
  }

  if (getIteratorFn(newChild)) {
    return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, expirationTime);
  }

  if (isObject) {
    throwOnInvalidObjectType(returnFiber, newChild);
  }

  {
    if (typeof newChild === 'function') {
      warnOnFunctionType();
    }
  }
  if (typeof newChild === 'undefined') {
    // If the new child is undefined, and the return fiber is a composite
    // component, throw an error. If Fiber return types are disabled,
    // we already threw above.
    switch (returnFiber.tag) {
      case ClassComponent:
        {
          {
            var instance = returnFiber.stateNode;
            if (instance.render._isMockFunction) {
              // We allow auto-mocks to proceed as if they're returning null.
              break;
            }
          }
        }
      // Intentionally fall through to the next case, which handles both
      // functions and classes
      // eslint-disable-next-lined no-fallthrough
      case FunctionalComponent:
        {
          var Component = returnFiber.type;
          invariant(false, '%s(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null.', Component.displayName || Component.name || 'Component');
        }
    }
  }

  // Remaining cases are all treated as empty.
  return deleteRemainingChildren(returnFiber, currentFirstChild);
}

// 调和单个 react element
function reconcileSingleElement(returnFiber, currentFirstChild, element, expirationTime) {
  var key = element.key;
  var child = currentFirstChild;

  // 更新，暂时跳过
  while (child !== null) {
    // TODO: If key === null and child.key === null, then this only applies to
    // the first item in the list.
    if (child.key === key) {
      if (child.tag === Fragment ? element.type === REACT_FRAGMENT_TYPE : child.type === element.type) {
        deleteRemainingChildren(returnFiber, child.sibling);
        var existing = useFiber(child, element.type === REACT_FRAGMENT_TYPE ? element.props.children : element.props, expirationTime);
        existing.ref = coerceRef(returnFiber, child, element);
        existing['return'] = returnFiber;
        {
          existing._debugSource = element._source;
          existing._debugOwner = element._owner;
        }
        return existing;
      } else {
        deleteRemainingChildren(returnFiber, child);
        break;
      }
    } else {
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }

  if (element.type === REACT_FRAGMENT_TYPE) {
    // fragment
    var created = createFiberFromFragment(element.props.children, returnFiber.mode, expirationTime, element.key);
    created['return'] = returnFiber;
    return created;
  } else {

    // 创建子级 fiber ../Fiber.js
    // 根据子组件类型创建fiber
    var _created4 = createFiberFromElement(element, returnFiber.mode, expirationTime);
    // ref相关暂时忽略
    _created4.ref = coerceRef(returnFiber, currentFirstChild, element);
    // 关联父级 fiber，模拟函数栈调用，子级函数执行完成，调用栈返回父级
    _created4['return'] = returnFiber;
    return _created4;
  }
}


function placeSingleChild(newFiber) {
  // This is simpler for the single child case. We only need to do a
  // placement for inserting new children.
  // 追踪当前fiber的副作用
  if (shouldTrackSideEffects && newFiber.alternate === null) {
    newFiber.effectTag = Placement;
  }
  return newFiber;
}


function bailoutOnAlreadyFinishedWork(current, workInProgress) {
  cancelWorkTimer(workInProgress);

  // 克隆所有的子节点
  cloneChildFibers(current, workInProgress);
  return workInProgress.child;
}


function cloneChildFibers(current, workInProgress) {
  !(current === null || workInProgress.child === current.child) ? invariant(false, 'Resuming work not yet implemented.') : void 0;

  if (workInProgress.child === null) {
    return;
  }

  var currentChild = workInProgress.child;
  var newChild = createWorkInProgress(currentChild, currentChild.pendingProps, currentChild.expirationTime);
  workInProgress.child = newChild;

  newChild['return'] = workInProgress;
  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(currentChild, currentChild.pendingProps, currentChild.expirationTime);
    newChild['return'] = workInProgress;
  }
  newChild.sibling = null;
}