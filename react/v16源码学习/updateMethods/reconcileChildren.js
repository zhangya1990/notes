// shouldTrackSideEffects 是否需要追踪副作用
// mountChildFibers 内部为false，直接插入子级fiber
// reconcileChildFibers 内部为true，调和过程（更新）


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

    // 更新
    while (child !== null) {
        // TODO: If key === null and child.key === null, then this only applies to
        // the first item in the list.
        if (child.key === key) {
            if (child.tag === Fragment ? element.type === REACT_FRAGMENT_TYPE : child.type === element.type) {

                // key 相同 type 相同，清除workInProgress除当前fiber子节点外的所有子节点
                deleteRemainingChildren(returnFiber, child.sibling);

                // 创建一个当前child的workInProgress
                var existing = useFiber(child, element.type === REACT_FRAGMENT_TYPE ? element.props.children : element.props, expirationTime);
                existing.ref = coerceRef(returnFiber, child, element);
                existing['return'] = returnFiber;
                {
                    existing._debugSource = element._source;
                    existing._debugOwner = element._owner;
                }
                return existing;
            } else {
                // key相同，type不同，清除所有子节点
                deleteRemainingChildren(returnFiber, child);
                break;
            }
        } else {
            // 如果key不相同，直接从当前的workInProgress清除当前fiber子节点，继续处理下一个子节点
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



// 调和多个子级fiber的更新,看的头昏脑涨才看明白的算法
// 首次插入的时候，直接生成子节点，添加fiber.index 不解释
// 更新的时候
// 从第一个子节点开始处理，跟新的childList列表中的第一个元素比较，如果key匹配，更新，开始处理第二个节点，依次类推，一旦不匹配，跳出循环，从当前节点开始向后，全部添加到Map当中，遍历map和剩余的childList，存在既更新，不存在既新建，childList遍历完成之后，如果map当中还存在子节点，添加到删除列表
function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, expirationTime) {
    // This algorithm can't optimize by searching from boths ends since we
    // don't have backpointers on fibers. I'm trying to see how far we can get
    // with that model. If it ends up not being worth the tradeoffs, we can
    // add it later.

    // Even with a two ended optimization, we'd want to optimize for the case
    // where there are few changes and brute force the comparison instead of
    // going for the Map. It'd like to explore hitting that path first in
    // forward-only mode and only go for the Map once we notice that we need
    // lots of look ahead. This doesn't handle reversal as well as two ended
    // search but that's unusual. Besides, for the two ended optimization to
    // work on Iterables, we'd need to copy the whole set.

    // In this first iteration, we'll just live with hitting the bad case
    // (adding everything to a Map) in for every insert/move.

    // If you change this code, also update reconcileChildrenIterator() which
    // uses the same algorithm.

    {
        // First, validate keys.
        var knownKeys = null;
        for (var i = 0; i < newChildren.length; i++) {
            var child = newChildren[i];
            knownKeys = warnOnInvalidKey(child, knownKeys);
        }
    }
 
    var resultingFirstChild = null;
    var previousNewFiber = null;

    var oldFiber = currentFirstChild;
    var lastPlacedIndex = 0;
    var newIdx = 0;
    var nextOldFiber = null;

    // 首次渲染的时候 oldFiber为null，否则为 returnFiber的第一个子节点
    // 所有fiber新建的时候 index 都是 0,只有在 reconcileChildrenArray 或 reconcileChildrenIterator之后，index才有可能更改
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
        // 如果oldFiber和newFiber index 相同或较小，说明是同一个位置，相互比较，否则跳出循环
        if (oldFiber.index > newIdx) {
            nextOldFiber = oldFiber;
            oldFiber = null;
        } else {
            nextOldFiber = oldFiber.sibling;
        }
        // 
        var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], expirationTime);
        if (newFiber === null) {
            // TODO: This breaks on empty slots like null children. That's
            // unfortunate because it triggers the slow path all the time. We need
            // a better way to communicate whether this was a miss or null,
            // boolean, undefined, etc.
            if (oldFiber === null) {
                oldFiber = nextOldFiber;
            }
            break;
        }
        // 
        if (shouldTrackSideEffects) {
            if (oldFiber && newFiber.alternate === null) {
                // We matched the slot, but we didn't reuse the existing fiber, so we
                // need to delete the existing child.
                deleteChild(returnFiber, oldFiber);
            }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
            // TODO: Move out of the loop. This only happens for the first run.
            resultingFirstChild = newFiber;
        } else {
            // TODO: Defer siblings if we're not at the right index for this slot.
            // I.e. if we had null values before, then we want to defer this
            // for each null value. However, we also don't want to call updateSlot
            // with the previous one.
            previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
        oldFiber = nextOldFiber;
    }

    if (newIdx === newChildren.length) {
        // We've reached the end of the new children. We can delete the rest.
        // 已经处理到新的子节点末尾，将oldFiber及后面的兄弟节点清除
        deleteRemainingChildren(returnFiber, oldFiber);
        return resultingFirstChild;
    }

    // 没有子节点，或者oldFiber原先的兄弟子节点全部更新完成，从当前的newIndx开始，将剩余的newChild全部插入，并按照当前的插入顺序赋值 fiber.index
    if (oldFiber === null) {
        // If we don't have any more existing children we can choose a fast path
        // since the rest will all be insertions.

        // 
        for (; newIdx < newChildren.length; newIdx++) {
            var _newFiber = createChild(returnFiber, newChildren[newIdx], expirationTime);
            if (!_newFiber) {
                continue;
            }
            lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);
            if (previousNewFiber === null) {
                // TODO: Move out of the loop. This only happens for the first run.
                resultingFirstChild = _newFiber;
            } else {
                previousNewFiber.sibling = _newFiber;
            }
            previousNewFiber = _newFiber;
        }
        return resultingFirstChild;
    }

    // Add all children to a key map for quick lookups.
    var existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    // Keep scanning and use the map to restore deleted items as moves.
    for (; newIdx < newChildren.length; newIdx++) {
        var _newFiber2 = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx], expirationTime);
        if (_newFiber2) {
            if (shouldTrackSideEffects) {
                if (_newFiber2.alternate !== null) {
                    // The new fiber is a work in progress, but if there exists a
                    // current, that means that we reused the fiber. We need to delete
                    // it from the child list so that we don't add it to the deletion
                    // list.
                    existingChildren['delete'](_newFiber2.key === null ? newIdx : _newFiber2.key);
                }
            }
            lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx);
            if (previousNewFiber === null) {
                resultingFirstChild = _newFiber2;
            } else {
                previousNewFiber.sibling = _newFiber2;
            }
            previousNewFiber = _newFiber2;
        }
    }

    if (shouldTrackSideEffects) {
        // Any existing children that weren't consumed above were deleted. We need
        // to add them to the deletion list.
        existingChildren.forEach(function (child) {
            return deleteChild(returnFiber, child);
        });
    }

    return resultingFirstChild;
}

