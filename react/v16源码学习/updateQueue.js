// 一个更新对应的数据结构
export type Update<State> = {
    expirationTime: ExpirationTime,
    partialState: PartialState<any, any>,
    callback: Callback | null,
    isReplace: boolean,
    isForced: boolean,
    next: Update<State> | null,
};

// 更新队列，以单链表形式表示并持久化
// 调度一个更新任务时，将其添加至当前（current）fiber和work-in-progress fiber的更新队列中;
// 这两个更新队列相互独立但共享同一个持久化数据结构；
// work-in-progress更新队列通常是current fiber更新队列的子集；
// 发生调和时，更新任务从work-in-progress fiber更新队列移除，
// current fiber内的更新任务则保留，当work-in-progress中断时可以从current fiber恢复；
// 提交完更新时，work-in-progress fiber就会变成current fiber
export type UpdateQueue<State> = {
    // 若存在更早添加至队列的更新未被处理，
    // 则此已处理的更新并不会从队列中移除-先进先出原则
    // 所以需要维护baseState，代表第一个未处理的更新的基础状态，
    // 通常这就是队列中的第一个更新，因为在队列首部的已处理更新会被移除
    baseState: State,
    // 同理，需要维护最近的未处理的更新的到期时间，
    // 即未处理更新中到期时间值最小的
    expirationTime: ExpirationTime,
    first: Update<State> | null,
    last: Update<State> | null,
    callbackList: Array<Update<State>> | null,
    hasForceUpdate: boolean,
    isInitialized: boolean
};


let q1;
let q2;
export function ensureUpdateQueues(fiber: Fiber) {
    q1 = q2 = null;
    // We'll have at least one and at most two distinct update queues.
    const alternateFiber = fiber.alternate;
    let queue1 = fiber.updateQueue;
    if (queue1 === null) {
        // TODO: We don't know what the base state will be until we begin work.
        // It depends on which fiber is the next current. Initialize with an empty
        // base state, then set to the memoizedState when rendering. Not super
        // happy with this approach.
        queue1 = fiber.updateQueue = createUpdateQueue((null: any));
    }

    let queue2;
    if (alternateFiber !== null) {
        queue2 = alternateFiber.updateQueue;
        if (queue2 === null) {
            queue2 = alternateFiber.updateQueue = createUpdateQueue((null: any));
        }
    } else {
        queue2 = null;
    }
    queue2 = queue2 !== queue1 ? queue2 : null;

    // Use module variables instead of returning a tuple
    q1 = queue1;
    q2 = queue2;
}



// 添加更新至更新队列
export function insertUpdateIntoQueue<State>(
    queue: UpdateQueue<State>,
    update: Update<State>
) {
    // 添加更新至队列尾部
    if (queue.last === null) {
        // 队列为空
        queue.first = queue.last = update;
    } else {
        queue.last.next = update;
        queue.last = update;
    }

    //如果更新队列的到期时间大于本次更新的到期时间，更新队列的到期时间(始终保持更新队列的到期时间为优先级最高的更新任务的到期时间)
    if (
        queue.expirationTime === NoWork ||
        queue.expirationTime > update.expirationTime
    ) {
        // 设置更新队列的到期时间
        queue.expirationTime = update.expirationTime;
    }
}

// 添加更新至fiber实例
function insertUpdateIntoFiber(fiber, update) {
    ensureUpdateQueues(fiber);
    var queue1 = q1;
    var queue2 = q2;
  
    // If there's only one queue, add the update to that queue and exit.
    // 如果只存在一个更新队列
    if (queue2 === null) {
      insertUpdateIntoQueue(queue1, update);
      return;
    }
  
    // If either queue is empty, we need to add to both queues.
    // 如果任意更新队列为空，则需要将更新添加至两个更新队列
    if (queue1.last === null || queue2.last === null) {
      insertUpdateIntoQueue(queue1, update);
      insertUpdateIntoQueue(queue2, update);
      return;
    }
  
    // If both lists are not empty, the last update is the same for both lists
    // because of structural sharing. So, we should only append to one of
    // the lists.
    // 如果2个更新队列均非空，则添加更新至第一个队列，并更新另一个队列的尾部更新项
    // 2个更新队列均非空，说明本次调度过程中，至少已经添加了两次以上(前两次添加会满足前面的条件),然后就不明白了，什么鬼东西
    insertUpdateIntoQueue(queue1, update);
    // But we still need to update the `last` pointer of queue2.
    queue2.last = update;
  }



//创建一个空的updateQueue
function createUpdateQueue(baseState) {
  var queue = {
    baseState: baseState,
    expirationTime: NoWork,
    first: null,
    last: null,
    callbackList: null,
    hasForceUpdate: false,
    isInitialized: false,
    capturedValues: null
  };
  {
    queue.isProcessing = false;
  }
  return queue;
}