// 从map中更新newChild
function updateFromMap(existingChildren, returnFiber, newIdx, newChild, expirationTime) {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes don't have keys, so we neither have to check the old nor
      // new node for the key. If both are text nodes, they match.
      var matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(returnFiber, matchedFiber, '' + newChild, expirationTime);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          {
            var _matchedFiber = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
            if (newChild.type === REACT_FRAGMENT_TYPE) {
              return updateFragment(returnFiber, _matchedFiber, newChild.props.children, expirationTime, newChild.key);
            }
            return updateElement(returnFiber, _matchedFiber, newChild, expirationTime);
          }
        case REACT_PORTAL_TYPE:
          {
            var _matchedFiber2 = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
            return updatePortal(returnFiber, _matchedFiber2, newChild, expirationTime);
          }
      }

      if (isArray$1(newChild) || getIteratorFn(newChild)) {
        var _matchedFiber3 = existingChildren.get(newIdx) || null;
        return updateFragment(returnFiber, _matchedFiber3, newChild, expirationTime, null);
      }

      throwOnInvalidObjectType(returnFiber, newChild);
    }

    {
      if (typeof newChild === 'function') {
        warnOnFunctionType();
      }
    }

    return null;
  }


  // 删除fiber调和
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) {
      // Noop.
      return;
    }
    // Deletions are added in reversed order so we add it to the front.
    // At this point, the return fiber's effect list is empty except for
    // deletions, so we can just append the deletion to the list. The remaining
    // effects aren't added until the complete phase. Once we implement
    // resuming, this may not be true.

    // 把当前的fiber添加到returnFiber的副作用链末尾，由于在当前调度器工作时间节点，returnFiber的副作用链尾空，在调和结束阶段，即提交的前一步，才会把剩余的副作用添加，因此，删除操作最终会在returnFiber的副作用链首部
    var last = returnFiber.lastEffect;
    if (last !== null) {
      last.nextEffect = childToDelete;
      returnFiber.lastEffect = childToDelete;
    } else {
      returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
    }
    childToDelete.nextEffect = null;
    childToDelete.effectTag = Deletion;
  }