// 处理更新队列任务，返回新状态对象
function processUpdateQueue(current, workInProgress, queue, instance, props, renderExpirationTime) {
    if (current !== null && current.updateQueue === queue) {
        // We need to create a work-in-progress queue, by cloning the current queue.
        // 克隆current fiber以创建work-in-progress fiber
        var currentQueue = queue;
        queue = workInProgress.updateQueue = {
            baseState: currentQueue.baseState,
            expirationTime: currentQueue.expirationTime,
            first: currentQueue.first,
            last: currentQueue.last,
            isInitialized: currentQueue.isInitialized,
            capturedValues: currentQueue.capturedValues,
            // These fields are no longer valid because they were already committed.
            // Reset them.

            // 如果当前workInProgress的稳定fiber版本的updateQueue与当前更新对象相同，重置callbackList和hasForceUpdate
            callbackList: null,
            hasForceUpdate: false
        };
    }

    {
        // Set this flag so we can warn if setState is called inside the update
        // function of another setState.
        queue.isProcessing = true;
    }

    // Reset the remaining expiration time. If we skip over any updates, we'll
    // increase this accordingly.
    queue.expirationTime = NoWork;

    // TODO: We don't know what the base state will be until we begin work.
    // It depends on which fiber is the next current. Initialize with an empty
    // base state, then set to the memoizedState when rendering. Not super
    // happy with this approach.
    var state = void 0;
    if (queue.isInitialized) {
        state = queue.baseState;
    } else {
        state = queue.baseState = workInProgress.memoizedState;
        queue.isInitialized = true;
    }
    var dontMutatePrevState = true;
    var update = queue.first;
    var didSkip = false;
    while (update !== null) {
        var updateExpirationTime = update.expirationTime;
        if (updateExpirationTime > renderExpirationTime) {
            // This update does not have sufficient priority. Skip it.
            // 此更新优先级不够，不处理，跳过
            var remainingExpirationTime = queue.expirationTime;
            if (remainingExpirationTime === NoWork || remainingExpirationTime > updateExpirationTime) {
                // Update the remaining expiration time.
                // 重新设置最近未处理更新的到期时间
                queue.expirationTime = updateExpirationTime;
            }
            if (!didSkip) {
                didSkip = true;
                queue.baseState = state;
            }
            // Continue to the next update.
            update = update.next;
            continue;
        }

        // 能走到这里的都是优先级足够的
        // This update does have sufficient priority.

        

        // Invoke setState callback an extra time to help detect side-effects.
        // Ignore the return value in this case.
        if (debugRenderPhaseSideEffects || debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & StrictMode) {
            getStateFromUpdate(update, instance, state, props);
        }

        // Process the update
        var _partialState = void 0;

        // replaceState
        if (update.isReplace) {
            state = getStateFromUpdate(update, instance, state, props);
            dontMutatePrevState = true;
        } else {
            _partialState = getStateFromUpdate(update, instance, state, props);
            if (_partialState) {
                if (dontMutatePrevState) {
                    // $FlowFixMe: Idk how to type this properly.
                    // 上一次是替换状态，所以不能影响state
                    state = _assign({}, state, _partialState);
                } else {
                    state = _assign(state, _partialState);
                }
                dontMutatePrevState = false;
            }
        }

        // 是否是强制更新
        if (update.isForced) {
            queue.hasForceUpdate = true;
        }

        // 添加回调函数队列
        if (update.callback !== null) {
            // Append to list of callbacks.
            var _callbackList = queue.callbackList;
            if (_callbackList === null) {
                _callbackList = queue.callbackList = [];
            }
            _callbackList.push(update);
        }

        // 将本次更新捕获的值添加到更新队列捕获中
        if (update.capturedValue !== null) {
            var _capturedValues = queue.capturedValues;
            if (_capturedValues === null) {
                queue.capturedValues = [update.capturedValue];
            } else {
                _capturedValues.push(update.capturedValue);
            }
        }

        // If no previous updates were skipped, drop this update from the queue by
        // advancing the head of the list.

        // 如果之前没有跳过更新，说明所有环节的优先级都足够，修改链表第一个子节点为当前更新的下一环queue.first = update.next，当前环节已经处理完成
        if (!didSkip) {
            queue.first = update.next;
            if (queue.first === null) {
                queue.last = null;
            }
        }

        // 处理下一环更新
        update = update.next;
    }

    if (queue.callbackList !== null) {
        // 谜一般的位运算
        workInProgress.effectTag |= Callback;
    } else if (queue.first === null && !queue.hasForceUpdate && queue.capturedValues === null) {
        // The queue is empty. We can reset it.
        // 队列处理完成，并且没有callback ！！！,重置为空
        workInProgress.updateQueue = null;
    }

    if (!didSkip) {
        didSkip = true;
        queue.baseState = state;
    }
 
    {
        // No longer processing.
        queue.isProcessing = false;
    }

    return state;
}