//创建fiber子节点
function createChild(returnFiber, newChild, expirationTime) {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
        // Text nodes don't have keys. If the previous node is implicitly keyed
        // we can continue to replace it without aborting even if it is not a text
        // node.
        var created = createFiberFromText('' + newChild, returnFiber.mode, expirationTime);
        created['return'] = returnFiber;
        return created;
    }

    if (typeof newChild === 'object' && newChild !== null) {
        switch (newChild.$$typeof) {
            case REACT_ELEMENT_TYPE:
                {
                    var _created = createFiberFromElement(newChild, returnFiber.mode, expirationTime);
                    _created.ref = coerceRef(returnFiber, null, newChild);
                    _created['return'] = returnFiber;
                    return _created;
                }
            case REACT_PORTAL_TYPE:
                {
                    var _created2 = createFiberFromPortal(newChild, returnFiber.mode, expirationTime);
                    _created2['return'] = returnFiber;
                    return _created2;
                }
        }

        if (isArray$1(newChild) || getIteratorFn(newChild)) {
            var _created3 = createFiberFromFragment(newChild, returnFiber.mode, expirationTime, null);
            _created3['return'] = returnFiber;
            return _created3;
        }

        throwOnInvalidObjectType(returnFiber, newChild);
    }

    {
        if (typeof newChild === 'function') {
            warnOnFunctionType();
        }
    }

    return null;
}

// 处理子fiber的index（正确位置）
function placeChild(newFiber, lastPlacedIndex, newIndex) {
    // 赋值 fiber.index
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) {
        // 直接插入，不需要任何多余的操作
        // Noop.
        return lastPlacedIndex;
    }

    // 在placeChild方法内，fiber的创建或者更新属性都已经完成，所以
    var current = newFiber.alternate;

    if (current !== null) {
        // 更新 current是稳定的fiber

        var oldIndex = current.index;
        if (oldIndex < lastPlacedIndex) {
            // This is a move.
            // 需要向前移动,添加占位副作用
            newFiber.effectTag = Placement;
            return lastPlacedIndex;
        } else {
            // 原来位置靠后，不用处理
            // This item can stay in place.
            return oldIndex;
        }
    } else {
        // This is an insertion.
        // 插入 
        newFiber.effectTag = Placement;
        return lastPlacedIndex;
    }
}

function updateSlot(returnFiber, oldFiber, newChild, expirationTime) {
    // Update the fiber if the keys match, otherwise return null.

    // 如果key匹配，更新，其他情况不做处理

    var key = oldFiber !== null ? oldFiber.key : null;

    if (typeof newChild === 'string' || typeof newChild === 'number') {
        // Text nodes don't have keys. If the previous node is implicitly keyed
        // we can continue to replace it without aborting even if it is not a text
        // node.

        // oldFilber 存在key ，并且 newChild 是文本，直接返回，不做处理
        if (key !== null) {
            return null;
        }
        // oldFilber 没有key ，并且 newChild 是文本， 更新oldFiber
        return updateTextNode(returnFiber, oldFiber, '' + newChild, expirationTime);
    }

    if (typeof newChild === 'object' && newChild !== null) {
        switch (newChild.$$typeof) {
            // react element
            case REACT_ELEMENT_TYPE:
                {
                    // key 相同，更新
                    if (newChild.key === key) {
                        if (newChild.type === REACT_FRAGMENT_TYPE) {
                            return updateFragment(returnFiber, oldFiber, newChild.props.children, expirationTime, key);
                        }
                        return updateElement(returnFiber, oldFiber, newChild, expirationTime);
                    } else {
                        // 否则
                        return null;
                    }
                }
            case REACT_PORTAL_TYPE:
                {
                    if (newChild.key === key) {
                        return updatePortal(returnFiber, oldFiber, newChild, expirationTime);
                    } else {
                        return null;
                    }
                }
        }

        // 数组子节点
        if (isArray$1(newChild) || getIteratorFn(newChild)) {
            if (key !== null) {
                return null;
            }

            return updateFragment(returnFiber, oldFiber, newChild, expirationTime, null);
        }

        throwOnInvalidObjectType(returnFiber, newChild);
    }

    {
        if (typeof newChild === 'function') {
            warnOnFunctionType();
        }
    }

    return null;
}

// 更新fiber
function updateElement(returnFiber, current, element, expirationTime) {
    if (current !== null && current.type === element.type) {
        // Move based on index
        var existing = useFiber(current, element.props, expirationTime);
        existing.ref = coerceRef(returnFiber, current, element);
        existing['return'] = returnFiber;
        {
            existing._debugSource = element._source;
            existing._debugOwner = element._owner;
        }
        return existing;
    } else {
        // Insert
        var created = createFiberFromElement(element, returnFiber.mode, expirationTime);
        created.ref = coerceRef(returnFiber, current, element);
        created['return'] = returnFiber;
        return created;
    }
}


function updateTextNode(returnFiber, current, textContent, expirationTime) {
    if (current === null || current.tag !== HostText) {
        // Insert
        var created = createFiberFromText(textContent, returnFiber.mode, expirationTime);
        created['return'] = returnFiber;
        return created;
    } else {
        // Update
        var existing = useFiber(current, textContent, expirationTime);
        existing['return'] = returnFiber;
        return existing;
    }
}


function useFiber(fiber, pendingProps, expirationTime) {
    // We currently set sibling to null and index to 0 here because it is easy
    // to forget to do before returning it. E.g. for the single child case.
    var clone = createWorkInProgress(fiber, pendingProps, expirationTime);
    clone.index = 0;
    clone.sibling = null;
    return clone;
}


function placeSingleChild(newFiber) {
    // This is simpler for the single child case. We only need to do a
    // placement for inserting new children.
    // 追踪当前fiber的副作用,如果是调和阶段，并且没有alternate，副作用为占位
    if (shouldTrackSideEffects && newFiber.alternate === null) {
        newFiber.effectTag = Placement;
    }
    return newFiber;
}


function bailoutOnAlreadyFinishedWork(current, workInProgress) {
    cancelWorkTimer(workInProgress);

    // 克隆所有的子节点,并为子节点创建 workInProgress
    cloneChildFibers(current, workInProgress);
    return workInProgress.child;
}

//
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

// 从当前child开始向后遍历，清除所有后面的兄弟fiber
function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) {
        // Noop.
        return null;
    }

    // TODO: For the shouldClone case, this could be micro-optimized a bit by
    // assuming that after the first child we've already added everything.
    var childToDelete = currentFirstChild;
    while (childToDelete !== null) {
        deleteChild(returnFiber, childToDelete);
        childToDelete = childToDelete.sibling;
    }
    return null;
}